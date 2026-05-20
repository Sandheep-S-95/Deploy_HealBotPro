import requests

API_BASE = "http://localhost:8002"

def verify_status(user_id):
    print(f"🔍 Checking status for user: {user_id}...")
    try:
        response = requests.get(f"{API_BASE}/user/{user_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data}")
            if data['has_history']:
                print(f"🎉 TEST PASSED: {user_id} HAS clinical history detected.")
            else:
                print(f"⚠️  TEST FAILED: {user_id} NO clinical history detected.")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    verify_status("Ronaldo_77")
