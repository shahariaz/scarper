import sqlite3

def debug_stats():
    conn = sqlite3.connect('jobs.db')
    cursor = conn.cursor()
    
    print("=== Database Debug ===")
    
    # Check jobs table schema
    cursor.execute('PRAGMA table_info(jobs)')
    columns = cursor.fetchall()
    print('Jobs table columns:')
    for col in columns:
        print(f'  {col[1]} ({col[2]})')
    
    # Check total jobs
    cursor.execute('SELECT COUNT(*) FROM jobs')
    total = cursor.fetchone()[0]
    print(f'\nTotal jobs in table: {total}')
    
    # Check active jobs with different conditions
    cursor.execute('SELECT COUNT(*) FROM jobs WHERE is_active IS NULL')
    null_active = cursor.fetchone()[0]
    print(f'Jobs with is_active IS NULL: {null_active}')
    
    cursor.execute('SELECT COUNT(*) FROM jobs WHERE is_active = 1')
    active_1 = cursor.fetchone()[0]
    print(f'Jobs with is_active = 1: {active_1}')
    
    cursor.execute('SELECT COUNT(*) FROM jobs WHERE is_active = 1 OR is_active IS NULL')
    combined = cursor.fetchone()[0]
    print(f'Jobs with (is_active = 1 OR is_active IS NULL): {combined}')
    
    # Check companies
    cursor.execute('SELECT COUNT(DISTINCT company) FROM jobs WHERE is_active = 1 OR is_active IS NULL')
    companies = cursor.fetchone()[0]
    print(f'Distinct companies: {companies}')
    
    # Sample data
    cursor.execute('SELECT id, title, company, is_active FROM jobs LIMIT 5')
    sample = cursor.fetchall()
    print('\nSample jobs:')
    for job in sample:
        print(f'  ID: {job[0]}, Title: {job[1]}, Company: {job[2]}, Active: {job[3]}')
    
    conn.close()

if __name__ == '__main__':
    debug_stats()
