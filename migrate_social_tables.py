"""
Migration script to add missing columns to blog_comments table
"""
import sqlite3
import os

def migrate_blog_comments_table():
    """Add missing social features columns to blog_comments table"""
    db_path = "jobs.db"
    
    if not os.path.exists(db_path):
        print("Database doesn't exist yet.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get current columns
        cursor.execute("PRAGMA table_info(blog_comments)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Current blog_comments columns: {columns}")
        
        # Add missing columns
        missing_columns = [
            ('likes_count', 'INTEGER DEFAULT 0'),
            ('replies_count', 'INTEGER DEFAULT 0'),
            ('is_edited', 'BOOLEAN DEFAULT 0')
        ]
        
        for column_name, column_type in missing_columns:
            if column_name not in columns:
                try:
                    cursor.execute(f'ALTER TABLE blog_comments ADD COLUMN {column_name} {column_type}')
                    print(f"✅ Added column: {column_name}")
                except sqlite3.Error as e:
                    print(f"❌ Error adding column {column_name}: {e}")
        
        # Create missing indexes
        indexes_to_create = [
            'CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments (parent_id)',
            'CREATE INDEX IF NOT EXISTS idx_blog_comments_blog ON blog_comments (blog_id)',
            'CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments (user_id)'
        ]
        
        for index_sql in indexes_to_create:
            try:
                cursor.execute(index_sql)
                print(f"✅ Created index")
            except sqlite3.Error as e:
                print(f"❌ Error creating index: {e}")
        
        conn.commit()
        print("✅ Blog comments table migration completed!")
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_blog_comments_table()
