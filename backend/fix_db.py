import os
from sqlalchemy import text
from app.database import engine, SessionLocal
from app import models

def fix_database():
    print(f"Connecting to database: {engine.url}")
    
    # 1. Add missing columns using raw SQL via SQLAlchemy
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN latitude FLOAT;"))
            conn.commit()
            print("Added latitude column to users table.")
        except Exception as e:
            conn.rollback()
            print("latitude column already exists or error:", e)

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN longitude FLOAT;"))
            conn.commit()
            print("Added longitude column to users table.")
        except Exception as e:
            conn.rollback()
            print("longitude column already exists or error:", e)

    # 2. Check and add Shops for any SHOP_OWNERs that don't have one
    db = SessionLocal()
    try:
        # Find shop owners
        # In SQLAlchemy, Enum 'role' can be queried by string usually, or by models.UserRole.SHOP_OWNER
        shop_owners = db.query(models.User).filter(
            models.User.role == models.UserRole.SHOP_OWNER
        ).all()

        created_count = 0
        for owner in shop_owners:
            # Check if they have a shop
            existing_shop = db.query(models.Shop).filter(models.Shop.owner_id == owner.id).first()
            if not existing_shop:
                new_shop = models.Shop(
                    name=f"{owner.name}'s Shop",
                    owner_id=owner.id,
                    location=owner.location or "Online",
                    latitude=owner.latitude,
                    longitude=owner.longitude,
                    phone=owner.phone or "N/A"
                )
                db.add(new_shop)
                created_count += 1
        
        if created_count > 0:
            db.commit()
            print(f"Successfully created {created_count} missing shops for shop owners.")
        else:
            print("All shop owners already have shops.")

    except Exception as e:
        db.rollback()
        print(f"Error checking/creating shops: {e}")
    finally:
        db.close()

    print("Database fix completed.")

if __name__ == "__main__":
    fix_database()
