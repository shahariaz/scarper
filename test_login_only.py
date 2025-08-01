import requests
import json

# Test login
login_data = {
    "email": "testadmin@example.com",
    "password": "password123"
}

try:
    print("Testing login...")
    response = requests.post("http://127.0.0.1:5000/api/auth/login", 
                           json=login_data,
                           headers={'Content-Type': 'application/json'})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        if 'access_token' in data:
            print(f"Token received: {data['access_token'][:50]}...")
        
except Exception as e:
    print(f"Error: {e}")
