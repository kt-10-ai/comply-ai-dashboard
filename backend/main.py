from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import NBFC, Base
from database import engine
from calendar_engine import build_compliance_calendar
from datetime import date
import json
import os
import chat

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Comply.AI – NBFC Compliance Calendar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

with open(os.path.join(DATA_DIR, "compliance_rules.json")) as f:
    COMPLIANCE_RULES = json.load(f)

with open(os.path.join(DATA_DIR, "rbi_portals.json")) as f:
    RBI_PORTALS = json.load(f)

with open(os.path.join(DATA_DIR, "classification_metadata.json")) as f:
    CLASSIFICATION_METADATA = json.load(f)

# ── Basic ──────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Comply.AI Compliance Calendar API running"}

# ── NBFC Registry ──────────────────────────────────────────────────────────────

@app.get("/nbfc/search")
def search_nbfc(
    name: str = Query(None),
    classification: str = Query(None),
    layer: str = Query(None),
    regional_office: str = Query(None),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    q = db.query(NBFC)
    if name:
        q = q.filter(NBFC.nbfc_name.ilike(f"%{name}%"))
    if classification:
        q = q.filter(NBFC.classification == classification)
    if layer:
        q = q.filter(NBFC.layer == layer)
    if regional_office:
        q = q.filter(NBFC.regional_office == regional_office)
    results = q.limit(limit).all()
    return [r.__dict__ for r in results]

@app.get("/nbfc/stats")
def get_nbfc_stats(db: Session = Depends(get_db)):
    total = db.query(NBFC).count()
    layers = db.query(NBFC.layer, func.count(NBFC.layer)).group_by(NBFC.layer).all()
    classifications = db.query(NBFC.classification, func.count(NBFC.classification)).group_by(NBFC.classification).all()
    
    return {
        "total": total,
        "layers": {k: v for k, v in layers if k},
        "classifications": {k: v for k, v in classifications if k}
    }

@app.get("/nbfc/{cin}")
def get_nbfc(cin: str, db: Session = Depends(get_db)):
    """
    Returns an NBFC's profile + its full compliance calendar.
    Calendar entries are sorted: OVERDUE → DUE SOON → UPCOMING.
    Status is computed from today's date — no filing records needed.
    """
    nbfc = db.query(NBFC).filter(NBFC.cin == cin).first()
    if not nbfc:
        return {"error": "Not found"}

    nbfc_dict = {
        "classification": nbfc.classification,
        "layer": nbfc.layer,
        "regional_office": nbfc.regional_office,
    }

    compliance_calendar = build_compliance_calendar(nbfc_dict, COMPLIANCE_RULES)

    return {
        "sl_no": nbfc.sl_no,
        "nbfc_name": nbfc.nbfc_name,
        "cin": nbfc.cin,
        "classification": nbfc.classification,
        "layer": nbfc.layer,
        "regional_office": nbfc.regional_office,
        "accepts_deposits": nbfc.accepts_deposits,
        "compliance_calendar": compliance_calendar,
        "general_mandates": CLASSIFICATION_METADATA["compliance_framework"]["general_mandates"]
    }

# ── Compliance Rules ───────────────────────────────────────────────────────────

@app.get("/compliance/rules")
def get_rules(classification: str = Query(None), layer: str = Query(None)):
    rules = COMPLIANCE_RULES
    if classification:
        rules = [r for r in rules if classification in r["applicable_classification"]]
    if layer:
        rules = [r for r in rules if layer in r["applicable_layer"]]
    return rules

@app.get("/compliance/portals")
def get_portals():
    return RBI_PORTALS

# ── Dashboard Stats ────────────────────────────────────────────────────────────

@app.get("/compliance/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(NBFC).count()
    by_classification = {}
    by_layer = {}
    by_office = {}
    for row in db.query(NBFC).all():
        by_classification[row.classification] = by_classification.get(row.classification, 0) + 1
        by_layer[row.layer] = by_layer.get(row.layer, 0) + 1
        by_office[row.regional_office] = by_office.get(row.regional_office, 0) + 1
    return {
        "total_nbfcs": total,
        "by_classification": by_classification,
        "by_layer": by_layer,
        "by_regional_office": by_office
    }

# ── Calendar overview — all upcoming deadlines from rules ─────────────────────

@app.get("/compliance/calendar")
def get_calendar_overview(classification: str = Query(None), layer: str = Query(None)):
    """
    Returns all compliance deadlines computed from today's date.
    Used by the calendar page and dashboard upcoming table.
    """
    from calendar_engine import calculate_due_date
    today = date.today()

    results = []
    for rule in COMPLIANCE_RULES:
        if classification and classification not in rule["applicable_classification"]:
            continue
        if layer and layer not in rule["applicable_layer"]:
            continue
        due_info = calculate_due_date(rule, today)
        results.append({
            **rule,
            **due_info,
            "reports_to": rule["submission_portal"],
        })

    results.sort(key=lambda x: (x["due_date"] or "9999-99-99"))
    return results