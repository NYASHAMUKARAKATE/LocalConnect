from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from .enums import UserRole, OrderStatus, ZonePriority, PaymentMethod, PaymentStatus

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    role: str
    user_id: int

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    role: UserRole = UserRole.RESIDENT
    credits: int = 0

    class Config:
        use_enum_values = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True

# ─── Category ───────────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Product ─────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    name: str
    category: str
    category_id: Optional[int] = None
    price: float
    stock: int
    image_url: Optional[str] = None
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    shop_id: Optional[int] = None
    sold: int
    created_at: datetime
    distance_str: Optional[str] = None
    shop: Optional["ShopBase"] = None

    class Config:
        from_attributes = True

class ShopBase(BaseModel):
    id: Optional[int] = None
    name: str
    owner_id: int
    phone: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    offers_delivery: bool = False
    delivery_fee: float = 0.0

    class Config:
        from_attributes = True

class ShopCreate(ShopBase):
    pass

class Shop(ShopBase):
    rating: float
    created_at: datetime
    products: List[Product] = []

    class Config:
        from_attributes = True

# Re-build forward reference
Product.model_rebuild()

# ─── Cart ────────────────────────────────────────────────────────────────────

class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: int
    user_id: int
    created_at: datetime
    product: Product

    class Config:
        from_attributes = True

# ─── Orders ──────────────────────────────────────────────────────────────────

class OrderItemBase(BaseModel):
    product_id: Optional[int] = None  # May be NULL if the product was deleted
    quantity: int
    price: float

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    product: Optional[Product] = None  # May be None if the product was deleted

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    total_amount: float
    status: str
    delivery_status: str = "Pending"
    delivery_type: str = "pickup"
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None
    delivery_fee: float = 0.0
    credits_used: int = 0

class OrderCreate(BaseModel):
    delivery_type: str = "pickup"
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None
    credits_to_use: int = 0

class Order(OrderBase):
    id: int
    customer_id: int
    shop_id: int
    created_at: datetime
    items: List[OrderItem] = []
    shop: Optional[ShopBase] = None

    class Config:
        from_attributes = True

# ─── Zones ───────────────────────────────────────────────────────────────────

class ZoneBase(BaseModel):
    name: str
    coverage: float
    priority: str

class Zone(ZoneBase):
    id: int

    class Config:
        from_attributes = True

# ─── Payments ────────────────────────────────────────────────────────────────

class PaymentBase(BaseModel):
    order_id: int
    payment_method: PaymentMethod
    amount: float
    paynow_reference: Optional[str] = None
    poll_url: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    payment_status: PaymentStatus
    transaction_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentIntentCreate(BaseModel):
    order_id: int
    payment_method: PaymentMethod

class PaymentIntentResponse(BaseModel):
    order_id: int
    payment_method: PaymentMethod
    amount: float
    transaction_id: str
    status: str

# ─── Ambassador / Bridge Verification ────────────────────────────────────────

class AmbassadorStats(BaseModel):
    verified_shops: int
    pending_invites: int
    community_score: int

class BridgeVerificationCreate(BaseModel):
    shop_id: int
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None

class BridgeVerificationReview(BaseModel):
    """Used by a senior Ambassador or Admin to approve / reject a verification."""
    status: str   # 'approved' or 'rejected'

class BridgeVerification(BaseModel):
    id: int
    ambassador_id: int
    shop_id: int
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    status: str
    reviewed_by: Optional[int] = None
    verified_at: datetime

    class Config:
        from_attributes = True

# ─── Admin ───────────────────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    total_shops: int
    total_orders: int
    total_volume: float

class TopProduct(BaseModel):
    id: int
    name: str
    sold: int
    revenue: float

class CustomerSegment(BaseModel):
    segment_name: str
    customer_count: int

class DailySales(BaseModel):
    day: str
    sales: float

class CategoryBreakdown(BaseModel):
    name: str
    value: int
    color: str = "#64748B"

class ShopAnalytics(BaseModel):
    total_revenue: float
    total_orders: int
    active_products: int
    top_products: List[TopProduct]
    revenue_forecast: float = 0.0
    customer_segments: List[CustomerSegment] = []
    daily_sales: List[DailySales] = []
    category_breakdown: List[CategoryBreakdown] = []

class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float  # based on density of orders

# ─── Messages ────────────────────────────────────────────────────────────────

class MessageBase(BaseModel):
    content: str
    receiver_id: Optional[int] = None
    shop_id: Optional[int] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    sender_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Reviews ─────────────────────────────────────────────────────────────────

class ReviewBase(BaseModel):
    shop_id: int
    rating: int
    comment: str

class ReviewCreate(ReviewBase):
    pass

class Review(ReviewBase):
    id: int
    customer_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Resolve forward references ───────────────────────────────────────────────
Product.model_rebuild()
User.model_rebuild()
Order.model_rebuild()
Message.model_rebuild()
