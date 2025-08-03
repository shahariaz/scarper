import sqlite3
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

class MessagingService:
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def get_or_create_conversation(self, user1_id: int, user2_id: int) -> Dict[str, Any]:
        """Get existing conversation or create a new one between two users"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Ensure consistent ordering (smaller ID first)
            participant1_id = min(user1_id, user2_id)
            participant2_id = max(user1_id, user2_id)
            
            # Check if conversation exists
            cursor.execute('''
                SELECT id, participant1_id, participant2_id, created_at, updated_at,
                       participant1_unread_count, participant2_unread_count, last_message_id
                FROM conversations 
                WHERE participant1_id = ? AND participant2_id = ?
            ''', (participant1_id, participant2_id))
            
            conversation = cursor.fetchone()
            
            if conversation:
                # Get last message details
                last_message = None
                if conversation[7]:  # last_message_id
                    cursor.execute('''
                        SELECT content, sender_id, created_at 
                        FROM messages 
                        WHERE id = ?
                    ''', (conversation[7],))
                    msg = cursor.fetchone()
                    if msg:
                        last_message = {
                            'content': msg[0],
                            'sender_id': msg[1],
                            'created_at': msg[2]
                        }
                
                conn.close()
                return {
                    'success': True,
                    'conversation': {
                        'id': conversation[0],
                        'participant1_id': conversation[1],
                        'participant2_id': conversation[2],
                        'created_at': conversation[3],
                        'updated_at': conversation[4],
                        'participant1_unread_count': conversation[5],
                        'participant2_unread_count': conversation[6],
                        'last_message_id': conversation[7],
                        'last_message': last_message
                    }
                }
            else:
                # Create new conversation
                cursor.execute('''
                    INSERT INTO conversations (participant1_id, participant2_id)
                    VALUES (?, ?)
                ''', (participant1_id, participant2_id))
                
                conversation_id = cursor.lastrowid
                conn.commit()
                conn.close()
                
                return {
                    'success': True,
                    'conversation': {
                        'id': conversation_id,
                        'participant1_id': participant1_id,
                        'participant2_id': participant2_id,
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat(),
                        'participant1_unread_count': 0,
                        'participant2_unread_count': 0,
                        'last_message_id': None,
                        'last_message': None
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting/creating conversation: {e}")
            return {'success': False, 'message': 'Failed to get conversation'}
    
    def send_message(self, sender_id: int, receiver_id: int, content: str, message_type: str = 'text') -> Dict[str, Any]:
        """Send a message between two users"""
        try:
            if not content.strip():
                return {'success': False, 'message': 'Message content cannot be empty'}
            
            # Get or create conversation
            conversation_result = self.get_or_create_conversation(sender_id, receiver_id)
            if not conversation_result['success']:
                return conversation_result
            
            conversation_id = conversation_result['conversation']['id']
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Insert message
            cursor.execute('''
                INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type)
                VALUES (?, ?, ?, ?, ?)
            ''', (conversation_id, sender_id, receiver_id, content.strip(), message_type))
            
            message_id = cursor.lastrowid
            
            # Get the complete message data
            cursor.execute('''
                SELECT m.id, m.conversation_id, m.sender_id, m.receiver_id, m.content, 
                       m.message_type, m.is_read, m.created_at, m.updated_at,
                       u1.first_name as sender_first_name, u1.last_name as sender_last_name,
                       u1.email as sender_email, up1.avatar_url as sender_avatar,
                       u2.first_name as receiver_first_name, u2.last_name as receiver_last_name,
                       u2.email as receiver_email, up2.avatar_url as receiver_avatar
                FROM messages m
                JOIN users u1 ON m.sender_id = u1.id
                LEFT JOIN user_profiles up1 ON u1.id = up1.user_id
                JOIN users u2 ON m.receiver_id = u2.id
                LEFT JOIN user_profiles up2 ON u2.id = up2.user_id
                WHERE m.id = ?
            ''', (message_id,))
            
            message_data = cursor.fetchone()
            
            conn.commit()
            conn.close()
            
            if message_data:
                return {
                    'success': True,
                    'message': 'Message sent successfully',
                    'data': {
                        'id': message_data[0],
                        'conversation_id': message_data[1],
                        'sender_id': message_data[2],
                        'receiver_id': message_data[3],
                        'content': message_data[4],
                        'message_type': message_data[5],
                        'is_read': bool(message_data[6]),
                        'created_at': message_data[7],
                        'updated_at': message_data[8],
                        'sender': {
                            'id': message_data[2],
                            'first_name': message_data[9],
                            'last_name': message_data[10],
                            'email': message_data[11],
                            'avatar_url': message_data[12]
                        },
                        'receiver': {
                            'id': message_data[3],
                            'first_name': message_data[13],
                            'last_name': message_data[14],
                            'email': message_data[15],
                            'avatar_url': message_data[16]
                        }
                    }
                }
            else:
                return {'success': False, 'message': 'Failed to fetch message data'}
                
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return {'success': False, 'message': 'Failed to send message'}
    
    def get_conversation_messages(self, conversation_id: int, user_id: int, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get messages from a conversation"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Verify user is part of this conversation
            cursor.execute('''
                SELECT participant1_id, participant2_id 
                FROM conversations 
                WHERE id = ?
            ''', (conversation_id,))
            
            conv = cursor.fetchone()
            if not conv or (user_id != conv[0] and user_id != conv[1]):
                return {'success': False, 'message': 'Conversation not found or access denied'}
            
            # Get messages with sender/receiver info
            cursor.execute('''
                SELECT m.id, m.conversation_id, m.sender_id, m.receiver_id, m.content, 
                       m.message_type, m.is_read, m.created_at, m.updated_at,
                       u1.first_name as sender_first_name, u1.last_name as sender_last_name,
                       u1.email as sender_email, up1.avatar_url as sender_avatar,
                       u2.first_name as receiver_first_name, u2.last_name as receiver_last_name,
                       u2.email as receiver_email, up2.avatar_url as receiver_avatar
                FROM messages m
                JOIN users u1 ON m.sender_id = u1.id
                LEFT JOIN user_profiles up1 ON u1.id = up1.user_id
                JOIN users u2 ON m.receiver_id = u2.id
                LEFT JOIN user_profiles up2 ON u2.id = up2.user_id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            ''', (conversation_id, limit, offset))
            
            messages = cursor.fetchall()
            
            # Format messages
            formatted_messages = []
            for msg in messages:
                formatted_messages.append({
                    'id': msg[0],
                    'conversation_id': msg[1],
                    'sender_id': msg[2],
                    'receiver_id': msg[3],
                    'content': msg[4],
                    'message_type': msg[5],
                    'is_read': bool(msg[6]),
                    'created_at': msg[7],
                    'updated_at': msg[8],
                    'sender': {
                        'id': msg[2],
                        'first_name': msg[9],
                        'last_name': msg[10],
                        'email': msg[11],
                        'avatar_url': msg[12]
                    },
                    'receiver': {
                        'id': msg[3],
                        'first_name': msg[13],
                        'last_name': msg[14],
                        'email': msg[15],
                        'avatar_url': msg[16]
                    }
                })
            
            # Get total count
            cursor.execute('SELECT COUNT(*) FROM messages WHERE conversation_id = ?', (conversation_id,))
            total_count = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'success': True,
                'messages': formatted_messages,
                'total_count': total_count,
                'has_more': offset + len(messages) < total_count
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation messages: {e}")
            return {'success': False, 'message': 'Failed to get messages'}
    
    def get_user_conversations(self, user_id: int, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """Get all conversations for a user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get conversations with other participant info and last message
            cursor.execute('''
                SELECT c.id, c.participant1_id, c.participant2_id, c.created_at, c.updated_at,
                       c.participant1_unread_count, c.participant2_unread_count, c.last_message_id,
                       CASE 
                           WHEN c.participant1_id = ? THEN c.participant2_id 
                           ELSE c.participant1_id 
                       END as other_user_id,
                       u.first_name, u.last_name, u.email, up.avatar_url,
                       m.content as last_message_content, m.sender_id as last_message_sender_id, 
                       m.created_at as last_message_time
                FROM conversations c
                JOIN users u ON (
                    CASE 
                        WHEN c.participant1_id = ? THEN c.participant2_id 
                        ELSE c.participant1_id 
                    END
                ) = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN messages m ON c.last_message_id = m.id
                WHERE c.participant1_id = ? OR c.participant2_id = ?
                ORDER BY c.updated_at DESC
                LIMIT ? OFFSET ?
            ''', (user_id, user_id, user_id, user_id, limit, offset))
            
            conversations = cursor.fetchall()
            
            # Format conversations
            formatted_conversations = []
            for conv in conversations:
                unread_count = conv[5] if conv[1] == user_id else conv[6]  # participant1 vs participant2
                
                formatted_conversations.append({
                    'id': conv[0],
                    'participant1_id': conv[1],
                    'participant2_id': conv[2],
                    'created_at': conv[3],
                    'updated_at': conv[4],
                    'unread_count': unread_count,
                    'other_user': {
                        'id': conv[8],
                        'first_name': conv[9],
                        'last_name': conv[10],
                        'email': conv[11],
                        'avatar_url': conv[12],
                        'display_name': f"{conv[9]} {conv[10]}" if conv[9] and conv[10] else conv[11]
                    },
                    'last_message': {
                        'content': conv[13],
                        'sender_id': conv[14],
                        'created_at': conv[15]
                    } if conv[13] else None
                })
            
            # Get total count
            cursor.execute('''
                SELECT COUNT(*) FROM conversations 
                WHERE participant1_id = ? OR participant2_id = ?
            ''', (user_id, user_id))
            total_count = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'success': True,
                'conversations': formatted_conversations,
                'total_count': total_count,
                'has_more': offset + len(conversations) < total_count
            }
            
        except Exception as e:
            logger.error(f"Error getting user conversations: {e}")
            return {'success': False, 'message': 'Failed to get conversations'}
    
    def mark_messages_as_read(self, conversation_id: int, user_id: int) -> Dict[str, Any]:
        """Mark all unread messages in a conversation as read for a user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Verify user is part of this conversation
            cursor.execute('''
                SELECT participant1_id, participant2_id 
                FROM conversations 
                WHERE id = ?
            ''', (conversation_id,))
            
            conv = cursor.fetchone()
            if not conv or (user_id != conv[0] and user_id != conv[1]):
                return {'success': False, 'message': 'Conversation not found or access denied'}
            
            # Mark messages as read
            cursor.execute('''
                UPDATE messages 
                SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE conversation_id = ? AND receiver_id = ? AND is_read = FALSE
            ''', (conversation_id, user_id))
            
            updated_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': f'Marked {updated_count} messages as read'
            }
            
        except Exception as e:
            logger.error(f"Error marking messages as read: {e}")
            return {'success': False, 'message': 'Failed to mark messages as read'}
    
    def get_unread_count(self, user_id: int) -> Dict[str, Any]:
        """Get total unread message count for a user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    SUM(CASE 
                        WHEN participant1_id = ? THEN participant1_unread_count 
                        ELSE participant2_unread_count 
                    END) as total_unread
                FROM conversations 
                WHERE participant1_id = ? OR participant2_id = ?
            ''', (user_id, user_id, user_id))
            
            result = cursor.fetchone()
            total_unread = result[0] if result[0] else 0
            
            conn.close()
            
            return {
                'success': True,
                'total_unread': total_unread
            }
            
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return {'success': False, 'message': 'Failed to get unread count'}
