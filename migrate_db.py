import sqlite3
import os

def migrate_database():
    """Migrate the existing database to include new columns."""
    db_path = "jobs.db"
    
    if not os.path.exists(db_path):
        print("Database doesn't exist yet, will be created with new schema.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get current columns
    cursor.execute("PRAGMA table_info(jobs)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    # Add missing columns
    new_columns = [
        ('requirements', 'TEXT'),
        ('responsibilities', 'TEXT'),
        ('benefits', 'TEXT'),
        ('salary_range', 'TEXT'),
        ('experience_level', 'TEXT'),
        ('skills', 'TEXT'),
        ('posted_date', 'TEXT'),
        ('deadline', 'TEXT'),
        ('is_active', 'BOOLEAN DEFAULT TRUE'),
        ('view_count', 'INTEGER DEFAULT 0')
    ]
    
    for column_name, column_type in new_columns:
        if column_name not in columns:
            try:
                cursor.execute(f'ALTER TABLE jobs ADD COLUMN {column_name} {column_type}')
                print(f"Added column: {column_name}")
            except sqlite3.Error as e:
                print(f"Error adding column {column_name}: {e}")
    
    conn.commit()
    conn.close()
    print("Database migration completed!")

if __name__ == "__main__":
    migrate_database()
