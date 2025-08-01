import requests
import json

try:
    # Test the companies API
    response = requests.get('http://localhost:5000/api/companies/public?page=1&per_page=3')
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print("API Response:")
        print(json.dumps(data, indent=2))
    else:
        print("Error response")
        
except Exception as e:
    print(f"Error: {e}")
