import sqlite3

conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

# Check what tables exist
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('Tables:', [t[0] for t in tables])

# Check if jobs table has data
try:
    cursor.execute('SELECT COUNT(*) FROM jobs')
    job_count = cursor.fetchone()[0]
    print(f'Total jobs in original table: {job_count}')
    
    # Check some sample data
    cursor.execute('SELECT company, COUNT(*) FROM jobs GROUP BY company LIMIT 10')
    companies = cursor.fetchall()
    print('Jobs by company:', companies)
    
    # Show some sample jobs
    cursor.execute('SELECT id, title, company, location FROM jobs LIMIT 5')
    sample_jobs = cursor.fetchall()
    print('Sample jobs:', sample_jobs)
    
except Exception as e:
    print(f'Error checking jobs table: {e}')

conn.close()
