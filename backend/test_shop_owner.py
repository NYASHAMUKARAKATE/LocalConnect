import requests

# Login as a shop owner to get token
res = requests.post('http://localhost:8000/api/auth/token', data={
    'username': 'nyasha@Localconnect.com',
    'password': 'password123'
})
    
if res.status_code != 200:
    print('Failed to login completely:', res.text)
    import sys; sys.exit(1)

token = res.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

endpoints = [
    "/api/shop-owner/my-shop",
    "/api/shop-owner/products",
    "/api/orders/shop-orders",
    "/api/shop-owner/analytics",
    "/api/reviews/shop/1",
    "/api/chat/history/1"
]

for ep in endpoints:
    r = requests.get(f"http://localhost:8000{ep}", headers=headers)
    print(f"GET {ep}: {r.status_code}")
    if r.status_code != 200:
        print(r.text)

# Try adding a product
payload = {
    "name": "Test Product",
    "category": "Other",
    "price": 10.0,
    "stock": 5,
    "description": "Test",
    "image_url": "http://img.com/1.png"
}
r2 = requests.post("http://localhost:8000/api/shop-owner/products", json=payload, headers=headers)
print(f"POST /api/shop-owner/products: {r2.status_code}")
if r2.status_code != 200:
    print(r2.text)
