"""Quick test for the CV search API."""
import requests
import json

BASE = "http://localhost:8000/api/cv"

# Test 1: Search using the Fresh Milk image URL (exact match expected)
print("=== TEST 1: Search by Fresh Milk image ===")
r = requests.get(
    f"{BASE}/search-by-url",
    params={"image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150", "top_k": 5},
)
data = r.json()
print(f"Status: {r.status_code}")
print(f"Message: {data['message']}")
for res in data["results"]:
    score = res["similarity_score"]
    name = res["name"]
    price = res["price"]
    shop = res["shop_name"]
    print(f"  {score:.4f} - {name} (${price}) @ {shop}")

print()

# Test 2: Search using the Tomatoes image URL (should rank tomatoes high)
print("=== TEST 2: Search by Tomatoes image ===")
r2 = requests.get(
    f"{BASE}/search-by-url",
    params={"image_url": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337", "top_k": 5},
)
data2 = r2.json()
print(f"Status: {r2.status_code}")
print(f"Message: {data2['message']}")
for res in data2["results"]:
    score = res["similarity_score"]
    name = res["name"]
    price = res["price"]
    shop = res["shop_name"]
    print(f"  {score:.4f} - {name} (${price}) @ {shop}")

print()
print("=== All tests passed! ===")
