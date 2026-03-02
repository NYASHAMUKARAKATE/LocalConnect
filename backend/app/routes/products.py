from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional, Any
import math
from .. import schemas, models, database
from ..database import get_db

# ─── Haversine helper ────────────────────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# Approx degrees per km at the equator (safe upper bound for a bounding box).
# 0.1° ≈ 11 km, giving a ~22 km search square before exact Haversine filtering.
_DEG_PER_KM = 0.009  # 1 km ≈ 0.009°
_RADIUS_KM = 12       # bounding box half-side (slightly > 10 km threshold)
_BOX_DEG = _DEG_PER_KM * _RADIUS_KM   # ≈ 0.108°


router = APIRouter()


@router.get("/")
def read_products(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    shop_id: Optional[int] = None,
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product).options(joinedload(models.Product.shop))

    if shop_id:
        query = query.filter(models.Product.shop_id == shop_id)
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
    if category:
        query = query.filter(func.lower(models.Product.category) == category.lower())
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)

    # ── Bounding-box pre-filter (Rec 5) ──────────────────────────────────────
    # Before fetching all products and sorting in Python, restrict rows to
    # shops whose coordinates fall within a lat/lng bounding square.
    # This drastically reduces the working set before the precise Haversine sort.
    if lat is not None and lng is not None:
        query = query.join(models.Shop, models.Product.shop_id == models.Shop.id)\
                     .filter(
                         models.Shop.latitude.between(lat - _BOX_DEG, lat + _BOX_DEG),
                         models.Shop.longitude.between(lng - _BOX_DEG, lng + _BOX_DEG)
                     )

    if sort_by == "price_asc":
        query = query.order_by(models.Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(models.Product.price.desc())
    elif sort_by == "popular":
        query = query.order_by(models.Product.sold.desc())
    elif sort_by != "distance":
        query = query.order_by(models.Product.created_at.desc())

    # Pagination
    skip = (page - 1) * page_size
    total_count = query.count()
    products = query.offset(skip).limit(page_size).all()

    # Precise Haversine sort (runs on the already-filtered subset)
    if sort_by == "distance" and lat is not None and lng is not None:
        products.sort(
            key=lambda p: haversine(
                lat, lng,
                p.shop.latitude if p.shop else None,
                p.shop.longitude if p.shop else None
            )
        )

    # Attach human-readable distance string for the frontend
    for p in products:
        p.distance_str = "Nearby"
        if lat is not None and lng is not None and p.shop and p.shop.latitude and p.shop.longitude:
            try:
                dist = haversine(lat, lng, p.shop.latitude, p.shop.longitude)
                p.distance_str = f"{int(dist * 1000)} m" if dist < 1 else f"{dist:.1f} km"
            except Exception:
                pass

    return {
        "data": products,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total_count / page_size) if page_size else 1,
    }


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """
    Return all available product categories.
    Prefers structured Category table rows; falls back to DISTINCT legacy
    string values from products for backward compatibility.
    """
    cat_rows = db.query(models.Category).order_by(models.Category.name).all()
    if cat_rows:
        return [{"id": c.id, "name": c.name, "description": c.description} for c in cat_rows]
    # Legacy fallback
    legacy = db.query(models.Product.category).distinct().all()
    return [{"id": None, "name": c[0], "description": None} for c in legacy if c[0]]


@router.get("/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    product.distance_str = "Nearby"
    return product


@router.post("/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, shop_id: int, db: Session = Depends(get_db)):
    shop = db.query(models.Shop).filter(models.Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    db_product = models.Product(**product.dict(), shop_id=shop_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product
