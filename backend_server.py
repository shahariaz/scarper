"""
Main API server for the job portal backend
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from functools import wraps
from datetime import datetime, timedelta
import json
import os
import sys
import sqlite3
import traceback

# Add the parent directory to the path so we can import from scraper
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.models.auth_models import AuthService
from scraper.models.job_models import JobService
from scraper.utils.logger import setup_logger

logger = setup_logger(__name__)

# Initialize services
auth_service = AuthService()
job_service = JobService()

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Enable CORS for frontend
    CORS(app, origins=["http://localhost:3000", "http://localhost:5000"], supports_credentials=True)
    
    # JWT token verification decorator
    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            
            # Get token from header
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                try:
                    token = auth_header.split(" ")[1]  # Bearer TOKEN
                except IndexError:
                    return jsonify({'success': False, 'message': 'Invalid token format'}), 401
            
            if not token:
                return jsonify({'success': False, 'message': 'Token is missing'}), 401
            
            try:
                # Verify token
                payload = auth_service.verify_token(token)
                if not payload:
                    return jsonify({'success': False, 'message': 'Token is invalid or expired'}), 401
                
                # Add user info to request context
                request.current_user_id = payload['user_id']
                request.current_user_type = payload['user_type']
                
            except Exception as e:
                logger.error(f"Token verification error: {e}")
                return jsonify({'success': False, 'message': 'Token verification failed'}), 401
            
            return f(*args, **kwargs)
        
        return decorated
    
    # Admin-only decorator
    def admin_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'current_user_type') or request.current_user_type != 'admin':
                return jsonify({'success': False, 'message': 'Admin access required'}), 403
            return f(*args, **kwargs)
        return decorated
    
    # Company-only decorator
    def company_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'current_user_type') or request.current_user_type not in ['admin', 'company']:
                return jsonify({'success': False, 'message': 'Company access required'}), 403
            return f(*args, **kwargs)
        return decorated
    
    # ============================================================================
    # AUTHENTICATION ENDPOINTS
    # ============================================================================
    
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        """Register a new user"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['email', 'password', 'user_type']
            for field in required_fields:
                if field not in data or not data[field]:
                    return jsonify({
                        'success': False, 
                        'message': f'Missing required field: {field}'
                    }), 400
            
            # Validate user type
            if data['user_type'] not in ['admin', 'jobseeker', 'company']:
                return jsonify({
                    'success': False,
                    'message': 'Invalid user type. Must be admin, jobseeker or company'
                }), 400            # Validate email format (basic)
            if '@' not in data['email']:
                return jsonify({
                    'success': False, 
                    'message': 'Invalid email format'
                }), 400
            
            # Validate password strength
            if len(data['password']) < 6:
                return jsonify({
                    'success': False, 
                    'message': 'Password must be at least 6 characters long'
                }), 400
            
            # Extract profile data
            profile_data = data.get('profile_data', {})
            
            # Register user
            result = auth_service.register_user(
                data['email'],
                data['password'],
                data['user_type'],
                profile_data
            )
            
            status_code = 201 if result['success'] else 400
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error in register endpoint: {e}")
            return jsonify({
                'success': False, 
                'message': 'Registration failed'
            }), 500
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """Login user"""
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data or 'email' not in data or 'password' not in data:
                return jsonify({
                    'success': False, 
                    'message': 'Email and password are required'
                }), 400
            
            # Login user
            result = auth_service.login_user(data['email'], data['password'])
            
            status_code = 200 if result['success'] else 401
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error in login endpoint: {e}")
            return jsonify({
                'success': False, 
                'message': 'Login failed'
            }), 500
    
    @app.route('/api/auth/refresh', methods=['POST'])
    def refresh_token():
        """Refresh access token"""
        try:
            data = request.get_json()
            
            if not data or 'refresh_token' not in data:
                return jsonify({
                    'success': False, 
                    'message': 'Refresh token is required'
                }), 400
            
            result = auth_service.refresh_access_token(data['refresh_token'])
            
            status_code = 200 if result['success'] else 401
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error in refresh token endpoint: {e}")
            return jsonify({
                'success': False, 
                'message': 'Token refresh failed'
            }), 500
    
    @app.route('/api/auth/logout', methods=['POST'])
    @token_required
    def logout():
        """Logout user"""
        try:
            data = request.get_json() or {}
            refresh_token = data.get('refresh_token')
            
            if refresh_token:
                auth_service.invalidate_refresh_token(refresh_token)
            
            return jsonify({
                'success': True,
                'message': 'Logged out successfully'
            })
            
        except Exception as e:
            logger.error(f"Error in logout endpoint: {e}")
            return jsonify({
                'success': False, 
                'message': 'Logout failed'
            }), 500
    
    @app.route('/api/auth/profile', methods=['GET'])
    @token_required
    def get_profile():
        """Get user profile"""
        try:
            profile = auth_service.get_user_profile(request.current_user_id)
            
            if not profile:
                return jsonify({
                    'success': False, 
                    'message': 'Profile not found'
                }), 404
            
            return jsonify({
                'success': True,
                'profile': profile
            })
            
        except Exception as e:
            logger.error(f"Error getting profile: {e}")
            return jsonify({
                'success': False, 
                'message': 'Failed to get profile'
            }), 500
    
    @app.route('/api/auth/profile', methods=['PUT'])
    @token_required
    def update_profile():
        """Update user profile"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False, 
                    'message': 'No data provided'
                }), 400
            
            result = auth_service.update_user_profile(
                request.current_user_id,
                request.current_user_type,
                data
            )
            
            status_code = 200 if result['success'] else 400
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return jsonify({
                'success': False, 
                'message': 'Failed to update profile'
            }), 500
    
    @app.route('/api/auth/settings', methods=['GET'])
    @token_required
    def get_user_settings():
        """Get user settings"""
        try:
            # For now, return basic settings
            settings = {
                'notifications': {
                    'email': True,
                    'push': True,
                    'marketing': False
                },
                'privacy': {
                    'profile_public': True,
                    'contact_info_visible': False
                },
                'preferences': {
                    'theme': 'dark',
                    'language': 'en'
                }
            }
            
            return jsonify({
                'success': True,
                'settings': settings
            })
            
        except Exception as e:
            logger.error(f"Error fetching user settings: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch settings'
            }), 500

    @app.route('/api/auth/settings', methods=['PUT'])
    @token_required
    def update_user_settings():
        """Update user settings"""
        try:
            data = request.get_json()
            
            # For now, just return success (settings would be saved to database in real implementation)
            return jsonify({
                'success': True,
                'message': 'Settings updated successfully'
            })
            
        except Exception as e:
            logger.error(f"Error updating user settings: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to update settings'
            }), 500
    
    # ============================================================================
    # JOB MANAGEMENT ENDPOINTS
    # ============================================================================
    
    @app.route('/api/jobs', methods=['POST'])
    @token_required
    @company_required
    def create_job():
        """Create a new job posting (company and admin only)"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400
            
            # Validate required fields
            required_fields = ['title', 'company', 'description']
            for field in required_fields:
                if field not in data or not data[field].strip():
                    return jsonify({
                        'success': False, 
                        'message': f'Missing required field: {field}'
                    }), 400
            
            # Create job posting
            result = job_service.create_job_posting(
                data, 
                request.current_user_id, 
                request.current_user_type
            )
            
            status_code = 201 if result['success'] else 400
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error creating job: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/jobs/<int:job_id>', methods=['GET'])
    def get_job(job_id):
        """Get a specific job posting"""
        try:
            # Check if user is authenticated for view tracking
            increment_views = True
            user_type = None
            user_id = None
            
            if 'Authorization' in request.headers:
                try:
                    auth_header = request.headers['Authorization']
                    token = auth_header.split(" ")[1]
                    payload = auth_service.verify_token(token)
                    if payload:
                        user_type = payload['user_type']
                        user_id = payload['user_id']
                except:
                    pass
            
            job = job_service.get_job_posting(job_id, increment_views)
            
            if not job:
                return jsonify({'success': False, 'message': 'Job not found'}), 404
            
            # Don't show unapproved jobs to non-authorized users
            if not job['approved_by_admin']:
                is_authorized = (
                    user_type == 'admin' or 
                    (user_type == 'company' and user_id == job['created_by_user_id'])
                )
                
                if not is_authorized:
                    return jsonify({'success': False, 'message': 'Job not found'}), 404
            
            return jsonify({
                'success': True,
                'job': job
            })
            
        except Exception as e:
            logger.error(f"Error getting job {job_id}: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/jobs/<int:job_id>', methods=['PUT'])
    @token_required
    def update_job(job_id):
        """Update a job posting"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'message': 'No data provided'}), 400
            
            result = job_service.update_job_posting(
                job_id, 
                data, 
                request.current_user_id, 
                request.current_user_type
            )
            
            status_code = 200 if result['success'] else 400
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error updating job {job_id}: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
    @token_required
    def delete_job(job_id):
        """Delete a job posting"""
        try:
            result = job_service.delete_job_posting(
                job_id, 
                request.current_user_id, 
                request.current_user_type
            )
            
            status_code = 200 if result['success'] else 400
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error deleting job {job_id}: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/jobs/search', methods=['GET'])
    def search_jobs():
        """Search job postings with filters and pagination"""
        try:
            # Get query parameters
            filters = {}
            
            # Search query
            if request.args.get('q'):
                filters['query'] = request.args.get('q')
            
            # Filters
            filter_params = [
                'company', 'location', 'job_type', 'work_mode', 'experience_level',
                'category', 'industry', 'created_by_type', 'status'
            ]
            
            for param in filter_params:
                if request.args.get(param):
                    filters[param] = request.args.get(param)
            
            # Salary filters
            if request.args.get('salary_min'):
                try:
                    filters['salary_min'] = int(request.args.get('salary_min'))
                except ValueError:
                    pass
            
            if request.args.get('salary_max'):
                try:
                    filters['salary_max'] = int(request.args.get('salary_max'))
                except ValueError:
                    pass
            
            # Date filters
            if request.args.get('posted_after'):
                filters['posted_after'] = request.args.get('posted_after')
            
            if request.args.get('deadline_before'):
                filters['deadline_before'] = request.args.get('deadline_before')
            
            # User-specific filters (only for authenticated users)
            if 'Authorization' in request.headers:
                try:
                    auth_header = request.headers['Authorization']
                    token = auth_header.split(" ")[1]
                    payload = auth_service.verify_token(token)
                    if payload:
                        user_type = payload['user_type']
                        user_id = payload['user_id']
                        
                        # Show unapproved jobs to admin users
                        if user_type == 'admin' and request.args.get('show_unapproved') == 'true':
                            filters['show_unapproved'] = True
                        
                        # Show user's own jobs
                        if request.args.get('my_jobs') == 'true':
                            filters['created_by_user_id'] = user_id
                except:
                    pass
            
            # Pagination
            page = int(request.args.get('page', 1))
            per_page = min(int(request.args.get('per_page', 20)), 100)  # Max 100 per page
            
            # Sorting
            if request.args.get('sort'):
                filters['sort'] = request.args.get('sort')
            
            result = job_service.search_job_postings(filters, page, per_page)
            
            return jsonify({
                'success': True,
                **result
            })
            
        except Exception as e:
            logger.error(f"Error searching jobs: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/jobs/<int:job_id>/approve', methods=['POST'])
    @token_required
    @admin_required
    def approve_job(job_id):
        """Approve a job posting (admin only)"""
        try:
            data = request.get_json() or {}
            admin_notes = data.get('admin_notes', '')
            
            result = job_service.approve_job_posting(
                job_id, 
                request.current_user_id, 
                admin_notes
            )
            
            status_code = 200 if result['success'] else 400
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error approving job {job_id}: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/jobs/<int:job_id>/reject', methods=['POST'])
    @token_required
    @admin_required
    def reject_job(job_id):
        """Reject a job posting (admin only)"""
        try:
            data = request.get_json() or {}
            admin_notes = data.get('admin_notes', '')
            
            result = job_service.reject_job_posting(
                job_id, 
                request.current_user_id, 
                admin_notes
            )
            
            status_code = 200 if result['success'] else 400
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error rejecting job {job_id}: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/jobs/statistics', methods=['GET'])
    @token_required
    def get_job_statistics():
        """Get job statistics"""
        try:
            stats = job_service.get_job_statistics(
                request.current_user_id, 
                request.current_user_type
            )
            
            return jsonify({
                'success': True,
                'statistics': stats
            })
            
        except Exception as e:
            logger.error(f"Error getting job statistics: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/jobs/categories', methods=['GET'])
    def get_job_categories():
        """Get all job categories"""
        try:
            categories = job_service.get_job_categories()
            
            return jsonify({
                'success': True,
                'categories': categories
            })
            
        except Exception as e:
            logger.error(f"Error getting job categories: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/jobs/filters', methods=['GET'])
    def get_job_filters():
        """Get available filter options"""
        try:
            filters = {
                'job_types': ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
                'work_modes': ['Remote', 'Hybrid', 'On-site'],
                'experience_levels': ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'],
                'salary_ranges': [
                    {'label': 'Under ৳30,000', 'min': 0, 'max': 30000},
                    {'label': '৳30,000 - ৳50,000', 'min': 30000, 'max': 50000},
                    {'label': '৳50,000 - ৳80,000', 'min': 50000, 'max': 80000},
                    {'label': '৳80,000 - ৳120,000', 'min': 80000, 'max': 120000},
                    {'label': 'Above ৳120,000', 'min': 120000, 'max': None}
                ]
            }
            
            return jsonify({
                'success': True,
                'filters': filters
            })
            
        except Exception as e:
            logger.error(f"Error getting job filters: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    # ============================================================================
    # LEGACY API ENDPOINTS (FOR EXISTING FRONTEND)
    # ============================================================================
    
    @app.route('/api/jobs', methods=['GET'])
    def get_jobs_legacy():
        """Legacy endpoint for job listing - uses original scraped data"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get filter parameters
            company = request.args.get('company')
            location = request.args.get('location')
            job_type = request.args.get('type')
            experience = request.args.get('experience')
            
            # Build query with filters
            where_conditions = ['is_active = 1 OR is_active IS NULL']  # Show active jobs or null (default active)
            params = []
            
            if company:
                where_conditions.append('company LIKE ?')
                params.append(f'%{company}%')
            
            if location:
                where_conditions.append('location LIKE ?')
                params.append(f'%{location}%')
                
            if job_type:
                where_conditions.append('type LIKE ?')
                params.append(f'%{job_type}%')
                
            if experience:
                where_conditions.append('experience_level LIKE ?')
                params.append(f'%{experience}%')
            
            where_clause = ' AND '.join(where_conditions)
            
            # Pagination
            page = int(request.args.get('page', 1))
            per_page = min(int(request.args.get('per_page', 20)), 100)
            offset = (page - 1) * per_page
            
            # Get total count
            count_query = f'SELECT COUNT(*) FROM jobs WHERE {where_clause}'
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]
            
            # Get jobs with pagination
            query = f'''
                SELECT id, title, company, location, type, description, apply_link, 
                       source_url, scraped_at, requirements, responsibilities, benefits,
                       salary_range, experience_level, skills, posted_date, view_count
                FROM jobs 
                WHERE {where_clause}
                ORDER BY scraped_at DESC 
                LIMIT ? OFFSET ?
            '''
            cursor.execute(query, params + [per_page, offset])
            
            jobs = []
            for row in cursor.fetchall():
                job = {
                    'id': row[0],
                    'title': row[1],
                    'company': row[2],
                    'location': row[3] or '',
                    'job_type': row[4] or 'Full-time',
                    'description': row[5] or '',
                    'apply_link': row[6] or '',
                    'source_url': row[7] or '',
                    'posted_date': row[15] or row[8],  # Use posted_date if available, else scraped_at
                    'scraped_at': row[8],
                    'requirements': row[9] or '',
                    'responsibilities': row[10] or '',
                    'benefits': row[11] or '',
                    'salary': row[12] or '',
                    'experience_level': row[13] or '',
                    'skills': row[14] or '',
                    'status': 'active',
                    'view_count': row[16] or 0
                }
                jobs.append(job)
            
            pages = (total + per_page - 1) // per_page
            
            conn.close()
            
            return jsonify({
                'jobs': jobs,
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': pages
            })
            
        except Exception as e:
            logger.error(f"Error in legacy jobs endpoint: {e}")
            return jsonify({
                'jobs': [],
                'total': 0,
                'page': 1,
                'per_page': 20,
                'pages': 0
            }), 500
    
    @app.route('/api/search', methods=['GET'])
    def search_jobs_legacy():
        """Legacy endpoint for job search - uses original scraped data"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get search parameters
            query = request.args.get('q', '')
            company = request.args.get('company')
            location = request.args.get('location')
            job_type = request.args.get('type')
            experience = request.args.get('experience')
            
            # Build search query
            where_conditions = ['is_active = 1 OR is_active IS NULL']
            params = []
            
            if query:
                where_conditions.append('(title LIKE ? OR company LIKE ? OR description LIKE ? OR skills LIKE ?)')
                params.extend([f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%'])
            
            if company:
                where_conditions.append('company LIKE ?')
                params.append(f'%{company}%')
            
            if location:
                where_conditions.append('location LIKE ?')
                params.append(f'%{location}%')
                
            if job_type:
                where_conditions.append('type LIKE ?')
                params.append(f'%{job_type}%')
                
            if experience:
                where_conditions.append('experience_level LIKE ?')
                params.append(f'%{experience}%')
            
            where_clause = ' AND '.join(where_conditions)
            
            # Pagination
            page = int(request.args.get('page', 1))
            per_page = min(int(request.args.get('per_page', 20)), 100)
            offset = (page - 1) * per_page
            
            # Get total count
            count_query = f'SELECT COUNT(*) FROM jobs WHERE {where_clause}'
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]
            
            # Get jobs with pagination
            search_query = f'''
                SELECT id, title, company, location, type, description, apply_link, 
                       source_url, scraped_at, requirements, responsibilities, benefits,
                       salary_range, experience_level, skills, posted_date, view_count
                FROM jobs 
                WHERE {where_clause}
                ORDER BY scraped_at DESC 
                LIMIT ? OFFSET ?
            '''
            cursor.execute(search_query, params + [per_page, offset])
            
            jobs = []
            for row in cursor.fetchall():
                job = {
                    'id': row[0],
                    'title': row[1],
                    'company': row[2],
                    'location': row[3] or '',
                    'job_type': row[4] or 'Full-time',
                    'description': row[5] or '',
                    'apply_link': row[6] or '',
                    'source_url': row[7] or '',
                    'posted_date': row[15] or row[8],
                    'scraped_at': row[8],
                    'requirements': row[9] or '',
                    'responsibilities': row[10] or '',
                    'benefits': row[11] or '',
                    'salary': row[12] or '',
                    'experience_level': row[13] or '',
                    'skills': row[14] or '',
                    'status': 'active',
                    'view_count': row[16] or 0
                }
                jobs.append(job)
            
            pages = (total + per_page - 1) // per_page
            
            conn.close()
            
            return jsonify({
                'jobs': jobs,
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': pages
            })
            
        except Exception as e:
            logger.error(f"Error in legacy search endpoint: {e}")
            return jsonify({
                'jobs': [],
                'total': 0,
                'page': 1,
                'per_page': 20,
                'pages': 0
            }), 500
    
    @app.route('/api/job/<int:job_id>', methods=['GET'])
    def get_job_legacy(job_id):
        """Legacy endpoint for single job - uses original scraped data"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get the job and increment view count
            cursor.execute('''
                SELECT id, title, company, location, type, description, apply_link, 
                       source_url, scraped_at, requirements, responsibilities, benefits,
                       salary_range, experience_level, skills, posted_date, view_count
                FROM jobs 
                WHERE id = ? AND (is_active = 1 OR is_active IS NULL)
            ''', (job_id,))
            
            row = cursor.fetchone()
            if not row:
                conn.close()
                return jsonify({'error': 'Job not found'}), 404
            
            # Increment view count
            cursor.execute('UPDATE jobs SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?', (job_id,))
            conn.commit()
            
            job = {
                'id': row[0],
                'title': row[1],
                'company': row[2],
                'location': row[3] or '',
                'job_type': row[4] or 'Full-time',
                'description': row[5] or '',
                'apply_link': row[6] or '',
                'source_url': row[7] or '',
                'posted_date': row[15] or row[8],
                'scraped_at': row[8],
                'requirements': row[9] or '',
                'responsibilities': row[10] or '',
                'benefits': row[11] or '',
                'salary': row[12] or '',
                'experience_level': row[13] or '',
                'skills': row[14] or '',
                'status': 'active',
                'view_count': (row[16] or 0) + 1  # Return incremented count
            }
            
            conn.close()
            return jsonify(job)
            
        except Exception as e:
            logger.error(f"Error in legacy job endpoint: {e}")
            return jsonify({'error': 'Internal server error'}), 500
    
    @app.route('/api/stats', methods=['GET'])
    def get_stats_legacy():
        """Legacy endpoint for dashboard stats - uses original scraped data"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get basic stats from original jobs table
            cursor.execute('SELECT COUNT(*) FROM jobs WHERE is_active = 1')
            total_jobs = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(DISTINCT company) FROM jobs WHERE is_active = 1 AND company IS NOT NULL')
            total_companies = cursor.fetchone()[0]
            
            # Get jobs by company
            cursor.execute('''
                SELECT company, COUNT(*) as count 
                FROM jobs 
                WHERE is_active = 1 AND company IS NOT NULL
                GROUP BY company 
                ORDER BY count DESC 
                LIMIT 10
            ''')
            jobs_by_company = [{'company': row[0], 'count': row[1]} for row in cursor.fetchall()]
            
            # Get jobs by location
            cursor.execute('''
                SELECT location, COUNT(*) as count 
                FROM jobs 
                WHERE is_active = 1 AND location IS NOT NULL
                GROUP BY location 
                ORDER BY count DESC 
                LIMIT 10
            ''')
            jobs_by_location = [{'location': row[0], 'count': row[1]} for row in cursor.fetchall()]
            
            # Get recent jobs
            cursor.execute('''
                SELECT id, title, company, location, type, description, apply_link, 
                       source_url, scraped_at, requirements, responsibilities, benefits,
                       salary_range, experience_level, skills, posted_date, view_count
                FROM jobs 
                WHERE is_active = 1
                ORDER BY scraped_at DESC 
                LIMIT 5
            ''')
            
            recent_jobs = []
            for row in cursor.fetchall():
                job = {
                    'id': row[0],
                    'title': row[1],
                    'company': row[2],
                    'location': row[3] or '',
                    'job_type': row[4] or 'Full-time',
                    'description': row[5] or '',
                    'apply_link': row[6] or '',
                    'source_url': row[7] or '',
                    'posted_date': row[15] or row[8],
                    'scraped_at': row[8],
                    'requirements': row[9] or '',
                    'responsibilities': row[10] or '',
                    'benefits': row[11] or '',
                    'salary': row[12] or '',
                    'experience_level': row[13] or '',
                    'skills': row[14] or '',
                    'status': 'active',
                    'view_count': row[16] or 0
                }
                recent_jobs.append(job)
            
            # Get latest scraping run
            cursor.execute('SELECT MAX(timestamp) FROM scraping_runs')
            latest_run_result = cursor.fetchone()
            latest_run = latest_run_result[0] if latest_run_result and latest_run_result[0] else datetime.utcnow().isoformat()
            
            conn.close()
            
            return jsonify({
                'total_jobs': total_jobs,
                'total_companies': total_companies,
                'latest_run': latest_run,
                'active_jobs': total_jobs,
                'jobs_by_company': jobs_by_company,
                'jobs_by_location': jobs_by_location,
                'recent_jobs': recent_jobs
            })
            
        except Exception as e:
            logger.error(f"Error in legacy stats endpoint: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return jsonify({
                'total_jobs': 0,
                'total_companies': 0,
                'latest_run': datetime.utcnow().isoformat(),
                'active_jobs': 0,
                'jobs_by_company': [],
                'jobs_by_location': [],
                'recent_jobs': []
            }), 500
    
    @app.route('/api/companies', methods=['GET'])
    def get_companies_legacy():
        """Legacy endpoint for companies list - uses original scraped data"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT DISTINCT company 
                FROM jobs 
                WHERE (is_active = 1 OR is_active IS NULL) AND company IS NOT NULL
                ORDER BY company
            ''')
            
            companies = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            return jsonify(companies)
            
        except Exception as e:
            logger.error(f"Error in legacy companies endpoint: {e}")
            return jsonify([]), 500
    
    @app.route('/api/locations', methods=['GET'])
    def get_locations_legacy():
        """Legacy endpoint for locations list - uses original scraped data"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT DISTINCT location 
                FROM jobs 
                WHERE (is_active = 1 OR is_active IS NULL) AND location IS NOT NULL
                ORDER BY location
            ''')
            
            locations = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            return jsonify(locations)
            
        except Exception as e:
            logger.error(f"Error in legacy locations endpoint: {e}")
            return jsonify([]), 500
    
    @app.route('/api/job-types', methods=['GET'])
    def get_job_types_legacy():
        """Legacy endpoint for job types list - uses original scraped data"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT DISTINCT type 
                FROM jobs 
                WHERE (is_active = 1 OR is_active IS NULL) AND type IS NOT NULL
                ORDER BY type
            ''')
            
            job_types = [row[0] for row in cursor.fetchall()]
            
            # Add default job types if none exist
            if not job_types:
                job_types = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']
            
            conn.close()
            
            return jsonify(job_types)
            
        except Exception as e:
            logger.error(f"Error in legacy job types endpoint: {e}")
            return jsonify(['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']), 500
    
    @app.route('/api/experience-levels', methods=['GET'])
    def get_experience_levels_legacy():
        """Legacy endpoint for experience levels list - uses original scraped data"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT DISTINCT experience_level 
                FROM jobs 
                WHERE (is_active = 1 OR is_active IS NULL) AND experience_level IS NOT NULL
                ORDER BY experience_level
            ''')
            
            experience_levels = [row[0] for row in cursor.fetchall()]
            
            # Add default experience levels if none exist
            if not experience_levels:
                experience_levels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive']
            
            conn.close()
            
            return jsonify(experience_levels)
            
        except Exception as e:
            logger.error(f"Error in legacy experience levels endpoint: {e}")
            return jsonify(['Entry Level', 'Mid Level', 'Senior Level', 'Executive']), 500

    # ============================================================================
    # HEALTH CHECK AND INFO ENDPOINTS
    # ============================================================================
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'success': True,
            'message': 'API is running',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0'
        })
    
    @app.route('/api/info', methods=['GET'])
    def api_info():
        """API information endpoint"""
        return jsonify({
            'success': True,
            'api_name': 'Job Portal API',
            'version': '1.0.0',
            'description': 'Backend API for the job portal application',
            'endpoints': {
                'auth': '/api/auth/*',
                'jobs': '/api/jobs/*',
                'health': '/api/health',
                'info': '/api/info'
            }
        })
    
    # ============================================================================
    # ERROR HANDLERS
    # ============================================================================
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Endpoint not found'
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'success': False,
            'message': 'Method not allowed'
        }), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500
    
    return app

if __name__ == '__main__':
    # Initialize database tables
    try:
        auth_service.db.init_auth_tables()
        job_service.db.init_job_management_tables()
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        sys.exit(1)
    
    # Create and run the app
    app = create_app()
    
    # Get port from environment or use default
    port = int(os.getenv('PORT', 5000))  # Changed from 5001 to 5000
    
    logger.info(f"Starting Job Portal API server on port {port}")
    app.run(debug=True, host='0.0.0.0', port=port)
