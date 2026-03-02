from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, models, database
from ..database import get_db
from ..routes.auth import get_current_user

router = APIRouter()


# ─── Stats ───────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=schemas.AmbassadorStats)
def read_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.AMBASSADOR:
        raise HTTPException(status_code=403, detail="Not authorized")

    verified_count = db.query(models.Shop).filter(models.Shop.is_verified == True).count()
    unverified_count = db.query(models.Shop).filter(models.Shop.is_verified == False).count()
    zone_count = db.query(models.Zone).count()

    community_score = verified_count * 100 + zone_count * 50

    return {
        "verified_shops": verified_count,
        "pending_invites": unverified_count,
        "community_score": community_score
    }


# ─── Zones ───────────────────────────────────────────────────────────────────

@router.get("/zones", response_model=List[schemas.Zone])
def read_zones(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.AMBASSADOR:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Zone).all()


# ─── Shops ───────────────────────────────────────────────────────────────────

@router.get("/unverified-shops")
def get_unverified_shops(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.AMBASSADOR:
        raise HTTPException(status_code=403, detail="Not authorized")

    shops = db.query(models.Shop).filter(models.Shop.is_verified == False).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "phone": s.phone,
            "location": s.location,
            "owner_name": s.owner.name if s.owner else "Unknown",
            "created_at": s.created_at,
        }
        for s in shops
    ]


@router.get("/verified-shops")
def get_verified_shops(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.AMBASSADOR:
        raise HTTPException(status_code=403, detail="Not authorized")

    shops = db.query(models.Shop).filter(models.Shop.is_verified == True).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "phone": s.phone,
            "location": s.location,
            "owner_name": s.owner.name if s.owner else "Unknown",
        }
        for s in shops
    ]


# ─── BridgeVerification ──────────────────────────────────────────────────────

@router.post("/verify-shop/{shop_id}", response_model=schemas.BridgeVerification)
def verify_shop(
    shop_id: int,
    payload: schemas.BridgeVerificationCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a BridgeVerification audit record and mark the shop as verified.
    Requires AMBASSADOR role. The record captures GPS coordinates, photo URL,
    and field notes from the ambassador's visit, providing a full audit trail.
    """
    if current_user.role != models.UserRole.AMBASSADOR:
        raise HTTPException(status_code=403, detail="Not authorized")

    shop = db.query(models.Shop).filter(models.Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    # Create an audit record
    verification = models.BridgeVerification(
        ambassador_id=current_user.id,
        shop_id=shop_id,
        notes=payload.notes,
        photo_url=payload.photo_url,
        gps_lat=payload.gps_lat,
        gps_lon=payload.gps_lon,
        status="pending",
    )
    db.add(verification)

    # Immediately mark shop as verified (an admin/senior can reject later)
    shop.is_verified = True

    db.commit()
    db.refresh(verification)
    return verification


@router.get("/verifications", response_model=List[schemas.BridgeVerification])
def get_my_verifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all BridgeVerification records submitted by the current ambassador."""
    if current_user.role != models.UserRole.AMBASSADOR:
        raise HTTPException(status_code=403, detail="Not authorized")

    return db.query(models.BridgeVerification)\
             .filter(models.BridgeVerification.ambassador_id == current_user.id)\
             .order_by(models.BridgeVerification.verified_at.desc())\
             .all()


@router.get("/verifications/{verification_id}", response_model=schemas.BridgeVerification)
def get_verification(
    verification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a single BridgeVerification record by ID."""
    if current_user.role != models.UserRole.AMBASSADOR:
        raise HTTPException(status_code=403, detail="Not authorized")

    record = db.query(models.BridgeVerification)\
               .filter(models.BridgeVerification.id == verification_id)\
               .first()
    if not record:
        raise HTTPException(status_code=404, detail="Verification not found")
    if record.ambassador_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your verification record")
    return record


@router.patch("/verifications/{verification_id}/review", response_model=schemas.BridgeVerification)
def review_verification(
    verification_id: int,
    payload: schemas.BridgeVerificationReview,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve or reject a BridgeVerification.
    Requires AMBASSADOR or SYSTEM_ADMIN role (peer-review model).
    If rejected, the associated shop's is_verified flag is reverted.
    """
    if current_user.role not in (models.UserRole.AMBASSADOR, models.UserRole.SYSTEM_ADMIN):
        raise HTTPException(status_code=403, detail="Not authorized")

    if payload.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'rejected'")

    record = db.query(models.BridgeVerification)\
               .filter(models.BridgeVerification.id == verification_id)\
               .first()
    if not record:
        raise HTTPException(status_code=404, detail="Verification not found")

    record.status = payload.status
    record.reviewed_by = current_user.id

    # If rejected, revert shop verification status
    if payload.status == "rejected":
        shop = db.query(models.Shop).filter(models.Shop.id == record.shop_id).first()
        if shop:
            shop.is_verified = False

    db.commit()
    db.refresh(record)
    return record


# ─── Products via Ambassador ──────────────────────────────────────────────────

@router.post("/shops/{shop_id}/products", response_model=schemas.Product)
def add_ambassador_product(
    shop_id: int,
    product: schemas.ProductCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.UserRole.AMBASSADOR:
        raise HTTPException(status_code=403, detail="Not authorized")

    shop = db.query(models.Shop).filter(models.Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    if not shop.is_verified:
        raise HTTPException(status_code=400, detail="Cannot add products to an unverified shop")

    db_product = models.Product(**product.dict(), shop_id=shop.id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product
