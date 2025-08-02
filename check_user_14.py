import sqlite3

conn = sqlite3.connect('jobs.db')
c = conn.cursor()

# Check users table structure
c.execute('PRAGMA table_info(users)')
columns = c.fetchall()
print('Users table columns:')
for col in columns:
    print(f'  {col[1]} ({col[2]})')

# Check if user 14 exists
c.execute('SELECT * FROM users WHERE id = 14')
user = c.fetchone()
if user:
    print(f'\nUser 14 exists: {user}')
else:
    print('\nUser 14 does not exist')

# Check how many users we have
c.execute('SELECT COUNT(*) FROM users')
total = c.fetchone()[0]
print(f'\nTotal users in database: {total}')

# Check users around ID 14
c.execute('SELECT id, email FROM users WHERE id BETWEEN 10 AND 20')
users = c.fetchall()
print('\nUsers 10-20:')
for user in users:
    print(f'  ID {user[0]}: {user[1]}')

conn.close()
