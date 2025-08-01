#!/usr/bin/env python3

import sqlite3

def check_company():
    conn = sqlite3.connect('jobs.db')
    cursor = conn.cursor()
    
    # Check if the company user exists
    result = cursor.execute('''
        SELECT u.id, u.email, u.user_type, cp.company_name, cp.is_approved 
        FROM users u 
        LEFT JOIN company_profiles cp ON u.id = cp.user_id 
        WHERE u.email = "shahariaz.info@gmail.com"
    ''').fetchall()
    
    print("Company search result:", result)
    
    # Check all companies
    all_companies = cursor.execute('''
        SELECT u.id, u.email, u.user_type, cp.company_name, cp.is_approved 
        FROM users u 
        LEFT JOIN company_profiles cp ON u.id = cp.user_id 
        WHERE u.user_type = "company"
    ''').fetchall()
    
    print("All companies:", all_companies)
    
    # Check all pending companies
    pending_companies = cursor.execute('''
        SELECT cp.id, cp.user_id, cp.company_name, cp.company_description, 
               cp.website, cp.industry, cp.company_size, cp.location, 
               cp.logo_url, cp.created_at, u.email, u.created_at as user_created_at
        FROM company_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.is_approved = 0
        ORDER BY cp.created_at DESC
    ''').fetchall()
    
    print("Pending companies:", pending_companies)
    
    conn.close()

if __name__ == "__main__":
    check_company()
