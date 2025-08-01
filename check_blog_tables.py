import sqlite3

conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%blog%'")
tables = cursor.fetchall()
print('Blog tables:', tables)

if tables:
    for table in tables:
        print(f'\nTable: {table[0]}')
        cursor.execute(f'PRAGMA table_info({table[0]})')
        columns = cursor.fetchall()
        for col in columns:
            print(f'  {col[1]} ({col[2]})')
else:
    print('No blog tables found')

conn.close()
