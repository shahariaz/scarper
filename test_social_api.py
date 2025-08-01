"""
Test script for social features API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_social_api():
    """Test the social API endpoints"""
    
    # First, let's try to login with existing users or register new ones
    print("1. Logging in test users...")
    
    # Try to login user 1 first
    login1_data = {
        "email": "user1@test.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login1_data)
    if response.status_code == 200:
        user1_result = response.json()
        if user1_result.get('success'):
            user1_token = user1_result.get('access_token')
            user1_id = user1_result.get('user_id')
            print(f"✅ User 1 logged in: ID {user1_id}")
        else:
            print(f"❌ User 1 login failed: {user1_result.get('message')}")
            return
    else:
        print("User 1 not found, registering...")
        # Register user 1
        user1_data = {
            "email": "user1@test.com",
            "password": "password123",
            "user_type": "jobseeker",
            "profile_data": {
                "first_name": "John",
                "last_name": "Doe",
                "bio": "Software developer passionate about blogging"
            }
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=user1_data)
        if response.status_code in [200, 201]:
            user1_result = response.json()
            if user1_result.get('success'):
                user1_token = user1_result.get('access_token')
                user1_id = user1_result.get('user_id')
                print(f"✅ User 1 registered: ID {user1_id}")
            else:
                print(f"❌ User 1 registration failed: {user1_result.get('message')}")
                return
        else:
            print(f"❌ User 1 registration failed: {response.text}")
            return
    
    # Try to login user 2
    login2_data = {
        "email": "user2@test.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login2_data)
    if response.status_code == 200:
        user2_result = response.json()
        if user2_result.get('success'):
            user2_token = user2_result.get('access_token')
            user2_id = user2_result.get('user_id')
            print(f"✅ User 2 logged in: ID {user2_id}")
        else:
            print(f"❌ User 2 login failed: {user2_result.get('message')}")
            return
    else:
        print("User 2 not found, registering...")
        # Register user 2
        user2_data = {
            "email": "user2@test.com",
            "password": "password123",
            "user_type": "jobseeker",
            "profile_data": {
                "first_name": "Jane",
                "last_name": "Smith",
                "bio": "Tech writer and blogger"
            }
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=user2_data)
        if response.status_code in [200, 201]:
            user2_result = response.json()
            if user2_result.get('success'):
                user2_token = user2_result.get('access_token')
                user2_id = user2_result.get('user_id')
                print(f"✅ User 2 registered: ID {user2_id}")
            else:
                print(f"❌ User 2 registration failed: {user2_result.get('message')}")
                return
        else:
            print(f"❌ User 2 registration failed: {response.text}")
            return
    
    # Test follow functionality
    print("\n2. Testing follow functionality...")
    
    headers1 = {"Authorization": f"Bearer {user1_token}"}
    headers2 = {"Authorization": f"Bearer {user2_token}"}
    
    # User 1 follows User 2
    response = requests.post(f"{BASE_URL}/users/{user2_id}/follow", headers=headers1)
    if response.status_code == 200:
        print("✅ User 1 successfully followed User 2")
    else:
        print(f"❌ Follow failed: {response.text}")
    
    # Check if User 1 is following User 2
    response = requests.get(f"{BASE_URL}/users/{user2_id}/is-following", headers=headers1)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Is following check: {result.get('is_following')}")
    else:
        print(f"❌ Is following check failed: {response.text}")
    
    # Get User 2's followers
    response = requests.get(f"{BASE_URL}/users/{user2_id}/followers")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ User 2 has {len(result.get('followers', []))} followers")
    else:
        print(f"❌ Get followers failed: {response.text}")
    
    # Test blog creation and likes
    print("\n3. Testing blog and like functionality...")
    
    # User 2 creates a blog post
    blog_data = {
        "title": "My First Blog Post",
        "content": "<p>This is my first blog post about social features!</p>",
        "excerpt": "A blog post about social features",
        "is_published": True,
        "tags": ["social", "features", "blog"]
    }
    
    response = requests.post(f"{BASE_URL}/blogs", json=blog_data, headers=headers2)
    if response.status_code == 201:
        blog_result = response.json()
        blog_id = blog_result.get('blog_id')
        print(f"✅ Blog created: ID {blog_id}")
    else:
        print(f"❌ Blog creation failed: {response.text}")
        return
    
    # User 1 likes the blog post
    response = requests.post(f"{BASE_URL}/blogs/{blog_id}/like", headers=headers1)
    if response.status_code == 200:
        print("✅ Blog liked successfully")
    else:
        print(f"❌ Blog like failed: {response.text}")
    
    # Check if User 1 liked the blog
    response = requests.get(f"{BASE_URL}/blogs/{blog_id}/is-liked", headers=headers1)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Is blog liked: {result.get('is_liked')}")
    else:
        print(f"❌ Is blog liked check failed: {response.text}")
    
    # Test comments
    print("\n4. Testing comments functionality...")
    
    # User 1 adds a comment
    comment_data = {
        "content": "Great blog post! Very informative."
    }
    
    response = requests.post(f"{BASE_URL}/blogs/{blog_id}/comments", json=comment_data, headers=headers1)
    if response.status_code == 201:
        comment_result = response.json()
        comment_id = comment_result.get('comment_id')
        print(f"✅ Comment added: ID {comment_id}")
    else:
        print(f"❌ Comment failed: {response.text}")
        return
    
    # User 2 replies to the comment
    reply_data = {
        "content": "Thank you for reading!",
        "parent_id": comment_id
    }
    
    response = requests.post(f"{BASE_URL}/blogs/{blog_id}/comments", json=reply_data, headers=headers2)
    if response.status_code == 201:
        reply_result = response.json()
        reply_id = reply_result.get('comment_id')
        print(f"✅ Reply added: ID {reply_id}")
    else:
        print(f"❌ Reply failed: {response.text}")
    
    # Get blog comments
    response = requests.get(f"{BASE_URL}/blogs/{blog_id}/comments")
    if response.status_code == 200:
        result = response.json()
        comments = result.get('comments', [])
        print(f"✅ Blog has {len(comments)} top-level comments")
        
        if comments:
            replies = comments[0].get('replies', [])
            print(f"✅ First comment has {len(replies)} replies")
    else:
        print(f"❌ Get comments failed: {response.text}")
    
    # Test comment likes
    response = requests.post(f"{BASE_URL}/comments/{comment_id}/like", headers=headers2)
    if response.status_code == 200:
        print("✅ Comment liked successfully")
    else:
        print(f"❌ Comment like failed: {response.text}")
    
    # Test notifications
    print("\n5. Testing notifications...")
    
    # Get notifications for User 2 (should have follow and comment notifications)
    response = requests.get(f"{BASE_URL}/notifications", headers=headers2)
    if response.status_code == 200:
        result = response.json()
        notifications = result.get('notifications', [])
        print(f"✅ User 2 has {len(notifications)} notifications")
        
        for notif in notifications[:3]:  # Show first 3
            print(f"   - {notif.get('title')}: {notif.get('message')}")
    else:
        print(f"❌ Get notifications failed: {response.text}")
    
    # Test user profile with social stats
    print("\n6. Testing user profile with social stats...")
    
    response = requests.get(f"{BASE_URL}/users/{user2_id}/profile")
    if response.status_code == 200:
        result = response.json()
        profile = result.get('profile', {})
        social_stats = profile.get('social_stats', {})
        
        print(f"✅ User 2 profile:")
        print(f"   - Name: {profile.get('first_name')} {profile.get('last_name')}")
        print(f"   - Followers: {social_stats.get('followers_count', 0)}")
        print(f"   - Following: {social_stats.get('following_count', 0)}")
        print(f"   - Blogs: {social_stats.get('blogs_count', 0)}")
        print(f"   - Total likes received: {social_stats.get('total_likes_received', 0)}")
        print(f"   - Total views: {social_stats.get('total_views', 0)}")
    else:
        print(f"❌ Get user profile failed: {response.text}")
    
    print("\n🎉 Social features testing completed!")

if __name__ == "__main__":
    try:
        test_social_api()
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure the backend server is running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Test error: {e}")
