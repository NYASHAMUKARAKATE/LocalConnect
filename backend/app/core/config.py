import os
import secrets

# ──────────────────────────────────────────────────────────────
# APPLICATION CONFIGURATION
# ──────────────────────────────────────────────────────────────

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")  # development | staging | production

# Secret key to sign JWT – MUST be set via env var in production.
_default_dev_key = "dev-only-" + secrets.token_hex(32)
SECRET_KEY = os.getenv("SECRET_KEY", _default_dev_key if ENVIRONMENT == "development" else "")
if not SECRET_KEY:
    raise RuntimeError(
        "FATAL: SECRET_KEY environment variable is not set. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Rate limiting
RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "60/minute")
RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "10/minute")
RATE_LIMIT_AI = os.getenv("RATE_LIMIT_AI", "20/minute")
