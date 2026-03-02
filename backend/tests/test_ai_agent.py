
def test_ai_chat(client, auth_headers):
    response = client.post(
        "/api/ai/chat",
        json={"query": "Find fresh milk"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "products" in data

def test_ai_chat_empty(client, auth_headers):
    response = client.post(
        "/api/ai/chat",
        json={"query": "xyznonexistent123"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
