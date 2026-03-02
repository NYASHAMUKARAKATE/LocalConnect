from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps a shop_owner_id to their active websocket
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, shop_owner_id: int):
        await websocket.accept()
        self.active_connections[shop_owner_id] = websocket
        
    def disconnect(self, shop_owner_id: int):
        if shop_owner_id in self.active_connections:
            del self.active_connections[shop_owner_id]

    async def send_personal_message(self, message: dict, shop_owner_id: int):
        if shop_owner_id in self.active_connections:
            websocket = self.active_connections[shop_owner_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                # Connection might have dropped without a proper disconnect
                self.disconnect(shop_owner_id)

manager = ConnectionManager()


class PublicConnectionManager:
    def __init__(self):
        # List of all active public websockets
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for websocket in self.active_connections[:]: # Iterate over a copy
            try:
                await websocket.send_json(message)
            except Exception as e:
                self.disconnect(websocket)

public_manager = PublicConnectionManager()


@router.websocket("/ws/public")
async def public_websocket_endpoint(websocket: WebSocket):
    await public_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        public_manager.disconnect(websocket)


@router.websocket("/ws/{shop_owner_id}")
async def websocket_endpoint(websocket: WebSocket, shop_owner_id: int):
    await manager.connect(websocket, shop_owner_id)
    try:
        while True:
            # We don't actively expect messages FROM the shop owner client right now.
            # However we must await receive_text() to keep the connection alive and detect drops.
            data = await websocket.receive_text()
            
            # Simple ping/pong keepalive
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        manager.disconnect(shop_owner_id)
