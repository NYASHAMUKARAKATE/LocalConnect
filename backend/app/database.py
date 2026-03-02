from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────────────────────
# DATABASE CONFIGURATION
# ──────────────────────────────────────────────────────────────
# Supports both SQLite (development) and PostgreSQL (production).
#
# To use PostgreSQL, set DATABASE_URL in your .env file:
#   DATABASE_URL=postgresql://user:password@localhost:5432/localconnect
#
# For local development, SQLite is used by default:
#   DATABASE_URL=sqlite:///./localconnect.db
#
# To switch to PostgreSQL:
#   1. Install PostgreSQL and create a database:
#      CREATE DATABASE localconnect;
#   2. Set DATABASE_URL in backend/.env
#   3. Run: alembic upgrade head
#   4. Run: python seed_db.py
# ──────────────────────────────────────────────────────────────

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./localconnect.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
