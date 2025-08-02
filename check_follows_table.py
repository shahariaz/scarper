import sqlite3

# Check user_follows table schema
conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

# Check if table exists and get schema
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_follows'")
result = cursor.fetchone()

if result:
    print("user_follows table schema:")
    print(result[0])
    
    # Check column names
    cursor.execute("PRAGMA table_info(user_follows)")
    columns = cursor.fetchall()
    print("\nColumns:")
    for col in columns:
        print(f"  {col[1]} {col[2]} {'NOT NULL' if col[3] else ''}")
else:
    print("user_follows table not found")

# Also check what the backend feed query is looking for
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_follows'")
result = cursor.fetchone()

conn.close()
