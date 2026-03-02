"""
Tests for the bounding-box proximity pre-filter on the products endpoint.
Covers Recommendation 5: SQL WHERE clause before Python Haversine sort.
"""
import pytest
from app import models
from app.core.security import get_password_hash


@pytest.fixture
def owner(db_session):
    u = models.User(
        email="owner_prox@example.com",
        password_hash=get_password_hash("testpass"),
        name="Proximity Owner",
        role=models.UserRole.SHOP_OWNER,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


def _make_shop(db, owner_id, name, lat, lon):
    shop = models.Shop(
        owner_id=owner_id, name=name, location=name,
        latitude=lat, longitude=lon, is_verified=True,
    )
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop


def _make_product(db, shop_id, name):
    p = models.Product(
        shop_id=shop_id, name=name, category="General",
        price=5.0, stock=10, sold=0,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def test_bounding_box_excludes_distant_shops(client, db_session, owner):
    """
    Products from shops further than ~12 km must NOT appear in a distance-sorted
    query when the bounding-box pre-filter is active.
    
    Setup:
      - Near shop  at (−17.83, 31.03) — ~0 km from user
      - Far shop   at (−18.91, 31.03) — ~120 km from user
    
    The bounding box (±0.108° ≈ ±12 km) should exclude the far shop entirely.
    """
    user_lat, user_lng = -17.83, 31.03

    near_shop = _make_shop(db_session, owner.id, "Near Shop", -17.83, 31.03)
    far_shop  = _make_shop(db_session, owner.id, "Far Shop",  -18.91, 31.03)

    near_prod = _make_product(db_session, near_shop.id, "Near Widget")
    far_prod  = _make_product(db_session, far_shop.id,  "Far Widget")

    response = client.get(
        "/api/products/",
        params={"lat": user_lat, "lng": user_lng, "sort_by": "distance"},
    )
    assert response.status_code == 200, response.text
    names = [p["name"] for p in response.json()]

    assert "Near Widget" in names, "Expected near product to appear in results"
    assert "Far Widget" not in names, "Far product (>120 km) should be excluded by bounding box"


def test_bounding_box_includes_edge_shops(client, db_session, owner):
    """
    Shops just inside the bounding box (~10 km) must still appear.
    """
    user_lat, user_lng = -17.83, 31.03
    # ~10 km north: 0.09° diff in lat
    edge_shop = _make_shop(db_session, owner.id, "Edge Shop", -17.74, 31.03)
    edge_prod = _make_product(db_session, edge_shop.id, "Edge Widget")

    response = client.get(
        "/api/products/",
        params={"lat": user_lat, "lng": user_lng, "sort_by": "distance"},
    )
    assert response.status_code == 200
    names = [p["name"] for p in response.json()]
    assert "Edge Widget" in names, "Shop within bounding box must appear in results"
