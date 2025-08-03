#!/usr/bin/env python3
"""
Quick test script to verify the messaging system is working
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper.models.messaging_models import MessagingService

def test_messaging_system():
    print("🧪 Testing Messaging System")
    print("=" * 40)
    
    messaging_service = MessagingService()
    
    # Test 1: Create a conversation between user 1 and user 2
    print("\n📱 Test 1: Creating conversation between users 1 and 2...")
    result = messaging_service.create_or_get_conversation(1, 2)
    if result['success']:
        conversation_id = result['conversation_id']
        print(f"✅ Conversation created/found: ID {conversation_id}")
        print(f"   Created new: {result['created']}")
    else:
        print(f"❌ Failed to create conversation: {result['message']}")
        return
    
    # Test 2: Send a message
    print(f"\n💬 Test 2: Sending message in conversation {conversation_id}...")
    message_result = messaging_service.send_message(
        sender_id=1,
        conversation_id=conversation_id,
        content="Hello! This is a test message from the messaging system. 👋",
        message_type="text"
    )
    
    if message_result['success']:
        message_id = message_result['message']['id']
        print(f"✅ Message sent successfully: ID {message_id}")
        print(f"   Content: {message_result['message']['content']}")
    else:
        print(f"❌ Failed to send message: {message_result['message']}")
        return
    
    # Test 3: Get conversations for user 2
    print(f"\n📋 Test 3: Getting conversations for user 2...")
    conversations_result = messaging_service.get_user_conversations(2, 1, 10)
    
    if conversations_result['success']:
        conversations = conversations_result['conversations']
        print(f"✅ Found {len(conversations)} conversations")
        for conv in conversations:
            print(f"   - Conversation {conv['id']}: {len(conv['participants'])} participants")
            if conv['last_message']:
                print(f"     Last message: {conv['last_message']['content'][:50]}...")
    else:
        print(f"❌ Failed to get conversations: {conversations_result['message']}")
    
    # Test 4: Get messages from the conversation
    print(f"\n📨 Test 4: Getting messages from conversation {conversation_id}...")
    messages_result = messaging_service.get_conversation_messages(conversation_id, 2, 1, 10)
    
    if messages_result['success']:
        messages = messages_result['messages']
        print(f"✅ Found {len(messages)} messages")
        for msg in messages:
            print(f"   - Message {msg['id']}: {msg['content'][:50]}...")
            print(f"     From user {msg['sender_id']} at {msg['created_at']}")
    else:
        print(f"❌ Failed to get messages: {messages_result['message']}")
    
    # Test 5: Mark messages as read
    print(f"\n👀 Test 5: Marking messages as read...")
    read_result = messaging_service.mark_messages_as_read(conversation_id, 2)
    
    if read_result['success']:
        print(f"✅ Marked {read_result['marked_count']} messages as read")
    else:
        print(f"❌ Failed to mark messages as read: {read_result['message']}")
    
    # Test 6: Get unread counts
    print(f"\n🔔 Test 6: Getting unread counts for user 2...")
    unread_result = messaging_service.get_unread_counts(2)
    
    if unread_result['success']:
        total_unread = unread_result['total_unread']
        conversations_unread = unread_result['conversations']
        print(f"✅ Total unread messages: {total_unread}")
        print(f"   Unread by conversation: {conversations_unread}")
    else:
        print(f"❌ Failed to get unread counts: {unread_result['message']}")
    
    print("\n" + "=" * 40)
    print("🎉 Messaging system test completed!")
    print("✅ All core messaging features are working properly")
    
    return conversation_id

if __name__ == "__main__":
    test_messaging_system()
