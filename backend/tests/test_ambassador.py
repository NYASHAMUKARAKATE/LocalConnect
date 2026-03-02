"""
Tests for the Bridge Ambassador portal and BridgeVerification audit trail.
Covers Recommendation 1: proper verification records with photo, GPS, status.
"""
import pytest
from app import models
from app.core.security import get_password_hash


@pytest.fixture
def ambassador_user(db_session):
    user = models.User(
        email="ambassador@example.com",
        password_hash=get_password_hash("testpass"),
        name="Test Ambassador",
        role=models.UserRole.AMBASSADOR,
        latitude=-17.8252,
        longitude=31.0335,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def shop_owner_user(db_session):
    owner = models.User(
        email="shopowner@example.com",
        password_hash=get_password_hash("testpass"),
        name="Shop Owner",
        role=models.UserRole.SHOP_OWNER,
    )
    db_session.add(owner)
    db_session.commit()
    db_session.refresh(owner)
    return owner


@pytest.fixture
def unverified_shop(db_session, shop_owner_user):
    shop = models.Shop(
        owner_id=shop_owner_user.id,
        name="Unverified Corner Store",
        location="Harare",
        latitude=-17.8252,
        longitude=31.0335,
        is_verified=False,
    )
    db_session.add(shop)
    db_session.commit()
    db_session.refresh(shop)
    return shop


@pytest.fixture
def ambassador_headers(client, ambassador_user):
    response = client.post(
        "/api/auth/token",
        data={"username": "ambassador@example.com", "password": "testpass"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_verify_shop_creates_verification_record(client, ambassador_headers, unverified_shop, db_session):
    """
    POST /api/ambassador/verify-shop/{id} must:
    1. Mark the shop as verified.
    2. Create a BridgeVerification audit record.
    """
    response = client.post(
        f"/api/ambassador/verify-shop/{unverified_shop.id}",
        json={
            "shop_id": unverified_shop.id,
            "notes": "All products present and correctly priced.",
            "photo_url": "https://example.com/photos/shop1.jpg",
            "gps_lat": -17.8252,
            "gps_lon": 31.0335,
        },
        headers=ambassador_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "pending"
    assert data["shop_id"] == unverified_shop.id
    assert data["photo_url"] == "https://example.com/photos/shop1.jpg"

    # Shop must now be verified
    db_session.refresh(unverified_shop)
    assert unverified_shop.is_verified is True

    # Audit row must exist in bridge_verifications
    record = db_session.query(models.BridgeVerification).filter(
        models.BridgeVerification.shop_id == unverified_shop.id
    ).first()
    assert record is not None
    assert record.gps_lat == pytest.approx(-17.8252)


def test_non_ambassador_cannot_verify(client, auth_headers, unverified_shop):
    """Resident users must receive 403 when attempting to verify a shop."""
    response = client.post(
        f"/api/ambassador/verify-shop/{unverified_shop.id}",
        json={"shop_id": unverified_shop.id},
        headers=auth_headers,
    )
    assert response.status_code == 403


def test_get_my_verifications(client, ambassador_headers, unverified_shop, db_session, ambassador_user):
    """GET /api/ambassador/verifications must return only the current ambassador's records."""
    # Create a verification record directly
    record = models.BridgeVerification(
        ambassador_id=ambassador_user.id,
        shop_id=unverified_shop.id,
        status="pending",
    )
    db_session.add(record)
    db_session.commit()

    response = client.get("/api/ambassador/verifications", headers=ambassador_headers)
    assert response.status_code == 200
    records = response.json()
    assert len(records) >= 1
    assert all(r["ambassador_id"] == ambassador_user.id for r in records)
