from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set.")

# SQLAlchemy 2.x no longer accepts the legacy "postgres://" scheme
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Supabase requires SSL; local Postgres usually doesn't support it
connect_args = {}
if "supabase.co" in DATABASE_URL or "supabase.com" in DATABASE_URL:
    if "sslmode=" not in DATABASE_URL:
        connect_args["sslmode"] = "require"

if os.getenv("VERCEL"):
    # Serverless: each invocation is short-lived, so let Supabase's pooler do the pooling
    engine = create_engine(DATABASE_URL, poolclass=NullPool, connect_args=connect_args)
else:
    # pool_pre_ping drops stale connections that the Supabase pooler has closed
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
