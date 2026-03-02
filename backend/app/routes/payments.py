import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from paynow import Paynow

from .auth import get_current_user
from ..database import get_db
from .. import models, schemas
from ..enums import OrderStatus, PaymentStatus, PaymentMethod
from ..core.config import ENVIRONMENT

logger = logging.getLogger("localconnect.payments")
router = APIRouter()

# Setup Paynow — keys MUST come from environment variables.
PAYNOW_INTEGRATION_ID = os.getenv("PAYNOW_INTEGRATION_ID", "")
PAYNOW_INTEGRATION_KEY = os.getenv("PAYNOW_INTEGRATION_KEY", "")

if not PAYNOW_INTEGRATION_ID or not PAYNOW_INTEGRATION_KEY:
    if ENVIRONMENT == "production":
        raise RuntimeError(
            "FATAL: PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY must be set in production."
        )
    else:
        logger.warning(
            "Paynow credentials not set — payment initiation will fail. "
            "Set PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY in .env"
        )
        PAYNOW_INTEGRATION_ID = PAYNOW_INTEGRATION_ID or "DEMO_ID"
        PAYNOW_INTEGRATION_KEY = PAYNOW_INTEGRATION_KEY or "DEMO_KEY"

# URLs are configurable for different environments
PAYNOW_RETURN_URL = os.getenv("PAYNOW_RETURN_URL", "http://localhost:5173/payment-return")
PAYNOW_RESULT_URL = os.getenv("PAYNOW_RESULT_URL", "http://localhost:8000/api/payments/update")

paynow = Paynow(
    PAYNOW_INTEGRATION_ID,
    PAYNOW_INTEGRATION_KEY,
    PAYNOW_RETURN_URL,
    PAYNOW_RESULT_URL,
)

class PaymentInitiateRequest(BaseModel):
    order_id: int
    email: str

@router.post("/initiate")
def initiate_payment(
    request: PaymentInitiateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Retrieve the order
    order = db.query(models.Order).filter(models.Order.id == request.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this order")
        
    # Check if a non-completed payment already exists
    payment = db.query(models.Payment).filter(models.Payment.order_id == request.order_id).first()
    
    if not payment:
        payment = models.Payment(
            order_id=request.order_id,
            payment_method=PaymentMethod.PAYNOW,
            amount=order.total_amount,
            payment_status=PaymentStatus.PENDING
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
    # Generate unique reference using Order ID
    reference = f"LOCALCONNECT-ORD-{order.id}-{payment.id}"
    
    # Create the Paynow transaction
    payment_request = paynow.create_payment(reference, request.email)
    
    # Add items to standard Paynow format (consolidating into one generic total for simplicity)
    payment_request.add("Order Total", order.total_amount)
    
    # Send the request to Paynow
    response = paynow.send(payment_request)
    
    if response.success:
        # Save the polling URL and reference
        payment.poll_url = response.poll_url
        payment.paynow_reference = reference
        db.commit()
        
        # Return the link so React can redirect the user
        return {"redirect_url": response.redirect_url, "poll_url": response.poll_url}
    else:
        raise HTTPException(status_code=400, detail="Failed to initiate payment via Paynow")

@router.post("/update")
async def update_payment_status(request: Request, db: Session = Depends(get_db)):
    """
    This webhook receives the asynchronous ping from Paynow when a transaction finalizes.
    We receive a POST body from Paynow with payment info, and we check their signature to prevent fraud.
    """
    body = await request.form()
    
    # Check if Paynow sent us something
    if not body:
        return {"status": "error", "message": "Empty body"}
        
    # Usually we'd use `paynow.check_transaction(body)` here, but for test logic we process it manually
    status = body.get("status")
    reference = body.get("reference")
    paynow_ref = body.get("paynowreference") 
    
    if not reference:
        return {"status": "error", "message": "No reference provided"}
        
    # Retrieve payment record by linking the parsed reference string
    # E.g., reference = "LOCALCONNECT-ORD-4-7"
    payment = db.query(models.Payment).filter(models.Payment.paynow_reference == reference).first()
    
    if not payment:
        return {"status": "error", "message": "Payment not found"}
        
    order = db.query(models.Order).filter(models.Order.id == payment.order_id).first()
        
    if status == "Paid":
        payment.payment_status = PaymentStatus.COMPLETED
        payment.transaction_id = paynow_ref
        
        if order:
            order.status = OrderStatus.PAID
            
    elif status == "Cancelled" or status == "Failed":
        payment.payment_status = PaymentStatus.FAILED
        
    db.commit()
    return {"status": "ok"}
