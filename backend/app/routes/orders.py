from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from .. import schemas, models, database
from ..database import get_db
from ..routes.auth import get_current_user
from itertools import groupby

router = APIRouter()

@router.post("/", response_model=List[schemas.Order])
def create_order(
    order_data: schemas.OrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify credits
    if order_data.credits_to_use > 0:
        if current_user.credits < order_data.credits_to_use:
            print(f"DEBUG_ORDER: Not enough credits. User has {current_user.credits}, needs {order_data.credits_to_use}")
            raise HTTPException(status_code=400, detail="Not enough credits")
    
    # 1. Fetch Cart Items
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()
    if not cart_items:
        print(f"DEBUG_ORDER: Cart is empty for user {current_user.id}")
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 2. Group by Shop
    cart_items.sort(key=lambda x: x.product.shop_id)
    
    created_orders = []
    
    try:
        # Pre-calculate grand total including delivery fees
        grand_total = 0.0
        shop_orders_calc = []
        for shop_id, items in groupby(cart_items, key=lambda x: x.product.shop_id):
            items_list = list(items)
            shop = db.query(models.Shop).filter(models.Shop.id == shop_id).first()
            
            shop_product_total = sum(item.product.price * item.quantity for item in items_list)
            
            # Determine delivery for this shop
            applied_delivery_type = "pickup"
            shop_delivery_fee = 0.0
            if order_data.delivery_type == "delivery" and shop and shop.offers_delivery:
                applied_delivery_type = "delivery"
                shop_delivery_fee = shop.delivery_fee
                
            shop_order_total = shop_product_total + shop_delivery_fee
            grand_total += shop_order_total
            
            shop_orders_calc.append({
                "shop_id": shop_id,
                "items_list": items_list,
                "shop_product_total": shop_product_total,
                "shop_delivery_fee": shop_delivery_fee,
                "applied_delivery_type": applied_delivery_type,
                "total_amount": shop_order_total
            })

        remaining_credits_to_apply = order_data.credits_to_use

        for so_calc in shop_orders_calc:
            shop_id = so_calc["shop_id"]
            items_list = so_calc["items_list"]
            total_amount = so_calc["total_amount"]
            order_items_data = []

            # Verify stock
            for item in items_list:
                if item.product.stock < item.quantity:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Product {item.product.name} is out of stock (Requested: {item.quantity}, Available: {item.product.stock})"
                    )
                order_items_data.append({
                    "product": item.product,
                    "quantity": item.quantity,
                    "price": item.product.price
                })

            # Proportionally apply credits to this order
            credits_for_this_order = 0
            if grand_total > 0 and remaining_credits_to_apply > 0:
                fraction = total_amount / grand_total
                credits_for_this_order = int(order_data.credits_to_use * fraction)
                remaining_credits_to_apply -= credits_for_this_order

            # Create Order
            db_order = models.Order(
                customer_id=current_user.id,
                shop_id=shop_id,
                total_amount=total_amount,
                status=models.OrderStatus.PENDING,
                delivery_type=so_calc["applied_delivery_type"],
                delivery_address=order_data.delivery_address if so_calc["applied_delivery_type"] == "delivery" else None,
                delivery_notes=order_data.delivery_notes,
                delivery_fee=so_calc["shop_delivery_fee"],
                credits_used=credits_for_this_order,
                delivery_status="Pending"
            )
            db.add(db_order)
            db.flush()

            # Create Order Items and Update Stock
            for data in order_items_data:
                db_item = models.OrderItem(
                    order_id=db_order.id,
                    product_id=data["product"].id,
                    quantity=data["quantity"],
                    price=data["price"]
                )
                db.add(db_item)
                
                data["product"].stock -= data["quantity"]
                data["product"].sold += data["quantity"]

            created_orders.append(db_order)

        # 3. Clear Cart
        db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).delete()
        
        # 4. Process Loyalty Credits
        if order_data.credits_to_use > 0:
            current_user.credits -= order_data.credits_to_use
            
        # Earn 5% back
        earned_credits = int(grand_total * 5)
        current_user.credits += earned_credits
        
        db.commit()
        
        for order in created_orders:
            db.refresh(order)
            
            # Send Real-Time Notification to the Shop Owner via WebSockets
            shop_owner_id = order.shop.owner_id
            notification_payload = {
                "type": "new_order",
                "order_id": order.id,
                "amount": float(order.total_amount),
                "customer": current_user.name or current_user.email,
                "message": f"New order from {current_user.name or 'a customer'} for ${order.total_amount:.2f}"
            }
            
            import asyncio
            from .notifications import manager
            
            # Send notification using background task if possible, 
            # otherwise just skip it to avoid breaking the synchronous order flow
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(manager.send_personal_message(notification_payload, shop_owner_id))
            except RuntimeError:
                # No running event loop in this synchronous thread
                print("Warning: Could not send WebSocket notification - no running event loop in synchronous endpoint.")
            except Exception as wsock_err:
                print(f"Warning: Failed to broadcast websocket notification: {wsock_err}")
            
        return created_orders

    except Exception as e:
        db.rollback()
        print(f"DEBUG_ORDER: create_order failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/my-orders", response_model=List[schemas.Order])
def read_my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(models.Order).filter(models.Order.customer_id == current_user.id).order_by(models.Order.created_at.desc()).all()
    return orders

@router.get("/shop-orders", response_model=List[schemas.Order])
def read_shop_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.SHOP_OWNER:
         raise HTTPException(status_code=403, detail="Not authorized")
    orders = db.query(models.Order).join(models.Shop).filter(models.Shop.owner_id == current_user.id).all()
    return orders

class DeliveryUpdate(BaseModel):
    status: str

@router.patch("/{order_id}/delivery")
def update_delivery_status(
    order_id: int,
    payload: DeliveryUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.SHOP_OWNER:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.delivery_status = payload.status
    db.commit()
    db.refresh(order)
    return {"message": "Status updated", "delivery_status": order.delivery_status}
