"""
Add latitude and longitude columns to the users and shops tables.

Run this once to add the columns if the tables already exist:
    python add_location_columns.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine


def migrate():
    with engine.connect() as conn:
        # Check if column already exists in users
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'users' AND column_name = 'latitude'"
        ))
        if not result.fetchone():
            conn.execute(text("ALTER TABLE users ADD COLUMN latitude FLOAT"))
            conn.execute(text("ALTER TABLE users ADD COLUMN longitude FLOAT"))
            print("Added latitude & longitude to 'users' table.")

        # Check if column already exists in shops
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'shops' AND column_name = 'latitude'"
        ))
        if not result.fetchone():
            conn.execute(text("ALTER TABLE shops ADD COLUMN latitude FLOAT"))
            conn.execute(text("ALTER TABLE shops ADD COLUMN longitude FLOAT"))
            print("Added latitude & longitude to 'shops' table.")

        conn.commit()
        print("Migration complete.")


if __name__ == "__main__":
    migrate()
