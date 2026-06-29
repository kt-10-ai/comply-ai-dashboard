import os
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from database import get_db
from models import NBFC

load_dotenv()

router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    history: list = [] 

system_prompt = """
You are Comply.AI's expert compliance assistant for Indian Non-Banking Financial Companies (NBFCs).
You help users understand RBI Master Directions, filing deadlines, classifications (ICC, MFI, CIC, HFC), and Scale Based Regulation (Base, Middle, Upper, Top layers).
CRITICAL GUARDRAIL: You are strictly limited to answering questions about NBFCs, RBI regulations, compliance, and corporate finance. If a user asks about ANYTHING else (e.g., writing code, general knowledge, recipes, personal advice), you MUST politely refuse and state that you can only assist with NBFC compliance matters.
CRITICAL: You are fully multilingual. Always detect the language of the user's message and respond fluently in that exact same language (e.g., if they ask in Hindi, reply in Hindi).
CRITICAL: You have access to a tool called `search_nbfc_database`. You MUST use it whenever a user asks about a specific company or NBFC (e.g., "What is Del Capital's classification?"). Do NOT guess company details; always query the database first.
Be highly concise, professional, and directly answer the question.
"""

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_nbfc_database",
            "description": "Search for an Indian NBFC by name to get its exact details (CIN, classification, layer, regional office).",
            "parameters": {
                "type": "object",
                "properties": {
                    "company_name": {
                        "type": "string",
                        "description": "The name of the company to search for (e.g., 'Del Capital')"
                    }
                },
                "required": ["company_name"]
            }
        }
    }
]

@router.post("/api/chat")
async def chat_endpoint(req: ChatMessage, db: Session = Depends(get_db)):
    load_dotenv(override=True)
    API_KEY = os.getenv("GEMINI_API_KEY")
    if not API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="AI API Key not configured. Please add GEMINI_API_KEY to your backend/.env file."
        )
    
    # Check if it's an OpenRouter key
    if API_KEY.startswith("sk-or"):
        client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=API_KEY,
        )
        model = "google/gemini-2.5-flash"
    else:
        # Fallback to standard OpenAI if needed, but assuming OpenRouter
        client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=API_KEY,
        )
        model = "google/gemini-2.5-flash"
    
    try:
        messages = [{"role": "system", "content": system_prompt}]
        for msg in req.history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": req.message})
        
        while True:
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1000,
                tools=tools,
                tool_choice="auto"
            )
            
            message = response.choices[0].message
            messages.append(message.model_dump(exclude_none=True))
            
            if not message.tool_calls:
                break
                
            for tool_call in message.tool_calls:
                if tool_call.function.name == "search_nbfc_database":
                    try:
                        args = json.loads(tool_call.function.arguments)
                        company_name = args.get("company_name", "")
                        
                        results = db.query(NBFC).filter(NBFC.nbfc_name.ilike(f"%{company_name}%")).limit(5).all()
                        
                        if results:
                            tool_result = json.dumps([
                                {"name": r.nbfc_name, "cin": r.cin, "classification": r.classification, "layer": r.layer, "office": r.regional_office} 
                                for r in results
                            ])
                        else:
                            tool_result = f"No NBFC found matching '{company_name}' in the registry."
                            
                    except Exception as ex:
                        tool_result = f"Error searching database: {str(ex)}"
                        
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": tool_call.function.name,
                        "content": tool_result
                    })
        
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
