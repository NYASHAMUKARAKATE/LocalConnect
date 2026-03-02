"""
CV (Computer Vision) search endpoint.

Allows users to upload an image and find visually similar products
using perceptual hashing and colour histogram matching.
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from .. import models
from ..database import get_db
from ..services import cv_service
from sqlalchemy import or_

router = APIRouter()


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class CVSearchResult(BaseModel):
    id: int
    name: str
    price: float
    image_url: str
    category: str
    shop_name: str
    similarity_score: float

    class Config:
        from_attributes = True


class CVSearchResponse(BaseModel):
    message: str
    results: List[CVSearchResult] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/search-by-image", response_model=CVSearchResponse)
async def search_by_image(
    file: UploadFile = File(...),
    top_k: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Upload a photo and get the most visually similar products.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await file.read()
    
    # Try Neural Network analysis first
    vision_tags = cv_service.analyze_image_with_vision(image_bytes)
    
    query_fingerprint = cv_service.fingerprint_from_bytes(image_bytes)

    return _search_by_fingerprint(query_fingerprint, top_k, db, vision_tags)


@router.get("/search-by-url", response_model=CVSearchResponse)
async def search_by_url(
    image_url: str = Query(..., min_length=1),
    top_k: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Provide an image URL and get the most visually similar products.
    Useful for reverse-image-searching a product you found online.
    """
    query_fingerprint = cv_service.fingerprint_from_url(image_url)
    if query_fingerprint is None:
        raise HTTPException(status_code=400, detail="Could not download or process the image URL.")

    # Note: For URL search, we could also download and pass to vision if needed
    # but let's stick to upload for the most common "Neural Network assistant" use case.
    
    return _search_by_fingerprint(query_fingerprint, top_k, db)


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------

def _search_by_fingerprint(
    query_fingerprint: dict,
    top_k: int,
    db: Session,
    vision_tags: Optional[str] = None,
) -> CVSearchResponse:
    """Run similarity search across all products, prioritized by vision keywords if available."""
    
    # 1. If we have vision tags, try to find products by keyword matching first
    keyword_product_ids = []
    message_prefix = ""
    
    if vision_tags:
        tags_list = vision_tags.split()
        tag_filters = [models.Product.name.ilike(f"%{tag}%") for tag in tags_list]
        tag_filters += [models.Product.description.ilike(f"%{tag}%") for tag in tags_list]
        tag_filters += [models.Product.category.ilike(f"%{tag}%") for tag in tags_list]
        
        matches = db.query(models.Product.id).filter(or_(*tag_filters)).limit(20).all()
        keyword_product_ids = [m.id for m in matches]
        message_prefix = f"Neural Network identified: {vision_tags}. "

    # 2. Fetch only products that have a stored fingerprint
    rows = (
        db.query(models.Product.id, models.Product.image_embedding)
        .filter(models.Product.image_embedding.isnot(None))
        .all()
    )

    if not rows:
        return CVSearchResponse(
            message="No product fingerprints found. Please run the embedding generation script first.",
            results=[],
        )

    # Rank by similarity
    ranked = cv_service.find_most_similar(
        query_fingerprint,
        [(r.id, r.image_embedding) for r in rows],
        top_k=top_k * 2, # Get a slightly larger pool to prioritize keywords
    )

    # 3. Combine keyword matches with similarity rank
    # If a product is in keyword matches, give it a similarity boost
    final_ranked = []
    for r in ranked:
        score = r["score"]
        if r["product_id"] in keyword_product_ids:
            score += 0.5 # Significant boost for Neural Network matches
        final_ranked.append({"product_id": r["product_id"], "score": score})
    
    final_ranked.sort(key=lambda x: x["score"], reverse=True)
    final_ranked = final_ranked[:top_k]

    # Fetch full product details for the top results
    product_ids = [r["product_id"] for r in final_ranked]
    score_map = {r["product_id"]: r["score"] for r in final_ranked}

    products = (
        db.query(models.Product)
        .filter(models.Product.id.in_(product_ids))
        .all()
    )

    results = []
    for p in products:
        results.append(CVSearchResult(
            id=p.id,
            name=p.name,
            price=p.price,
            image_url=p.image_url or "",
            category=p.category or "",
            shop_name=p.shop.name if p.shop else "Unknown",
            similarity_score=round(score_map.get(p.id, 0.0), 4),
        ))

    # Sort by score descending
    results.sort(key=lambda r: r.similarity_score, reverse=True)

    return CVSearchResponse(
        message=f"{message_prefix}Found {len(results)} similar products.",
        results=results,
    )
