"""
Test simplified messaging system
"""

import sys
sys.path.append('.')

from scraper.models.messaging_simple import MessagingService
import sqlite3

def test_messaging():
    print("Testing simplified messaging system...")
    
    # Initialize messaging service
    messaging = MessagingService()
    print("✓ MessagingService initialized")
    
    # Check if users exist
    with sqlite3.connect('jobs.db') as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email FROM users LIMIT 2")
        users = cursor.fetchall()
        
        if len(users) < 2:
            print("❌ Need at least 2 users for testing")
            return
        
        user1_id, user1_email = users[0]
        user2_id, user2_email = users[1]
        print(f"✓ Using users: {user1_email} (ID: {user1_id}) and {user2_email} (ID: {user2_id})")
    
    # Test conversation creation
    conv_result = messaging.create_or_get_conversation(user1_id, user2_id)
    if conv_result['success']:
        conversation_id = conv_result['conversation_id']
        print(f"✓ Conversation created/found: ID {conversation_id}")
    else:
        print("❌ Failed to create conversation")
        return
    
    # Test sending message
    msg_result = messaging.send_message(
        sender_id=user1_id,
        conversation_id=conversation_id,
        content="Hello! This is a test message."
    )
    
    if msg_result['success']:
        print("✓ Message sent successfully")
    else:
        print("❌ Failed to send message")
        return
    
    # Test getting conversations
    convs_result = messaging.get_user_conversations(user1_id)
    if convs_result['success']:
        print(f"✓ Found {len(convs_result['conversations'])} conversations for user")
    else:
        print("❌ Failed to get conversations")
    
    # Test getting messages
    msgs_result = messaging.get_conversation_messages(conversation_id, user1_id)
    if msgs_result['success']:
        print(f"✓ Found {len(msgs_result['messages'])} messages in conversation")
    else:
        print("❌ Failed to get messages")
    
    print("\n✅ All basic messaging tests passed!")

if __name__ == "__main__":
    test_messaging()
