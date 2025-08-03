"""
Simplified Messaging System - Working Version
"""

import sqlite3
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class MessagingService:
    """Simplified messaging service for testing"""
    
    def __init__(self, db_path: str = 'jobs.db'):
        self.db_path = db_path
        self.init_messaging_tables()
    
    def init_messaging_tables(self):
        """Initialize messaging tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create conversations table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS conversations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        is_group BOOLEAN DEFAULT 0,
                        group_name TEXT,
                        group_description TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        metadata TEXT DEFAULT '{}'
                    )
                ''')
                
                # Create conversation participants table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS conversation_participants (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        conversation_id INTEGER,
                        user_id INTEGER,
                        role TEXT DEFAULT 'member',
                        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        left_at TIMESTAMP,
                        is_muted BOOLEAN DEFAULT 0,
                        last_read_message_id INTEGER,
                        FOREIGN KEY (conversation_id) REFERENCES conversations(id),
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        UNIQUE(conversation_id, user_id)
                    )
                ''')
                
                # Create messages table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        conversation_id INTEGER,
                        sender_id INTEGER,
                        content TEXT NOT NULL,
                        message_type TEXT DEFAULT 'text',
                        reply_to_message_id INTEGER,
                        is_edited BOOLEAN DEFAULT 0,
                        edited_at TIMESTAMP,
                        deleted_at TIMESTAMP,
                        metadata TEXT DEFAULT '{}',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (conversation_id) REFERENCES conversations(id),
                        FOREIGN KEY (sender_id) REFERENCES users(id),
                        FOREIGN KEY (reply_to_message_id) REFERENCES messages(id)
                    )
                ''')
                
                # Create message status table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS message_status (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        message_id INTEGER,
                        user_id INTEGER,
                        status TEXT DEFAULT 'sent',
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (message_id) REFERENCES messages(id),
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        UNIQUE(message_id, user_id)
                    )
                ''')
                
                conn.commit()
                logger.info("Messaging tables initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing messaging tables: {e}")
            
    def create_or_get_conversation(self, user1_id: int, user2_id: int) -> Dict[str, Any]:
        """Create or get existing conversation between two users"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if conversation already exists
                cursor.execute('''
                    SELECT c.id FROM conversations c
                    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
                    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
                    WHERE c.is_group = 0 
                    AND cp1.user_id = ? AND cp1.left_at IS NULL
                    AND cp2.user_id = ? AND cp2.left_at IS NULL
                ''', (user1_id, user2_id))
                
                existing = cursor.fetchone()
                if existing:
                    return {
                        'success': True,
                        'conversation_id': existing[0],
                        'created': False
                    }
                
                # Create new conversation
                cursor.execute('''
                    INSERT INTO conversations (is_group, metadata) 
                    VALUES (0, '{}')
                ''')
                conversation_id = cursor.lastrowid
                
                # Add participants
                cursor.execute('''
                    INSERT INTO conversation_participants (conversation_id, user_id, role)
                    VALUES (?, ?, 'member'), (?, ?, 'member')
                ''', (conversation_id, user1_id, conversation_id, user2_id))
                
                conn.commit()
                
                return {
                    'success': True,
                    'conversation_id': conversation_id,
                    'created': True
                }
                
        except Exception as e:
            logger.error(f"Error creating/getting conversation: {e}")
            return {
                'success': False,
                'message': 'Failed to create conversation'
            }
    
    def send_message(self, sender_id: int, conversation_id: int, content: str, 
                    message_type: str = 'text', reply_to: Optional[int] = None,
                    metadata: Dict = None) -> Dict[str, Any]:
        """Send a message in a conversation"""
        try:
            if metadata is None:
                metadata = {}
                
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Insert message
                cursor.execute('''
                    INSERT INTO messages 
                    (conversation_id, sender_id, content, message_type, reply_to_message_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (conversation_id, sender_id, content, message_type, reply_to, json.dumps(metadata)))
                
                message_id = cursor.lastrowid
                
                # Update conversation timestamp
                cursor.execute('''
                    UPDATE conversations 
                    SET updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                ''', (conversation_id,))
                
                # Get participants for status creation
                cursor.execute('''
                    SELECT user_id FROM conversation_participants 
                    WHERE conversation_id = ? AND left_at IS NULL
                ''', (conversation_id,))
                
                participants = [p[0] for p in cursor.fetchall()]
                
                # Create message status for all participants
                for user_id in participants:
                    status = 'read' if user_id == sender_id else 'sent'
                    cursor.execute('''
                        INSERT INTO message_status (message_id, user_id, status)
                        VALUES (?, ?, ?)
                    ''', (message_id, user_id, status))
                
                conn.commit()
                
                # Get the created message
                cursor.execute('''
                    SELECT * FROM messages WHERE id = ?
                ''', (message_id,))
                
                message_row = cursor.fetchone()
                message = {
                    'id': message_row[0],
                    'conversation_id': message_row[1],
                    'sender_id': message_row[2],
                    'content': message_row[3],
                    'message_type': message_row[4],
                    'reply_to_message_id': message_row[5],
                    'is_edited': bool(message_row[6]),
                    'edited_at': message_row[7],
                    'deleted_at': message_row[8],
                    'metadata': json.loads(message_row[9] or '{}'),
                    'created_at': message_row[10]
                }
                
                return {
                    'success': True,
                    'message': message,
                    'participants': participants
                }
                
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return {
                'success': False,
                'message': 'Failed to send message'
            }
    
    def get_user_conversations(self, user_id: int, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get conversations for a user"""
        try:
            offset = (page - 1) * limit
            
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Get conversations with last message
                cursor.execute('''
                    SELECT DISTINCT
                        c.id, c.is_group, c.group_name, c.group_description,
                        c.created_at, c.updated_at,
                        (SELECT COUNT(*) FROM messages m2 
                         JOIN message_status ms ON m2.id = ms.message_id
                         WHERE m2.conversation_id = c.id 
                         AND ms.user_id = ? AND ms.status != 'read'
                         AND m2.deleted_at IS NULL) as unread_count
                    FROM conversations c
                    JOIN conversation_participants cp ON c.id = cp.conversation_id
                    WHERE cp.user_id = ? AND cp.left_at IS NULL
                    ORDER BY c.updated_at DESC
                    LIMIT ? OFFSET ?
                ''', (user_id, user_id, limit, offset))
                
                conversations = []
                for row in cursor.fetchall():
                    conv = dict(row)
                    
                    # Get participants
                    cursor.execute('''
                        SELECT u.id, u.email, up.first_name, up.last_name
                        FROM users u
                        LEFT JOIN user_profiles up ON u.id = up.user_id
                        JOIN conversation_participants cp ON u.id = cp.user_id
                        WHERE cp.conversation_id = ? AND cp.left_at IS NULL
                    ''', (conv['id'],))
                    
                    conv['participants'] = [dict(p) for p in cursor.fetchall()]
                    
                    # Get last message
                    cursor.execute('''
                        SELECT * FROM messages 
                        WHERE conversation_id = ? AND deleted_at IS NULL
                        ORDER BY created_at DESC LIMIT 1
                    ''', (conv['id'],))
                    
                    last_msg = cursor.fetchone()
                    if last_msg:
                        conv['last_message'] = {
                            'id': last_msg[0],
                            'sender_id': last_msg[2],
                            'content': last_msg[3],
                            'created_at': last_msg[10]
                        }
                    else:
                        conv['last_message'] = None
                    
                    conversations.append(conv)
                
                return {
                    'success': True,
                    'conversations': conversations,
                    'total': len(conversations),
                    'page': page,
                    'pages': 1
                }
                
        except Exception as e:
            logger.error(f"Error getting conversations: {e}")
            return {
                'success': False,
                'message': 'Failed to get conversations'
            }
    
    def get_conversation_messages(self, conversation_id: int, user_id: int, 
                                page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Get messages from a conversation"""
        try:
            offset = (page - 1) * limit
            
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Verify user is participant
                cursor.execute('''
                    SELECT id FROM conversation_participants 
                    WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL
                ''', (conversation_id, user_id))
                
                if not cursor.fetchone():
                    return {
                        'success': False,
                        'message': 'User is not a participant in this conversation'
                    }
                
                # Get messages
                cursor.execute('''
                    SELECT * FROM messages 
                    WHERE conversation_id = ? AND deleted_at IS NULL
                    ORDER BY created_at ASC
                    LIMIT ? OFFSET ?
                ''', (conversation_id, limit, offset))
                
                messages = []
                for row in cursor.fetchall():
                    msg = {
                        'id': row[0],
                        'conversation_id': row[1],
                        'sender_id': row[2],
                        'content': row[3],
                        'message_type': row[4],
                        'reply_to_message_id': row[5],
                        'is_edited': bool(row[6]),
                        'created_at': row[10],
                        'is_read': True  # Simplified for testing
                    }
                    messages.append(msg)
                
                return {
                    'success': True,
                    'messages': messages,
                    'total': len(messages),
                    'page': page,
                    'pages': 1
                }
                
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            return {
                'success': False,
                'message': 'Failed to get messages'
            }
    
    def mark_messages_as_read(self, conversation_id: int, user_id: int, 
                            up_to_message_id: Optional[int] = None) -> Dict[str, Any]:
        """Mark messages as read"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                if up_to_message_id:
                    cursor.execute('''
                        UPDATE message_status 
                        SET status = 'read', timestamp = CURRENT_TIMESTAMP
                        WHERE user_id = ? AND message_id <= ?
                        AND message_id IN (
                            SELECT id FROM messages WHERE conversation_id = ?
                        )
                    ''', (user_id, up_to_message_id, conversation_id))
                else:
                    cursor.execute('''
                        UPDATE message_status 
                        SET status = 'read', timestamp = CURRENT_TIMESTAMP
                        WHERE user_id = ? AND message_id IN (
                            SELECT id FROM messages WHERE conversation_id = ?
                        )
                    ''', (user_id, conversation_id))
                
                marked_count = cursor.rowcount
                conn.commit()
                
                return {
                    'success': True,
                    'marked_count': marked_count
                }
                
        except Exception as e:
            logger.error(f"Error marking messages as read: {e}")
            return {
                'success': False,
                'message': 'Failed to mark messages as read'
            }
    
    def get_unread_counts(self, user_id: int) -> Dict[str, Any]:
        """Get unread message counts"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get total unread count
                cursor.execute('''
                    SELECT COUNT(*) FROM message_status ms
                    JOIN messages m ON ms.message_id = m.id
                    WHERE ms.user_id = ? AND ms.status != 'read' 
                    AND m.deleted_at IS NULL
                ''', (user_id,))
                
                total_unread = cursor.fetchone()[0]
                
                # Get unread by conversation
                cursor.execute('''
                    SELECT m.conversation_id, COUNT(*) FROM message_status ms
                    JOIN messages m ON ms.message_id = m.id
                    WHERE ms.user_id = ? AND ms.status != 'read' 
                    AND m.deleted_at IS NULL
                    GROUP BY m.conversation_id
                ''', (user_id,))
                
                conversations = dict(cursor.fetchall())
                
                return {
                    'success': True,
                    'total_unread': total_unread,
                    'conversations': conversations
                }
                
        except Exception as e:
            logger.error(f"Error getting unread counts: {e}")
            return {
                'success': False,
                'message': 'Failed to get unread counts'
            }
