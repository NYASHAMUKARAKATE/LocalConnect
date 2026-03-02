import asyncio
import websockets
import json

async def mock_shop_owner_client():
    uri = "ws://localhost:8000/api/notifications/ws/1"
    
    print(f"Connecting to {uri} as Shop Owner 1...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected successfully! Waiting for real-time notifications...")
            
            # Keep listener open for 10 seconds to verify handshakes
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                print(f"Received Alert: {message}")
            except asyncio.TimeoutError:
                print("No notifications received in 10s. This is normal if no orders were placed. Connection is stable.")
    except Exception as e:
        print(f"WebSocket Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(mock_shop_owner_client())
