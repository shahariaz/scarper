import requests
import json

# Test the follow/unfollow functionality
BASE_URL = "http://localhost:5000"

def test_follow_unfollow():
    # First login to get a token (using a fake user we created)
    login_data = {
        "email": "jessica.martinez123@example.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"Login response: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        current_user_id = data.get('user', {}).get('id')
        print(f"Logged in successfully. User ID: {current_user_id}")
        
        # Find another user to follow (not the current user)
        search_response = requests.get(f"{BASE_URL}/api/users/search?page=1&limit=5")
        if search_response.status_code == 200:
            search_data = search_response.json()
            users = search_data.get('users', [])
            
            # Find a user different from current user
            target_user = None
            for user in users:
                if user['id'] != current_user_id:
                    target_user = user
                    break
            
            if target_user:
                target_user_id = target_user['id']
                print(f"Target user: {target_user['display_name']} (ID: {target_user_id})")
                
                headers = {'Authorization': f'Bearer {token}'}
                
                # Test follow
                follow_response = requests.post(f"{BASE_URL}/api/users/{target_user_id}/follow", headers=headers)
                print(f"Follow response: {follow_response.status_code} - {follow_response.json()}")
                
                # Check if following
                check_response = requests.get(f"{BASE_URL}/api/users/{target_user_id}/is-following", headers=headers)
                print(f"Is following check: {check_response.status_code} - {check_response.json()}")
                
                # Test unfollow
                unfollow_response = requests.post(f"{BASE_URL}/api/users/{target_user_id}/unfollow", headers=headers)
                print(f"Unfollow response: {unfollow_response.status_code} - {unfollow_response.json()}")
                
                # Check if not following
                check_response2 = requests.get(f"{BASE_URL}/api/users/{target_user_id}/is-following", headers=headers)
                print(f"Is following check after unfollow: {check_response2.status_code} - {check_response2.json()}")
                
            else:
                print("No other users found to test follow functionality")
        else:
            print(f"Failed to get users for testing: {search_response.status_code}")
    else:
        print(f"Login failed: {response.status_code} - {response.text}")

def test_user_profile():
    # Test getting user profile
    response = requests.get(f"{BASE_URL}/api/users/1/profile")
    print(f"User profile response: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Profile data: {json.dumps(data, indent=2)}")

if __name__ == "__main__":
    print("Testing Follow/Unfollow functionality...")
    test_follow_unfollow()
    print("\n" + "="*50 + "\n")
    print("Testing User Profile...")
    test_user_profile()
