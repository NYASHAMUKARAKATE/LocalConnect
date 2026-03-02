from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from .. import schemas, models, database
from ..database import get_db
from .auth import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.Review)
def create_review(
    review: schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Check if shop exists
    shop = db.query(models.Shop).filter(models.Shop.id == review.shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # 2. Prevent user from reviewing their own shop
    if shop.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Owners cannot review their own shop")

    # 3. Save Review
    db_review = models.Review(
        customer_id=current_user.id,
        shop_id=review.shop_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # 4. Update Shop's average rating (Conceptual - in a full app we'd keep a cached field)
    all_reviews = db.query(models.Review).filter(models.Review.shop_id == shop.id).all()
    if all_reviews:
        avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
        shop.rating = float(avg_rating)
        db.commit()

    return db_review

@router.get("/shop/{shop_id}", response_model=List[schemas.Review])
def get_shop_reviews(
    shop_id: int,
    db: Session = Depends(get_db)
):
    return db.query(models.Review).filter(models.Review.shop_id == shop_id).all()
