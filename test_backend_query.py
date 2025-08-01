import sqlite3

# Connect to database
conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

try:
    # Test the exact query from the backend
    query = '''
        SELECT 
            u.id,
            u.email,
            cp.company_name,
            cp.industry,
            cp.company_size,
            cp.location,
            cp.website,
            cp.company_description,
            cp.logo_url,
            cp.is_approved,
            cp.created_at,
            COUNT(jp.id) as job_count
        FROM users u
        JOIN company_profiles cp ON u.id = cp.user_id
        LEFT JOIN job_postings jp ON u.id = jp.user_id AND jp.is_active = 1
        WHERE u.user_type = 'company' AND u.is_active = 1 AND cp.is_approved = 1
        GROUP BY u.id
        ORDER BY cp.company_name ASC
        LIMIT 12 OFFSET 0
    '''
    
    cursor.execute(query)
    companies = cursor.fetchall()
    
    print(f"Query returned {len(companies)} companies:")
    for company in companies:
        print(f"  ID: {company[0]}, Email: {company[1]}, Name: {company[2]}, Industry: {company[3]}")
        print(f"     Size: {company[4]}, Location: {company[5]}, Jobs: {company[11]}")
        
except Exception as e:
    print(f"Error running query: {e}")
    import traceback
    print(traceback.format_exc())
finally:
    conn.close()
