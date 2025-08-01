#!/usr/bin/env python3
"""
Script to approve pending jobs using admin credentials
"""
import requests
import json

BASE_URL = "http://localhost:5001"

def login_admin():
    """Login as admin and get token"""
    login_data = {
        "email": "admin@jobportal.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            return result.get('access_token')
    return None

def approve_job(job_id, admin_token):
    """Approve a job posting"""
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    approve_data = {
        "admin_notes": "Approved by automated test"
    }
    
    response = requests.post(f"{BASE_URL}/api/jobs/{job_id}/approve", 
                            json=approve_data, headers=headers)
    return response.status_code == 200 and response.json().get('success', False)

def get_all_jobs_admin(admin_token):
    """Get all jobs including unapproved ones"""
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/api/jobs/search?show_unapproved=true", 
                           headers=headers)
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            return result.get('jobs', [])
    return []

def main():
    print("🔑 Logging in as admin...")
    admin_token = login_admin()
    
    if not admin_token:
        print("❌ Failed to login as admin")
        return
    
    print("✅ Admin login successful")
    
    print("\n📋 Getting all jobs (including unapproved)...")
    jobs = get_all_jobs_admin(admin_token)
    
    print(f"Found {len(jobs)} jobs")
    
    if not jobs:
        print("❌ No jobs found")
        return
    
    print("\n🔍 Jobs found:")
    for job in jobs:
        status = job.get('approved_by_admin', False)
        print(f"  ID: {job['id']}, Title: {job['title']}, Approved: {status}")
    
    print("\n✅ Approving all pending jobs...")
    approved_count = 0
    
    for job in jobs:
        if not job.get('approved_by_admin', False):
            print(f"  Approving job {job['id']}: {job['title']}")
            if approve_job(job['id'], admin_token):
                approved_count += 1
                print(f"    ✅ Approved")
            else:
                print(f"    ❌ Failed to approve")
    
    print(f"\n🎉 Successfully approved {approved_count} jobs!")
    
    # Test public search
    print("\n🔍 Testing public job search...")
    response = requests.get(f"{BASE_URL}/api/jobs/search")
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            public_jobs = result.get('jobs', [])
            print(f"✅ Public search now shows {len(public_jobs)} approved jobs")
            for job in public_jobs:
                print(f"  - {job['title']} at {job['company']}")
        else:
            print("❌ Public search failed")
    else:
        print(f"❌ Public search returned status {response.status_code}")

if __name__ == "__main__":
    main()
