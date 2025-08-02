import requests
import json

# Create a test user and then test follow functionality
BASE_URL = "http://localhost:5000"

def create_test_user():
    """Create a test user account"""
    register_data = {
        "email": f"testfollow{hash('testuser') % 1000}@test.com",
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User",
        "user_type": "jobseeker"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    print(f"Registration response: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"Test user created with ID: {data.get('user_id')}")
        # Return the access token from registration
        return register_data["email"], register_data["password"], data.get('access_token')
    else:
        print(f"Registration failed: {response.json()}")
        return None, None, None

def test_follow_unfollow():
    # Create a test user
    email, password, access_token = create_test_user()
    if not email:
        print("Failed to create test user")
        return
    
    # Use the access token from registration
    token = access_token
    current_user_id = "new_user"  # We know it's a new user
    print(f"Using access token from registration")
    
    # Get user ID 1 to follow (the original user)
    target_user_id = 1
    print(f"Target user ID: {target_user_id}")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test follow
    follow_response = requests.post(f"{BASE_URL}/api/users/{target_user_id}/follow", headers=headers)
    print(f"Follow response: {follow_response.status_code}")
    if follow_response.status_code == 200:
        print(f"Follow success: {follow_response.json()}")
    else:
        print(f"Follow failed: {follow_response.text}")
    
    # Check if following
    check_response = requests.get(f"{BASE_URL}/api/users/{target_user_id}/is-following", headers=headers)
    print(f"Is following check: {check_response.status_code}")
    if check_response.status_code == 200:
        print(f"Following status: {check_response.json()}")
    
    # Test unfollow
    unfollow_response = requests.post(f"{BASE_URL}/api/users/{target_user_id}/unfollow", headers=headers)
    print(f"Unfollow response: {unfollow_response.status_code}")
    if unfollow_response.status_code == 200:
        print(f"Unfollow success: {unfollow_response.json()}")
    else:
        print(f"Unfollow failed: {unfollow_response.text}")
    
    # Check if not following
    check_response2 = requests.get(f"{BASE_URL}/api/users/{target_user_id}/is-following", headers=headers)
    print(f"Is following check after unfollow: {check_response2.status_code}")
    if check_response2.status_code == 200:
        print(f"Following status after unfollow: {check_response2.json()}")

if __name__ == "__main__":
    print("Testing Follow/Unfollow functionality...")
    test_follow_unfollow()
