import requests

# Test the simplified login endpoint
url = "http://localhost:8002/login"
data = {
    "username": "testuser",
    "password": "testpassword"
}

# First register the user to be sure
reg_url = "http://localhost:8002/register"
reg_data = {
    "username": "testuser",
    "password": "testpassword",
    "full_name": "Test User"
}
try:
    requests.post(reg_url, json=reg_data)
except:
    pass

# Now login
response = requests.post(url, data=data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")

if response.status_code == 200:
    token = response.json().get("access_token")
    print(f"Token (Username): {token}")
    
    # Test protected route
    headers = {"Authorization": f"Bearer {token}"}
    me_response = requests.get("http://localhost:8002/users/me", headers=headers)
    print(f"Me Response: {me_response.json()}")
