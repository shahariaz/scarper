import sqlite3

# Connect to database
conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

try:
    # Check users table structure
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    print("Users table columns:")
    for column in columns:
        print(f"  {column[1]} ({column[2]})")
    
    # Check sample company users with correct column names
    cursor.execute("SELECT * FROM users WHERE user_type = 'company' LIMIT 3")
    companies = cursor.fetchall()
    print(f"\nSample company records:")
    for company in companies:
        print(f"  {company}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
