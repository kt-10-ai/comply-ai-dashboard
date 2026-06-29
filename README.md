# Comply.AI — NBFC Compliance Intelligence Platform

**Comply.AI** is an enterprise-grade, AI-powered Compliance Management Platform built specifically for Indian Non-Banking Financial Companies (NBFCs). It automates regulatory reporting workflows and deadline tracking by translating complex **RBI Master Directions (Scale-Based Regulation Framework, 2025)** into a dynamic, real-time rule engine.

Instead of storing static, hardcoded due dates that quickly become obsolete, Comply.AI stores **regulatory logic** (e.g., *"15 days after quarter-end"*) and dynamically computes exact deadlines based on each NBFC's unique Classification, SBR Layer, and Deposit-taking status — recalculating every single time, from today's date.

> **Live Demo:** [https://comply-ai-dashboard.vercel.app](https://comply-ai-dashboard.vercel.app)  
> **Backend API:** [https://comply-ai.onrender.com](https://comply-ai.onrender.com)

---

## Table of Contents

1. [Key Features](#key-features)
2. [How the Core Engine Works](#how-the-core-engine-works)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [API Reference](#api-reference)
6. [Data Architecture](#data-architecture)
7. [Regulatory Context](#regulatory-context)
8. [Deployment Guide](#deployment-guide)
9. [Local Development](#local-development)
10. [Environment Variables](#environment-variables)
11. [Disclaimer](#disclaimer)

---

## Key Features

### 1. 🏛️ NBFC Registry (9,074+ Entities)
A fully searchable, filterable database of every RBI-registered NBFC in India. Each entity contains:
- **CIN** (Corporate Identity Number)
- **SBR Layer** (Base / Middle / Upper / Top)
- **Classification** (ICC, MFI, CIC, HFC, IDF, IFC, MGC, NBFC-P2P, SPD)
- **Regional Office** (22 RBI offices across India)
- **Deposit-taking status**

### 2. ⚙️ Dynamic Rule Engine
The heart of the platform. Instead of a static spreadsheet, the engine:
- Loads structured regulatory rules from `compliance_rules.json`
- Filters applicable rules by the NBFC's Layer + Classification
- Dynamically computes the exact due date from today's date using RBI-prescribed logic
- Auto-classifies each return as `UPCOMING`, `DUE SOON`, or `OVERDUE`

### 3. 📅 Master Compliance Calendar
A global calendar view across all NBFC categories showing:
- All upcoming, due soon, and overdue regulatory deadlines
- Filterable by Classification and SBR Layer
- Full audit trail showing exactly how each date was computed

### 4. 🔍 Compliance Explorer (Entity Deep Dive)
Click into any NBFC to see its complete regulatory profile:
- **Full compliance calendar** specific to that entity
- **Structural mandates** (Board-approved FPC, KYC cycles, Grievance Redressal obligations)
- **Risk exposure** (daily penalty per return, maximum liability)
- **Maker/Checker workflow roles** (who drafts vs. who approves each return)
- **Pre-requisites** (e.g., Board Approval, Auditor Sign-off required before filing)
- **Direct template links** (one-click access to blank XBRL/PDF submission forms)

### 5. 🤖 AI Knowledge Assistant (Gemini-Powered)
A conversational compliance expert powered by Google Gemini 2.5 Flash with:
- **Function Calling** — can query the live PostgreSQL database in real-time to answer NBFC-specific questions
- **Multilingual support** — detects and responds in the user's language (Hindi, English, Gujarati, etc.)
- **Strict guardrails** — refuses to answer anything outside of NBFC/RBI compliance scope
- **Context-aware** — maintains conversation history for multi-turn Q&A

### 6. 🔐 Authentication (Supabase Auth)
- Secure email + password signup/login
- Protected routes — all pages require authentication
- Session persistence across browser refreshes

---

## How the Core Engine Works

### Rule Storage (`compliance_rules.json`)
Each RBI return is stored as a structured rule object — not a date, but the *logic* to derive a date:

```json
{
  "id": "NBS-1",
  "return_name": "Capital Funds, Risk Assets & Risk Asset Ratio",
  "applicable_classification": ["ICC", "MFI", "HFC"],
  "applicable_layer": ["Middle", "Upper", "Top"],
  "frequency": "Quarterly",
  "rule_type": "quarter_end",
  "offset_days": 15,
  "due_basis": "15 days after quarter end (Jun 30 / Sep 30 / Dec 31 / Mar 31)",
  "submission_portal": "RBI CIMS",
  "portal_url": "https://cims.rbi.org.in/",
  "legal_source": "RBI (NBFCs – Scale Based Regulation) Directions, 2025",
  "clause": "Para 74",
  "regulator": "RBI – DNBS"
}
```

### Rule Types Supported

| `rule_type` | Logic |
|---|---|
| `month_end` | `last day of previous month + offset_days` |
| `quarter_end` | `last completed Indian FY quarter end + offset_days` |
| `fy_end` | `last completed 31 March + offset_days` |
| `fixed_date` | `fixed_month / fixed_day each year` |
| `event` | On occurrence — no fixed schedule |

### Date Computation Lifecycle

```
Today's Date
    │
    ▼
Identify last completed period end (e.g. Jun 30 for quarter_end)
    │
    ▼
Add offset_days (e.g. + 15 days = Jul 15)
    │
    ▼
Compare to today → delta = due_date − today
    │
    ├── delta < 0         → OVERDUE
    ├── 0 ≤ delta ≤ 7     → DUE SOON
    └── delta > 7         → UPCOMING
```

### Applicability Filtering

Before computing any date, the engine checks:
1. Is the NBFC's `classification` in the rule's `applicable_classification` array?
2. Is the NBFC's `layer` in the rule's `applicable_layer` array?

If either check fails, the rule is **silently skipped** — the NBFC never sees an obligation that doesn't apply to them.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, Recharts, Framer Motion |
| **Routing** | React Router v7 |
| **Auth** | Supabase Auth (`@supabase/supabase-js`) |
| **HTTP Client** | Axios |
| **Backend** | Python 3.14, FastAPI, Uvicorn |
| **ORM** | SQLAlchemy 2.0 |
| **Database** | PostgreSQL (Render) |
| **AI** | Google Gemini 2.5 Flash via OpenRouter (Function Calling) |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render (Web Service) |

---

## Project Structure

```
Comply.AI/
│
├── backend/
│   ├── main.py              # FastAPI server, all API endpoints
│   ├── database.py          # SQLAlchemy engine, session factory
│   ├── models.py            # NBFC PostgreSQL table schema
│   ├── calendar_engine.py   # Core: dynamic due-date computation & calendar builder
│   └── chat.py              # Gemini AI chatbot with function calling
│
├── frontend/
│   └── src/
│       ├── api/
│       │   └── axios.js         # Axios instance (reads VITE_API_URL env var)
│       ├── components/          # Reusable UI elements (Badges, Sidebar, Layout)
│       ├── context/
│       │   └── AuthContext.jsx  # Supabase Auth state management
│       ├── lib/
│       │   └── supabase.js      # Supabase client initialisation
│       ├── pages/
│       │   ├── Login.jsx        # Authentication page
│       │   ├── Dashboard.jsx    # KPI overview + stats + charts
│       │   ├── Registry.jsx     # Searchable NBFC registry table
│       │   ├── Detail.jsx       # Full entity compliance profile
│       │   ├── Matrix.jsx       # Compliance rules explorer
│       │   ├── Calendar.jsx     # Global compliance calendar
│       │   └── Chat.jsx         # AI chatbot interface
│       ├── App.jsx              # Root component + routing
│       └── index.css            # Global styles + design tokens
│
├── data/
│   ├── compliance_rules.json        # All RBI return rules (structured logic)
│   ├── classification_metadata.json # Structural mandates (KYC, FPC, Ombudsman)
│   └── rbi_portals.json            # Submission portal metadata
│
├── scripts/
│   ├── extract_nbfc.py   # Parses RBI PDF to build nbfc_registry.csv
│   └── seed_db.py        # Seeds PostgreSQL from nbfc_registry.csv
│
└── requirements.txt      # Python backend dependencies
```

---

## API Reference

Base URL: `https://comply-ai.onrender.com`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/nbfc/search?name=&classification=&layer=&regional_office=` | Search NBFCs with filters |
| `GET` | `/nbfc/stats` | Total count by layer and classification |
| `GET` | `/nbfc/{cin}` | Full NBFC profile + compliance calendar |
| `GET` | `/compliance/rules?classification=&layer=` | Filtered compliance rules |
| `GET` | `/compliance/portals` | All RBI submission portals |
| `GET` | `/compliance/stats` | Dashboard aggregate statistics |
| `GET` | `/compliance/calendar?classification=&layer=` | All upcoming deadlines (global) |
| `POST` | `/api/chat` | AI chatbot endpoint (Gemini function calling) |

---

## Data Architecture

### NBFC Registry Table (`nbfc_registry`)

| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Auto-generated primary key |
| `sl_no` | Integer | RBI serial number |
| `nbfc_name` | String | Company name |
| `cin` | String | Corporate Identity Number |
| `classification` | String | ICC / MFI / CIC / HFC / etc. |
| `layer` | String | Base / Middle / Upper / Top |
| `regional_office` | String | RBI regional office jurisdiction |
| `accepts_deposits` | String | Yes / No |

### Compliance Rule Schema (`compliance_rules.json`)

Each rule object supports these fields:

```json
{
  "id": "string",
  "return_name": "string",
  "applicable_classification": ["ICC", "MFI", ...],
  "applicable_layer": ["Base", "Middle", ...],
  "frequency": "Monthly | Quarterly | Annual | On Occurrence",
  "rule_type": "month_end | quarter_end | fy_end | fixed_date | event",
  "offset_days": 15,
  "due_basis": "Human-readable explanation",
  "submission_portal": "string",
  "portal_url": "url",
  "legal_source": "string",
  "clause": "string",
  "regulator": "string",
  "penalty_per_day": 10000,
  "max_penalty": 100000,
  "maker_role": "string",
  "checker_role": "string",
  "prerequisites": ["Board Approval", ...],
  "internal_buffer_days": 5,
  "blank_template_url": "url"
}
```

---

## Regulatory Context

This platform encodes logic derived from official RBI Master Directions, including:

- **RBI (NBFCs – Scale Based Regulation) Directions, 2025**
- **RBI (NBFCs – Prudential Norms on Capital Adequacy) Directions, 2025**
- **RBI (NBFCs – Governance) Directions, 2025**
- **RBI (NBFCs – Liquidity Risk Management) Directions, 2025**

### SBR Layer Classification Summary

| Layer | Criteria |
|---|---|
| **Base Layer** | Asset size < ₹1,000 Cr, no systemic risk |
| **Middle Layer** | Asset size ≥ ₹1,000 Cr, listed NBFCs, deposit-taking |
| **Upper Layer** | RBI-identified top 25–50 systemically important NBFCs |
| **Top Layer** | Reserved for extraordinary supervisory concerns |

### NBFC Classification Types

| Code | Full Name |
|---|---|
| ICC | Investment & Credit Company |
| MFI | Microfinance Institution |
| CIC | Core Investment Company |
| HFC | Housing Finance Company |
| IDF | Infrastructure Debt Fund |
| IFC | Infrastructure Finance Company |
| MGC | Mortgage Guarantee Company |
| NBFC-P2P | Peer-to-Peer Lending Platform |
| SPD | Standalone Primary Dealer |

---

## Deployment Guide

### Backend (Render Web Service)

| Setting | Value |
|---|---|
| **Runtime** | Python |
| **Root Directory** | *(blank)* |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Environment Variables on Render:**

| Key | Value |
|---|---|
| `DATABASE_URL` | Internal PostgreSQL URL from Render DB |
| `GEMINI_API_KEY` | Your OpenRouter or Google AI API key |

### Frontend (Vercel)

| Setting | Value |
|---|---|
| **Framework** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

**Environment Variables on Vercel:**

| Key | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### Database Seeding

After deploying, seed the cloud database once from your local machine:

```bash
DATABASE_URL="your-render-external-db-url" python scripts/seed_db.py
```

This will upload all 9,074 RBI-registered NBFCs into your production database.

---

## Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- A PostgreSQL database (local or cloud)

### 1. Clone the Repository
```bash
git clone https://github.com/kt-10-ai/comply-ai-dashboard.git
cd comply-ai-dashboard
```

### 2. Backend Setup
```bash
pip install -r requirements.txt
```

Create a `.env` file in the root:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/comply_ai
GEMINI_API_KEY=your_api_key_here
```

Seed the database:
```bash
python scripts/seed_db.py
```

Start the backend:
```bash
cd backend
uvicorn main:app --reload --port 8000
```
API available at: `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `frontend/.env` file:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the frontend:
```bash
npm run dev
```
App available at: `http://localhost:5173`

---

## Environment Variables

### Backend (`.env` in root)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ | OpenRouter or Google AI API key for the chatbot |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL |
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL for auth |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key for auth |

---

## Disclaimer

> The **statutory penalty amounts**, **internal SLA buffers**, **Maker/Checker roles**, and **blank template URLs** included in the default `compliance_rules.json` are **mock/illustrative data** designed to demonstrate platform capabilities. They must be reviewed, validated, and updated by a qualified legal or compliance team before use in any production or advisory context.
>
> The core **deadline computation logic** (rule types, offsets, period calculations) is derived from publicly available RBI Master Directions and is intended to be accurate to the best of our knowledge as of 2025.
