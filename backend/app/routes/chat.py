from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime, timedelta, timezone
from .. import schemas, models, database
from ..database import get_db
from .auth import get_current_user


router = APIRouter()

# WebSocket Manager to track active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, shop_id: int, websocket: WebSocket):
        await websocket.accept()
        if shop_id not in self.active_connections:
            self.active_connections[shop_id] = []
        self.active_connections[shop_id].append(websocket)

    def disconnect(self, shop_id: int, websocket: WebSocket):
        if shop_id in self.active_connections:
            self.active_connections[shop_id].remove(websocket)

    async def broadcast_to_shop(self, shop_id: int, message: dict):
        if shop_id in self.active_connections:
            for connection in self.active_connections[shop_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{shop_id}")
async def websocket_endpoint(websocket: WebSocket, shop_id: int):
    db = database.SessionLocal()
    try:
        # Validate shop exists before accepting connection
        shop = db.query(models.Shop).filter(models.Shop.id == shop_id).first()
        if not shop:
            await websocket.close(code=4004, reason="Shop not found")
            return

        await manager.connect(shop_id, websocket)
        try:
            while True:
                data = await websocket.receive_json()
                # Expecting data format: {"sender_id": int, "content": str}

                # 1. Save message to DB
                try:
                    db_message = models.Message(
                        sender_id=data["sender_id"],
                        shop_id=shop_id,
                        content=data["content"]
                    )
                    db.add(db_message)
                    db.commit()
                    db.refresh(db_message)

                    # 2. Broadcast to all subscribers of this shop channel
                    await manager.broadcast_to_shop(shop_id, {
                        "id": db_message.id,
                        "sender_id": db_message.sender_id,
                        "content": db_message.content,
                        "created_at": db_message.created_at.isoformat()
                    })
                except Exception as e:
                    db.rollback()
                    await websocket.send_json({"error": "Failed to save message", "detail": str(e)})
        except WebSocketDisconnect:
            manager.disconnect(shop_id, websocket)
    finally:
        db.close()

@router.get("/history/{shop_id}", response_model=List[schemas.Message])
def get_chat_history(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Return all messages for a shop chat room, oldest first."""
    messages = db.query(models.Message).filter(
        models.Message.shop_id == shop_id
    ).order_by(models.Message.created_at.asc()).all()
    return messages


@router.delete("/cleanup")
def cleanup_old_messages(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    retention_days: int = 90
):
    """
    Delete messages older than `retention_days` days (default: 90).
    Implements the 90-day chat retention policy stated in FR-03.
    Restricted to SYSTEM_ADMIN role.
    """
    if current_user.role != models.UserRole.SYSTEM_ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    deleted = db.query(models.Message)\
                .filter(models.Message.created_at < cutoff)\
                .delete(synchronize_session=False)
    db.commit()
    return {"deleted_count": deleted, "cutoff_date": cutoff.isoformat()}
