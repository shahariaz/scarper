import sqlite3

# Connect to database
conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

try:
    # Check company profiles with approval status
    cursor.execute("""
        SELECT cp.id, cp.user_id, cp.company_name, cp.is_approved, u.user_type, u.is_active
        FROM company_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE u.user_type = 'company' AND u.is_active = 1
    """)
    
    companies = cursor.fetchall()
    print("All company profiles:")
    for company in companies:
        print(f"  ID: {company[0]}, User ID: {company[1]}, Name: {company[2]}, Approved: {company[3]}, User Type: {company[4]}, User Active: {company[5]}")
    
    # Check specifically approved ones
    cursor.execute("""
        SELECT COUNT(*)
        FROM users u
        JOIN company_profiles cp ON u.id = cp.user_id
        WHERE u.user_type = 'company' AND u.is_active = 1 AND cp.is_approved = 1
    """)
    
    approved_count = cursor.fetchone()[0]
    print(f"\nApproved company profiles: {approved_count}")
    
    # Check which ones are approved
    cursor.execute("""
        SELECT cp.company_name, cp.is_approved
        FROM users u
        JOIN company_profiles cp ON u.id = cp.user_id
        WHERE u.user_type = 'company' AND u.is_active = 1 AND cp.is_approved = 1
    """)
    
    approved_companies = cursor.fetchall()
    print(f"Approved companies:")
    for company in approved_companies:
        print(f"  {company[0]} (Approved: {company[1]})")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
