import requests

WEBHOOK_URL = "http://localhost:8000/api/payments/update"

payload = {
    "reference": "LOCALCONNECT-ORD-1-1",  # Assuming Order 1, Payment 1 exists for test logic
    "paynowreference": "12345678",
    "amount": "45.00",
    "status": "Paid",
    "pollurl": "https://www.paynow.co.zw/Interface/CheckPayment/?guid=123",
    "hash": "ABCD1234EFGH5678" # Mocked hash
}

print("Simulating Paynow sending a successful payment webhook...")
try:
    response = requests.post(WEBHOOK_URL, data=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Failed to hit webhook: {e}")
