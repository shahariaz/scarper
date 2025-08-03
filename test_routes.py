"""
Test what routes are available on the Flask app
"""

import requests

def test_routes():
    # Test some known working routes first
    try:
        # Test health endpoint
        response = requests.get("http://localhost:5000/health")
        print(f"Health endpoint: {response.status_code}")
        
        # Test existing auth endpoint
        response = requests.post("http://localhost:5000/api/auth/login", json={"email": "test", "password": "test"})
        print(f"Login endpoint: {response.status_code}")
        
        # Test our new messaging endpoints
        headers = {"Authorization": "Bearer fake-token"}
        
        response = requests.get("http://localhost:5000/api/auth/conversations", headers=headers)
        print(f"Get conversations endpoint: {response.status_code}")
        print(f"Response: {response.text}")
        
        response = requests.post("http://localhost:5000/api/auth/conversations", json={"other_user_id": 1}, headers=headers)
        print(f"Create conversation endpoint: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_routes()
