
def test_signup(client):
    import time
    unique_email = f"new_{time.time()}@example.com"
    response = client.post(
        "/api/auth/register",
        json={
            "email": unique_email,
            "password": "password123",
            "name": "New User",
            "phone": "12345678"
        }
    )
    if response.status_code != 200:
        print(f"FAILED: {response.text}")
    assert response.status_code == 200
    assert response.json()["email"] == unique_email

def test_login(client, normal_user):
    response = client.post(
        "/api/auth/token",
        data={"username": normal_user.email, "password": "testpass"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_get_profile(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
