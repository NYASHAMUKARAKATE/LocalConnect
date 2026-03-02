"""
Generate visual fingerprints for all products in the database.

Run this script after seeding products to populate their image_embedding column
with perceptual-hash + colour-histogram fingerprints.

Usage:
    python generate_embeddings.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models
from app.services.cv_service import fingerprint_from_url


def generate_embeddings():
    db = SessionLocal()

    products = db.query(models.Product).all()
    total = len(products)

    if total == 0:
        print("No products found. Run seed_db.py first.")
        db.close()
        return

    print(f"Found {total} products. Generating fingerprints ...\n")

    success = 0
    failed = 0

    for i, product in enumerate(products, 1):
        prefix = f"[{i}/{total}] {product.name}"

        if product.image_embedding is not None:
            print(f"{prefix} — already has fingerprint, skipping.")
            success += 1
            continue

        if not product.image_url:
            print(f"{prefix} — no image_url, skipping.")
            failed += 1
            continue

        print(f"{prefix} — downloading & fingerprinting …", end=" ", flush=True)
        fingerprint = fingerprint_from_url(product.image_url)

        if fingerprint is None:
            print("FAILED")
            failed += 1
            continue

        product.image_embedding = fingerprint
        db.commit()
        print("OK")
        success += 1

    db.close()
    print(f"\nDone! {success} succeeded, {failed} failed out of {total} products.")


if __name__ == "__main__":
    generate_embeddings()
