#!/usr/bin/env python3
"""
WebSocket test client for real-time updates
"""
import socketio
import time
import threading

# Create a Socket.IO client
sio = socketio.Client()

@sio.event
def connect():
    print('Connected to server')
    # Join a blog room for testing
    sio.emit('join_blog', {'blog_id': 1})

@sio.event
def disconnect():
    print('Disconnected from server')

@sio.event
def connected(data):
    print(f'Server says: {data["message"]}')

@sio.event
def joined_blog(data):
    print(f'Joined blog room: {data["blog_id"]}')

@sio.event
def blog_liked(data):
    print(f'🎉 Blog {data["blog_id"]} liked! New count: {data["like_count"]}')

@sio.event
def blog_unliked(data):
    print(f'💔 Blog {data["blog_id"]} unliked! New count: {data["like_count"]}')

@sio.event
def new_comment(data):
    print(f'💬 New comment on blog {data["blog_id"]}! Comment ID: {data["comment_id"]}')

@sio.event
def new_follower(data):
    print(f'👥 New follower! User {data["follower_id"]}')

def main():
    try:
        print("Connecting to WebSocket server...")
        sio.connect('http://localhost:5000')
        
        print("Connected! Waiting for real-time updates...")
        print("Press Ctrl+C to stop")
        
        # Keep the client running
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down...")
        sio.disconnect()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()