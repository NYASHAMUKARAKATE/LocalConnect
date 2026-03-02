from app.database import engine, SessionLocal
from sqlalchemy import text

def clear_inventory():
    print(f"Connecting to database: {engine.url}")
    with engine.connect() as conn:
        try:
            # Delete all products to empty the marketplace
            # Also clear any dependent cart items or order items if necessary
            conn.execute(text("TRUNCATE TABLE cart_items CASCADE;"))
            conn.execute(text("TRUNCATE TABLE order_items CASCADE;"))
            conn.execute(text("TRUNCATE TABLE reviews CASCADE;"))
            conn.execute(text("TRUNCATE TABLE products CASCADE;"))
            conn.commit()
            print("Successfully cleared all products and related inventory data.")
        except Exception as e:
            conn.rollback()
            print(f"Error clearing inventory: {e}")

if __name__ == "__main__":
    clear_inventory()
