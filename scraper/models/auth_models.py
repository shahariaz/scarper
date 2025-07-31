"""
Authentication models for the job portal
"""
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from ..utils.logger import setup_logger

logger = setup_logger(__name__)

class AuthDatabase:
    def __init__(self, db_path: str = "jobs.db"):
        self.db_path = db_path
        self.init_auth_tables()
    
    def init_auth_tables(self):
        """Initialize authentication related tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'jobseeker', 'company')),
                is_active BOOLEAN DEFAULT TRUE,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # User profiles table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(20),
                avatar_url VARCHAR(500),
                bio TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Company profiles table (for company users)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS company_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                company_name VARCHAR(200) NOT NULL,
                company_description TEXT,
                website VARCHAR(500),
                industry VARCHAR(100),
                company_size VARCHAR(50),
                location VARCHAR(200),
                logo_url VARCHAR(500),
                is_approved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Job seeker profiles table (for job seeker users)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobseeker_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                resume_url VARCHAR(500),
                skills TEXT, -- JSON array of skills
                experience_level VARCHAR(50),
                current_position VARCHAR(200),
                expected_salary VARCHAR(100),
                location VARCHAR(200),
                available_for_work BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Refresh tokens table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Password reset tokens table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Email verification tokens table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_verification_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Authentication tables initialized successfully")

class AuthService:
    def __init__(self, db_path: str = "jobs.db", jwt_secret: str = None):
        self.db = AuthDatabase(db_path)
        self.jwt_secret = jwt_secret or "your-secret-key-change-in-production"
        self.jwt_algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 30
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256 with salt"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}:{password_hash}"
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            salt, password_hash = hashed_password.split(':')
            return hashlib.sha256((password + salt).encode()).hexdigest() == password_hash
        except ValueError:
            return False
    
    def generate_tokens(self, user_id: int, user_type: str) -> Dict[str, str]:
        """Generate access and refresh tokens"""
        # Access token
        access_payload = {
            'user_id': user_id,
            'user_type': user_type,
            'exp': datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes),
            'type': 'access'
        }
        access_token = jwt.encode(access_payload, self.jwt_secret, algorithm=self.jwt_algorithm)
        
        # Refresh token
        refresh_token = secrets.token_urlsafe(32)
        
        # Store refresh token in database
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        expires_at = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        cursor.execute('''
            INSERT INTO refresh_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
        ''', (user_id, refresh_token, expires_at))
        
        conn.commit()
        conn.close()
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer'
        }
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def register_user(self, email: str, password: str, user_type: str, 
                     profile_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Register a new user"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        try:
            # Check if email already exists
            cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
            if cursor.fetchone():
                return {'success': False, 'message': 'Email already registered'}
            
            # Hash password
            password_hash = self.hash_password(password)
            
            # Insert user
            cursor.execute('''
                INSERT INTO users (email, password_hash, user_type)
                VALUES (?, ?, ?)
            ''', (email, password_hash, user_type))
            
            user_id = cursor.lastrowid
            
            # Create user profile
            cursor.execute('''
                INSERT INTO user_profiles (user_id, first_name, last_name, phone, bio)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                user_id,
                profile_data.get('first_name', '') if profile_data else '',
                profile_data.get('last_name', '') if profile_data else '',
                profile_data.get('phone', '') if profile_data else '',
                profile_data.get('bio', '') if profile_data else ''
            ))
            
            # Create specific profile based on user type
            if user_type == 'company' and profile_data:
                cursor.execute('''
                    INSERT INTO company_profiles (user_id, company_name, company_description, 
                                                website, industry, company_size, location)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user_id,
                    profile_data.get('company_name', ''),
                    profile_data.get('company_description', ''),
                    profile_data.get('website', ''),
                    profile_data.get('industry', ''),
                    profile_data.get('company_size', ''),
                    profile_data.get('location', '')
                ))
            
            elif user_type == 'jobseeker' and profile_data:
                cursor.execute('''
                    INSERT INTO jobseeker_profiles (user_id, skills, experience_level, 
                                                  current_position, expected_salary, location)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    user_id,
                    profile_data.get('skills', '[]'),
                    profile_data.get('experience_level', ''),
                    profile_data.get('current_position', ''),
                    profile_data.get('expected_salary', ''),
                    profile_data.get('location', '')
                ))
            
            conn.commit()
            
            # Generate tokens
            tokens = self.generate_tokens(user_id, user_type)
            
            return {
                'success': True,
                'message': 'User registered successfully',
                'user_id': user_id,
                **tokens
            }
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Error registering user: {e}")
            return {'success': False, 'message': 'Registration failed'}
        
        finally:
            conn.close()
    
    def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login user and generate tokens"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        try:
            # Get user
            cursor.execute('''
                SELECT id, password_hash, user_type, is_active, is_verified
                FROM users WHERE email = ?
            ''', (email,))
            
            user = cursor.fetchone()
            if not user:
                return {'success': False, 'message': 'Invalid credentials'}
            
            user_id, password_hash, user_type, is_active, is_verified = user
            
            # Verify password
            if not self.verify_password(password, password_hash):
                return {'success': False, 'message': 'Invalid credentials'}
            
            # Check if user is active
            if not is_active:
                return {'success': False, 'message': 'Account is deactivated'}
            
            # Update last login
            cursor.execute('''
                UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
            ''', (user_id,))
            
            conn.commit()
            
            # Generate tokens
            tokens = self.generate_tokens(user_id, user_type)
            
            return {
                'success': True,
                'message': 'Login successful',
                'user_id': user_id,
                'user_type': user_type,
                'is_verified': is_verified,
                **tokens
            }
            
        except Exception as e:
            logger.error(f"Error logging in user: {e}")
            return {'success': False, 'message': 'Login failed'}
        
        finally:
            conn.close()
    
    def get_user_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get complete user profile"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        try:
            # Get user basic info
            cursor.execute('''
                SELECT u.id, u.email, u.user_type, u.is_active, u.is_verified,
                       u.created_at, u.last_login,
                       p.first_name, p.last_name, p.phone, p.avatar_url, p.bio
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE u.id = ?
            ''', (user_id,))
            
            user_data = cursor.fetchone()
            if not user_data:
                return None
            
            profile = {
                'id': user_data[0],
                'email': user_data[1],
                'user_type': user_data[2],
                'is_active': user_data[3],
                'is_verified': user_data[4],
                'created_at': user_data[5],
                'last_login': user_data[6],
                'first_name': user_data[7],
                'last_name': user_data[8],
                'phone': user_data[9],
                'avatar_url': user_data[10],
                'bio': user_data[11]
            }
            
            # Get specific profile data based on user type
            if user_data[2] == 'company':
                cursor.execute('''
                    SELECT company_name, company_description, website, industry,
                           company_size, location, logo_url, is_approved
                    FROM company_profiles WHERE user_id = ?
                ''', (user_id,))
                
                company_data = cursor.fetchone()
                if company_data:
                    profile.update({
                        'company_name': company_data[0],
                        'company_description': company_data[1],
                        'website': company_data[2],
                        'industry': company_data[3],
                        'company_size': company_data[4],
                        'location': company_data[5],
                        'logo_url': company_data[6],
                        'is_approved': company_data[7]
                    })
            
            elif user_data[2] == 'jobseeker':
                cursor.execute('''
                    SELECT resume_url, skills, experience_level, current_position,
                           expected_salary, location, available_for_work
                    FROM jobseeker_profiles WHERE user_id = ?
                ''', (user_id,))
                
                jobseeker_data = cursor.fetchone()
                if jobseeker_data:
                    profile.update({
                        'resume_url': jobseeker_data[0],
                        'skills': jobseeker_data[1],
                        'experience_level': jobseeker_data[2],
                        'current_position': jobseeker_data[3],
                        'expected_salary': jobseeker_data[4],
                        'location': jobseeker_data[5],
                        'available_for_work': jobseeker_data[6]
                    })
            
            return profile
            
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None
        
        finally:
            conn.close()
