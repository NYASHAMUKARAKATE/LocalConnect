"""
Add image_embedding column to the products table.

Run this once to add the column if the table already exists:
    python add_embedding_column.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine


def migrate():
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'products' AND column_name = 'image_embedding'"
        ))
        if result.fetchone():
            print("Column 'image_embedding' already exists. Nothing to do.")
            return

        # Add the column
        conn.execute(text(
            "ALTER TABLE products ADD COLUMN image_embedding JSON"
        ))
        conn.commit()
        print("Added 'image_embedding' column to products table.")


if __name__ == "__main__":
    migrate()
