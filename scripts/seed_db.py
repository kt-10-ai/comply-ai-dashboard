import sys
sys.path.append("backend")

import pandas as pd
from database import SessionLocal, engine
from models import NBFC, Base

Base.metadata.create_all(bind=engine)
db = SessionLocal()

df = pd.read_csv("data/nbfc_registry.csv")
db.query(NBFC).delete()

for _, row in df.iterrows():
    db.add(NBFC(
        sl_no=row['sl_no'],
        nbfc_name=row['nbfc_name'],
        regional_office=row['regional_office'],
        accepts_deposits=row['accepts_deposits'],
        classification=row['classification'],
        cin=row['cin'],
        layer=row['layer']
    ))

db.commit()
print(f"Seeded {len(df)} NBFCs")
db.close()
