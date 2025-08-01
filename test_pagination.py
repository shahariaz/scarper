#!/usr/bin/env python3

import requests
import json

def test_pagination_per_page():
    """Test the pagination per_page functionality"""
    base_url = "http://localhost:5000/api"
    
    print("Testing Pagination Per Page functionality...\n")
    
    # Test different per_page values
    per_page_values = [5, 10, 20, 50]
    
    for per_page in per_page_values:
        print(f"Testing per_page={per_page}:")
        try:
            response = requests.get(f"{base_url}/search?page=1&per_page={per_page}")
            if response.status_code == 200:
                data = response.json()
                jobs_returned = len(data.get('jobs', []))
                total = data.get('total', 0)
                pages = data.get('pages', 0)
                
                print(f"   Jobs returned: {jobs_returned}")
                print(f"   Total jobs: {total}")
                print(f"   Total pages: {pages}")
                print(f"   Expected jobs per page: {per_page}")
                print(f"   Expected pages: {(total + per_page - 1) // per_page}")
                
                # Verify the logic
                expected_jobs = min(per_page, total)  # Should not exceed total available
                expected_pages = (total + per_page - 1) // per_page if total > 0 else 0
                
                if jobs_returned == expected_jobs and pages == expected_pages:
                    print(f"   ✅ PASS: Pagination working correctly")
                else:
                    print(f"   ❌ FAIL: Expected {expected_jobs} jobs and {expected_pages} pages")
            else:
                print(f"   ❌ ERROR: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
        
        print()

if __name__ == "__main__":
    test_pagination_per_page()
