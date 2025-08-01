#!/usr/bin/env python3

import requests
import json

def test_jobs_api():
    """Test the jobs API endpoints to verify pagination"""
    base_url = "http://localhost:5000/api"
    
    print("Testing Jobs API endpoints...")
    
    # Test /api/jobs endpoint
    print("\n1. Testing /api/jobs endpoint:")
    try:
        response = requests.get(f"{base_url}/jobs?page=1&per_page=5")
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: Success")
            print(f"   Jobs returned: {len(data.get('jobs', []))}")
            print(f"   Total: {data.get('total', 0)}")
            print(f"   Page: {data.get('page', 'N/A')}")
            print(f"   Per page: {data.get('per_page', 'N/A')}")
            print(f"   Pages: {data.get('pages', 'N/A')}")
            print(f"   Total pages: {data.get('total_pages', 'N/A')}")
        else:
            print(f"   Status: Error {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test /api/search endpoint
    print("\n2. Testing /api/search endpoint:")
    try:
        response = requests.get(f"{base_url}/search?page=1&per_page=5")
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: Success")
            print(f"   Jobs returned: {len(data.get('jobs', []))}")
            print(f"   Total: {data.get('total', 0)}")
            print(f"   Page: {data.get('page', 'N/A')}")
            print(f"   Per page: {data.get('per_page', 'N/A')}")
            print(f"   Pages: {data.get('pages', 'N/A')}")
            print(f"   Total pages: {data.get('total_pages', 'N/A')}")
        else:
            print(f"   Status: Error {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test /api/search endpoint with company filter
    print("\n3. Testing /api/search endpoint with company filter:")
    try:
        response = requests.get(f"{base_url}/search?page=1&per_page=5&company=TechCorp")
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: Success")
            print(f"   Jobs returned: {len(data.get('jobs', []))}")
            print(f"   Total: {data.get('total', 0)}")
            print(f"   Page: {data.get('page', 'N/A')}")
            print(f"   Per page: {data.get('per_page', 'N/A')}")
            print(f"   Pages: {data.get('pages', 'N/A')}")
            print(f"   Total pages: {data.get('total_pages', 'N/A')}")
            
            # Show first job if available
            jobs = data.get('jobs', [])
            if jobs:
                print(f"   First job company: {jobs[0].get('company', 'N/A')}")
        else:
            print(f"   Status: Error {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_jobs_api()
