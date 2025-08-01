#!/usr/bin/env python3
"""
Script to create an admin user in the database
"""
import sys
import os

# Add the parent directory to the path so we can import from scraper
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper.models.auth_models import AuthService

def create_admin_user():
    """Create an admin user with email admin@gmail.com and password 123456"""
    
    # Initialize the auth service
    auth_service = AuthService()
    
    # Admin user details
    email = "admin@gmail.com"
    password = "123456"
    user_type = "admin"
    
    # Profile data for the admin user
    profile_data = {
        'first_name': 'Admin',
        'last_name': 'User',
        'bio': 'System Administrator'
    }
    
    print(f"Creating admin user with email: {email}")
    
    try:
        # Register the admin user
        result = auth_service.register_user(
            email=email,
            password=password,
            user_type=user_type,
            profile_data=profile_data
        )
        
        if result['success']:
            print("✅ Admin user created successfully!")
            print(f"Email: {email}")
            print(f"Password: {password}")
            print(f"User Type: {user_type}")
            print("\nYou can now login to the admin dashboard with these credentials.")
        else:
            print(f"❌ Failed to create admin user: {result['message']}")
            
            # If user already exists, let's check if it's already an admin
            if "already registered" in result['message'].lower():
                print("\nChecking if existing user is an admin...")
                
                # Try to login to verify user type
                login_result = auth_service.login_user(email, password)
                if login_result['success']:
                    user_data = login_result['user']
                    if user_data.get('user_type') == 'admin':
                        print("✅ User already exists and is an admin!")
                        print(f"Email: {email}")
                        print(f"Password: {password}")
                        print("You can login with these credentials.")
                    else:
                        print(f"❌ User exists but is not an admin (type: {user_data.get('user_type')})")
                else:
                    print("❌ Could not verify existing user credentials")
                    
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_admin_user()
