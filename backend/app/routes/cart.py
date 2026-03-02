from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, database
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.CartItem])
def get_cart(user_id: int, db: Session = Depends(get_db)):
    # In a real app, user_id would come from auth token
    return db.query(models.CartItem).filter(models.CartItem.user_id == user_id).all()

@router.post("/", response_model=schemas.CartItem)
def add_to_cart(item: schemas.CartItemCreate, user_id: int, db: Session = Depends(get_db)):
    # Check if item exists
    db_item = db.query(models.CartItem).filter(
        models.CartItem.user_id == user_id,
        models.CartItem.product_id == item.product_id
    ).first()

    if db_item:
        db_item.quantity += item.quantity
        db.commit()
        db.refresh(db_item)
        return db_item
    
    new_item = models.CartItem(**item.dict(), user_id=user_id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.delete("/{product_id}")
def remove_from_cart(product_id: int, user_id: int, db: Session = Depends(get_db)):
    db.query(models.CartItem).filter(
        models.CartItem.user_id == user_id,
        models.CartItem.product_id == product_id
    ).delete()
    db.commit()
    return {"message": "Item removed"}
