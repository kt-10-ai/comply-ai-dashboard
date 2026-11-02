"""Load data/nbfc_registry.csv into the database at DATABASE_URL (replaces existing rows).

Usage (from repo root):  DATABASE_URL="postgresql://..." .venv/bin/python scripts/seed_db.py
"""
import csv
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy import insert  # noqa: E402
from database import SessionLocal, engine  # noqa: E402
from models import NBFC, Base  # noqa: E402

CSV = os.path.join(os.path.dirname(__file__), "..", "data", "nbfc_registry.csv")
COLS = ["sl_no", "nbfc_name", "regional_office", "accepts_deposits", "classification", "cin", "layer"]

with open(CSV, newline="", encoding="utf-8") as f:
    rows = [
        {c: (int(float(r[c])) if c == "sl_no" and r[c] else (r[c] or None)) for c in COLS}
        for r in csv.DictReader(f)
    ]

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    db.query(NBFC).delete()
    for i in range(0, len(rows), 1000):
        db.execute(insert(NBFC), rows[i:i + 1000])
    db.commit()
print(f"Seeded {len(rows)} NBFCs")
