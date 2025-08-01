import sqlite3

conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

# Check all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]
print("Tables:", tables)

# Check jobs table structure
cursor.execute("PRAGMA table_info(jobs)")
columns = cursor.fetchall()
print("\nJobs table columns:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# Check job_postings table if it exists
if 'job_postings' in tables:
    cursor.execute("SELECT COUNT(*) FROM job_postings")
    count = cursor.fetchone()[0]
    print(f"\nJob_postings table has {count} entries")

conn.close()
