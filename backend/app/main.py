import os
import uuid
import time
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .database import engine, Base
from .routes import (
    products, auth, cart, shops, orders, ambassador, admin,
    uploads, ai_agent, cv_search, shop_owner, payments, chat,
    reviews, notifications,
)
from .core.config import ENVIRONMENT

# ──────────────────────────────────────────────────────────────
# LOGGING
# ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("localconnect")

# ──────────────────────────────────────────────────────────────
# APPLICATION FACTORY
# ──────────────────────────────────────────────────────────────

# Read allowed origins from environment; fallback to localhost dev server.
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LocalConnect API",
    description="Community commerce platform connecting residents with local shops.",
    version="2.0.0",
    docs_url="/docs" if ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if ENVIRONMENT != "production" else None,
)


# ──────────────────────────────────────────────────────────────
# MIDDLEWARE — Request ID & Timing
# ──────────────────────────────────────────────────────────────
class RequestTracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{elapsed}ms"
        logger.info(
            "%s %s → %s (%sms) [%s]",
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
            request_id[:8],
        )
        return response


app.add_middleware(RequestTracingMiddleware)


# ──────────────────────────────────────────────────────────────
# MIDDLEWARE — CORS (restricted methods)
# ──────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────
# GLOBAL EXCEPTION HANDLER
# ──────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all so stack traces are never leaked to the client."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "type": "internal_error",
        },
    )


# ──────────────────────────────────────────────────────────────
# STATIC FILES
# ──────────────────────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


# ──────────────────────────────────────────────────────────────
# ROUTER REGISTRATION
# ──────────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api/auth",          tags=["Authentication"])
app.include_router(products.router,      prefix="/api/products",      tags=["Products"])
app.include_router(shops.router,         prefix="/api/shops",         tags=["Shops"])
app.include_router(cart.router,          prefix="/api/cart",           tags=["Cart"])
app.include_router(orders.router,        prefix="/api/orders",        tags=["Orders"])
app.include_router(ambassador.router,    prefix="/api/ambassador",    tags=["Ambassador"])
app.include_router(admin.router,         prefix="/api/admin",         tags=["Admin"])
app.include_router(uploads.router,       prefix="/api/upload",        tags=["Uploads"])
app.include_router(ai_agent.router,      prefix="/api/ai",            tags=["AI Assistant"])
app.include_router(cv_search.router,     prefix="/api/cv",            tags=["Visual Search"])
app.include_router(shop_owner.router,    prefix="/api/shop-owner",    tags=["Shop Owner"])
app.include_router(payments.router,      prefix="/api/payments",      tags=["Payments"])
app.include_router(chat.router,          prefix="/api/chat",          tags=["Chat"])
app.include_router(reviews.router,       prefix="/api/reviews",       tags=["Reviews"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


# ──────────────────────────────────────────────────────────────
# HEALTH / READINESS ENDPOINTS
# ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Status"])
def read_root():
    return {"message": "Welcome to LocalConnect API", "version": "2.0.0"}


@app.get("/health", tags=["Status"])
def health_check():
    """Liveness probe — is the server process running?"""
    return {"status": "healthy", "environment": ENVIRONMENT}


@app.get("/readiness", tags=["Status"])
def readiness_check():
    """Readiness probe — can we serve traffic (DB reachable)?"""
    from .database import SessionLocal
    try:
        db = SessionLocal()
        db.execute("SELECT 1" if hasattr(db, "execute") else db.connection())
        db.close()
        return {"status": "ready", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "unreachable"},
        )

