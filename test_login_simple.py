"""
Simple test to verify login works
"""
import requests
import json

# Test with the first admin user
admin_users = [
    {"email": "admin@gmail.com", "password": "admin123"},
    {"email": "admin@jobportal.com", "password": "admin123"},
    {"email": "bytecoderarc@gmail.com", "password": "admin123"},
    {"email": "admin@gmail.com", "password": "password"},
    {"email": "admin@gmail.com", "password": "123456"}
]

def test_login():
    for user in admin_users:
        print(f"Testing login with {user['email']}...")
        
        try:
            response = requests.post("http://localhost:5000/api/auth/login", json=user)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"✅ Login successful for {user['email']}")
                    print(f"Token: {result.get('access_token', 'N/A')[:50]}...")
                    return user, result['access_token']
                else:
                    print(f"❌ Login failed: {result.get('message')}")
            else:
                print(f"❌ HTTP Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print()
    
    return None, None

if __name__ == "__main__":
    user, token = test_login()
    if token:
        print(f"Successfully logged in as {user['email']}")
    else:
        print("No valid login found")
