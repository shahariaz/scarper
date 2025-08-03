#!/usr/bin/env python3

import sqlite3
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_messaging_tables():
    """Create messaging tables for the social platform"""
    try:
        conn = sqlite3.connect('jobs.db')
        cursor = conn.cursor()
        
        logger.info("Creating messaging tables...")
        
        # Create conversations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                participant1_id INTEGER NOT NULL,
                participant2_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_message_id INTEGER,
                participant1_unread_count INTEGER DEFAULT 0,
                participant2_unread_count INTEGER DEFAULT 0,
                FOREIGN KEY (participant1_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (participant2_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(participant1_id, participant2_id)
            )
        ''')
        
        # Create messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                message_type TEXT DEFAULT 'text', -- text, image, file
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read)')
        
        # Create trigger to update conversation last_message_id and updated_at
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_conversation_on_message_insert
            AFTER INSERT ON messages
            BEGIN
                UPDATE conversations 
                SET 
                    last_message_id = NEW.id,
                    updated_at = CURRENT_TIMESTAMP,
                    participant1_unread_count = CASE 
                        WHEN NEW.receiver_id = participant1_id THEN participant1_unread_count + 1 
                        ELSE participant1_unread_count 
                    END,
                    participant2_unread_count = CASE 
                        WHEN NEW.receiver_id = participant2_id THEN participant2_unread_count + 1 
                        ELSE participant2_unread_count 
                    END
                WHERE id = NEW.conversation_id;
            END
        ''')
        
        # Create trigger to update conversation unread counts when message is marked as read
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_conversation_on_message_read
            AFTER UPDATE OF is_read ON messages
            WHEN OLD.is_read = 0 AND NEW.is_read = 1
            BEGIN
                UPDATE conversations 
                SET 
                    participant1_unread_count = CASE 
                        WHEN NEW.receiver_id = participant1_id AND participant1_unread_count > 0 
                        THEN participant1_unread_count - 1 
                        ELSE participant1_unread_count 
                    END,
                    participant2_unread_count = CASE 
                        WHEN NEW.receiver_id = participant2_id AND participant2_unread_count > 0 
                        THEN participant2_unread_count - 1 
                        ELSE participant2_unread_count 
                    END
                WHERE id = NEW.conversation_id;
            END
        ''')
        
        conn.commit()
        logger.info("✅ Messaging tables created successfully!")
        
        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('conversations', 'messages')")
        tables = cursor.fetchall()
        logger.info(f"Created tables: {[table[0] for table in tables]}")
        
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creating messaging tables: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_messaging_tables()
    if success:
        print("🎉 Messaging database setup completed!")
    else:
        print("❌ Failed to set up messaging database")
