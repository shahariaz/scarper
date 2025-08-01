import sqlite3

# Connect to database
conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

# Check if users table exists and has company users
try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if cursor.fetchone():
        print("Users table exists")
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE user_type = 'company'")
        company_count = cursor.fetchone()[0]
        print(f"Company users: {company_count}")
        
        if company_count > 0:
            cursor.execute("SELECT id, email, company_name, user_type, is_approved FROM users WHERE user_type = 'company' LIMIT 5")
            companies = cursor.fetchall()
            print("Sample companies:")
            for company in companies:
                print(f"  ID: {company[0]}, Email: {company[1]}, Name: {company[2]}, Type: {company[3]}, Approved: {company[4]}")
        else:
            print("No company users found")
    else:
        print("Users table does not exist")
        
    # Check all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f"Available tables: {[table[0] for table in tables]}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
