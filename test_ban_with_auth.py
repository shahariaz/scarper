import requests
import json

# First, let's try to login and get a token
admin_credentials = [
    {'email': 'admin@jobportal.com', 'password': 'admin123'},
    {'email': 'admin@jobportal.com', 'password': 'password'},
    {'email': 'admin@jobportal.com', 'password': 'admin'},
    {'email': 'admin@gmail.com', 'password': 'admin123'},
    {'email': 'test@example.com', 'password': 'admin123'},
]

access_token = None
for creds in admin_credentials:
    print(f"Attempting login with {creds['email']}...")
    login_response = requests.post('http://127.0.0.1:5000/api/auth/login', json=creds)
    print(f'Login Response Status: {login_response.status_code}')
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        if login_result.get('success'):
            access_token = login_result.get('access_token')
            print(f'Successfully logged in with {creds["email"]}')
            print(f'Got access token: {access_token[:20]}...' if access_token else 'No access token in response')
            break
        else:
            print(f'Login failed: {login_result.get("message", "Unknown error")}')
    else:
        try:
            error_data = login_response.json()
            print(f'Login failed: {error_data.get("message", "Unknown error")}')
        except:
            print(f'Login failed: {login_response.text}')
    print()

if access_token:
            # Now try to ban a user
            ban_data = {
                'reason': 'Testing ban functionality from script',
                'duration': None
            }
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            print(f"\nTesting ban API for user 1...")
            ban_response = requests.post(
                'http://127.0.0.1:5000/api/admin/users/1/ban',
                json=ban_data,
                headers=headers
            )
            print(f'Ban API Response Status: {ban_response.status_code}')
            print(f'Ban API Response: {ban_response.text}')
else:
    print('Could not authenticate with any admin credentials')
