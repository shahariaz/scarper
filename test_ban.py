import sqlite3
import requests
import json

# Check current users in the database
conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

# Get first user
cursor.execute('SELECT id, email, is_banned, banned_reason FROM users WHERE user_type = "jobseeker" LIMIT 1')
user = cursor.fetchone()
if user:
    print(f'Current user: ID={user[0]}, email={user[1]}, is_banned={user[2]}, banned_reason={user[3]}')
    user_id = user[0]
    
    # Test ban API
    print(f"\nTesting ban API for user {user_id}...")
    ban_data = {
        'reason': 'Testing ban functionality'
    }
    
    try:
        response = requests.post(
            f'http://127.0.0.1:5000/api/admin/users/{user_id}/ban',
            json=ban_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f'Ban API Response Status: {response.status_code}')
        print(f'Ban API Response: {response.text}')
        
        # Check database after ban
        cursor.execute('SELECT id, email, is_banned, banned_reason FROM users WHERE id = ?', (user_id,))
        updated_user = cursor.fetchone()
        print(f'After ban: ID={updated_user[0]}, email={updated_user[1]}, is_banned={updated_user[2]}, banned_reason={updated_user[3]}')
        
    except Exception as e:
        print(f'Error testing ban API: {e}')
        
else:
    print('No users found')

conn.close()
