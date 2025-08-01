import sqlite3

# Connect to database
conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

try:
    # Check all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("All tables:")
    for table in tables:
        print(f"  {table[0]}")
    
    # Check if there's a profiles table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%profile%'")
    profile_tables = cursor.fetchall()
    if profile_tables:
        print(f"\nProfile-related tables: {[t[0] for t in profile_tables]}")
        
        # Check company_profiles table structure if it exists
        for table in profile_tables:
            table_name = table[0]
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print(f"\n{table_name} table columns:")
            for column in columns:
                print(f"  {column[1]} ({column[2]})")
                
            # Check sample records
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
            records = cursor.fetchall()
            print(f"\nSample {table_name} records:")
            for record in records:
                print(f"  {record}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
