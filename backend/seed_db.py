import random
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app import models
from app.core.security import get_password_hash
from app.models import UserRole

def seed_data():
    # DROP all tables to ensure schema is fresh, then recreate
    print("Dropping old tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Seeding fresh data...")

    # Create Users
    admin_user = models.User(
        email="admin@localconnect.com",
        password_hash=get_password_hash("password123"),
        name="Admin User",
        role=UserRole.SYSTEM_ADMIN
    )
    
    shop_owner_1 = models.User(
        email="nyasha@Localconnect.com",
        password_hash=get_password_hash("password123"),
        name="Nyasha Mukarakate",
        role=UserRole.SHOP_OWNER,
        phone="+263 77 123 4567"
    )

    resident_1 = models.User(
        email="resident@local.com",
        password_hash=get_password_hash("password123"),
        name="Sarah Resident",
        role=UserRole.RESIDENT,
        credits=2500  # Start with some credits
    )
    
    resident_2 = models.User(
        email="john@local.com",
        password_hash=get_password_hash("password123"),
        name="John Customer",
        role=UserRole.RESIDENT,
        credits=500
    )

    ambassador_1 = models.User(
        email="ambassador@local.com",
        password_hash=get_password_hash("password123"),
        name="David Ambassador",
        role=UserRole.AMBASSADOR,
        phone="+263 77 345 6789"
    )

    db.add_all([admin_user, shop_owner_1, resident_1, resident_2, ambassador_1])
    db.commit()
    db.refresh(shop_owner_1)
    db.refresh(resident_1)
    db.refresh(resident_2)

    # Create Shops (Bulawayo)
    shop1 = models.Shop(
        owner_id=shop_owner_1.id,
        name="TechHub CBD",
        phone="+263 77 111 2222",
        location="CBD, Bulawayo",
        latitude=-20.1500, # Approximate CBD center
        longitude=28.5833,
        rating=4.7,
        is_verified=True,
        offers_delivery=True,
        delivery_fee=5.00,
        image_url="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80" # Electronics store
    )
    
    shop2 = models.Shop(
        owner_id=shop_owner_1.id,
        name="Elite Fashion Boutique",
        phone="+263 77 333 4444",
        location="Famona, Bulawayo",
        latitude=-20.1700, # Approx Famona area
        longitude=28.5800,
        rating=4.5,
        is_verified=True,
        offers_delivery=True,
        delivery_fee=3.00,
        image_url="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80" # Fashion boutique
    )

    shop3 = models.Shop(
        owner_id=shop_owner_1.id,
        name="Freshies Groceries",
        phone="+263 77 555 6666",
        location="Nkulumane, Bulawayo",
        latitude=-20.2000, # Approx Nkulumane area
        longitude=28.5200,
        rating=4.8,
        is_verified=True,
        offers_delivery=False,
        delivery_fee=0.0,
        image_url="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80" # Grocery store
    )
    
    shop4 = models.Shop(
        owner_id=shop_owner_1.id,
        name="Gadget World Hillside",
        phone="+263 77 777 8888",
        location="Hillside, Bulawayo",
        latitude=-20.1800, # Approx Hillside area
        longitude=28.6000,
        rating=4.9,
        is_verified=True,
        offers_delivery=True,
        delivery_fee=4.00,
        image_url="https://images.unsplash.com/photo-1528548648-936d5951c893?w=800&q=80" # Gadgets
    )
    db.add_all([shop1, shop2, shop3, shop4])
    db.commit()

    # Create Diverse Products
    products_data = [
        # Shop 1 (TechHub CBD - Electronics)
        (shop1.id, "Samsung 55-inch 4K Smart TV", "Electronics", 450.00, 10, "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80"),
        (shop1.id, "Apple iPhone 14 Pro", "Electronics", 999.00, 15, "https://images.unsplash.com/photo-1663465372439-d8e75eb82b99?w=800&q=80"),
        (shop1.id, "Sony WH-1000XM5 Headphones", "Electronics", 299.00, 25, "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80"),
        (shop1.id, "Dell XPS 13 Laptop", "Electronics", 1200.00, 8, "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80"),
        (shop1.id, "Logitech Wireless Mouse", "Electronics", 25.00, 50, "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80"),
        
        # Shop 2 (Elite Fashion Boutique - Fashion)
        (shop2.id, "Men's Classic Suits", "Fashion", 150.00, 20, "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&q=80"),
        (shop2.id, "Nike Air Force 1 Sneakers", "Fashion", 85.00, 30, "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80"),
        (shop2.id, "Women's Summer Dress", "Fashion", 45.00, 40, "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80"),
        (shop2.id, "Vintage Denim Jacket", "Fashion", 60.00, 15, "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=800&q=80"),
        (shop2.id, "Leather Handbag", "Fashion", 120.00, 10, "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80"),
        
        # Shop 3 (Freshies Groceries - Groceries)
        (shop3.id, "Fresh Bananas (Bunch)", "Groceries", 2.00, 100, "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=800&q=80"),
        (shop3.id, "Organic Tomatoes (1kg)", "Groceries", 3.50, 50, "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80"),
        (shop3.id, "Whole Wheat Bread", "Groceries", 1.50, 80, "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80"),
        (shop3.id, "Fresh Milk (2L)", "Groceries", 2.50, 60, "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80"),
        (shop3.id, "Beef Steak (1kg)", "Groceries", 15.00, 20, "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80"),
        
        # Shop 4 (Gadget World Hillside - Electronics)
        (shop4.id, "Nintendo Switch OLED", "Electronics", 350.00, 12, "https://images.unsplash.com/photo-1627389955776-665e7ae92440?w=800&q=80"),
        (shop4.id, "JBL Portable Bluetooth Speaker", "Electronics", 89.00, 40, "https://images.unsplash.com/photo-1608223652643-dc19d7b51c89?w=800&q=80"),
        (shop4.id, "Apple Watch Series 8", "Electronics", 399.00, 18, "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80")
    ]

    products = []
    for pd in products_data:
        p = models.Product(
            shop_id=pd[0],
            name=pd[1],
            category=pd[2],
            price=pd[3],
            stock=pd[4],
            image_url=pd[5],
            description=f"High quality {pd[1].lower()} available now."
        )
        products.append(p)
    db.add_all(products)
    db.commit()
    for p in products:
        db.refresh(p)

    # Generate Historical Orders for Analytics
    # Scatter 30 orders over the past 14 days
    print("Generating Historical Orders for Analytics...")
    customers = [resident_1, resident_2]
    
    base_date = datetime.utcnow()
    
    for i in range(30):
        # Random date in last 14 days
        days_ago = random.randint(0, 14)
        order_date = base_date - timedelta(days=days_ago, hours=random.randint(1, 23))
        
        shop = shop1 if random.random() > 0.4 else shop2
        customer = random.choice(customers)
        status = random.choice([
            models.OrderStatus.COMPLETED, 
            models.OrderStatus.OUT_FOR_DELIVERY, 
            models.OrderStatus.READY_FOR_PICKUP, 
            models.OrderStatus.PENDING
        ])
        
        delivery_type = "pickup"
        delivery_fee = 0.0
        if shop.offers_delivery and random.random() > 0.5:
            delivery_type = "delivery"
            delivery_fee = shop.delivery_fee
            
        delivery_status = "Pending"
        if status == models.OrderStatus.OUT_FOR_DELIVERY:
            delivery_status = "Out for Delivery"
        elif status == models.OrderStatus.COMPLETED and delivery_type == "delivery":
            delivery_status = "Delivered"
        elif status == models.OrderStatus.COMPLETED and delivery_type == "pickup":
            delivery_status = "Picked Up"
        elif status == models.OrderStatus.READY_FOR_PICKUP:
            delivery_status = "Ready for Pickup"
        
        # Pick 1-3 random products from this shop
        shop_products = [p for p in products if p.shop_id == shop.id]
        chosen_products = random.sample(shop_products, random.randint(1, min(3, len(shop_products))))
        
        total_amount = 0
        order_items = []
        for cp in chosen_products:
            qty = random.randint(1, 3)
            price = cp.price
            total_amount += qty * price
            
            # Update sold tracking
            cp.sold += qty
            
            oi = models.OrderItem(
                product_id=cp.id,
                quantity=qty,
                price=price
            )
            order_items.append(oi)
            
        # occasional credit usage
        credits_used = 0
        if random.random() > 0.8:
            credits_used = random.randint(10, 50)
            
        order = models.Order(
            customer_id=customer.id,
            shop_id=shop.id,
            total_amount=total_amount + delivery_fee,
            status=status,
            delivery_type=delivery_type,
            delivery_status=delivery_status,
            delivery_fee=delivery_fee,
            delivery_address="123 Local St, Harare" if delivery_type == "delivery" else None,
            credits_used=credits_used,
            created_at=order_date
        )
        db.add(order)
        db.flush() # get id
        
        for oi in order_items:
            oi.order_id = order.id
            db.add(oi)
            
    db.commit()
    print("Seed complete! Added heavy load of historical orders, diverse products, shops, and populated user credits.")

if __name__ == "__main__":
    seed_data()
