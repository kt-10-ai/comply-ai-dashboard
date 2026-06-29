# Comply.AI

**Comply.AI** is an intelligent, enterprise-grade Compliance Management Platform built specifically for Indian Non-Banking Financial Companies (NBFCs). It automates regulatory reporting workflows and deadline tracking by translating complex **RBI Master Directions (Scale-Based Regulation Framework)** into a dynamic, structured rule engine.

Instead of storing fixed, hardcoded due dates that quickly become obsolete, Comply.AI stores regulatory logic (e.g., *"15 days after quarter-end"*) and dynamically computes exact deadlines based on an NBFC's specific Classification, SBR Layer, and Deposit-taking status.

---

##  Key Modules & Features

1. **NBFC Registry (Data Layer)**
   A searchable registry of 9,100+ RBI-registered NBFCs, complete with profile metadata (CIN, Layer, Classification, Regional Office).
2. **Dynamic Rule Engine (Logic Layer)**
   Evaluates an NBFC's profile against structured RBI regulations to determine exactly which returns (e.g., NBS-1, NBS-9) apply to them, filtering out irrelevant obligations.
3. **Master Compliance Calendar (Visualization Layer)**
   A global calendar view displaying Upcoming, Due Soon, and Overdue deadlines across the entire NBFC landscape, filterable by specific entities or return frequencies.
4. **Compliance Explorer (Detail View)**
   Deep-dive entity profiles that display a company's specific obligations, risk exposure (daily penalty calculations), Maker/Checker workflow roles, statutory prerequisites (e.g., Board Approval), and direct links to blank RBI submission templates.
5. **AI Knowledge Assistant (Intelligence Layer)**
   A conversational AI interface (powered by Gemini) equipped with function-calling capabilities. It can securely query the live PostgreSQL database to answer specific questions about NBFC layers, classifications, and regulatory nuances, strictly guarded to refuse out-of-scope inquiries.

---

## ⚙️ How the Core Engine Works (Dynamic Dates & Applicability)

Instead of relying on static calendars, Comply.AI operates as a real-time rules engine. Here is the lifecycle of how a deadline is calculated:

1. **Rule Definition (`compliance_rules.json`)**
   Regulations are stored as metadata. For example, instead of storing "July 15", the system stores: 
   `"rule_type": "quarter_end"` and `"offset_days": 15`.
2. **Applicability Filtering (`calendar_engine.py`)**
   When an NBFC is queried, the engine checks the NBFC's specific **Layer** (e.g., *Base*) and **Classification** (e.g., *ICC*) against the rule's allowed arrays. If it doesn't match, the rule is ignored.
3. **Dynamic Date Computation**
   Using Python's date utilities, the engine identifies the current time period. If the rule is `quarter_end` and today is July 5th, the engine anchors to the most recent quarter-end (June 30) and adds the `offset_days` (+15 days) to compute the exact statutory due date (July 15).
4. **Status & Risk Assessment**
   The computed date is compared against the current system date and the company's `internal_buffer_days`. The system automatically classifies the return as `UPCOMING`, `DUE SOON` (if within the buffer period), or `OVERDUE` (applying daily penalty calculations).

---

## 🛠️ Technology Stack

* **Frontend:** React, TailwindCSS, Recharts (for dynamic KPI dashboards and charts), Vite
* **Backend:** Python, FastAPI, SQLAlchemy (ORM)
* **Database:** PostgreSQL (hosted on Supabase)
* **AI Logic:** Gemini API (Multimodal, Function Calling, System Guardrails)

---

##  Getting Started (Local Development)

### 1. Database Setup
Comply.AI uses a PostgreSQL database. 
You can use Supabase or a local Postgres instance. Ensure your `backend/.env` file contains your connection string and API keys:

```env
DATABASE_URL="postgresql://username:password@host:port/dbname"
GEMINI_API_KEY="your_api_key_here"
```

### 2. Backend (FastAPI) Setup
Navigate to the backend directory, install dependencies, and start the server:
```bash
cd backend
pip install -r ../requirements.txt  # (or pip install fastapi uvicorn sqlalchemy psycopg2-binary google-genai pydantic)
uvicorn main:app --reload --port 8000
```
*The backend API will be available at http://localhost:8000*

*(Note: Ensure you have seeded your database using the provided `scripts/seed_db.py` if running for the first time).*

### 3. Frontend (React/Vite) Setup
In a new terminal window, navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
*The web app will be available at http://localhost:5173*

---

## 📂 Project Structure

```
Comply.AI/
├── backend/
│   ├── main.py              # FastAPI server & endpoints
│   ├── database.py          # SQLAlchemy setup & connection
│   ├── models.py            # PostgreSQL table schemas
│   ├── calendar_engine.py   # Dynamic due-date computation logic
│   └── chat.py              # Gemini AI logic & Function Calling
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI elements (Badges, Modals, Layout)
│   │   ├── pages/           # Dashboard, Matrix, Calendar, Detail, Chat views
│   │   ├── api/             # Axios API configurations
│   │   └── context/         # React Context (Auth)
│   └── tailwind.config.js   # Custom enterprise UI design system & branding
├── data/
│   ├── compliance_rules.json        # Structured RBI master direction rules & logic
│   └── classification_metadata.json # Structural mandates, KYC, and SBR Layer info
└── scripts/                 # Utility scripts for extracting and seeding NBFC data
```

---

## 🛡️ Regulatory Context
This platform encodes logic derived from actual RBI Master Directions, including but not limited to:
* RBI (NBFCs – Scale Based Regulation) Directions, 2025
* RBI (NBFCs – Prudential Norms on Capital Adequacy) Directions, 2025
* RBI (NBFCs – Governance) Directions, 2025

*(Disclaimer: The statutory penalties and internal workflow SLA buffers configured in the default database are mock/illustrative data designed to demonstrate platform capabilities. They should be reviewed and configured by a legal/compliance team for production use.)*
