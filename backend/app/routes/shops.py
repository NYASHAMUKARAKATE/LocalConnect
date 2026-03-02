from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, database
from ..database import get_db
from .auth import get_current_user
from .notifications import public_manager
import asyncio

router = APIRouter()

@router.get("/", response_model=List[schemas.Shop])
def read_shops(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Shop).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.Shop)
def create_shop(shop: schemas.ShopCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_shop = models.Shop(**shop.dict())
    db.add(db_shop)
    db.commit()
    db.refresh(db_shop)
    
    # Broadcast new shop to public websocket
    # Convert db_shop to dict for JSON serialization
    shop_dict = {
        "id": db_shop.id,
        "name": db_shop.name,
        "latitude": db_shop.latitude,
        "longitude": db_shop.longitude,
        "location": db_shop.location,
        "distance": "Nearby"
    }
    
    # Run the broadcast safely in the event loop background
    background_tasks.add_task(
        lambda: asyncio.run(public_manager.broadcast({"type": "new_shop", "shop": shop_dict}))
    )

    return db_shop
@router.get("/my-shop", response_model=schemas.Shop)
def read_my_shop(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.SHOP_OWNER:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    shop = db.query(models.Shop).filter(models.Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop
