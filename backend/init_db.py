import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

load_dotenv()

# We need to connect to the default 'postgres' database to create a new one
DEFAULT_DB_URL = os.getenv("DEFAULT_DB_URL", "postgresql://postgres:password@localhost/postgres")
TARGET_DB_NAME = "localconnect"

def create_database():
    try:
        # Parse the URL to get connection params (simplified)
        # Assuming format: postgresql://user:password@host/dbname
        from urllib.parse import urlparse
        result = urlparse(DEFAULT_DB_URL)
        username = result.username
        password = result.password
        database = result.path[1:]
        hostname = result.hostname
        port = result.port or 5432

        con = psycopg2.connect(
            dbname=database,
            user=username,
            host=hostname,
            password=password,
            port=port
        )

        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()

        # Check if database exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{TARGET_DB_NAME}'")
        exists = cur.fetchone()

        if not exists:
            print(f"Creating database {TARGET_DB_NAME}...")
            cur.execute(f"CREATE DATABASE {TARGET_DB_NAME}")
            print(f"Database {TARGET_DB_NAME} created successfully.")
        else:
            print(f"Database {TARGET_DB_NAME} already exists.")

        cur.close()
        con.close()

    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_database()
