import sqlite3
import requests
import json

# First login as admin to get token
print("Logging in as admin...")
login_data = {
    "email": "testadmin@example.com",
    "password": "password123"
}

try:
    login_response = requests.post("http://127.0.0.1:5000/api/auth/login", json=login_data)
    print(f"Login status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        print(f"Login response: {login_data}")
        
        if 'access_token' in login_data:
            token = login_data['access_token']
        elif 'token' in login_data:
            token = login_data['token']
        else:
            print("No token found in response")
            exit()
            
        print("Login successful, got token")
        
        # Check current users in the database
        conn = sqlite3.connect('jobs.db')
        cursor = conn.cursor()

        # Get a test user (let's use ID 2 since ID 1 is admin)
        cursor.execute('SELECT id, email, is_banned, banned_reason FROM users WHERE id = 2')
        user = cursor.fetchone()
        if user:
            print(f'Current user: ID={user[0]}, email={user[1]}, is_banned={user[2]}, banned_reason={user[3]}')
            user_id = user[0]
            
            # Test unban API with proper authentication
            print(f"\nTesting unban API for user {user_id}...")
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f'http://127.0.0.1:5000/api/admin/users/{user_id}/unban',
                headers=headers
            )
            print(f'Unban API Response Status: {response.status_code}')
            print(f'Unban API Response: {response.text}')
            
            # Check database after unban
            cursor.execute('SELECT id, email, is_banned, banned_reason FROM users WHERE id = ?', (user_id,))
            updated_user = cursor.fetchone()
            if updated_user:
                print(f'After unban: ID={updated_user[0]}, email={updated_user[1]}, is_banned={updated_user[2]}, banned_reason={updated_user[3]}')
                
        else:
            print('User ID 2 not found')

        conn.close()
        
    else:
        print(f"Login failed: {login_response.text}")
        
except Exception as e:
    print(f'Error: {e}')
