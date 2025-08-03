import sqlite3

conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%conversation%' OR name LIKE '%message%')")
tables = cursor.fetchall()
print("Messaging tables:", tables)
conn.close()
