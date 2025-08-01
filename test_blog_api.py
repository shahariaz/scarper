import requests
import json

# First login to get token
login_data = {
    "email": "testadmin@example.com",
    "password": "password123"
}

print("Logging in...")
login_response = requests.post("http://localhost:5000/api/auth/login", json=login_data)
print(f"Login status: {login_response.status_code}")

if login_response.status_code == 200:
    login_result = login_response.json()
    token = login_result['access_token']
    print("Login successful!")
    
    # Test creating a blog post
    blog_data = {
        "title": "Welcome to Our New Blog Feature!",
        "content": "<h1>Hello World!</h1><p>This is our <strong>first blog post</strong> using the new rich text editor. We can add:</p><ul><li>Bold text</li><li>Lists</li><li>Links</li><li>And much more!</li></ul><p>Stay tuned for more exciting content!</p>",
        "excerpt": "Introducing our new blog feature with rich text editing capabilities.",
        "tags": ["announcement", "blog", "new-feature"],
        "meta_description": "Welcome to our new blog feature with rich text editing capabilities.",
        "is_published": True,
        "is_featured": True
    }
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("\nCreating blog post...")
    blog_response = requests.post("http://localhost:5000/api/blogs", 
                                 json=blog_data, headers=headers)
    print(f"Blog creation status: {blog_response.status_code}")
    print(f"Response: {blog_response.text}")
    
    if blog_response.status_code == 201:
        blog_result = blog_response.json()
        print(f"Blog created successfully!")
        print(f"Blog ID: {blog_result['blog_id']}")
        print(f"Blog Slug: {blog_result['slug']}")
        
        # Test fetching the blog
        print(f"\nFetching blog by slug: {blog_result['slug']}")
        fetch_response = requests.get(f"http://localhost:5000/api/blogs/slug/{blog_result['slug']}")
        print(f"Fetch status: {fetch_response.status_code}")
        if fetch_response.status_code == 200:
            blog_data = fetch_response.json()
            print(f"Blog title: {blog_data['blog']['title']}")
            print(f"Views: {blog_data['blog']['views_count']}")
    
else:
    print(f"Login failed: {login_response.text}")
