import sqlite3

# Connect to database
conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

try:
    # Check job_postings table structure
    cursor.execute("PRAGMA table_info(job_postings)")
    columns = cursor.fetchall()
    print("job_postings table columns:")
    for column in columns:
        print(f"  {column[1]} ({column[2]})")
    
    # Sample records
    cursor.execute("SELECT * FROM job_postings LIMIT 3")
    jobs = cursor.fetchall()
    print(f"\nSample job_postings records:")
    for job in jobs:
        print(f"  {job}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
