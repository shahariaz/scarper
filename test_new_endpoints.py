#!/usr/bin/env python3
"""
Test script for the new blog and social API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_login():
    """Test login and get token"""
    login_data = {
        "email": "user1@test.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"Login response: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            return data.get('access_token')
    
    # Try a different user
    login_data = {
        "email": "admin@gmail.com", 
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"Admin login response: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            return data.get('access_token')
    
    return None

def test_blog_endpoints():
    """Test blog endpoints"""
    print("\n=== Testing Blog Endpoints ===")
    
    # Test GET /api/blogs
    response = requests.get(f"{BASE_URL}/api/blogs")
    print(f"GET /api/blogs: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data.get('blogs', []))} blogs")
    
    # Test GET /api/blogs/1
    response = requests.get(f"{BASE_URL}/api/blogs/1")
    print(f"GET /api/blogs/1: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        blog = data.get('blog', {})
        print(f"Blog: {blog.get('title')} (Views: {blog.get('view_count')})")

def test_social_endpoints(token):
    """Test social endpoints with authentication"""
    print("\n=== Testing Social Endpoints ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test user search
    response = requests.get(f"{BASE_URL}/api/users/search?q=test", headers=headers)
    print(f"GET /api/users/search: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data.get('users', []))} users")
    
    # Test like blog (blog ID 1)
    response = requests.post(f"{BASE_URL}/api/blogs/1/like", headers=headers)
    print(f"POST /api/blogs/1/like: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Like result: {data.get('message')}")
    elif response.status_code == 400:
        data = response.json()
        print(f"Like result: {data.get('message')} (already liked)")

def test_comment_endpoints(token):
    """Test comment endpoints with authentication"""
    print("\n=== Testing Comment Endpoints ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test get comments for blog 7 (has comments)
    response = requests.get(f"{BASE_URL}/api/blogs/7/comments")
    print(f"GET /api/blogs/7/comments: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data.get('comments', []))} comments")
    
    # Test create comment
    comment_data = {"content": "This is a test comment from the API test!"}
    response = requests.post(f"{BASE_URL}/api/blogs/1/comments", json=comment_data, headers=headers)
    print(f"POST /api/blogs/1/comments: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"Comment created: {data.get('message')}")

def test_notification_endpoints(token):
    """Test notification endpoints"""
    print("\n=== Testing Notification Endpoints ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test get notifications
    response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
    print(f"GET /api/notifications: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data.get('notifications', []))} notifications")

def main():
    print("Testing new blog and social API endpoints...")
    
    # Test endpoints that don't require authentication
    test_blog_endpoints()
    
    # Get authentication token
    token = test_login()
    if not token:
        print("Could not get authentication token, skipping authenticated tests")
        return
    
    print(f"Got token: {token[:20]}...")
    
    # Test authenticated endpoints
    test_social_endpoints(token)
    test_comment_endpoints(token)
    test_notification_endpoints(token)
    
    print("\n=== Test completed ===")

if __name__ == "__main__":
    main()