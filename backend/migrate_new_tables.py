"""
One-time migration script to sync the PostgreSQL database with the new
models added during the recommendation implementation:

1. Creates the `categories` table (if not exists)
2. Creates the `bridge_verifications` table (if not exists)
3. Adds `category_id` column to `products` (if not exists)

Run once:  python migrate_new_tables.py
"""
import os
import sys

# Ensure the app package is importable
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine

DDL_STATEMENTS = [
    # 1. categories table
    """
    CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR UNIQUE NOT NULL,
        description VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
    );
    """,

    # 2. bridge_verifications table
    """
    CREATE TABLE IF NOT EXISTS bridge_verifications (
        id SERIAL PRIMARY KEY,
        ambassador_id INTEGER NOT NULL REFERENCES users(id),
        shop_id INTEGER NOT NULL REFERENCES shops(id),
        status VARCHAR DEFAULT 'pending',
        notes TEXT,
        photo_url VARCHAR,
        gps_lat FLOAT,
        gps_lon FLOAT,
        reviewed_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP DEFAULT NOW()
    );
    """,

    # 3. Add category_id column to products (nullable FK)
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'category_id'
        ) THEN
            ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);
        END IF;
    END
    $$;
    """,
]


def run_migration():
    with engine.connect() as conn:
        for stmt in DDL_STATEMENTS:
            conn.execute(text(stmt))
        conn.commit()
    print("✅ Migration complete — categories, bridge_verifications tables created; "
          "category_id column added to products.")


if __name__ == "__main__":
    run_migration()
