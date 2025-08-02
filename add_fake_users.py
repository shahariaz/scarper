#!/usr/bin/env python3
"""
Script to add 200 fake users to the database for testing infinite scroll
"""

import sqlite3
import random
from datetime import datetime, timedelta
import hashlib
import uuid

# Fake data for generating users
first_names = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Jessica', 'Daniel', 'Ashley',
    'Matthew', 'Amanda', 'James', 'Jennifer', 'Robert', 'Lisa', 'William', 'Michelle', 'Richard', 'Karen',
    'Joseph', 'Nancy', 'Thomas', 'Betty', 'Charles', 'Helen', 'Christopher', 'Sandra', 'Andrew', 'Donna',
    'Kenneth', 'Carol', 'Paul', 'Ruth', 'Joshua', 'Sharon', 'Kevin', 'Michelle', 'Brian', 'Laura',
    'George', 'Sarah', 'Edward', 'Kimberly', 'Ronald', 'Deborah', 'Timothy', 'Dorothy', 'Jason', 'Lisa',
    'Jeffrey', 'Nancy', 'Ryan', 'Karen', 'Jacob', 'Betty', 'Gary', 'Helen', 'Nicholas', 'Sandra',
    'Eric', 'Donna', 'Jonathan', 'Carol', 'Stephen', 'Ruth', 'Larry', 'Sharon', 'Justin', 'Michelle',
    'Scott', 'Laura', 'Brandon', 'Sarah', 'Benjamin', 'Kimberly', 'Samuel', 'Deborah', 'Gregory', 'Dorothy'
]

last_names = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
    'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
    'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson'
]

company_names = [
    'TechCorp Solutions', 'Digital Innovations Ltd', 'Global Systems Inc', 'Future Tech Bangladesh',
    'Smart Solutions Ltd', 'Innovative Software', 'DataTech Solutions', 'CloudFirst Technologies',
    'NextGen Development', 'AgileWorks Ltd', 'CodeCraft Solutions', 'ByteForce Technologies',
    'DevStream Ltd', 'TechBridge Solutions', 'InnovateLab', 'DigitalCraft Inc', 'CodeWave Technologies',
    'SmartCode Ltd', 'TechFlow Solutions', 'DevHub Bangladesh', 'SoftwareWorks Ltd', 'TechNova Solutions',
    'CodeGenius Inc', 'DigitalForge Ltd', 'TechMaster Solutions', 'InnovateCore', 'DevCraft Technologies',
    'SmartTech Ltd', 'CodeStorm Solutions', 'TechVision Inc', 'DigitalEdge Ltd', 'SoftwarePlus Solutions',
    'TechBoost Inc', 'CodeLab Technologies', 'DigitalWorks Ltd', 'TechSphere Solutions', 'InnovateTech Inc',
    'DevWorks Bangladesh', 'SmartSoft Ltd', 'TechCube Solutions', 'CodeCore Technologies'
]

locations = [
    'Dhaka, Bangladesh', 'Chittagong, Bangladesh', 'Sylhet, Bangladesh', 'Rajshahi, Bangladesh',
    'Khulna, Bangladesh', 'Barisal, Bangladesh', 'Rangpur, Bangladesh', 'Mymensingh, Bangladesh',
    'Cumilla, Bangladesh', 'Gazipur, Bangladesh', 'Narayanganj, Bangladesh', 'Savar, Bangladesh',
    'Dhanmondi, Dhaka', 'Gulshan, Dhaka', 'Banani, Dhaka', 'Uttara, Dhaka', 'Mirpur, Dhaka',
    'Wari, Dhaka', 'Old Dhaka', 'New Market, Dhaka', 'Tejgaon, Dhaka', 'Mohammadpur, Dhaka'
]

industries = [
    'Information Technology', 'Software Development', 'Web Development', 'Mobile App Development',
    'Data Science', 'Artificial Intelligence', 'Machine Learning', 'Cybersecurity', 'Cloud Computing',
    'DevOps', 'UI/UX Design', 'Digital Marketing', 'E-commerce', 'Fintech', 'Healthcare Technology',
    'Education Technology', 'Telecommunications', 'Banking & Finance', 'Consulting', 'Startup'
]

job_positions = [
    'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer',
    'Backend Developer', 'Mobile App Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager',
    'UI/UX Designer', 'Quality Assurance Engineer', 'System Administrator', 'Database Administrator',
    'Cybersecurity Specialist', 'AI/ML Engineer', 'Cloud Architect', 'Technical Lead', 'Project Manager',
    'Business Analyst', 'Digital Marketing Specialist', 'Sales Executive', 'HR Manager', 'CEO', 'CTO'
]

experience_levels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive']

skills_pool = [
    'Python', 'JavaScript', 'React', 'Node.js', 'Django', 'Flask', 'PHP', 'Laravel', 'Java', 'Spring Boot',
    'C#', '.NET', 'Angular', 'Vue.js', 'HTML', 'CSS', 'Bootstrap', 'Tailwind CSS', 'MySQL', 'PostgreSQL',
    'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Git', 'Linux', 'Agile',
    'Machine Learning', 'Data Analysis', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Selenium', 'Jest',
    'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Digital Marketing', 'SEO', 'Social Media Marketing'
]

bio_templates = [
    "Passionate {position} with {years} years of experience in {industry}. Love working with {tech} and building innovative solutions.",
    "Experienced {position} specializing in {tech}. {years} years in {industry} with a focus on delivering quality results.",
    "{years}-year veteran {position} in {industry}. Expert in {tech} and passionate about technology innovation.",
    "Senior {position} with extensive experience in {tech}. {years} years of building scalable solutions in {industry}.",
    "Dedicated {position} with {years} years of experience. Specialized in {tech} and committed to excellence in {industry}.",
    "Results-driven {position} with {years} years in {industry}. Proficient in {tech} and focused on continuous learning.",
    "Creative {position} with {years} years of experience. Skilled in {tech} and passionate about {industry} innovation."
]

