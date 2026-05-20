import requests

API_BASE = "http://localhost:8002"

def test_signup():
    payload = {
        "username": "testuser_" + str(hash("testuser")),
        "password": "testpassword",
        "full_name": "Test User"
    }
    try:
        response = requests.post(f"{API_BASE}/register", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_signup()
