"""
seed_filings.py — Loads data/filings.csv into the filing_records table.

CSV format (with header):
  cin,rule_id,period_label,filed_date,status

Example rows:
  U65929MH2028PTC339823,KYC-REV,FY2024-25,2025-04-10,FILED
  U65929MH2028PTC339823,NBS-4,FY2024-25,,OVERDUE
  U65929MH2028PTC339823,FIU-STR,Jun-2026,,PENDING

Run from project root:
  python scripts/seed_filings.py
"""

import sys, os
sys.path.append("backend")

import pandas as pd
from datetime import date
from database import SessionLocal, engine
from models import FilingRecord, Base

Base.metadata.create_all(bind=engine)
db = SessionLocal()

CSV_PATH = "data/filings.csv"

if not os.path.exists(CSV_PATH):
    print(f"❌  {CSV_PATH} not found.")
    print("   Create it with columns: cin, rule_id, period_label, filed_date, status")
    sys.exit(1)

df = pd.read_csv(CSV_PATH)
df.columns = df.columns.str.strip().str.lower()

required = {"cin", "rule_id", "period_label", "status"}
missing = required - set(df.columns)
if missing:
    print(f"❌  CSV missing columns: {missing}")
    sys.exit(1)

# Clear existing records (full reload)
deleted = db.query(FilingRecord).delete()
print(f"🗑  Cleared {deleted} existing filing records.")

inserted = 0
errors = 0
for _, row in df.iterrows():
    try:
        filed_date = None
        if pd.notna(row.get("filed_date")) and str(row["filed_date"]).strip():
            filed_date = date.fromisoformat(str(row["filed_date"]).strip())

        db.add(FilingRecord(
            cin=str(row["cin"]).strip(),
            rule_id=str(row["rule_id"]).strip(),
            period_label=str(row["period_label"]).strip(),
            status=str(row["status"]).strip().upper(),
            filed_date=filed_date,
        ))
        inserted += 1
    except Exception as e:
        print(f"  ⚠ Row {_}: {e}")
        errors += 1

db.commit()
db.close()
print(f"✅  Inserted {inserted} filing records ({errors} errors).")
print(f"   Re-start the backend server for changes to take effect.")