def generate_password_hash(password):
    """Generate a simple password hash (for demo purposes)"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_fake_users(num_users=200):
    """Generate fake user data"""
    users = []
    companies = []
    jobseekers = []
    
    for i in range(num_users):
        # Generate basic user info
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@example.com"
        
        # Random user type (70% jobseeker, 25% company, 5% admin)
        rand = random.random()
        if rand < 0.70:
            user_type = 'jobseeker'
        elif rand < 0.95:
            user_type = 'company'
        else:
            user_type = 'admin'
        
        # Generate creation date (last 2 years)
        created_at = datetime.now() - timedelta(days=random.randint(1, 730))
        
        user = {
            'email': email,
            'password_hash': generate_password_hash('password123'),  # Default password
            'user_type': user_type,
            'is_active': True,
            'is_verified': random.choice([True, True, True, False]),  # 75% verified
            'created_at': created_at.isoformat(),
            'updated_at': created_at.isoformat(),
            # Store first/last name for user_profiles table
            'first_name': first_name,
            'last_name': last_name
        }
        users.append(user)
        
        # Generate profile based on user type
        if user_type == 'company':
            company = {
                'company_name': random.choice(company_names),
                'company_description': f"Leading {random.choice(industries).lower()} company providing innovative solutions and services to clients worldwide.",
                'industry': random.choice(industries),
                'company_size': random.choice(['1-10', '11-50', '51-200', '201-500', '500+']),
                'location': random.choice(locations),
                'website': f"https://www.{company_names[random.randint(0, len(company_names)-1)].lower().replace(' ', '')}.com",
                'is_approved': random.choice([True, True, False]),  # 66% approved
                'created_at': created_at.isoformat(),
                'updated_at': created_at.isoformat()
            }
            companies.append(company)
            
        elif user_type == 'jobseeker':
            years_exp = random.randint(1, 15)
            position = random.choice(job_positions)
            
            # Generate skills (3-8 skills per person)
            user_skills = random.sample(skills_pool, random.randint(3, 8))
            skills_str = ', '.join(user_skills)
            
            jobseeker = {
                'current_position': position,
                'experience_level': random.choice(experience_levels),
                'location': random.choice(locations),
                'skills': skills_str,
                'expected_salary': f"{random.randint(30, 200)}K BDT",
                'available_for_work': random.choice([True, True, False]),  # 66% available
                'created_at': created_at.isoformat(),
                'updated_at': created_at.isoformat()
            }
            jobseekers.append(jobseeker)
    
    return users, companies, jobseekers

def insert_fake_data():
    """Insert fake data into the database"""
    try:
        # Connect to database
        conn = sqlite3.connect('jobs.db')
        cursor = conn.cursor()
        
        print("Generating fake user data...")
        users, companies, jobseekers = generate_fake_users(200)
        
        print(f"Inserting {len(users)} users...")
        
        # Insert users
        for i, user in enumerate(users):
            try:
                cursor.execute('''
                    INSERT INTO users (email, password_hash, user_type, is_active, is_verified, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user['email'], user['password_hash'], user['user_type'], user['is_active'],
                    user['is_verified'], user['created_at'], user['updated_at']
                ))
                
                user_id = cursor.lastrowid
                
                # Insert basic user profile with first_name and last_name
                cursor.execute('''
                    INSERT INTO user_profiles (user_id, first_name, last_name, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    user_id, user['first_name'], user['last_name'], user['created_at'], user['updated_at']
                ))
                
                # Insert profile based on user type
                if user['user_type'] == 'company' and i < len(companies):
                    company = companies[min(i, len(companies)-1)]
                    cursor.execute('''
                        INSERT INTO company_profiles (
                            user_id, company_name, company_description, industry, company_size, 
                            location, website, is_approved, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        user_id, company['company_name'], company['company_description'], 
                        company['industry'], company['company_size'], company['location'], 
                        company['website'], company['is_approved'], company['created_at'], company['updated_at']
                    ))
                
                elif user['user_type'] == 'jobseeker':
                    # Find corresponding jobseeker profile
                    js_index = len([u for u in users[:i+1] if u['user_type'] == 'jobseeker']) - 1
                    if js_index < len(jobseekers):
                        jobseeker = jobseekers[js_index]
                        cursor.execute('''
                            INSERT INTO jobseeker_profiles (
                                user_id, current_position, experience_level, location, skills, 
                                expected_salary, available_for_work, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            user_id, jobseeker['current_position'], jobseeker['experience_level'],
                            jobseeker['location'], jobseeker['skills'], jobseeker['expected_salary'],
                            jobseeker['available_for_work'], jobseeker['created_at'], jobseeker['updated_at']
                        ))
                
                if (i + 1) % 20 == 0:
                    print(f"Inserted {i + 1} users...")
                    
            except sqlite3.IntegrityError as e:
                print(f"Skipping duplicate user {user['email']}: {e}")
                continue
        
        # Commit all changes
        conn.commit()
        
        # Verify insertion
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM company_profiles')
        total_companies = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM jobseeker_profiles')
        total_jobseekers = cursor.fetchone()[0]
        
        print(f"\n✅ Successfully added fake data!")
        print(f"📊 Database now contains:")
        print(f"   - Total users: {total_users}")
        print(f"   - Company profiles: {total_companies}")
        print(f"   - Jobseeker profiles: {total_jobseekers}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error inserting fake data: {e}")
        if conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    print("🚀 Adding 200 fake users to database for infinite scroll testing...")
    insert_fake_data()
    print("✨ Done! You can now test infinite scroll with plenty of data.")
