"""
Test script to start the backend server and create initial data
"""
import sys
import os
import requests
import json
from datetime import datetime

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_api_connection():
    """Test if the API server is running"""
    try:
        response = requests.get('http://localhost:5001/api/health', timeout=5)  # Changed to port 5001
        if response.status_code == 200:
            print("✅ API server is running")
            return True
        else:
            print(f"❌ API server returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Make sure it's running on port 5001")  # Updated message
        return False
    except Exception as e:
        print(f"❌ Error connecting to API: {e}")
        return False

def create_test_admin():
    """Create a test admin user"""
    try:
        admin_data = {
            "email": "admin@jobportal.com",
            "password": "admin123",
            "user_type": "admin",
            "profile_data": {
                "first_name": "System",
                "last_name": "Administrator",
                "bio": "System administrator for the job portal"
            }
        }
        
        response = requests.post('http://localhost:5001/api/auth/register', 
                               json=admin_data, 
                               timeout=10)
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Test admin created successfully")
            return result.get('access_token'), result.get('user_id')
        elif response.status_code == 400:
            result = response.json()
            if 'already registered' in result.get('message', ''):
                print("ℹ️  Admin user already exists, trying to login...")
                # Try to login
                login_data = {"email": "admin@jobportal.com", "password": "admin123"}
                login_response = requests.post('http://localhost:5001/api/auth/login', 
                                             json=login_data, 
                                             timeout=10)
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    print("✅ Admin login successful")
                    return login_result.get('access_token'), login_result.get('user_id')
                else:
                    print(f"❌ Admin login failed: {login_response.json()}")
                    return None, None
            else:
                print(f"❌ Failed to create admin: {result.get('message')}")
                return None, None
        else:
            print(f"❌ Failed to create admin: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        return None, None

def create_test_company():
    """Create a test company user"""
    try:
        company_data = {
            "email": "company@example.com",
            "password": "company123",
            "user_type": "company",
            "profile_data": {
                "first_name": "John",
                "last_name": "Doe",
                "company_name": "TechCorp Bangladesh",
                "company_description": "Leading technology company in Bangladesh",
                "website": "https://techcorp.com.bd",
                "industry": "Technology",
                "company_size": "51-200",
                "location": "Dhaka, Bangladesh"
            }
        }
        
        response = requests.post('http://localhost:5001/api/auth/register', 
                               json=company_data, 
                               timeout=10)
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Test company created successfully")
            return result.get('access_token'), result.get('user_id')
        elif response.status_code == 400:
            result = response.json()
            if 'already registered' in result.get('message', ''):
                print("ℹ️  Company user already exists, trying to login...")
                # Try to login
                login_data = {"email": "company@example.com", "password": "company123"}
                login_response = requests.post('http://localhost:5001/api/auth/login', 
                                             json=login_data, 
                                             timeout=10)
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    print("✅ Company login successful")
                    return login_result.get('access_token'), login_result.get('user_id')
                else:
                    print(f"❌ Company login failed: {login_response.json()}")
                    return None, None
            else:
                print(f"❌ Failed to create company: {result.get('message')}")
                return None, None
        else:
            print(f"❌ Failed to create company: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error creating company: {e}")
        return None, None

def create_test_jobs(company_token):
    """Create test job postings"""
    if not company_token:
        print("❌ No company token available, skipping job creation")
        return
    
    headers = {"Authorization": f"Bearer {company_token}"}
    
    test_jobs = [
        {
            "title": "Senior React Developer",
            "company": "TechCorp Bangladesh",
            "location": "Dhaka, Bangladesh",
            "job_type": "Full-time",
            "work_mode": "Hybrid",
            "description": "We are looking for an experienced React developer to join our team. You will be responsible for developing and maintaining web applications using React.js and related technologies.",
            "requirements": "- 3+ years of experience with React.js\n- Strong knowledge of JavaScript, HTML, CSS\n- Experience with Redux or similar state management\n- Familiarity with RESTful APIs\n- Bachelor's degree in Computer Science or related field",
            "responsibilities": "- Develop and maintain React applications\n- Collaborate with design and backend teams\n- Write clean, maintainable code\n- Participate in code reviews\n- Optimize applications for performance",
            "benefits": "- Competitive salary\n- Health insurance\n- Flexible working hours\n- Professional development opportunities\n- Modern office environment",
            "salary_min": 80000,
            "salary_max": 120000,
            "salary_currency": "BDT",
            "experience_level": "Mid Level",
            "skills": ["React.js", "JavaScript", "HTML", "CSS", "Redux", "REST API"],
            "category": "Technology",
            "industry": "Technology",
            "apply_email": "careers@techcorp.com.bd",
            "contact_person": "HR Manager",
            "contact_phone": "+880-1234-567890",
            "company_website": "https://techcorp.com.bd"
        },
        {
            "title": "UI/UX Designer",
            "company": "TechCorp Bangladesh",
            "location": "Dhaka, Bangladesh",
            "job_type": "Full-time",
            "work_mode": "Remote",
            "description": "Join our design team as a UI/UX Designer. You will be responsible for creating intuitive and visually appealing user interfaces for our web and mobile applications.",
            "requirements": "- 2+ years of UI/UX design experience\n- Proficiency in Figma, Adobe XD, or Sketch\n- Strong understanding of user-centered design principles\n- Experience with prototyping and wireframing\n- Portfolio showcasing design work",
            "responsibilities": "- Create user interface designs for web and mobile apps\n- Conduct user research and usability testing\n- Develop wireframes and prototypes\n- Collaborate with developers and product managers\n- Maintain design systems and style guides",
            "benefits": "- Remote work flexibility\n- Creative work environment\n- Learning and development budget\n- Health and wellness benefits\n- Team building activities",
            "salary_min": 50000,
            "salary_max": 80000,
            "salary_currency": "BDT",
            "experience_level": "Mid Level",
            "skills": ["UI Design", "UX Design", "Figma", "Prototyping", "User Research"],
            "category": "Design",
            "industry": "Technology",
            "apply_email": "design@techcorp.com.bd",
            "contact_person": "Design Lead",
            "contact_phone": "+880-1234-567891",
            "company_website": "https://techcorp.com.bd"
        },
        {
            "title": "DevOps Engineer",
            "company": "TechCorp Bangladesh",
            "location": "Chittagong, Bangladesh",
            "job_type": "Full-time",
            "work_mode": "On-site",
            "description": "We are seeking a skilled DevOps Engineer to help us build and maintain our infrastructure. You will work on automation, deployment, and monitoring of our applications.",
            "requirements": "- 3+ years of DevOps experience\n- Experience with AWS, Docker, Kubernetes\n- Knowledge of CI/CD pipelines\n- Scripting skills (Python, Bash)\n- Experience with monitoring tools",
            "responsibilities": "- Manage cloud infrastructure on AWS\n- Implement CI/CD pipelines\n- Monitor application performance\n- Automate deployment processes\n- Ensure security and compliance",
            "benefits": "- Competitive salary package\n- Technical training opportunities\n- Health insurance coverage\n- Performance bonuses\n- Modern tech stack",
            "salary_min": 90000,
            "salary_max": 140000,
            "salary_currency": "BDT",
            "experience_level": "Senior Level",
            "skills": ["AWS", "Docker", "Kubernetes", "CI/CD", "Python", "Monitoring"],
            "category": "Technology",
            "industry": "Technology",
            "apply_email": "devops@techcorp.com.bd",
            "contact_person": "Technical Lead",
            "contact_phone": "+880-1234-567892",
            "company_website": "https://techcorp.com.bd"
        }
    ]
    
    created_jobs = 0
    for job_data in test_jobs:
        try:
            response = requests.post('http://localhost:5001/api/jobs', 
                                   json=job_data, 
                                   headers=headers,
                                   timeout=10)
            
            if response.status_code == 201:
                result = response.json()
                print(f"✅ Created job: {job_data['title']}")
                created_jobs += 1
            else:
                print(f"❌ Failed to create job '{job_data['title']}': {response.json()}")
                
        except Exception as e:
            print(f"❌ Error creating job '{job_data['title']}': {e}")
    
    print(f"✅ Successfully created {created_jobs} test jobs")

def test_job_search():
    """Test job search functionality"""
    try:
        # Test basic search
        response = requests.get('http://localhost:5001/api/jobs/search?q=react', timeout=10)
        if response.status_code == 200:
            result = response.json()
            jobs_count = len(result.get('jobs', []))
            print(f"✅ Job search test passed - Found {jobs_count} jobs matching 'react'")
        else:
            print(f"❌ Job search test failed: {response.status_code}")
            
        # Test category filter
        response = requests.get('http://localhost:5001/api/jobs/search?category=Technology', timeout=10)
        if response.status_code == 200:
            result = response.json()
            tech_jobs = len(result.get('jobs', []))
            print(f"✅ Category filter test passed - Found {tech_jobs} technology jobs")
        else:
            print(f"❌ Category filter test failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing job search: {e}")

def main():
    """Main test function"""
    print("🚀 Starting Job Portal Backend Tests")
    print("=" * 50)
    
    # Test API connection
    if not test_api_connection():
        print("\n❌ Please start the backend server first by running:")
        print("   python backend_server.py")
        return
    
    print("\n1. Creating test users...")
    
    # Create admin user
    admin_token, admin_id = create_test_admin()
    
    # Create company user  
    company_token, company_id = create_test_company()
    
    print("\n2. Creating test job postings...")
    
    # Create test jobs
    create_test_jobs(company_token)
    
    print("\n3. Testing job search...")
    
    # Test job search
    test_job_search()
    
    print("\n" + "=" * 50)
    print("🎉 Backend setup completed!")
    print("\nTest credentials:")
    print("Admin: admin@jobportal.com / admin123")
    print("Company: company@example.com / company123")
    print("\nAPI Endpoints:")
    print("- Health Check: http://localhost:5001/api/health")
    print("- Job Search: http://localhost:5001/api/jobs/search")
    print("- API Info: http://localhost:5001/api/info")
    print("\n✨ You can now connect your frontend to the backend!")

if __name__ == "__main__":
    main()
