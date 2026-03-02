from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base
from .enums import UserRole, OrderStatus, ZonePriority, PaymentMethod, PaymentStatus


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(SQLEnum(UserRole), default=UserRole.RESIDENT)
    name = Column(String)
    phone = Column(String)
    location = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ambassador_data = Column(JSON, nullable=True)
    credits = Column(Integer, default=0)
    # credits: loyalty points earned by residents for purchases and by
    # ambassadors for completed verifications. Redeemable at checkout.

    shops = relationship("Shop", back_populates="owner")
    orders = relationship("Order", back_populates="customer")
    cart_items = relationship("CartItem", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    reviews = relationship("Review", back_populates="customer")


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    phone = Column(String)
    location = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    rating = Column(Float, default=0.0)
    image_url = Column(String)
    is_verified = Column(Boolean, default=False)
    offers_delivery = Column(Boolean, default=False)
    delivery_fee = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="shops")
    products = relationship("Product", back_populates="shop")
    orders = relationship("Order", back_populates="shop")
    messages = relationship("Message", back_populates="shop")
    reviews = relationship("Review", back_populates="shop")
    verifications = relationship("BridgeVerification", back_populates="shop")


class Category(Base):
    """
    Dedicated category table replacing free-text Product.category strings.
    Enables hierarchical browsing and admin-managed category taxonomy.
    Products link to this table via category_id (nullable FK for backward
    compatibility with rows that still use the legacy `category` string).
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="category_obj")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    name = Column(String)
    category = Column(String)        # Legacy free-text; kept for backward compatibility
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    price = Column(Float)
    stock = Column(Integer)
    sold = Column(Integer, default=0)
    image_url = Column(String)
    description = Column(String)
    image_embedding = Column(JSON, nullable=True)  # CLIP embedding for CV search
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    shop = relationship("Shop", back_populates="products")
    category_obj = relationship("Category", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    shop_id = Column(Integer, ForeignKey("shops.id"))
    total_amount = Column(Float)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    delivery_status = Column(String, default="Pending")  # Pending, Ready for Pickup, Out for Delivery, Delivered
    delivery_type = Column(String, default="pickup")     # pickup or delivery
    delivery_address = Column(String, nullable=True)
    delivery_notes = Column(String, nullable=True)
    delivery_fee = Column(Float, default=0.0)
    credits_used = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("User", back_populates="orders")
    shop = relationship("Shop", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", uselist=False, back_populates="order")


class Payment(Base):
    """
    Tracks the payment lifecycle for each Order.
    Supports Paynow (Zimbabwe mobile money / card gateway) and cash.
    - paynow_reference: reference string returned by the Paynow API
    - poll_url: URL used to poll the Paynow API for payment status updates
    Both fields are populated by `backend/app/routes/payments.py` on
    initiation and cleared once the transaction is confirmed or failed.
    """
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True)
    payment_method = Column(SQLEnum(PaymentMethod))
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    transaction_id = Column(String, unique=True, nullable=True)
    paynow_reference = Column(String, nullable=True)
    poll_url = Column(String, nullable=True)
    amount = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="payment")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price = Column(Float)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Zone(Base):
    """
    A geographic service zone managed by Bridge Ambassadors.
    - coverage: radius in kilometres that this zone covers
    - priority: LOW / MEDIUM / HIGH — used by admins to direct Ambassador
      effort toward underserved or high-demand areas.
    ZonePriority enum is defined in `backend/app/enums.py`.
    """
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    coverage = Column(Float)
    priority = Column(SQLEnum(ZonePriority), default=ZonePriority.MEDIUM)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # If null, message goes to shop owner
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=True)
    content = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    shop = relationship("Shop", back_populates="messages")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    shop_id = Column(Integer, ForeignKey("shops.id"))
    rating = Column(Integer)  # 1-5
    comment = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("User", back_populates="reviews")
    shop = relationship("Shop", back_populates="reviews")


class BridgeVerification(Base):
    """
    Audit record created each time a Bridge Ambassador verifies a shop.
    Replaces the previous approach where verification was only stored as
    Shop.is_verified (a single boolean). Each record captures:
      - ambassador_id : who performed the verification visit
      - shop_id       : which shop was verified
      - photo_url     : photo evidence captured during the field visit
      - gps_lat/lon   : GPS coordinates recorded at time of visit
      - notes         : free-text observations from the ambassador
      - status        : 'pending' → 'approved' / 'rejected'
      - reviewed_by   : senior ambassador or admin who reviewed the record
      - verified_at   : timestamp of the verification visit
    This enables full audit trails, peer review, and performance metrics
    as described in the Final LocalConnect Documentation (Chapter 5, 6).
    """
    __tablename__ = "bridge_verifications"

    id = Column(Integer, primary_key=True, index=True)
    ambassador_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    notes = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    gps_lat = Column(Float, nullable=True)
    gps_lon = Column(Float, nullable=True)
    status = Column(String, default="pending")          # pending | approved | rejected
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), server_default=func.now())

    ambassador = relationship("User", foreign_keys=[ambassador_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    shop = relationship("Shop", back_populates="verifications")
