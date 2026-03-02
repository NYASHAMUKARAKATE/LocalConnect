from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .. import schemas, models, database
from ..database import get_db
from ..core import security, config
from jose import JWTError

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.decode_token(token)
        # Reject refresh tokens used on normal endpoints
        if payload.get("type") == "refresh":
            raise credentials_exception
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        name=user.name,
        phone=user.phone,
        role=user.role,
        location=user.location,
        latitude=user.latitude,
        longitude=user.longitude
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if db_user.role == models.UserRole.SHOP_OWNER:
        db_shop = models.Shop(
            owner_id=db_user.id,
            name=f"{db_user.name}'s Shop",
            phone=db_user.phone,
            location=db_user.location,
            latitude=db_user.latitude,
            longitude=db_user.longitude,
            image_url="https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80",
            offers_delivery=False,
            delivery_fee=0.0
        )
        db.add(db_shop)
        db.commit()
    return db_user

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token_data = {"sub": user.email, "role": user.role, "user_id": user.id}
    access_token = security.create_access_token(data=token_data)
    refresh_token = security.create_refresh_token(data=token_data)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id
    }


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
def refresh_access_token(body: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    try:
        payload = security.decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = db.query(models.User).filter(models.User.id == payload.get("user_id")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        token_data = {"sub": user.email, "role": user.role, "user_id": user.id}
        return {
            "access_token": security.create_access_token(data=token_data),
            "refresh_token": security.create_refresh_token(data=token_data),
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

@router.get("/me")
def get_current_profile(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "phone": current_user.phone,
        "location": current_user.location,
        "credits": current_user.credits,
        "created_at": current_user.created_at,
    }

@router.put("/me")
def update_profile(
    updates: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if updates.name is not None:
        current_user.name = updates.name
    if updates.phone is not None:
        current_user.phone = updates.phone
    if updates.location is not None:
        current_user.location = updates.location
    if updates.password is not None:
        current_user.password_hash = security.get_password_hash(updates.password)
    
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "phone": current_user.phone,
        "location": current_user.location,
        "credits": current_user.credits,
        "created_at": current_user.created_at,
    }
