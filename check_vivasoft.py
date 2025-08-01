import sqlite3

conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

# Check for Vivasoft jobs specifically
cursor.execute("SELECT id, title, company, location FROM jobs WHERE company LIKE '%Vivasoft%' LIMIT 5")
vivasoft_jobs = cursor.fetchall()
print('Vivasoft jobs:', vivasoft_jobs)

# Check the is_active status
cursor.execute("SELECT company, is_active, COUNT(*) FROM jobs GROUP BY company, is_active LIMIT 10")
status_check = cursor.fetchall()
print('Jobs by company and status:', status_check)

# Check if there are active jobs
cursor.execute("SELECT COUNT(*) FROM jobs WHERE is_active = 1 OR is_active IS NULL")
active_count = cursor.fetchone()[0]
print(f'Active jobs: {active_count}')

conn.close()
