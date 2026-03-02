from enum import Enum

class UserRole(str, Enum):
    SYSTEM_ADMIN = "system-admin"
    SHOP_OWNER = "shop-owner"
    RESIDENT = "resident"
    AMBASSADOR = "ambassador"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    READY_FOR_PICKUP = "ready for pickup"
    OUT_FOR_DELIVERY = "out for delivery"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentMethod(str, Enum):
    ECOCASH = "ecocash"
    OMARI = "omari"
    INNBUCKS = "innbucks"
    PAYNOW = "paynow"
    ONEMONEY = "onemoney"
    CASH = "cash"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class ZonePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
