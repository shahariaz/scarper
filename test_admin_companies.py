#!/usr/bin/env python3

import requests
import json

def test_admin_companies():
    # Login as admin
    login_data = {
        "email": "admin@jobportal.com",
        "password": "admin123"
    }
    
    login_response = requests.post("http://localhost:5000/api/auth/login", json=login_data)
    print("Login response:", login_response.status_code, login_response.json())
    
    if login_response.status_code == 200:
        token = login_response.json()['access_token']
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test companies pending endpoint
        companies_response = requests.get("http://localhost:5000/api/companies/pending", headers=headers)
        print("Companies pending response:", companies_response.status_code)
        print("Companies data:", json.dumps(companies_response.json(), indent=2))
        
        # Test company statistics endpoint
        stats_response = requests.get("http://localhost:5000/api/companies/statistics", headers=headers)
        print("Company statistics response:", stats_response.status_code)
        if stats_response.status_code == 200:
            print("Statistics data:", json.dumps(stats_response.json(), indent=2))
        else:
            print("Statistics error:", stats_response.text)
    else:
        print("Login failed!")

if __name__ == "__main__":
    test_admin_companies()
