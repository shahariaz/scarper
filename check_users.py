import sqlite3

conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

# Check admin accounts
cursor.execute('SELECT id, email, user_type FROM users WHERE user_type = "admin"')
admins = cursor.fetchall()
print(f'Admin accounts: {admins}')

# Check all users
cursor.execute('SELECT id, email, user_type FROM users LIMIT 5')
users = cursor.fetchall()
print(f'All users (first 5): {users}')

conn.close()
