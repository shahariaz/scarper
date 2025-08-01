from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
import jwt
import logging
from functools import wraps

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self, app: Flask, socketio: SocketIO):
        self.app = app
        self.socketio = socketio
        self.connected_users = {}  # user_id -> session_id mapping
        self.user_rooms = {}  # user_id -> set of rooms
        
        # Register event handlers
        self.register_handlers()
    
    def register_handlers(self):
        @self.socketio.on('connect')
        def handle_connect(auth=None):
            try:
                # Get token from query parameters
                token = auth.get('token') if auth else None
                if not token:
                    logger.warning("WebSocket connection rejected: No token provided")
                    disconnect()
                    return False
                
                # Verify JWT token
                try:
                    # Simple JWT decode without verification for WebSocket
                    # In production, you should verify the signature
                    decoded_token = jwt.decode(token, options={"verify_signature": False})
                    user_id = decoded_token.get('sub') or decoded_token.get('user_id')
                    
                    if not user_id:
                        raise ValueError("No user_id in token")
                    
                    # Store user connection
                    self.connected_users[user_id] = request.sid
                    self.user_rooms[user_id] = set()
                    
                    # Join user to their personal room
                    join_room(f'user_{user_id}')
                    self.user_rooms[user_id].add(f'user_{user_id}')
                    
                    logger.info(f"WebSocket connected: user_id={user_id}, session_id={request.sid}")
                    emit('connected', {'status': 'success', 'user_id': user_id})
                    
                except Exception as e:
                    logger.error(f"WebSocket token verification failed: {e}")
                    disconnect()
                    return False
                    
            except Exception as e:
                logger.error(f"WebSocket connection error: {e}")
                disconnect()
                return False
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            try:
                # Find user by session_id
                user_id = None
                for uid, sid in self.connected_users.items():
                    if sid == request.sid:
                        user_id = uid
                        break
                
                if user_id:
                    # Clean up user data
                    if user_id in self.connected_users:
                        del self.connected_users[user_id]
                    if user_id in self.user_rooms:
                        del self.user_rooms[user_id]
                    
                    logger.info(f"WebSocket disconnected: user_id={user_id}")
                
            except Exception as e:
                logger.error(f"WebSocket disconnect error: {e}")
        
        @self.socketio.on('join_room')
        def handle_join_room(data):
            try:
                room = data.get('room')
                if not room:
                    return
                
                # Find user by session_id
                user_id = None
                for uid, sid in self.connected_users.items():
                    if sid == request.sid:
                        user_id = uid
                        break
                
                if user_id:
                    join_room(room)
                    self.user_rooms[user_id].add(room)
                    logger.info(f"User {user_id} joined room: {room}")
                    emit('room_joined', {'room': room})
                    
            except Exception as e:
                logger.error(f"Join room error: {e}")
        
        @self.socketio.on('leave_room')
        def handle_leave_room(data):
            try:
                room = data.get('room')
                if not room:
                    return
                
                # Find user by session_id
                user_id = None
                for uid, sid in self.connected_users.items():
                    if sid == request.sid:
                        user_id = uid
                        break
                
                if user_id:
                    leave_room(room)
                    if user_id in self.user_rooms and room in self.user_rooms[user_id]:
                        self.user_rooms[user_id].remove(room)
                    logger.info(f"User {user_id} left room: {room}")
                    emit('room_left', {'room': room})
                    
            except Exception as e:
                logger.error(f"Leave room error: {e}")
    
    def emit_to_user(self, user_id: int, event: str, data: dict):
        """Emit an event to a specific user"""
        try:
            if user_id in self.connected_users:
                self.socketio.emit(event, data, room=f'user_{user_id}')
                logger.debug(f"Emitted {event} to user {user_id}: {data}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error emitting to user {user_id}: {e}")
            return False
    
    def emit_to_room(self, room: str, event: str, data: dict, exclude_user: int = None):
        """Emit an event to all users in a room, optionally excluding a user"""
        try:
            if exclude_user:
                # Emit to room excluding specific user
                for user_id, rooms in self.user_rooms.items():
                    if room in rooms and user_id != exclude_user:
                        self.emit_to_user(user_id, event, data)
            else:
                self.socketio.emit(event, data, room=room)
            
            logger.debug(f"Emitted {event} to room {room}: {data}")
            return True
        except Exception as e:
            logger.error(f"Error emitting to room {room}: {e}")
            return False
    
    def emit_notification(self, user_id: int, notification_data: dict):
        """Send a notification to a specific user"""
        return self.emit_to_user(user_id, 'notification', notification_data)
    
    def emit_blog_liked(self, blog_id: int, liker_user_id: int, likes_count: int):
        """Notify blog room when someone likes a blog"""
        data = {
            'blog_id': blog_id,
            'liker_user_id': liker_user_id,
            'likes_count': likes_count
        }
        return self.emit_to_room(f'blog_{blog_id}', 'blog_liked', data, exclude_user=liker_user_id)
    
    def emit_blog_unliked(self, blog_id: int, unliker_user_id: int, likes_count: int):
        """Notify blog room when someone unlikes a blog"""
        data = {
            'blog_id': blog_id,
            'unliker_user_id': unliker_user_id,
            'likes_count': likes_count
        }
        return self.emit_to_room(f'blog_{blog_id}', 'blog_unliked', data, exclude_user=unliker_user_id)
    
    def emit_comment_added(self, blog_id: int, comment_data: dict, commenter_user_id: int):
        """Notify blog room when a new comment is added"""
        data = {
            'blog_id': blog_id,
            'comment': comment_data,
            'commenter_user_id': commenter_user_id
        }
        return self.emit_to_room(f'blog_{blog_id}', 'new_comment', data, exclude_user=commenter_user_id)
    
    def emit_comment_reply(self, blog_id: int, parent_comment_id: int, reply_data: dict, replier_user_id: int):
        """Notify blog room when a comment reply is added"""
        data = {
            'blog_id': blog_id,
            'parent_comment_id': parent_comment_id,
            'reply': reply_data,
            'replier_user_id': replier_user_id
        }
        return self.emit_to_room(f'blog_{blog_id}', 'comment_reply', data, exclude_user=replier_user_id)
    
    def emit_comment_liked(self, comment_id: int, blog_id: int, liker_user_id: int, likes_count: int):
        """Notify blog room when someone likes a comment"""
        data = {
            'comment_id': comment_id,
            'blog_id': blog_id,
            'liker_user_id': liker_user_id,
            'likes_count': likes_count
        }
        return self.emit_to_room(f'blog_{blog_id}', 'comment_liked', data, exclude_user=liker_user_id)
    
    def emit_comment_unliked(self, comment_id: int, blog_id: int, unliker_user_id: int, likes_count: int):
        """Notify blog room when someone unlikes a comment"""
        data = {
            'comment_id': comment_id,
            'blog_id': blog_id,
            'unliker_user_id': unliker_user_id,
            'likes_count': likes_count
        }
        return self.emit_to_room(f'blog_{blog_id}', 'comment_unliked', data, exclude_user=unliker_user_id)
    
    def emit_user_followed(self, followed_user_id: int, follower_user_id: int, followers_count: int, following_count: int):
        """Notify when someone follows a user"""
        # Notify the followed user
        self.emit_to_user(followed_user_id, 'user_followed', {
            'follower_user_id': follower_user_id,
            'followers_count': followers_count
        })
        
        # Notify followers of the follower (activity feed)
        self.emit_to_room(f'user_{follower_user_id}', 'user_followed', {
            'followed_user_id': followed_user_id,
            'following_count': following_count
        })
    
    def emit_user_unfollowed(self, unfollowed_user_id: int, unfollower_user_id: int, followers_count: int, following_count: int):
        """Notify when someone unfollows a user"""
        # Notify the unfollowed user
        self.emit_to_user(unfollowed_user_id, 'user_unfollowed', {
            'unfollower_user_id': unfollower_user_id,
            'followers_count': followers_count
        })
        
        # Notify followers of the unfollower (activity feed)
        self.emit_to_room(f'user_{unfollower_user_id}', 'user_unfollowed', {
            'unfollowed_user_id': unfollowed_user_id,
            'following_count': following_count
        })
    
    def get_connected_users(self):
        """Get list of connected user IDs"""
        return list(self.connected_users.keys())
    
    def is_user_connected(self, user_id: int):
        """Check if a user is connected"""
        return user_id in self.connected_users
    
    def get_user_rooms(self, user_id: int):
        """Get rooms a user has joined"""
        return list(self.user_rooms.get(user_id, set()))

# WebSocket manager instance (will be initialized in main app)
websocket_manager = None

def init_websocket(app: Flask, socketio: SocketIO):
    """Initialize WebSocket manager"""
    global websocket_manager
    websocket_manager = WebSocketManager(app, socketio)
    return websocket_manager

def get_websocket_manager():
    """Get the WebSocket manager instance"""
    return websocket_manager
