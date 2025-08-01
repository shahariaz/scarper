#!/usr/bin/env python3
"""
Script to check database contents
"""
import sqlite3

def check_database():
    conn = sqlite3.connect('jobs.db')
    cursor = conn.cursor()
    
    print("=== ALL TABLES ===")
    cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
    tables = cursor.fetchall()
    print(f"Total tables: {len(tables)}")
    for table in tables:
        print(f"- {table[0]}")
    
    print("\n=== JOBS TABLE (OLD) ===")
    cursor.execute('SELECT id, title, company, type FROM jobs ORDER BY id DESC LIMIT 5')
    jobs = cursor.fetchall()
    print(f"Recent jobs: {len(jobs)}")
    for row in jobs:
        print(f"ID: {row[0]}, Title: {row[1]}, Company: {row[2]}, Type: {row[3]}")
    
    print("\n=== JOB POSTINGS TABLE (NEW) ===")
    try:
        cursor.execute('SELECT id, title, company, created_by_type, status FROM job_postings ORDER BY id DESC LIMIT 10')
        job_postings = cursor.fetchall()
        print(f"Recent job postings: {len(job_postings)}")
        for row in job_postings:
            print(f"ID: {row[0]}, Title: {row[1]}, Company: {row[2]}, Created by: {row[3]}, Status: {row[4]}")
    except sqlite3.OperationalError as e:
        print(f"Table doesn't exist: {e}")
    
    print("\n=== USERS TABLE ===")
    cursor.execute('SELECT id, email, user_type FROM users ORDER BY id DESC')
    users = cursor.fetchall()
    print(f"Total users: {len(users)}")
    for row in users:
        print(f"ID: {row[0]}, Email: {row[1]}, Type: {row[2]}")
    
    conn.close()

if __name__ == "__main__":
    check_database()
