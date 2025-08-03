"""
Test backend messaging API
"""

import requests
import json

# Backend URL
BASE_URL = "http://localhost:5000/api/auth"

def test_messaging_api():
    print("Testing backend messaging API...")
    
    # First, let's login to get a token
    login_data = {
        "email": "admin@jobportal.com",
        "password": "admin123"
    }
    
    print("1. Testing login...")
    login_response = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        if login_result.get('success'):
            token = login_result['access_token']
            print("✓ Login successful")
        else:
            print("❌ Login failed:", login_result.get('message'))
            return
    else:
        print(f"❌ Login request failed with status {login_response.status_code}")
        return
    
    # Headers with auth token
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test getting conversations
    print("\n2. Testing get conversations...")
    conv_response = requests.get(f"{BASE_URL}/conversations", headers=headers)
    
    if conv_response.status_code == 200:
        conv_result = conv_response.json()
        print(f"✓ Got {len(conv_result.get('conversations', []))} conversations")
    else:
        print(f"❌ Get conversations failed with status {conv_response.status_code}")
        print(conv_response.text)
    
    # Test creating conversation (with user ID 9 - admin@gmail.com)
    print("\n3. Testing create conversation...")
    create_conv_data = {
        "other_user_id": 9
    }
    
    create_response = requests.post(f"{BASE_URL}/conversations", json=create_conv_data, headers=headers)
    
    if create_response.status_code == 200:
        create_result = create_response.json()
        if create_result.get('success'):
            conversation_id = create_result['conversation_id']
            print(f"✓ Conversation created/found: ID {conversation_id}")
        else:
            print("❌ Create conversation failed:", create_result.get('message'))
            return
    else:
        print(f"❌ Create conversation failed with status {create_response.status_code}")
        print(create_response.text)
        return
    
    # Test sending message
    print("\n4. Testing send message...")
    message_data = {
        "content": "Hello! This is a test message from the API.",
        "message_type": "text"
    }
    
    message_response = requests.post(f"{BASE_URL}/conversations/{conversation_id}/messages", 
                                   json=message_data, headers=headers)
    
    if message_response.status_code == 201:
        message_result = message_response.json()
        if message_result.get('success'):
            print("✓ Message sent successfully")
        else:
            print("❌ Send message failed:", message_result.get('message'))
    else:
        print(f"❌ Send message failed with status {message_response.status_code}")
        print(message_response.text)
    
    # Test getting messages
    print("\n5. Testing get messages...")
    get_messages_response = requests.get(f"{BASE_URL}/conversations/{conversation_id}/messages", 
                                       headers=headers)
    
    if get_messages_response.status_code == 200:
        messages_result = get_messages_response.json()
        if messages_result.get('success'):
            print(f"✓ Got {len(messages_result.get('messages', []))} messages")
        else:
            print("❌ Get messages failed:", messages_result.get('message'))
    else:
        print(f"❌ Get messages failed with status {get_messages_response.status_code}")
        print(get_messages_response.text)
    
    # Test unread counts
    print("\n6. Testing unread counts...")
    unread_response = requests.get(f"{BASE_URL}/messages/unread-counts", headers=headers)
    
    if unread_response.status_code == 200:
        unread_result = unread_response.json()
        if unread_result.get('success'):
            total_unread = unread_result.get('total_unread', 0)
            print(f"✓ Total unread messages: {total_unread}")
        else:
            print("❌ Get unread counts failed:", unread_result.get('message'))
    else:
        print(f"❌ Get unread counts failed with status {unread_response.status_code}")
        print(unread_response.text)
    
    print("\n✅ All messaging API tests completed!")

if __name__ == "__main__":
    try:
        test_messaging_api()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Make sure it's running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
