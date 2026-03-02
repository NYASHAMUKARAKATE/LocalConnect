from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from pydantic import BaseModel
from .. import models, database
from ..database import get_db
from ..routes.auth import get_current_user
from google import genai
import os
import math

def get_distance(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
    R = 6371  # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

# Bounding box constant: 0.009° ≈ 1 km; 0.108° ≈ 12 km half-side
_BOX_DEG = 0.009 * 12


router = APIRouter()

class MessageContext(BaseModel):
    role: str
    content: str

class AIRequest(BaseModel):
    query: str
    history: List[MessageContext] = []

class AIResponse(BaseModel):
    message: str
    stores: List[dict] = []
    products: List[dict] = []
    map_view: bool = False

@router.post("/chat", response_model=AIResponse)
def chat_with_ai(
    request: AIRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = request.query
    
    # Check for Gemini API Key
    api_key = os.getenv("GEMINI_API_KEY")
    
    # --- GEMINI FLOW ---
    if api_key:
        try:
            genai_client = genai.Client(api_key=api_key)

            # 1. RAG: Retrieve Relevant Products & Shops
            # Better search: try to extract keywords or just load general scope if it's a map/shop query
            query_lower = query.lower()
            
            # Simple keyword extraction for DB filtering
            stop_words = ["i", "want", "to", "can", "you", "where", "find", "buy", "get", "me", "show", "looking", "for", "a", "an", "the", "compare", "shops", "stores", "in", "near", "around", "map"]
            keywords = [w for w in query_lower.split() if w not in stop_words]
            search_term = " ".join(keywords)

            products = []
            if search_term:
                products = db.query(models.Product).filter(
                    or_(
                        models.Product.name.ilike(f"%{search_term}%"),
                        models.Product.description.ilike(f"%{search_term}%"),
                        models.Product.category.ilike(f"%{search_term}%")
                    )
                ).limit(5).all()

            def fetch_nearby_shops(limit=3, search=None):
                q = db.query(models.Shop)
                # Apply bounding-box pre-filter when user location is known
                if current_user.latitude is not None and current_user.longitude is not None:
                    q = q.filter(
                        models.Shop.latitude.between(
                            current_user.latitude - _BOX_DEG,
                            current_user.latitude + _BOX_DEG
                        ),
                        models.Shop.longitude.between(
                            current_user.longitude - _BOX_DEG,
                            current_user.longitude + _BOX_DEG
                        )
                    )
                if search:
                    q = q.filter(
                        or_(
                            models.Shop.name.ilike(f"%{search}%"),
                            models.Shop.location.ilike(f"%{search}%")
                        )
                    )
                shops_list = q.all()
                if current_user.latitude is not None and current_user.longitude is not None:
                    shops_list.sort(key=lambda s: get_distance(current_user.latitude, current_user.longitude, s.latitude, s.longitude))
                return shops_list[:limit]


            shops = []
            if search_term:
                shops = fetch_nearby_shops(limit=3, search=search_term)
            
            # If still no shops, but they asked for shops/map, return all to give context
            if not shops and any(w in query_lower for w in ["shop", "store", "near", "map", "where"]):
                shops = fetch_nearby_shops(limit=3)

            # 2. Construct Context
            context_text = "Here is the available data from our local database:\n\n"
            
            if products:
                context_text += "PRODUCTS:\n"
                for p in products:
                    context_text += f"- {p.name} (${p.price}): {p.description} (Shop: {p.shop.name})\n"
            else:
                context_text += "No specific products found matching the exact query.\n"

            if shops:
                context_text += "\nSHOPS:\n"
                for s in shops:
                    context_text += f"- {s.name}: Located in {s.location}. Rating: {s.rating}.\n"
            
            context_text += "\nUSER QUERY: " + query

            # Build conversation prompt for Gemini
            system_prompt = "You are a helpful shopping assistant for LocalConnect. Use the provided database context to answer the user's question. If the user asks for recommendations, use the context to suggest items. If the context doesn't have the answer, politely say you don't know but offer general advice. Keep answers concise and friendly."
            
            conversation_parts = [system_prompt + "\n\n"]
            for msg in request.history:
                role_label = "User" if msg.role == "user" else "Assistant"
                conversation_parts.append(f"{role_label}: {msg.content}\n")
            conversation_parts.append(context_text)

            # 3. Call Gemini
            full_prompt = "\n".join(conversation_parts)
            completion = genai_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=full_prompt,
            )

            ai_message = completion.text

            # 4. Format Response
            # We still return structured data for the UI to render cards
            product_list = []
            for p in products:
                product_list.append({
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "shop_name": p.shop.name if p.shop else "Unknown Shop",
                    "image_url": p.image_url
                })

            shop_list = []
            for s in shops:
                dist = get_distance(current_user.latitude, current_user.longitude, s.latitude, s.longitude)
                dist_str = f"{dist:.1f} km away" if dist != float('inf') else "Nearby"
                shop_list.append({
                    "id": s.id,
                    "name": s.name,
                    "location": s.location,
                    "phone": s.phone,
                    "rating": s.rating,
                    "latitude": s.latitude,
                    "longitude": s.longitude,
                    "distance": dist_str,
                    "items": [p.name for p in s.products[:3]],
                    "link": "/marketplace"
                })

            # Decide if we show the map
            query_lower = query.lower()
            show_map = ("near me" in query_lower or "map" in query_lower or "where" in query_lower) and len(shops) > 0

            return {
                "message": ai_message,
                "products": product_list,
                "stores": shop_list,
                "map_view": show_map
            }

        except Exception as e:
            print(f"Gemini Error: {e}")
            # Fall through to local backup
    
    # --- LOCAL FALLBACK FLOW (Symbolic AI) ---
    query_lower = query.lower()
    
    # 1. Order Status Queries
    if "order" in query_lower and any(w in query_lower for w in ["where", "status", "track", "my"]):
        orders = db.query(models.Order).filter(models.Order.customer_id == current_user.id).order_by(models.Order.created_at.desc()).limit(1).all()
        if orders:
            latest = orders[0]
            status_msg = f"Your latest order (#{latest.id}) is currently: **{latest.delivery_status or latest.status}**.\n\nTotal: ${latest.total_amount:.2f}."
            return {
                "message": status_msg,
                "products": [],
                "stores": [],
                "map_view": False
            }
        else:
            return {
                "message": "I couldn't find any recent orders for your account.",
                "products": [],
                "stores": [],
                "map_view": False
            }

    # 2. Advanced Search (Keyword + Description)
    stop_words = ["i", "want", "to", "can", "you", "where", "find", "buy", "get", "me", "show", "looking", "for", "a", "an", "the", "compare", "shops", "stores", "in", "near", "around", "map", "cheap", "expensive", "best"]
    keywords = [w for w in query_lower.split() if w not in stop_words and not w.startswith("$") and not w.isdigit()]
    search_term = " ".join(keywords)

    import re
    budget_match = re.search(r'\$?(\d+)', query)
    budget = float(budget_match.group(1)) if budget_match else None

    products = []
    shops = []

    # Try searching products first
    if search_term:
        product_query = db.query(models.Product).filter(
            or_(
                models.Product.name.ilike(f"%{search_term}%"),
                models.Product.description.ilike(f"%{search_term}%"),
                models.Product.category.ilike(f"%{search_term}%")
            )
        )
        if budget:
            product_query = product_query.filter(models.Product.price <= budget)
        
        products = product_query.limit(4).all()

    def fetch_nearby_shops_fallback(limit=3, search=None):
        q = db.query(models.Shop)
        # Apply bounding-box pre-filter when user location is known
        if current_user.latitude is not None and current_user.longitude is not None:
            q = q.filter(
                models.Shop.latitude.between(
                    current_user.latitude - _BOX_DEG,
                    current_user.latitude + _BOX_DEG
                ),
                models.Shop.longitude.between(
                    current_user.longitude - _BOX_DEG,
                    current_user.longitude + _BOX_DEG
                )
            )
        if search:
            q = q.filter(
                or_(
                    models.Shop.name.ilike(f"%{search}%"),
                    models.Shop.location.ilike(f"%{search}%")
                )
            )
        shops_list = q.all()
        if current_user.latitude is not None and current_user.longitude is not None:
            shops_list.sort(key=lambda s: get_distance(current_user.latitude, current_user.longitude, s.latitude, s.longitude))
        return shops_list[:limit]


    # Try searching shops if looking for places
    if search_term and any(w in query_lower for w in ["shop", "store", "near", "map", "where"]):
        shops = fetch_nearby_shops_fallback(limit=3, search=search_term)

    # If asking for map/near me with no specific search term, show random near shops
    if not shops and not products and any(w in query_lower for w in ["shop", "store", "near", "map"]):
        shops = fetch_nearby_shops_fallback(limit=3)

    # Construct intelligent response message
    if products:
        if budget:
            message = f"Here are some '{search_term}' options under ${budget:.2f}:"
        else:
            message = f"I found these products matching '{search_term}':"
    elif shops:
        message = f"Here are some shops matching your request:"
    else:
        # Generic pleasantries if no intent matches
        if any(w in query_lower for w in ["hello", "hi", "hey"]):
            message = "Hello! I can help you find products (e.g. 'fresh tomatoes under $5'), locate nearby stores, or check your order status. What do you need?"
        else:
            message = "I couldn't find exact matches for that in our local shops. Try asking for specific items like 'milk', 'baked goods', or 'show me shops near me'."

    # Format Output
    product_list = []
    for p in products:
        product_list.append({
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "shop_name": p.shop.name if p.shop else "Unknown Shop",
            "image_url": p.image_url
        })

    shop_list = []
    for s in shops:
        dist = get_distance(current_user.latitude, current_user.longitude, s.latitude, s.longitude)
        dist_str = f"{dist:.1f} km away" if dist != float('inf') else "Nearby"
        shop_list.append({
            "id": s.id,
            "name": s.name,
            "location": s.location,
            "phone": s.phone,
            "rating": s.rating,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "distance": dist_str,
            "items": [p.name for p in s.products[:3]],
            "link": "/marketplace"
        })

    # Decide if we show the map
    show_map = ("near me" in query_lower or "map" in query_lower or "where" in query_lower) and len(shops) > 0
    if show_map:
        message = "Here are the shops near you on the map:"

    return {
        "message": message,
        "products": product_list,
        "stores": shop_list,
        "map_view": show_map
    }
