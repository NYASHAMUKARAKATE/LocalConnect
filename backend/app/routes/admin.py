from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from .. import schemas, models, database
from ..database import get_db
from ..routes.auth import get_current_user

router = APIRouter()


def _require_admin(current_user: models.User):
    if current_user.role != models.UserRole.SYSTEM_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/stats", response_model=schemas.AdminStats)
def read_admin_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.SYSTEM_ADMIN and current_user.role != models.UserRole.SHOP_OWNER: # Allow shop owner to see for demo if needed, but strictly should be admin
        # For this demo let's be strict or allow simplified access? 
        # The prompt implies System Admin.
        pass
    
    if current_user.role != models.UserRole.SYSTEM_ADMIN:
         raise HTTPException(status_code=403, detail="Not authorized")

    total_users = db.query(models.User).count()
    total_shops = db.query(models.Shop).count()
    total_orders = db.query(models.Order).count()
    
    # Calculate total volume (sum of order totals)
    total_volume = db.query(func.sum(models.Order.total_amount)).scalar() or 0.0

    return {
        "total_users": total_users,
        "total_shops": total_shops,
        "total_orders": total_orders,
        "total_volume": total_volume
    }

@router.get("/heatmap", response_model=List[schemas.HeatmapPoint])
def get_demand_heatmap(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.SYSTEM_ADMIN:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    # Query orders and join with customers to get coordinates
    heatmap_data = db.query(
        models.User.latitude,
        models.User.longitude,
        func.count(models.Order.id).label("order_count")
    ).join(models.Order, models.User.id == models.Order.customer_id)\
     .filter(models.User.latitude.isnot(None))\
     .group_by(models.User.latitude, models.User.longitude).all()
    
    return [
        schemas.HeatmapPoint(lat=p.latitude, lng=p.longitude, intensity=float(p.order_count))
        for p in heatmap_data
    ]

@router.get("/customers", response_model=List[schemas.User])
def get_admin_customers(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.SYSTEM_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    # Fetch users who are residents/customers
    customers = db.query(models.User).filter(models.User.role == models.UserRole.RESIDENT).all()
    return customers

@router.get("/shops", response_model=List[schemas.Shop])
def get_admin_shops(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.SYSTEM_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    shops = db.query(models.Shop).all()
    return shops

@router.get("/ambassadors", response_model=List[schemas.User])
def get_admin_ambassadors(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    _require_admin(current_user)
    ambassadors = db.query(models.User).filter(models.User.role == models.UserRole.AMBASSADOR).all()
    return ambassadors


# ─── Category Management ─────────────────────────────────────────────────────

@router.get("/categories", response_model=List[schemas.Category])
def list_categories(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all managed categories (admin view)."""
    _require_admin(current_user)
    return db.query(models.Category).order_by(models.Category.name).all()


@router.post("/categories", response_model=schemas.Category, status_code=201)
def create_category(
    payload: schemas.CategoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new product category. Admins only."""
    _require_admin(current_user)
    existing = db.query(models.Category).filter(
        models.Category.name.ilike(payload.name)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category already exists")
    cat = models.Category(name=payload.name, description=payload.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a category by ID. Products with this category_id will have their
    category_id set to NULL (cascade handled at DB level via nullable FK).
    Admins only.
    """
    _require_admin(current_user)
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"detail": f"Category '{cat.name}' deleted"}


# ─── Bridge Verification oversight ───────────────────────────────────────────

@router.get("/verifications", response_model=List[schemas.BridgeVerification])
def get_all_verifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all BridgeVerification records platform-wide. Admins only."""
    _require_admin(current_user)
    return db.query(models.BridgeVerification)\
             .order_by(models.BridgeVerification.verified_at.desc())\
             .all()
