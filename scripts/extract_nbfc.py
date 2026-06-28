import pdfplumber
import pandas as pd
import re

records = []
PDF_PATH = "data/List_of_NBFCs_and_ARCs_registered_with_the_RBI.PDF"

with pdfplumber.open(PDF_PATH) as pdf:
    for page in pdf.pages[2:]:
        tables = page.extract_tables()
        if not tables:
            continue
        for table in tables:
            for row in table:
                if not row:
                    continue
                row = [str(cell).strip() if cell else "" for cell in row]
                if not row[0].isdigit():
                    continue
                while len(row) < 7:
                    row.append("")
                records.append({
                    "sl_no": row[0],
                    "nbfc_name": re.sub(r"\s+", " ", row[1]),
                    "regional_office": row[2],
                    "accepts_deposits": row[3],
                    "classification": row[4],
                    "cin": row[5],
                    "layer": row[6]
                })

df = pd.DataFrame(records)

df['classification'] = df['classification'].replace('ICC*', 'ICC')
df['regional_office'] = df['regional_office'].str.replace(r'\s+', ' ', regex=True).str.strip()

office_map = {
    "Thiruvananthapu ram": "Thiruvananthapuram",
    "Thiruvananthapu\nram": "Thiruvananthapuram",
    "hiruvananthapura": "Thiruvananthapuram",
}
df['regional_office'] = df['regional_office'].replace(office_map)

VALID_CLASSIFICATIONS = ["ICC", "Type-I", "MFI", "HFC", "CIC", "P2P", "AA", "Factor", "IFC", "PD", "IDF", "NOFHC", "MGC"]
VALID_LAYERS = ["Base", "Middle", "Upper", "Top"]
VALID_OFFICES = [
    "Mumbai", "New Delhi", "Kolkata", "Chennai", "Ahmedabad",
    "Bengaluru", "Hyderabad", "Jaipur", "Chandigarh", "Kanpur",
    "Guwahati", "Bhopal", "Bhubaneswar", "Patna", "Ranchi",
    "Raipur", "Jammu", "Nagpur", "Dehradun", "Thiruvananthapuram",
    "Shimla", "Andhra Pradesh"
]

df['regional_office'] = df['regional_office'].apply(lambda x: x if x in VALID_OFFICES else None)
df = df[df['classification'].isin(VALID_CLASSIFICATIONS)]
df = df[df['layer'].isin(VALID_LAYERS)]
df = df.dropna(subset=['nbfc_name', 'regional_office', 'classification', 'layer'])
df = df.reset_index(drop=True)

print(df.shape)
print(df['classification'].value_counts())
print(df['regional_office'].value_counts())
print(df.isnull().sum())

df.to_csv("data/nbfc_registry.csv", index=False)
print("CSV saved.")