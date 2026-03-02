"""
Update existing users and shops with default coordinates.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models

def update_coordinates():
    db = SessionLocal()
    
    # Update Makoni's Groceries
    shop1 = db.query(models.Shop).filter(models.Shop.name == "Makoni's Groceries").first()
    if shop1:
        shop1.latitude = -17.8000
        shop1.longitude = 31.0333
        
    # Update Green Valley Farms
    shop2 = db.query(models.Shop).filter(models.Shop.name == "Green Valley Farms").first()
    if shop2:
        shop2.latitude = -17.7500
        shop2.longitude = 31.0667

    # Update users
    users = db.query(models.User).all()
    for user in users:
        # Give them a general Harare coordinate
        user.latitude = -17.8252
        user.longitude = 31.0335

    db.commit()
    db.close()
    print("Coordinates updated successfully for existing records.")

if __name__ == "__main__":
    update_coordinates()
