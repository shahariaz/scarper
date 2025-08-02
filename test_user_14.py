import requests

# Test user 14 profile
response = requests.get("http://localhost:5000/api/users/14/profile")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Test user 1 for comparison
response1 = requests.get("http://localhost:5000/api/users/1/profile")
print(f"\nUser 1 Status: {response1.status_code}")
print(f"User 1 Response: {response1.json()}")
