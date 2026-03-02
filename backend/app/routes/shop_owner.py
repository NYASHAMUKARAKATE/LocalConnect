from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from .. import schemas, models, database
from ..database import get_db
from .auth import get_current_user

router = APIRouter()

def check_shop_owner(current_user: models.User):
    if current_user.role != models.UserRole.SHOP_OWNER:
        raise HTTPException(status_code=403, detail="Only shop owners can access this resource")
    return current_user

@router.get("/my-shop", response_model=schemas.Shop)
def get_my_shop(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_shop_owner(current_user)
    shop = db.query(models.Shop).filter(models.Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found for this user")
    return shop

@router.get("/products", response_model=List[schemas.Product])
def get_shop_products(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_shop_owner(current_user)
    shop = db.query(models.Shop).filter(models.Shop.owner_id == current_user.id).first()
    if not shop:
        return []
    return db.query(models.Product).filter(models.Product.shop_id == shop.id).all()

@router.post("/products", response_model=schemas.Product)
def add_shop_product(
    product: schemas.ProductBase,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_shop_owner(current_user)
    shop = db.query(models.Shop).filter(models.Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    db_product = models.Product(**product.dict(), shop_id=shop.id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/products/{product_id}", response_model=schemas.Product)
def update_shop_product(
    product_id: int,
    product_update: schemas.ProductBase,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_shop_owner(current_user)
    shop = db.query(models.Shop).filter(models.Shop.owner_id == current_user.id).first()
    
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.shop_id == shop.id
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found in your shop")
    
    for key, value in product_update.dict().items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/products/{product_id}")
def delete_shop_product(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_shop_owner(current_user)
    shop = db.query(models.Shop).filter(models.Shop.owner_id == current_user.id).first()
    
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.shop_id == shop.id
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found in your shop")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.get("/analytics", response_model=schemas.ShopAnalytics)
def get_shop_analytics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_shop_owner(current_user)
    shop = db.query(models.Shop).filter(models.Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    # Sales Analytics
    total_orders = db.query(models.Order).filter(models.Order.shop_id == shop.id).count()
    total_revenue = db.query(func.sum(models.Order.total_amount)).filter(models.Order.shop_id == shop.id).scalar() or 0.0
    active_products = db.query(models.Product).filter(models.Product.shop_id == shop.id).count()

    # Top Products
    top_products_query = db.query(
        models.Product.id,
        models.Product.name,
        models.Product.sold,
        (models.Product.sold * models.Product.price).label("revenue")
    ).filter(models.Product.shop_id == shop.id).order_by(models.Product.sold.desc()).limit(5).all()

    top_products = [
        schemas.TopProduct(id=p.id, name=p.name, sold=p.sold, revenue=p.revenue)
        for p in top_products_query
    ]

    # Analytics computations for Phase 5
    # Forecast Strategy: Calculate historical 7-day average and multiply by next 7 days
    from datetime import datetime, timedelta
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_revenue = db.query(func.sum(models.Order.total_amount)).filter(
        models.Order.shop_id == shop.id,
        models.Order.created_at >= seven_days_ago
    ).scalar() or 0.0
    
    revenue_forecast = (recent_revenue / 7) * 7  # Extrapolate for next 7 days based on last 7
    
    # Customer Segmentation Strategy
    # Segment buyers as 'First-time', 'Returning', 'Loyal' based on order counts
    customer_order_counts = db.query(
        models.Order.customer_id, 
        func.count(models.Order.id).label('order_count')
    ).filter(models.Order.shop_id == shop.id).group_by(models.Order.customer_id).all()

    loyal_count = sum(1 for c in customer_order_counts if c.order_count >= 5)
    returning_count = sum(1 for c in customer_order_counts if 2 <= c.order_count < 5)
    first_time_count = sum(1 for c in customer_order_counts if c.order_count == 1)

    customer_segments = [
        schemas.CustomerSegment(segment_name="Loyal VIPs", customer_count=loyal_count),
        schemas.CustomerSegment(segment_name="Returning", customer_count=returning_count),
        schemas.CustomerSegment(segment_name="First-time", customer_count=first_time_count)
    ]

    # Daily Sales Trend (last 7 days)
    daily_sales = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        revenue = db.query(func.sum(models.Order.total_amount)).filter(
            models.Order.shop_id == shop.id,
            models.Order.created_at >= day_start,
            models.Order.created_at < day_end
        ).scalar() or 0.0
        daily_sales.append(schemas.DailySales(
            day=day_names[day_start.weekday()],
            sales=round(revenue, 2)
        ))

    # Category Breakdown (sold units by product category)
    category_colors = {
        "Vegetables": "#10B981", "Fruits": "#F59E0B", "Grains": "#8B5CF6",
        "Dairy": "#1E40AF", "Bakery": "#D97706", "Meat & Poultry": "#EF4444",
        "Beverages": "#06B6D4", "Snacks": "#F97316", "Personal Care": "#EC4899",
        "Household": "#6366F1", "Fashion": "#14B8A6", "Electronics": "#3B82F6",
        "Other": "#64748B"
    }
    category_query = db.query(
        models.Product.category,
        func.sum(models.Product.sold).label("total_sold")
    ).filter(
        models.Product.shop_id == shop.id
    ).group_by(models.Product.category).all()

    category_breakdown = [
        schemas.CategoryBreakdown(
            name=cat.category or "Other",
            value=int(cat.total_sold or 0),
            color=category_colors.get(cat.category, "#64748B")
        )
        for cat in category_query if cat.total_sold and cat.total_sold > 0
    ]

    return schemas.ShopAnalytics(
        total_revenue=total_revenue,
        total_orders=total_orders,
        active_products=active_products,
        top_products=top_products,
        revenue_forecast=revenue_forecast,
        customer_segments=customer_segments,
        daily_sales=daily_sales,
        category_breakdown=category_breakdown
    )
