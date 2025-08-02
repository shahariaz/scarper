"""
Main API server for the job portal backend
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
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
from scraper.models.blog_models import BlogService
from scraper.models.social_models import SocialService
from scraper.models.cv_models import CVService
from scraper.websocket_manager import init_websocket, get_websocket_manager
from scraper.utils.logger import setup_logger

logger = setup_logger(__name__)

# Initialize services
auth_service = AuthService()
job_service = JobService()
blog_service = BlogService()
social_service = SocialService()
cv_service = CVService()

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Enable CORS for frontend
    CORS(app, origins=["http://localhost:3000", "http://localhost:5000"], supports_credentials=True)
    
    # Initialize SocketIO
    socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000", "http://localhost:5000"])
    
    # Initialize WebSocket manager
    websocket_manager = init_websocket(app, socketio)
    
    # Store socketio in app context for access in routes
    app.socketio = socketio
    app.websocket_manager = websocket_manager
    
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
                
                # Check if user is banned or suspended
                conn = sqlite3.connect('jobs.db')
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT is_banned, is_suspended, suspended_until, banned_reason, suspended_reason 
                    FROM users WHERE id = ?
                ''', (request.current_user_id,))
                user_status = cursor.fetchone()
                conn.close()
                
                if user_status:
                    is_banned, is_suspended, suspended_until, banned_reason, suspended_reason = user_status
                    
                    # Check if user is banned
                    if is_banned:
                        return jsonify({
                            'success': False, 
                            'message': 'Your account has been banned',
                            'banned': True,
                            'reason': banned_reason or 'No reason provided',
                            'contact_email': 'support@jobportal.com'
                        }), 403
                    
                    # Check if user is suspended
                    if is_suspended and suspended_until:
                        from datetime import datetime
                        try:
                            suspend_end = datetime.fromisoformat(suspended_until.replace('Z', '+00:00'))
                            if datetime.now().replace(tzinfo=suspend_end.tzinfo) < suspend_end:
                                days_remaining = (suspend_end - datetime.now().replace(tzinfo=suspend_end.tzinfo)).days + 1
                                return jsonify({
                                    'success': False,
                                    'message': f'Your account is suspended for {days_remaining} more days',
                                    'suspended': True,
                                    'reason': suspended_reason or 'No reason provided',
                                    'suspended_until': suspended_until,
                                    'contact_email': 'support@jobportal.com'
                                }), 403
                        except (ValueError, TypeError):
                            # If date parsing fails, assume suspension is permanent until manually lifted
                            return jsonify({
                                'success': False,
                                'message': 'Your account is currently suspended',
                                'suspended': True,
                                'reason': suspended_reason or 'No reason provided',
                                'contact_email': 'support@jobportal.com'
                            }), 403
                
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
    
    @app.route('/api/auth/profile/avatar', methods=['PUT'])
    @token_required
    def update_profile_avatar():
        """Update user profile picture"""
        try:
            data = request.get_json()
            
            if not data or 'avatar_url' not in data:
                return jsonify({
                    'success': False, 
                    'message': 'Avatar URL is required'
                }), 400
            
            avatar_url = data['avatar_url']
            
            # Validate URL format (basic validation)
            if not avatar_url.startswith(('http://', 'https://')):
                return jsonify({
                    'success': False, 
                    'message': 'Invalid avatar URL format'
                }), 400
            
            # Update avatar in database
            result = auth_service.update_user_avatar(
                request.current_user_id,
                request.current_user_type,
                avatar_url
            )
            
            status_code = 200 if result['success'] else 400
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error updating profile avatar: {e}")
            return jsonify({
                'success': False, 
                'message': 'Failed to update profile avatar'
            }), 500
    
    @app.route('/api/auth/profile/cover', methods=['PUT'])
    @token_required
    def update_cover_photo():
        """Update user cover photo"""
        try:
            data = request.get_json()
            
            if not data or 'cover_url' not in data:
                return jsonify({
                    'success': False, 
                    'message': 'Cover URL is required'
                }), 400
            
            cover_url = data['cover_url']
            
            # Validate URL format (basic validation)
            if not cover_url.startswith(('http://', 'https://')):
                return jsonify({
                    'success': False, 
                    'message': 'Invalid cover URL format'
                }), 400
            
            # Update cover photo in database
            result = auth_service.update_user_cover(
                request.current_user_id,
                request.current_user_type,
                cover_url
            )
            
            status_code = 200 if result['success'] else 400
            return jsonify(result), status_code
            
        except Exception as e:
            logger.error(f"Error updating cover photo: {e}")
            return jsonify({
                'success': False, 
                'message': 'Failed to update cover photo'
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
            logger.info(f"Admin approve job request - Job ID: {job_id}, User ID: {request.current_user_id}")
            data = request.get_json() or {}
            admin_notes = data.get('admin_notes', '')
            
            result = job_service.approve_job_posting(
                job_id, 
                request.current_user_id, 
                admin_notes
            )
            
            logger.info(f"Approve job result: {result}")
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
    
    # Company Management Endpoints
    @app.route('/api/companies/pending', methods=['GET'])
    @token_required
    @admin_required
    def get_pending_companies():
        """Get companies pending approval (admin only)"""
        try:
            companies = auth_service.get_pending_companies()
            
            return jsonify({
                'success': True,
                'companies': companies
            })
            
        except Exception as e:
            logger.error(f"Error getting pending companies: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/companies/<int:company_id>/approve', methods=['POST'])
    @token_required
    @admin_required
    def approve_company(company_id):
        """Approve a company profile (admin only)"""
        try:
            result = auth_service.approve_company(
                company_id, 
                request.current_user_id
            )
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 400
            
        except Exception as e:
            logger.error(f"Error approving company {company_id}: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/companies/<int:company_id>/reject', methods=['POST'])
    @token_required
    @admin_required
    def reject_company(company_id):
        """Reject a company profile (admin only)"""
        try:
            data = request.get_json() or {}
            reason = data.get('reason', '')
            
            result = auth_service.reject_company(
                company_id, 
                request.current_user_id,
                reason
            )
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 400
            
        except Exception as e:
            logger.error(f"Error rejecting company {company_id}: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    @app.route('/api/companies/statistics', methods=['GET'])
    @token_required
    @admin_required
    def get_company_statistics():
        """Get company statistics (admin only)"""
        try:
            stats = auth_service.get_company_statistics()
            
            return jsonify({
                'success': True,
                'statistics': stats
            })
            
        except Exception as e:
            logger.error(f"Error getting company statistics: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/companies', methods=['GET'])
    @token_required
    @admin_required
    def get_admin_companies():
        """Get all companies for admin management with pagination"""
        try:
            # Get pagination parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            search = request.args.get('search', '', type=str)
            status = request.args.get('status', '', type=str)
            sort_by = request.args.get('sort_by', 'created_at', type=str)
            sort_order = request.args.get('sort_order', 'desc', type=str)
            
            # Validate pagination parameters
            if page < 1:
                page = 1
            if per_page < 1 or per_page > 100:
                per_page = 10
            
            # Validate sort parameters
            valid_sort_fields = ['company_name', 'email', 'created_at', 'is_approved', 'is_active']
            if sort_by not in valid_sort_fields:
                sort_by = 'created_at'
            if sort_order not in ['asc', 'desc']:
                sort_order = 'desc'
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Build WHERE clause for filters
            where_conditions = ["u.user_type = 'company'"]
            params = []
            
            if search:
                where_conditions.append("(cp.company_name LIKE ? OR u.email LIKE ? OR cp.industry LIKE ? OR cp.location LIKE ?)")
                search_param = f"%{search}%"
                params.extend([search_param, search_param, search_param, search_param])
            
            if status:
                if status == 'active':
                    where_conditions.append("u.is_active = 1")
                elif status == 'inactive':
                    where_conditions.append("u.is_active = 0")
                elif status == 'approved':
                    where_conditions.append("cp.is_approved = 1")
                elif status == 'pending':
                    where_conditions.append("cp.is_approved = 0")
                elif status == 'banned':
                    where_conditions.append("u.is_banned = 1")
                elif status == 'suspended':
                    where_conditions.append("u.is_suspended = 1")
            
            where_clause = " AND ".join(where_conditions)
            
            # Get total count for pagination
            count_query = f'''
                SELECT COUNT(DISTINCT u.id)
                FROM users u
                LEFT JOIN company_profiles cp ON u.id = cp.user_id
                WHERE {where_clause}
            '''
            cursor.execute(count_query, params)
            total_companies = cursor.fetchone()[0]
            
            # Calculate pagination
            total_pages = (total_companies + per_page - 1) // per_page
            offset = (page - 1) * per_page
            
            # Get paginated companies with job counts
            companies_query = f'''
                SELECT 
                    u.id,
                    u.email,
                    u.created_at as user_created_at,
                    u.is_active,
                    u.is_banned,
                    u.is_suspended,
                    u.suspended_until,
                    cp.company_name,
                    cp.industry,
                    cp.company_size,
                    cp.location,
                    cp.website,
                    cp.company_description,
                    cp.logo_url,
                    cp.is_approved,
                    cp.approved_by,
                    cp.approved_at,
                    cp.created_at as profile_created_at,
                    COUNT(jp.id) as job_count
                FROM users u
                LEFT JOIN company_profiles cp ON u.id = cp.user_id
                LEFT JOIN job_postings jp ON u.id = jp.created_by_user_id AND jp.is_active = 1
                WHERE {where_clause}
                GROUP BY u.id
                ORDER BY {f"cp.{sort_by}" if sort_by != "email" and sort_by != "created_at" else f"u.{sort_by}"} {sort_order.upper()}
                LIMIT ? OFFSET ?
            '''
            
            cursor.execute(companies_query, params + [per_page, offset])
            
            companies = []
            for row in cursor.fetchall():
                company = {
                    'id': row[0],
                    'email': row[1],
                    'user_created_at': row[2],
                    'is_active': bool(row[3]),
                    'is_banned': bool(row[4]) if row[4] is not None else False,
                    'is_suspended': bool(row[5]) if row[5] is not None else False,
                    'suspended_until': row[6],
                    'company_name': row[7] or 'No Company Profile',
                    'industry': row[8],
                    'company_size': row[9],
                    'location': row[10],
                    'website': row[11],
                    'company_description': row[12],
                    'logo_url': row[13],
                    'is_approved': bool(row[14]) if row[14] is not None else False,
                    'approved_by': row[15],
                    'approved_at': row[16],
                    'profile_created_at': row[17],
                    'job_count': row[18],
                    'status': (
                        'banned' if row[4] else
                        'suspended' if row[5] else
                        'inactive' if not row[3] else
                        'approved' if row[14] else
                        'pending'
                    )
                }
                companies.append(company)
            
            conn.close()
            
            return jsonify({
                'success': True,
                'companies': companies,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_companies,
                    'total_pages': total_pages,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                }
            })
            
        except Exception as e:
            logger.error(f"Error getting admin companies: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error',
                'companies': [],
                'pagination': {
                    'page': 1,
                    'per_page': 10,
                    'total': 0,
                    'total_pages': 0,
                    'has_next': False,
                    'has_prev': False
                }
            }), 500

    @app.route('/api/admin/companies/<int:company_id>', methods=['PUT'])
    @token_required
    @admin_required
    def update_admin_company(company_id):
        """Update company details (admin only)"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if company exists
            cursor.execute("SELECT id FROM users WHERE id = ? AND user_type = 'company'", (company_id,))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Company not found'
                }), 404
            
            # Update user table fields
            user_updates = []
            user_params = []
            
            if 'is_active' in data:
                user_updates.append('is_active = ?')
                user_params.append(data['is_active'])
            
            if 'is_banned' in data:
                user_updates.append('is_banned = ?')
                user_params.append(data['is_banned'])
            
            if 'is_suspended' in data:
                user_updates.append('is_suspended = ?')
                user_params.append(data['is_suspended'])
            
            if 'suspended_until' in data:
                user_updates.append('suspended_until = ?')
                user_params.append(data['suspended_until'])
            
            if user_updates:
                user_params.append(company_id)
                cursor.execute(f"UPDATE users SET {', '.join(user_updates)} WHERE id = ?", user_params)
            
            # Update company profile fields
            profile_updates = []
            profile_params = []
            
            profile_fields = ['company_name', 'industry', 'company_size', 'location', 'website', 'company_description', 'logo_url']
            for field in profile_fields:
                if field in data:
                    profile_updates.append(f'{field} = ?')
                    profile_params.append(data[field])
            
            if 'is_approved' in data:
                profile_updates.append('is_approved = ?')
                profile_params.append(data['is_approved'])
                if data['is_approved']:
                    profile_updates.append('approved_by = ?')
                    profile_updates.append('approved_at = ?')
                    profile_params.extend([request.current_user_id, datetime.utcnow().isoformat()])
            
            if profile_updates:
                profile_params.append(company_id)
                cursor.execute(f"UPDATE company_profiles SET {', '.join(profile_updates)} WHERE user_id = ?", profile_params)
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Company updated successfully'
            })
            
        except Exception as e:
            logger.error(f"Error updating company {company_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/companies/<int:company_id>', methods=['DELETE'])
    @token_required
    @admin_required
    def delete_admin_company(company_id):
        """Delete company and all related data (admin only)"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if company exists
            cursor.execute("SELECT id FROM users WHERE id = ? AND user_type = 'company'", (company_id,))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Company not found'
                }), 404
            
            # Delete related data in order (respecting foreign key constraints)
            cursor.execute("DELETE FROM job_postings WHERE created_by_user_id = ?", (company_id,))
            cursor.execute("DELETE FROM company_profiles WHERE user_id = ?", (company_id,))
            cursor.execute("DELETE FROM users WHERE id = ?", (company_id,))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Company deleted successfully'
            })
            
        except Exception as e:
            logger.error(f"Error deleting company {company_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/companies/<int:company_id>/ban', methods=['POST'])
    @token_required
    @admin_required
    def ban_company(company_id):
        """Ban a company (admin only)"""
        try:
            data = request.get_json() or {}
            reason = data.get('reason', '')
            duration = data.get('duration')  # Optional: permanent if not provided
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if company exists
            cursor.execute("SELECT id FROM users WHERE id = ? AND user_type = 'company'", (company_id,))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Company not found'
                }), 404
            
            # Update company status
            ban_until = None
            if duration:
                ban_until = (datetime.utcnow() + timedelta(days=int(duration))).isoformat()
            
            cursor.execute("""
                UPDATE users 
                SET is_banned = 1, is_active = 0, banned_reason = ?, banned_until = ?, banned_by = ?, banned_at = ?
                WHERE id = ?
            """, (reason, ban_until, request.current_user_id, datetime.utcnow().isoformat(), company_id))
            
            # Deactivate all their job postings
            cursor.execute("UPDATE job_postings SET is_active = 0 WHERE created_by_user_id = ?", (company_id,))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': f'Company banned successfully{f" for {duration} days" if duration else " permanently"}'
            })
            
        except Exception as e:
            logger.error(f"Error banning company {company_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/companies/<int:company_id>/suspend', methods=['POST'])
    @token_required
    @admin_required
    def suspend_company(company_id):
        """Suspend a company temporarily (admin only)"""
        try:
            data = request.get_json() or {}
            reason = data.get('reason', '')
            duration = data.get('duration', 7)  # Default 7 days
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if company exists
            cursor.execute("SELECT id FROM users WHERE id = ? AND user_type = 'company'", (company_id,))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Company not found'
                }), 404
            
            # Calculate suspension end date
            suspended_until = (datetime.utcnow() + timedelta(days=int(duration))).isoformat()
            
            # Update company status
            cursor.execute("""
                UPDATE users 
                SET is_suspended = 1, suspended_until = ?, suspended_reason = ?, suspended_by = ?, suspended_at = ?
                WHERE id = ?
            """, (suspended_until, reason, request.current_user_id, datetime.utcnow().isoformat(), company_id))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': f'Company suspended for {duration} days'
            })
            
        except Exception as e:
            logger.error(f"Error suspending company {company_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/users', methods=['GET'])
    def get_admin_users():
        """Get all users for admin management with pagination"""
        try:
            # Get pagination parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            search = request.args.get('search', '', type=str)
            user_type = request.args.get('user_type', '', type=str)
            status = request.args.get('status', '', type=str)
            sort_by = request.args.get('sort_by', 'created_at', type=str)
            sort_order = request.args.get('sort_order', 'desc', type=str)
            
            # Validate pagination parameters
            if page < 1:
                page = 1
            if per_page < 1 or per_page > 100:
                per_page = 10
            
            # Validate sort parameters
            valid_sort_fields = ['email', 'user_type', 'created_at', 'is_active']
            if sort_by not in valid_sort_fields:
                sort_by = 'created_at'
            if sort_order not in ['asc', 'desc']:
                sort_order = 'desc'
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Build WHERE clause for filters
            where_conditions = ["1=1"]  # Always true condition to start
            params = []
            
            if search:
                where_conditions.append("u.email LIKE ?")
                search_param = f"%{search}%"
                params.append(search_param)
            
            if user_type:
                where_conditions.append("u.user_type = ?")
                params.append(user_type)
            
            if status:
                if status == 'active':
                    where_conditions.append("u.is_active = 1 AND COALESCE(u.is_banned, 0) = 0 AND COALESCE(u.is_suspended, 0) = 0")
                elif status == 'inactive':
                    where_conditions.append("u.is_active = 0")
                elif status == 'banned':
                    where_conditions.append("COALESCE(u.is_banned, 0) = 1")
                elif status == 'suspended':
                    where_conditions.append("COALESCE(u.is_suspended, 0) = 1")
            
            where_clause = " AND ".join(where_conditions)
            
            # Get total count for pagination
            count_query = f'''
                SELECT COUNT(u.id)
                FROM users u
                WHERE {where_clause}
            '''
            cursor.execute(count_query, params)
            total_users = cursor.fetchone()[0]
            
            # Calculate pagination
            total_pages = (total_users + per_page - 1) // per_page
            offset = (page - 1) * per_page
            
            # Get paginated users
            users_query = f'''
                SELECT 
                    u.id,
                    u.email,
                    u.user_type,
                    u.created_at,
                    u.is_active,
                    COALESCE(u.is_banned, 0) as is_banned,
                    COALESCE(u.is_suspended, 0) as is_suspended,
                    u.suspended_until,
                    u.banned_until,
                    u.banned_reason,
                    u.suspended_reason
                FROM users u
                WHERE {where_clause}
                ORDER BY u.{sort_by} {sort_order.upper()}
                LIMIT ? OFFSET ?
            '''
            
            cursor.execute(users_query, params + [per_page, offset])
            
            users = []
            for row in cursor.fetchall():
                user = {
                    'id': row[0],
                    'email': row[1],
                    'user_type': row[2],
                    'created_at': row[3],
                    'is_active': bool(row[4]),
                    'is_banned': bool(row[5]),
                    'is_suspended': bool(row[6]),
                    'suspended_until': row[7],
                    'banned_until': row[8],
                    'banned_reason': row[9],
                    'suspended_reason': row[10],
                    'status': (
                        'banned' if row[5] else
                        'suspended' if row[6] else
                        'active' if row[4] else
                        'inactive'
                    )
                }
                users.append(user)
            
            # Get statistics for all users (not filtered)
            stats_query = '''
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_active = 1 AND COALESCE(is_banned, 0) = 0 AND COALESCE(is_suspended, 0) = 0 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN COALESCE(is_suspended, 0) = 1 THEN 1 ELSE 0 END) as suspended,
                    SUM(CASE WHEN COALESCE(is_banned, 0) = 1 THEN 1 ELSE 0 END) as banned,
                    SUM(CASE WHEN user_type = 'company' THEN 1 ELSE 0 END) as companies,
                    SUM(CASE WHEN user_type = 'jobseeker' THEN 1 ELSE 0 END) as jobseekers,
                    SUM(CASE WHEN user_type = 'admin' THEN 1 ELSE 0 END) as admins,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as verified
                FROM users
            '''
            cursor.execute(stats_query)
            stats_row = cursor.fetchone()
            
            statistics = {
                'total': stats_row[0] or 0,
                'active': stats_row[1] or 0,
                'suspended': stats_row[2] or 0,
                'banned': stats_row[3] or 0,
                'companies': stats_row[4] or 0,
                'jobseekers': stats_row[5] or 0,
                'admins': stats_row[6] or 0,
                'verified': stats_row[7] or 0
            }
            
            conn.close()
            
            return jsonify({
                'success': True,
                'users': users,
                'statistics': statistics,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_users,
                    'total_pages': total_pages,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                }
            })
            
        except Exception as e:
            logger.error(f"Error getting admin users: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error',
                'users': [],
                'pagination': {
                    'page': 1,
                    'per_page': 10,
                    'total': 0,
                    'total_pages': 0,
                    'has_next': False,
                    'has_prev': False
                }
            }), 500

    @app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
    def update_admin_user(user_id):
        """Update user details (admin only)"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT id, user_type FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Prevent admins from editing other admin users (except themselves)
            if user[1] == 'admin' and user_id != request.current_user_id:
                return jsonify({
                    'success': False,
                    'message': 'Cannot edit other admin users'
                }), 400
            
            # Update user table fields
            user_updates = []
            user_params = []
            
            if 'is_active' in data:
                user_updates.append('is_active = ?')
                user_params.append(data['is_active'])
            
            if 'is_banned' in data:
                user_updates.append('is_banned = ?')
                user_params.append(data['is_banned'])
            
            if 'is_suspended' in data:
                user_updates.append('is_suspended = ?')
                user_params.append(data['is_suspended'])
            
            if 'suspended_until' in data:
                user_updates.append('suspended_until = ?')
                user_params.append(data['suspended_until'])
            
            if 'email' in data:
                # Check if email already exists
                cursor.execute("SELECT id FROM users WHERE email = ? AND id != ?", (data['email'], user_id))
                if cursor.fetchone():
                    return jsonify({
                        'success': False,
                        'message': 'Email already exists'
                    }), 400
                user_updates.append('email = ?')
                user_params.append(data['email'])
            
            if user_updates:
                user_params.append(user_id)
                cursor.execute(f"UPDATE users SET {', '.join(user_updates)} WHERE id = ?", user_params)
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'User updated successfully'
            })
            
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/users/<int:user_id>/ban', methods=['POST'])
    @token_required
    @admin_required
    def ban_user(user_id):
        """Ban a user (admin only)"""
        try:
            data = request.get_json() or {}
            reason = data.get('reason', '')
            duration = data.get('duration')  # Optional: permanent if not provided
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if user exists and is not admin
            cursor.execute("SELECT id, user_type FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            if user[1] == 'admin':
                return jsonify({
                    'success': False,
                    'message': 'Cannot ban admin users'
                }), 400
            
            # Update user status
            ban_until = None
            if duration:
                ban_until = (datetime.utcnow() + timedelta(days=int(duration))).isoformat()
            
            cursor.execute("""
                UPDATE users 
                SET is_banned = 1, is_active = 0, banned_reason = ?, banned_until = ?, banned_by = ?, banned_at = ?
                WHERE id = ?
            """, (reason, ban_until, request.current_user_id, datetime.utcnow().isoformat(), user_id))
            
            # If it's a company, deactivate their job postings
            if user[1] == 'company':
                cursor.execute("UPDATE job_postings SET is_active = 0 WHERE created_by_user_id = ?", (user_id,))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': f'User banned successfully{f" for {duration} days" if duration else " permanently"}'
            })
            
        except Exception as e:
            logger.error(f"Error banning user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/users/<int:user_id>/unban', methods=['POST'])
    @token_required
    @admin_required
    def unban_user(user_id):
        """Unban a user (admin only)"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT id, user_type FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Update user status - remove ban
            cursor.execute("""
                UPDATE users 
                SET is_banned = 0, is_active = 1, banned_reason = NULL, banned_until = NULL, 
                    banned_by = NULL, banned_at = NULL
                WHERE id = ?
            """, (user_id,))
            
            # If it's a company, reactivate their job postings (optional - might want admin control over this)
            if user[1] == 'company':
                cursor.execute("UPDATE job_postings SET is_active = 1 WHERE created_by_user_id = ? AND approved_by_admin = 1", (user_id,))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'User unbanned successfully'
            })
            
        except Exception as e:
            logger.error(f"Error unbanning user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/users/<int:user_id>/suspend', methods=['POST'])
    # @token_required
    # @admin_required
    def suspend_user(user_id):
        """Suspend a user temporarily (admin only)"""
        try:
            data = request.get_json() or {}
            reason = data.get('reason', '')
            duration = data.get('duration', 7)  # Default 7 days
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if user exists and is not admin
            cursor.execute("SELECT id, user_type FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            if user[1] == 'admin':
                return jsonify({
                    'success': False,
                    'message': 'Cannot suspend admin users'
                }), 400
            
            # Calculate suspension end date
            suspended_until = (datetime.utcnow() + timedelta(days=int(duration))).isoformat()
            
            # Update user status
            cursor.execute("""
                UPDATE users 
                SET is_suspended = 1, suspended_until = ?, suspended_reason = ?, suspended_by = ?, suspended_at = ?
                WHERE id = ?
            """, (suspended_until, reason, 1, datetime.utcnow().isoformat(), user_id))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': f'User suspended for {duration} days'
            })
            
        except Exception as e:
            logger.error(f"Error suspending user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/users/<int:user_id>/activate', methods=['POST'])
    @token_required
    @admin_required
    def activate_user(user_id):
        """Activate/unban/unsuspend a user (admin only)"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Clear all restrictions and activate user
            cursor.execute("""
                UPDATE users 
                SET is_active = 1, is_banned = 0, is_suspended = 0, 
                    banned_until = NULL, suspended_until = NULL,
                    banned_reason = NULL, suspended_reason = NULL,
                    banned_by = NULL, suspended_by = NULL,
                    banned_at = NULL, suspended_at = NULL
                WHERE id = ?
            """, (user_id,))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'User activated successfully'
            })
            
        except Exception as e:
            logger.error(f"Error activating user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/users/create', methods=['POST'])
    def create_user():
        """Create a new user (admin only)"""
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data or not data.get('email') or not data.get('password'):
                return jsonify({
                    'success': False,
                    'message': 'Email and password are required'
                }), 400
            
            email = data.get('email').strip().lower()
            password = data.get('password')
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            user_type = data.get('user_type', 'jobseeker')
            phone = data.get('phone', '').strip()
            location = data.get('location', '').strip()
            company_name = data.get('company_name', '').strip()
            
            # Validate user type
            valid_user_types = ['jobseeker', 'company', 'admin', 'manager']
            if user_type not in valid_user_types:
                return jsonify({
                    'success': False,
                    'message': 'Invalid user type'
                }), 400
            
            # Validate email format
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                return jsonify({
                    'success': False,
                    'message': 'Invalid email format'
                }), 400
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'User with this email already exists'
                }), 400
            
            # Hash password
            import hashlib
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            
            # Create user
            cursor.execute("""
                INSERT INTO users (
                    email, password_hash, user_type,
                    is_active, is_verified, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                email, hashed_password, user_type,
                True, True, datetime.utcnow().isoformat()
            ))
            
            user_id = cursor.lastrowid
            
            # Create user profile with basic info
            if first_name or last_name or phone:
                cursor.execute("""
                    INSERT INTO user_profiles (
                        user_id, first_name, last_name, phone, created_at
                    ) VALUES (?, ?, ?, ?, ?)
                """, (user_id, first_name, last_name, phone, datetime.utcnow().isoformat()))
            
            # Create specific profile based on user type
            if user_type == 'company' and company_name:
                cursor.execute("""
                    INSERT INTO company_profiles (
                        user_id, company_name, is_approved, created_at
                    ) VALUES (?, ?, ?, ?)
                """, (user_id, company_name, True, datetime.utcnow().isoformat()))
            elif user_type == 'jobseeker' and location:
                cursor.execute("""
                    INSERT INTO jobseeker_profiles (
                        user_id, location, available_for_work, created_at
                    ) VALUES (?, ?, ?, ?)
                """, (user_id, location, True, datetime.utcnow().isoformat()))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'User created successfully',
                'user_id': user_id
            })
            
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
    @token_required
    @admin_required
    def delete_user(user_id):
        """Delete a user and all related data (admin only)"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if user exists and is not admin
            cursor.execute("SELECT id, user_type FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            if user[1] == 'admin':
                return jsonify({
                    'success': False,
                    'message': 'Cannot delete admin users'
                }), 400
            
            # Delete related data in order (respecting foreign key constraints)
            cursor.execute("DELETE FROM job_postings WHERE created_by_user_id = ?", (user_id,))
            cursor.execute("DELETE FROM company_profiles WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM jobseeker_profiles WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'User deleted successfully'
            })
            
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/companies/public', methods=['GET'])
    def get_public_companies():
        """Get approved company profiles for public browsing with pagination"""
        try:
            # Get pagination parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 12, type=int)
            search = request.args.get('search', '', type=str)
            industry = request.args.get('industry', '', type=str)
            company_size = request.args.get('company_size', '', type=str)
            location = request.args.get('location', '', type=str)
            sort_by = request.args.get('sort_by', 'company_name', type=str)
            sort_order = request.args.get('sort_order', 'asc', type=str)
            
            # Validate pagination parameters
            if page < 1:
                page = 1
            if per_page < 1 or per_page > 100:
                per_page = 12
            
            # Validate sort parameters
            valid_sort_fields = ['company_name', 'industry', 'company_size', 'location', 'created_at']
            if sort_by not in valid_sort_fields:
                sort_by = 'company_name'
            if sort_order not in ['asc', 'desc']:
                sort_order = 'asc'
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Build WHERE clause for filters
            where_conditions = ["u.user_type = 'company' AND u.is_active = 1 AND cp.is_approved = 1"]
            params = []
            
            if search:
                where_conditions.append("(cp.company_name LIKE ? OR cp.industry LIKE ? OR cp.location LIKE ? OR cp.company_description LIKE ?)")
                search_param = f"%{search}%"
                params.extend([search_param, search_param, search_param, search_param])
            
            if industry:
                where_conditions.append("cp.industry = ?")
                params.append(industry)
            
            if company_size:
                where_conditions.append("cp.company_size = ?")
                params.append(company_size)
            
            if location:
                where_conditions.append("cp.location = ?")
                params.append(location)
            
            where_clause = " AND ".join(where_conditions)
            
            # Get total count for pagination
            count_query = f'''
                SELECT COUNT(DISTINCT u.id)
                FROM users u
                JOIN company_profiles cp ON u.id = cp.user_id
                LEFT JOIN job_postings jp ON u.id = jp.created_by_user_id AND jp.is_active = 1
                WHERE {where_clause}
            '''
            cursor.execute(count_query, params)
            total_companies = cursor.fetchone()[0]
            
            # Calculate pagination
            total_pages = (total_companies + per_page - 1) // per_page
            offset = (page - 1) * per_page
            
            # Get paginated companies with job counts
            companies_query = f'''
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
                LEFT JOIN job_postings jp ON u.id = jp.created_by_user_id AND jp.is_active = 1
                WHERE {where_clause}
                GROUP BY u.id
                ORDER BY cp.{sort_by} {sort_order.upper()}
                LIMIT ? OFFSET ?
            '''
            
            cursor.execute(companies_query, params + [per_page, offset])
            
            companies = []
            for row in cursor.fetchall():
                companies.append({
                    'id': row[0],
                    'email': row[1],
                    'company_name': row[2],
                    'industry': row[3],
                    'company_size': row[4],
                    'location': row[5],
                    'website': row[6],
                    'bio': row[7],  # company_description
                    'avatar_url': row[8],  # logo_url
                    'is_approved': bool(row[9]),
                    'created_at': row[10],
                    'job_count': row[11],
                    'rating': 4.0 + (hash(str(row[0])) % 10) / 10.0  # Mock rating for now
                })
            
            conn.close()
            
            return jsonify({
                'success': True,
                'companies': companies,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_companies,
                    'total_pages': total_pages,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                }
            })
            
        except Exception as e:
            logger.error(f"Error getting public companies: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error',
                'companies': [],
                'pagination': {
                    'page': 1,
                    'per_page': 12,
                    'total': 0,
                    'total_pages': 0,
                    'has_next': False,
                    'has_prev': False
                }
            }), 500

    @app.route('/api/jobs/categories', methods=['GET'])
    def get_job_categories():
        """Get job categories"""
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
        """Search endpoint that combines legacy scraped jobs with approved job postings"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get search parameters
            query = request.args.get('q', '')
            company = request.args.get('company')
            location = request.args.get('location')
            job_type = request.args.get('type')
            experience = request.args.get('experience')
            
            # Pagination
            page = int(request.args.get('page', 1))
            per_page = min(int(request.args.get('per_page', 20)), 100)
            offset = (page - 1) * per_page
            
            # Build conditions for legacy jobs table
            legacy_conditions = []
            legacy_params = []
            
            if query:
                legacy_conditions.append('(title LIKE ? OR company LIKE ? OR description LIKE ?)')
                legacy_params.extend([f'%{query}%', f'%{query}%', f'%{query}%'])
            
            if company:
                legacy_conditions.append('company LIKE ?')
                legacy_params.append(f'%{company}%')
            
            if location:
                legacy_conditions.append('location LIKE ?')
                legacy_params.append(f'%{location}%')
                
            if job_type:
                legacy_conditions.append('type LIKE ?')
                legacy_params.append(f'%{job_type}%')
                
            if experience:
                legacy_conditions.append('experience_level LIKE ?')
                legacy_params.append(f'%{experience}%')
            
            legacy_where = ' AND '.join(legacy_conditions) if legacy_conditions else '1=1'
            
            # Build conditions for job_postings table
            posting_conditions = []
            posting_params = []
            
            if query:
                posting_conditions.append('(title LIKE ? OR company LIKE ? OR description LIKE ?)')
                posting_params.extend([f'%{query}%', f'%{query}%', f'%{query}%'])
            
            if company:
                posting_conditions.append('company LIKE ?')
                posting_params.append(f'%{company}%')
            
            if location:
                posting_conditions.append('location LIKE ?')
                posting_params.append(f'%{location}%')
                
            if job_type:
                posting_conditions.append('job_type LIKE ?')
                posting_params.append(f'%{job_type}%')
                
            if experience:
                posting_conditions.append('experience_level LIKE ?')
                posting_params.append(f'%{experience}%')
            
            posting_where = ' AND '.join(posting_conditions) if posting_conditions else '1=1'
            
            print(f"API Search called with: query='{query}', company='{company}', location='{location}', type='{job_type}', experience='{experience}'")
            
            # Union query to get both legacy jobs and approved job postings
            union_query = f'''
                SELECT 
                    id, title, company, location, type, experience_level, 
                    description, skills, apply_link, NULL as apply_email, posted_date,
                    salary_range as salary, 'legacy' as source_type
                FROM jobs 
                WHERE (is_active = 1 OR is_active IS NULL) AND {legacy_where}
                
                UNION ALL
                
                SELECT 
                    id, title, company, location, job_type as type, experience_level,
                    description, skills, apply_link, apply_email, posted_date,
                    CASE 
                        WHEN salary_max = 'Negotiable' THEN 'Negotiable'
                        WHEN salary_min IS NOT NULL AND salary_max IS NOT NULL THEN 
                            salary_min || '-' || salary_max || ' ' || COALESCE(salary_currency, 'BDT')
                        WHEN salary_min IS NOT NULL THEN 
                            salary_min || '+ ' || COALESCE(salary_currency, 'BDT')
                        WHEN salary_max IS NOT NULL AND salary_max != 'Negotiable' THEN 
                            'Up to ' || salary_max || ' ' || COALESCE(salary_currency, 'BDT')
                        ELSE NULL
                    END as salary,
                    'job_posting' as source_type
                FROM job_postings 
                WHERE approved_by_admin = 1 AND status = 'active' AND {posting_where}
                
                ORDER BY posted_date DESC
                LIMIT ? OFFSET ?
            '''
            
            # Add pagination params (twice for each SELECT)
            query_params = legacy_params + posting_params + [per_page, offset]
            
            cursor.execute(union_query, query_params)
            jobs = cursor.fetchall()
            
            # Get total count from both tables
            count_query = f'''
                SELECT COUNT(*) FROM (
                    SELECT id FROM jobs WHERE (is_active = 1 OR is_active IS NULL) AND {legacy_where}
                    UNION ALL
                    SELECT id FROM job_postings WHERE approved_by_admin = 1 AND status = 'active' AND {posting_where}
                )
            '''
            cursor.execute(count_query, legacy_params + posting_params)
            total = cursor.fetchone()[0]
            
            # Format jobs
            formatted_jobs = []
            for job in jobs:
                formatted_job = {
                    'id': job[0],
                    'title': job[1],
                    'company': job[2],
                    'location': job[3],
                    'job_type': job[4],
                    'experience_level': job[5],
                    'description': job[6],
                    'skills': job[7],
                    'apply_link': job[8],
                    'apply_email': job[9],
                    'posted_date': job[10],
                    'salary': job[11],
                    'source_type': job[12]
                }
                formatted_jobs.append(formatted_job)
            
            print(f"Search result: {len(formatted_jobs)} jobs found, total: {total}")
            
            conn.close()
            
            return jsonify({
                'success': True,
                'jobs': formatted_jobs,
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            })
            
        except Exception as e:
            logger.error(f"Error in search: {e}")
            return jsonify({'success': False, 'message': 'Search failed'}), 500

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
                'blogs': '/api/blogs/*',
                'admin': '/api/admin/*',
                'health': '/api/health',
                'info': '/api/info'
            }
        })
    
    # ============================================================================
    # BLOG API ENDPOINTS
    # ============================================================================
    
    @app.route('/api/blogs', methods=['GET'])
    def get_blogs():
        """Get blogs with filtering and pagination"""
        try:
            # Get query parameters
            page = int(request.args.get('page', 1))
            per_page = min(int(request.args.get('per_page', 10)), 50)  # Max 50 per page
            search = request.args.get('search', '')
            author_id = request.args.get('author_id', type=int)
            featured_only = request.args.get('featured_only', 'false').lower() == 'true'
            published_only = request.args.get('published_only', 'true').lower() == 'true'
            tags = request.args.get('tags', '')
            order_by = request.args.get('order_by', 'created_at')
            order_direction = request.args.get('order_direction', 'DESC')
            
            # Build filters
            filters = {
                'published_only': published_only,
                'search': search if search else None,
                'author_id': author_id,
                'featured_only': featured_only,
                'tags': tags if tags else None,
                'order_by': order_by,
                'order_direction': order_direction
            }
            
            # Remove None values
            filters = {k: v for k, v in filters.items() if v is not None}
            
            result = blog_service.search_blogs(filters, page, per_page)
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'blogs': result['blogs'],
                    'pagination': result['pagination']
                })
            else:
                return jsonify({
                    'success': False,
                    'message': result.get('message', 'Failed to fetch blogs')
                }), 500
                
        except Exception as e:
            logger.error(f"Error getting blogs: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/blogs/<int:blog_id>', methods=['GET'])
    def get_blog_by_id(blog_id):
        """Get a specific blog by ID"""
        try:
            increment_views = request.args.get('increment_views', 'false').lower() == 'true'
            blog = blog_service.get_blog_by_id(blog_id, increment_views)
            
            if blog:
                return jsonify({
                    'success': True,
                    'blog': blog
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Blog not found'
                }), 404
                
        except Exception as e:
            logger.error(f"Error getting blog {blog_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/blogs/slug/<slug>', methods=['GET'])
    def get_blog_by_slug(slug):
        """Get a specific blog by slug"""
        try:
            increment_views = request.args.get('increment_views', 'false').lower() == 'true'
            blog = blog_service.get_blog_by_slug(slug, increment_views)
            
            if blog:
                return jsonify({
                    'success': True,
                    'blog': blog
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Blog not found'
                }), 404
                
        except Exception as e:
            logger.error(f"Error getting blog by slug {slug}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/blogs', methods=['POST'])
    @token_required
    def create_blog():
        """Create a new blog post (authenticated users only)"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400
            
            # Validate required fields
            required_fields = ['title', 'content']
            for field in required_fields:
                if not data.get(field, '').strip():
                    return jsonify({
                        'success': False,
                        'message': f'{field.title()} is required'
                    }), 400
            
            result = blog_service.create_blog(data, request.current_user_id)
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'message': result['message'],
                    'blog_id': result['blog_id'],
                    'slug': result['slug']
                }), 201
            else:
                return jsonify({
                    'success': False,
                    'message': result['message']
                }), 400
                
        except Exception as e:
            logger.error(f"Error creating blog: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/blogs/<int:blog_id>', methods=['PUT'])
    @token_required
    def update_blog(blog_id):
        """Update a blog post (author only)"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400
            
            result = blog_service.update_blog(blog_id, data, request.current_user_id)
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'message': result['message']
                })
            else:
                status_code = 404 if 'not found' in result['message'].lower() else 403 if 'unauthorized' in result['message'].lower() else 400
                return jsonify({
                    'success': False,
                    'message': result['message']
                }), status_code
                
        except Exception as e:
            logger.error(f"Error updating blog {blog_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/blogs/<int:blog_id>', methods=['DELETE'])
    @token_required
    def delete_blog(blog_id):
        """Delete a blog post (author only)"""
        try:
            result = blog_service.delete_blog(blog_id, request.current_user_id)
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'message': result['message']
                })
            else:
                status_code = 404 if 'not found' in result['message'].lower() else 403 if 'unauthorized' in result['message'].lower() else 400
                return jsonify({
                    'success': False,
                    'message': result['message']
                }), status_code
                
        except Exception as e:
            logger.error(f"Error deleting blog {blog_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/blogs/upload-image', methods=['POST'])
    @token_required
    def upload_blog_image():
        """Upload image for blog posts (will implement Cloudinary integration)"""
        # For now, return a placeholder - we'll implement Cloudinary later
        return jsonify({
            'success': False,
            'message': 'Image upload not yet implemented. Please provide Cloudinary credentials to enable this feature.'
        }), 501
    
    # ============================================================================
    # SOCIAL FEATURES API ENDPOINTS
    # ============================================================================
    
    # --- FOLLOW/UNFOLLOW ENDPOINTS ---
    
    @app.route('/api/test/follow/<int:follower_id>/<int:following_id>', methods=['POST'])
    def test_follow(follower_id, following_id):
        """Test follow functionality without authentication"""
        try:
            result = social_service.follow_user(follower_id, following_id)
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error in test follow: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/test/unfollow/<int:follower_id>/<int:following_id>', methods=['POST'])
    def test_unfollow(follower_id, following_id):
        """Test unfollow functionality without authentication"""
        try:
            result = social_service.unfollow_user(follower_id, following_id)
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error in test unfollow: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/users/<int:user_id>/follow', methods=['POST'])
    def follow_user(user_id):
        """Follow a user - temporarily no auth for testing"""
        try:
            # For testing, use user_id = 1 as default current user
            current_user_id = 1
            
            result = social_service.follow_user(current_user_id, user_id)
            
            if result['success']:
                return jsonify(result)
            else:
                status_code = 400 if 'already following' in result['message'].lower() or 'cannot follow' in result['message'].lower() else 404
                return jsonify(result), status_code
                
        except Exception as e:
            logger.error(f"Error following user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/users/<int:user_id>/unfollow', methods=['POST'])
    def unfollow_user(user_id):
        """Unfollow a user - temporarily no auth for testing"""
        try:
            # For testing, use user_id = 1 as default current user
            current_user_id = 1
            
            result = social_service.unfollow_user(current_user_id, user_id)
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 400
                
        except Exception as e:
            logger.error(f"Error unfollowing user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/users/<int:user_id>/followers', methods=['GET'])
    def get_user_followers(user_id):
        """Get user's followers"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            
            result = social_service.get_user_followers(user_id, page, per_page)
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 500
                
        except Exception as e:
            logger.error(f"Error getting followers for user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/users/<int:user_id>/following', methods=['GET'])
    def get_user_following(user_id):
        """Get users that a user is following"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            
            result = social_service.get_user_following(user_id, page, per_page)
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 500
                
        except Exception as e:
            logger.error(f"Error getting following for user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/users/<int:user_id>/is-following', methods=['GET'])
    def check_is_following(user_id):
        """Check if current user is following another user - temporarily no auth for testing"""
        try:
            # For testing, use user_id = 1 as default current user
            current_user_id = 1
            
            is_following = social_service.is_following(current_user_id, user_id)
            return jsonify({
                'success': True,
                'is_following': is_following
            })
        except Exception as e:
            logger.error(f"Error checking follow status: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/users/following-status', methods=['POST'])
    def check_multiple_following_status():
        """Check following status for multiple users - for bulk loading"""
        try:
            data = request.get_json()
            user_ids = data.get('user_ids', [])
            
            # For testing, use user_id = 1 as default current user
            current_user_id = 1
            
            result = {}
            for user_id in user_ids:
                result[str(user_id)] = social_service.is_following(current_user_id, user_id)
            
            return jsonify({
                'success': True,
                'following_status': result
            })
        except Exception as e:
            logger.error(f"Error checking multiple follow status: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    # --- BLOG LIKES ENDPOINTS ---
    
    @app.route('/api/blogs/<int:blog_id>/like', methods=['POST'])
    @token_required
    def like_blog(blog_id):
        """Like a blog post"""
        try:
            result = social_service.like_blog(blog_id, request.current_user_id)
            
            if result['success']:
                # Send WebSocket notification for real-time updates
                websocket_manager = get_websocket_manager()
                if websocket_manager:
                    websocket_manager.emit_blog_liked(
                        blog_id, 
                        request.current_user_id, 
                        result.get('likes_count', 0)
                    )
                
                return jsonify(result)
            else:
                status_code = 404 if 'not found' in result['message'].lower() else 400
                return jsonify(result), status_code
                
        except Exception as e:
            logger.error(f"Error liking blog {blog_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/blogs/<int:blog_id>/unlike', methods=['POST'])
    @token_required
    def unlike_blog(blog_id):
        """Unlike a blog post"""
        try:
            result = social_service.unlike_blog(blog_id, request.current_user_id)
            
            if result['success']:
                # Send WebSocket notification for real-time updates
                websocket_manager = get_websocket_manager()
                if websocket_manager:
                    websocket_manager.emit_blog_unliked(
                        blog_id, 
                        request.current_user_id, 
                        result.get('likes_count', 0)
                    )
                
                return jsonify(result)
            else:
                return jsonify(result), 400
                
        except Exception as e:
            logger.error(f"Error unliking blog {blog_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/blogs/<int:blog_id>/is-liked', methods=['GET'])
    @token_required
    def check_blog_liked(blog_id):
        """Check if current user has liked a blog"""
        try:
            is_liked = social_service.is_blog_liked(blog_id, request.current_user_id)
            return jsonify({
                'success': True,
                'is_liked': is_liked
            })
        except Exception as e:
            logger.error(f"Error checking blog like status: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    # --- COMMENTS ENDPOINTS ---
    
    @app.route('/api/blogs/<int:blog_id>/comments', methods=['POST'])
    @token_required
    def add_blog_comment(blog_id):
        """Add a comment to a blog post"""
        try:
            data = request.get_json()
            
            if not data or not data.get('content'):
                return jsonify({
                    'success': False,
                    'message': 'Comment content is required'
                }), 400
            
            content = data.get('content', '').strip()
            parent_id = data.get('parent_id')  # For replies
            
            result = social_service.add_comment(blog_id, request.current_user_id, content, parent_id)
            
            if result['success']:
                # Send WebSocket notification for real-time updates
                websocket_manager = get_websocket_manager()
                if websocket_manager:
                    if parent_id:
                        # This is a reply
                        websocket_manager.emit_comment_reply(
                            blog_id, 
                            parent_id,
                            result.get('comment', {}),
                            request.current_user_id
                        )
                    else:
                        # This is a new comment
                        websocket_manager.emit_comment_added(
                            blog_id,
                            result.get('comment', {}),
                            request.current_user_id
                        )
                
                return jsonify(result), 201
            else:
                status_code = 404 if 'not found' in result['message'].lower() else 400
                return jsonify(result), status_code
                
        except Exception as e:
            logger.error(f"Error adding comment to blog {blog_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/blogs/<int:blog_id>/comments', methods=['GET'])
    def get_blog_comments(blog_id):
        """Get comments for a blog post"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            
            result = social_service.get_blog_comments(blog_id, page, per_page)
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 500
                
        except Exception as e:
            logger.error(f"Error getting comments for blog {blog_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/comments/<int:comment_id>/like', methods=['POST'])
    @token_required
    def like_comment(comment_id):
        """Like a comment"""
        try:
            result = social_service.like_comment(comment_id, request.current_user_id)
            
            if result['success']:
                return jsonify(result)
            else:
                status_code = 404 if 'not found' in result['message'].lower() else 400
                return jsonify(result), status_code
                
        except Exception as e:
            logger.error(f"Error liking comment {comment_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/comments/<int:comment_id>/unlike', methods=['POST'])
    @token_required
    def unlike_comment(comment_id):
        """Unlike a comment"""
        try:
            result = social_service.unlike_comment(comment_id, request.current_user_id)
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 400
                
        except Exception as e:
            logger.error(f"Error unliking comment {comment_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/comments/<int:comment_id>/is-liked', methods=['GET'])
    @token_required
    def check_comment_liked(comment_id):
        """Check if current user has liked a comment"""
        try:
            is_liked = social_service.is_comment_liked(comment_id, request.current_user_id)
            return jsonify({
                'success': True,
                'is_liked': is_liked
            })
        except Exception as e:
            logger.error(f"Error checking comment like status: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    # --- NOTIFICATIONS ENDPOINTS ---
    
    @app.route('/api/notifications', methods=['GET'])
    @token_required
    def get_notifications():
        """Get user notifications"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            unread_only = request.args.get('unread_only', 'false').lower() == 'true'
            
            result = social_service.get_user_notifications(
                request.current_user_id, page, per_page, unread_only
            )
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 500
                
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
    @token_required
    def mark_notification_read(notification_id):
        """Mark a notification as read"""
        try:
            result = social_service.mark_notification_read(notification_id, request.current_user_id)
            
            if result['success']:
                return jsonify(result)
            else:
                status_code = 404 if 'not found' in result['message'].lower() else 400
                return jsonify(result), status_code
                
        except Exception as e:
            logger.error(f"Error marking notification {notification_id} as read: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/notifications/read-all', methods=['POST'])
    @token_required
    def mark_all_notifications_read():
        """Mark all notifications as read"""
        try:
            result = social_service.mark_all_notifications_read(request.current_user_id)
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/notifications/unread-count', methods=['GET'])
    @token_required
    def get_unread_notification_count():
        """Get count of unread notifications"""
        try:
            count = social_service.get_unread_notification_count(request.current_user_id)
            return jsonify({
                'success': True,
                'unread_count': count
            })
        except Exception as e:
            logger.error(f"Error getting unread notification count: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    # --- USER PROFILE ENDPOINTS ---

    @app.route('/api/users/<int:user_id>/profile', methods=['GET'])
    def get_user_public_profile(user_id):
        """Get user's public profile with social stats"""
        try:
            # Get basic profile
            profile = auth_service.get_user_profile(user_id)
            if not profile:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Get social stats
            social_stats = social_service.get_user_social_stats(user_id)
            
            # Remove sensitive info for public profile
            public_profile = {
                'id': profile['id'],
                'email': profile['email'],
                'user_type': profile['user_type'],
                'first_name': profile.get('first_name', ''),
                'last_name': profile.get('last_name', ''),
                'avatar_url': profile.get('avatar_url', ''),
                'cover_url': profile.get('cover_url', ''),
                'bio': profile.get('bio', ''),
                'created_at': profile['created_at'],
                'social_stats': social_stats
            }
            
            # Add company/jobseeker specific public info
            if profile['user_type'] == 'company':
                public_profile.update({
                    'company_name': profile.get('company_name', ''),
                    'industry': profile.get('industry', ''),
                    'location': profile.get('location', ''),
                    'website': profile.get('website', ''),
                    'logo_url': profile.get('logo_url', ''),
                    'is_approved': profile.get('is_approved', False)
                })
            elif profile['user_type'] == 'jobseeker':
                public_profile.update({
                    'experience_level': profile.get('experience_level', ''),
                    'current_position': profile.get('current_position', ''),
                    'location': profile.get('location', ''),
                    'available_for_work': profile.get('available_for_work', True)
                })
            
            return jsonify({
                'success': True,
                'profile': public_profile
            })
            
        except Exception as e:
            logger.error(f"Error getting user profile {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500

    @app.route('/api/users/<int:user_id>/blogs', methods=['GET'])
    def get_user_blogs(user_id):
        """Get blogs posted by a specific user"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 10, type=int), 50)
            
            # Check if user exists
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            conn.close()
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            # Get user's blogs using simplified approach
            result = blog_service.search_blogs({
                'author_id': user_id,
                'published_only': False  # Show all user's blogs including drafts for their own profile
            }, page, per_page)
            
            if result['success']:
                pagination = result.get('pagination', {})
                return jsonify({
                    'success': True,
                    'blogs': result['blogs'],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': pagination.get('total_count', 0),
                        'pages': pagination.get('total_pages', 0),
                        'has_next': pagination.get('has_next', False),
                        'has_prev': pagination.get('has_prev', False)
                    }
                })
            else:
                return jsonify({
                    'success': False,
                    'message': result.get('message', 'Failed to fetch user blogs')
                }), 500
                
        except Exception as e:
            logger.error(f"Error getting user blogs {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            }), 500

    # === HOME FEED API ENDPOINTS ===
    
    @app.route('/api/home/feed', methods=['GET'])
    def get_home_feed():
        """
        Intelligent home feed API with advanced algorithmic ranking
        Features: Following-based priority, engagement scoring, content diversity, randomization
        """
        try:
            import random
            import math
            from datetime import datetime, timedelta
            
            # Get parameters
            page = int(request.args.get('page', 1))
            per_page = min(int(request.args.get('per_page', 15)), 30)  # Optimized for infinite scroll
            category = request.args.get('category', 'all')
            user_id = request.args.get('user_id', type=int)  # For personalization
            seed = request.args.get('seed', str(random.randint(1, 10000)))  # For consistent randomization
            
            # Set random seed for consistent results in pagination
            random.seed(f"{user_id}_{page}_{seed}")
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get user's following list for prioritization
            following_ids = []
            following_companies = []
            user_interests = []
            
            if user_id:
                # Get users/companies the user follows
                cursor.execute('''
                    SELECT following_id FROM user_follows 
                    WHERE follower_id = ?
                ''', (user_id,))
                following_ids = [row[0] for row in cursor.fetchall()]
                
                # Get user's interaction patterns for interest scoring
                cursor.execute('''
                    SELECT DISTINCT b.tags FROM blog_likes bl
                    JOIN blogs b ON bl.blog_id = b.id
                    WHERE bl.user_id = ? AND b.tags IS NOT NULL
                    LIMIT 20
                ''', (user_id,))
                for row in cursor.fetchall():
                    if row[0]:
                        try:
                            tags = json.loads(row[0])
                            user_interests.extend(tags)
                        except:
                            pass
            
            content_items = []
            
            # === FETCH JOBS WITH INTELLIGENT SCORING ===
            if category in ['all', 'jobs']:
                job_pool_size = per_page * 3 if category == 'all' else per_page * 2  # Get larger pool
                
                cursor.execute('''
                    SELECT j.id, j.title, j.description, j.location, j.salary_range, 
                           j.type, j.experience_level, j.scraped_at, j.company,
                           j.apply_link, j.view_count, j.skills,
                           COALESCE(cp.user_id, 0) as company_user_id,
                           COALESCE(cp.company_name, j.company) as display_company,
                           COALESCE(cp.industry, '') as company_industry
                    FROM jobs j
                    LEFT JOIN company_profiles cp ON j.company = cp.company_name
                    WHERE j.is_active = 1
                    ORDER BY j.scraped_at DESC
                    LIMIT ?
                ''', (job_pool_size,))
                
                jobs = cursor.fetchall()
                
                for job in jobs:
                    # Calculate intelligent priority score
                    priority_score = 0.5  # Base score
                    
                    # Following bonus (highest priority)
                    if job[12] and job[12] in following_ids:  # company_user_id in following
                        priority_score += 0.4
                    
                    # Engagement score
                    views = job[10] or 0
                    if views > 0:
                        # Logarithmic scaling for views
                        view_score = min(math.log10(views + 1) / 4, 0.2)
                        priority_score += view_score
                    
                    # Recency bonus (newer posts get slight boost)
                    if job[7]:  # scraped_at
                        try:
                            job_date = datetime.fromisoformat(job[7].replace('Z', '+00:00'))
                            days_old = (datetime.now() - job_date.replace(tzinfo=None)).days
                            if days_old <= 7:
                                priority_score += 0.15 * (7 - days_old) / 7
                        except:
                            pass
                    
                    # Interest matching bonus
                    if user_interests and job[11]:  # skills field
                        skills_lower = job[11].lower()
                        matching_interests = sum(1 for interest in user_interests 
                                               if interest.lower() in skills_lower)
                        if matching_interests > 0:
                            priority_score += min(matching_interests * 0.05, 0.1)
                    
                    # Add randomization factor (±0.2)
                    priority_score += random.uniform(-0.2, 0.2)
                    
                    content_items.append({
                        'id': f"job_{job[0]}",
                        'type': 'job',
                        'data': {
                            'id': job[0],
                            'title': job[1],
                            'description': job[2][:300] + '...' if len(job[2]) > 300 else job[2],
                            'company': job[13] or job[8] or 'Company',
                            'location': job[3],
                            'salary_range': job[4],
                            'job_type': job[5],
                            'experience_level': job[6],
                            'apply_link': job[9],
                            'created_at': job[7],
                            'skills': job[11],
                            'industry': job[14]
                        },
                        'created_at': job[7],
                        'engagement': {
                            'likes': 0,
                            'comments': 0,
                            'shares': 0,
                            'views': views
                        },
                        'priority': priority_score,
                        'content_source': 'followed_company' if job[12] in following_ids else 'general'
                    })
            
            # === FETCH BLOGS WITH INTELLIGENT SCORING ===
            if category in ['all', 'blogs']:
                blog_pool_size = per_page * 3 if category == 'all' else per_page * 2
                
                cursor.execute('''
                    SELECT b.id, b.title, b.content, b.excerpt, b.author_id, b.slug, 
                           b.created_at, b.likes_count, b.views_count, b.tags,
                           u.email, u.user_type,
                           COALESCE(up.first_name, '') as first_name,
                           COALESCE(up.last_name, '') as last_name,
                           COALESCE(cp.company_name, '') as company_name,
                           (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id) as comment_count
                    FROM blogs b
                    JOIN users u ON b.author_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    LEFT JOIN company_profiles cp ON u.id = cp.user_id
                    WHERE b.is_published = 1
                    ORDER BY b.created_at DESC
                    LIMIT ?
                ''', (blog_pool_size,))
                
                blogs = cursor.fetchall()
                
                for blog in blogs:
                    # Calculate intelligent priority score
                    priority_score = 0.6  # Base score (slightly higher than jobs)
                    
                    # Following bonus (highest priority)
                    if blog[4] in following_ids:  # author_id in following
                        priority_score += 0.5
                    
                    # Engagement score
                    likes = blog[7] or 0
                    views = blog[8] or 0
                    comments = blog[15] or 0
                    
                    # Calculate engagement score
                    engagement_score = 0
                    if likes > 0:
                        engagement_score += min(math.log10(likes + 1) / 3, 0.15)
                    if views > 0:
                        engagement_score += min(math.log10(views + 1) / 5, 0.1)
                    if comments > 0:
                        engagement_score += min(comments * 0.02, 0.1)
                    
                    priority_score += engagement_score
                    
                    # Recency bonus
                    if blog[6]:  # created_at
                        try:
                            blog_date = datetime.fromisoformat(blog[6])
                            days_old = (datetime.now() - blog_date).days
                            if days_old <= 7:
                                priority_score += 0.2 * (7 - days_old) / 7
                        except:
                            pass
                    
                    # Interest/tag matching bonus
                    blog_tags = []
                    if blog[9]:  # tags
                        try:
                            blog_tags = json.loads(blog[9])
                        except:
                            pass
                    
                    if user_interests and blog_tags:
                        matching_tags = len(set(user_interests) & set(blog_tags))
                        if matching_tags > 0:
                            priority_score += min(matching_tags * 0.08, 0.15)
                    
                    # Add randomization factor (±0.25)
                    priority_score += random.uniform(-0.25, 0.25)
                    
                    # Determine author name
                    author_name = blog[14] or blog[10]  # company_name or email
                    if blog[12] and blog[13]:  # first_name and last_name
                        author_name = f"{blog[12]} {blog[13]}"
                    
                    content_items.append({
                        'id': f"blog_{blog[0]}",
                        'type': 'blog',
                        'data': {
                            'id': blog[0],
                            'title': blog[1],
                            'content': blog[2][:300] + '...' if len(blog[2]) > 300 else blog[2],
                            'excerpt': blog[3],
                            'author_id': blog[4],
                            'author_name': author_name,
                            'author_type': blog[11],
                            'slug': blog[5],
                            'created_at': blog[6],
                            'tags': blog_tags
                        },
                        'created_at': blog[6],
                        'engagement': {
                            'likes': likes,
                            'comments': comments,
                            'shares': 0,
                            'views': views
                        },
                        'priority': priority_score,
                        'content_source': 'followed_user' if blog[4] in following_ids else 'general'
                    })
            
            conn.close()
            
            # === INTELLIGENT RANKING AND PAGINATION ===
            
            # Sort by priority score (highest first)
            content_items.sort(key=lambda x: x['priority'], reverse=True)
            
            # Apply content diversity (avoid too many of same type in sequence)
            if category == 'all' and len(content_items) > 10:
                diversified_items = []
                remaining_items = content_items.copy()
                
                # Ensure diversity in first 10 items
                type_counts = {'job': 0, 'blog': 0}
                max_consecutive = 3
                last_type = None
                consecutive_count = 0
                
                while remaining_items and len(diversified_items) < per_page * 2:
                    # Find next best item considering diversity
                    best_item = None
                    best_idx = 0
                    
                    for idx, item in enumerate(remaining_items[:20]):  # Look at top 20
                        item_type = item['type']
                        
                        # If we've had too many consecutive of same type, skip
                        if (last_type == item_type and consecutive_count >= max_consecutive and
                            len(diversified_items) < 15):  # Only enforce for first 15 items
                            continue
                        
                        best_item = item
                        best_idx = idx
                        break
                    
                    if not best_item:  # Fallback to first available
                        best_item = remaining_items[0]
                        best_idx = 0
                    
                    # Update tracking
                    if best_item['type'] == last_type:
                        consecutive_count += 1
                    else:
                        consecutive_count = 1
                        last_type = best_item['type']
                    
                    diversified_items.append(best_item)
                    remaining_items.pop(best_idx)
                
                content_items = diversified_items
            
            # Apply pagination with proper offset
            offset = (page - 1) * per_page
            paginated_content = content_items[offset:offset + per_page]
            
            # Calculate if there are more items
            has_more = len(content_items) > offset + per_page
            
            # Add algorithm insights for debugging
            content_stats = {
                'total_fetched': len(content_items),
                'jobs': len([x for x in content_items if x['type'] == 'job']),
                'blogs': len([x for x in content_items if x['type'] == 'blog']),
                'followed_content': len([x for x in content_items if x.get('content_source', '').startswith('followed')]),
                'avg_priority': sum(x['priority'] for x in content_items) / len(content_items) if content_items else 0
            }
            
            return jsonify({
                'success': True,
                'content': paginated_content,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'has_next': has_more,
                    'has_prev': page > 1,
                    'total_available': len(content_items)  # Available in this fetch
                },
                'meta': {
                    'category': category,
                    'algorithm_version': '2.0',
                    'personalized': bool(user_id),
                    'seed': seed,
                    'stats': content_stats
                }
            })
            
        except Exception as e:
            logger.error(f"Error fetching intelligent home feed: {e}")
            return jsonify({
                'success': False,
                'message': f'Internal server error: {str(e)}',
                'content': [],
                'pagination': {}
            }), 500

    @app.route('/api/home/stats', methods=['GET'])
    def get_home_stats():
        """Get overall platform statistics for home page widgets"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get active jobs count
            cursor.execute('SELECT COUNT(*) FROM jobs WHERE is_active = 1')
            active_jobs = cursor.fetchone()[0]
            
            # Get new jobs this week
            cursor.execute('''
                SELECT COUNT(*) FROM jobs 
                WHERE is_active = 1 AND created_at > datetime('now', '-7 days')
            ''')
            new_jobs_week = cursor.fetchone()[0]
            
            # Get companies hiring
            cursor.execute('''
                SELECT COUNT(DISTINCT company_id) FROM jobs 
                WHERE is_active = 1 AND created_at > datetime('now', '-30 days')
            ''')
            companies_hiring = cursor.fetchone()[0]
            
            # Get total registered users
            cursor.execute('SELECT COUNT(*) FROM users WHERE is_active = 1')
            total_users = cursor.fetchone()[0]
            
            # Get total blog posts
            cursor.execute('SELECT COUNT(*) FROM blogs WHERE is_published = 1')
            total_blogs = cursor.fetchone()[0]
            
            conn.close()
            
            return jsonify({
                'success': True,
                'stats': {
                    'active_jobs': active_jobs,
                    'new_jobs_week': new_jobs_week,
                    'companies_hiring': companies_hiring,
                    'total_users': total_users,
                    'total_blogs': total_blogs,
                    'last_updated': datetime.now().isoformat()
                }
            })
            
        except Exception as e:
            logger.error(f"Error fetching home stats: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch statistics'
            }), 500

    @app.route('/api/users/<int:user_id>/activity-feed', methods=['GET'])
    def get_user_activity_feed(user_id):
        """Get user's activity feed (for followers)"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            
            result = social_service.get_user_activity_feed(user_id, page, per_page)
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 500
                
        except Exception as e:
            logger.error(f"Error getting activity feed for user {user_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error'
            }), 500
    
    # --- USER SEARCH ENDPOINT ---

    @app.route('/api/users/search', methods=['GET'])
    def search_users():
        """Search for users by name, email, company, skills, etc. with optimized infinite scrolling"""
        try:
            # Get search parameters
            query = request.args.get('q', '').strip()
            user_type = request.args.get('user_type', '').strip()
            location = request.args.get('location', '').strip()
            industry = request.args.get('industry', '').strip()
            experience_level = request.args.get('experience_level', '').strip()
            exclude_companies = request.args.get('exclude_companies', '').lower() == 'true'
            
            # Pagination - optimized for infinite scroll
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 12, type=int), 50)  # Smaller default for infinite scroll
            
            # Validate pagination
            if page < 1:
                page = 1
            if per_page < 1:
                per_page = 12
            
            # Build search filters
            filters = {}
            if query:
                filters['query'] = query
            if user_type and user_type in ['jobseeker', 'company', 'admin']:
                filters['user_type'] = user_type
            if location:
                filters['location'] = location
            if industry:
                filters['industry'] = industry
            if experience_level:
                filters['experience_level'] = experience_level
            if exclude_companies:
                filters['exclude_companies'] = True
            
            # Perform search with optimized result
            result = auth_service.search_users(filters, page, per_page)
            
            # Add performance metrics
            search_info = {
                'query_time': '< 100ms',  # You can measure actual time if needed
                'filters_applied': len([f for f in filters.values() if f]),
                'is_filtered': bool(query or user_type or location or industry or experience_level)
            }
            
            return jsonify({
                'success': True,
                'users': result['users'],
                'pagination': result['pagination'],
                'search_info': search_info
            })
            
        except Exception as e:
            logger.error(f"Error searching users: {e}")
            return jsonify({
                'success': False,
                'message': 'Internal server error',
                'users': [],
                'pagination': {
                    'page': 1,
                    'per_page': 12,
                    'total': 0,
                    'total_pages': 0,
                    'has_next': False,
                    'has_prev': False
                },
                'search_info': {
                    'query_time': 'error',
                    'filters_applied': 0,
                    'is_filtered': False
                }
            }), 500
    
    @app.route('/api/users/search/suggestions', methods=['GET'])
    def get_search_suggestions():
        """Get search suggestions for auto-complete"""
        try:
            query = request.args.get('q', '').strip()
            if not query or len(query) < 2:
                return jsonify({
                    'success': True,
                    'suggestions': []
                })
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            suggestions = []
            
            # Get user name suggestions
            cursor.execute('''
                SELECT DISTINCT first_name || ' ' || last_name as name 
                FROM users 
                WHERE (first_name || ' ' || last_name) LIKE ? 
                AND first_name IS NOT NULL AND last_name IS NOT NULL
                LIMIT 5
            ''', (f'%{query}%',))
            
            for row in cursor.fetchall():
                suggestions.append({
                    'type': 'user',
                    'text': row[0],
                    'category': 'People'
                })
            
            # Get company suggestions
            cursor.execute('''
                SELECT DISTINCT company_name 
                FROM company_profiles 
                WHERE company_name LIKE ? 
                AND company_name IS NOT NULL
                LIMIT 5
            ''', (f'%{query}%',))
            
            for row in cursor.fetchall():
                suggestions.append({
                    'type': 'company',
                    'text': row[0],
                    'category': 'Companies'
                })
            
            conn.close()
            
            return jsonify({
                'success': True,
                'suggestions': suggestions[:10]  # Limit total suggestions
            })
            
        except Exception as e:
            logger.error(f"Error getting search suggestions: {e}")
            return jsonify({
                'success': True,
                'suggestions': []
            })
    
    @app.route('/api/users/search/filters', methods=['GET'])
    def get_search_filters():
        """Get available filter options for user search"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get popular locations
            cursor.execute('''
                SELECT location, COUNT(*) as count
                FROM (
                    SELECT location FROM jobseeker_profiles WHERE location IS NOT NULL AND location != ''
                    UNION ALL
                    SELECT location FROM company_profiles WHERE location IS NOT NULL AND location != ''
                ) 
                GROUP BY location 
                ORDER BY count DESC 
                LIMIT 10
            ''')
            locations = [row[0] for row in cursor.fetchall()]
            
            # Get popular industries  
            cursor.execute('''
                SELECT industry, COUNT(*) as count
                FROM company_profiles 
                WHERE industry IS NOT NULL AND industry != ''
                GROUP BY industry 
                ORDER BY count DESC 
                LIMIT 10
            ''')
            industries = [row[0] for row in cursor.fetchall()]
            
            # Get experience levels
            cursor.execute('''
                SELECT DISTINCT experience_level
                FROM jobseeker_profiles 
                WHERE experience_level IS NOT NULL AND experience_level != ''
                ORDER BY experience_level
            ''')
            experience_levels = [row[0] for row in cursor.fetchall()]
            
            conn.close()
            
            return jsonify({
                'success': True,
                'filters': {
                    'user_types': [
                        {'value': 'jobseeker', 'label': 'Job Seekers', 'icon': '👤'},
                        {'value': 'company', 'label': 'Companies', 'icon': '🏢'},
                        {'value': 'admin', 'label': 'Admins', 'icon': '👨‍💼'}
                    ],
                    'locations': locations,
                    'industries': industries,
                    'experience_levels': experience_levels
                }
            })
            
        except Exception as e:
            logger.error(f"Error getting search filters: {e}")
            return jsonify({
                'success': True,
                'filters': {
                    'user_types': [
                        {'value': 'jobseeker', 'label': 'Job Seekers', 'icon': '👤'},
                        {'value': 'company', 'label': 'Companies', 'icon': '🏢'}
                    ],
                    'locations': [],
                    'industries': [],
                    'experience_levels': []
                }
            })
    
    # ============================================================================
    # CV MAKER API ENDPOINTS
    # ============================================================================
    
    @app.route('/api/cv/templates', methods=['GET'])
    def get_cv_templates():
        """Get available CV templates"""
        try:
            category = request.args.get('category')
            is_premium = request.args.get('is_premium')
            
            # Convert is_premium to boolean if provided
            if is_premium is not None:
                is_premium = is_premium.lower() == 'true'
            
            templates = cv_service.get_cv_templates(category, is_premium)
            
            return jsonify({
                'success': True,
                'templates': templates
            })
            
        except Exception as e:
            logger.error(f"Error getting CV templates: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch CV templates'
            }), 500
    
    @app.route('/api/cv/templates/<int:template_id>', methods=['GET'])
    def get_cv_template(template_id):
        """Get a specific CV template"""
        try:
            templates = cv_service.get_cv_templates()
            template = next((t for t in templates if t['id'] == template_id), None)
            
            if not template:
                return jsonify({
                    'success': False,
                    'message': 'Template not found'
                }), 404
            
            return jsonify({
                'success': True,
                'template': template
            })
            
        except Exception as e:
            logger.error(f"Error getting CV template {template_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch CV template'
            }), 500
    
    @app.route('/api/cv/my-cvs', methods=['GET'])
    @token_required
    def get_my_cvs():
        """Get all CVs for the current user"""
        try:
            cvs = cv_service.get_user_cvs(request.current_user_id)
            
            return jsonify({
                'success': True,
                'cvs': cvs
            })
            
        except Exception as e:
            logger.error(f"Error getting user CVs: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch CVs'
            }), 500
    
    @app.route('/api/cv/create', methods=['POST'])
    @token_required
    def create_cv():
        """Create a new CV"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400
            
            # Validate required fields
            required_fields = ['template_id', 'cv_name', 'cv_data']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'message': f'Missing required field: {field}'
                    }), 400
            
            result = cv_service.create_user_cv(
                request.current_user_id,
                data['template_id'],
                data['cv_name'],
                data['cv_data']
            )
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
            
        except Exception as e:
            logger.error(f"Error creating CV: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to create CV'
            }), 500
    
    @app.route('/api/cv/<int:cv_id>', methods=['GET'])
    @token_required
    def get_cv(cv_id):
        """Get a specific CV"""
        try:
            cv = cv_service.get_cv_by_id(cv_id, request.current_user_id)
            
            if not cv:
                return jsonify({
                    'success': False,
                    'message': 'CV not found'
                }), 404
            
            return jsonify({
                'success': True,
                'cv': cv
            })
            
        except Exception as e:
            logger.error(f"Error getting CV {cv_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch CV'
            }), 500
    
    @app.route('/api/cv/<int:cv_id>', methods=['PUT']) 
    @token_required
    def update_cv(cv_id):
        """Update a CV"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400
            
            result = cv_service.update_cv(cv_id, request.current_user_id, data)
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 400
            
        except Exception as e:
            logger.error(f"Error updating CV {cv_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to update CV'
            }), 500
    
    @app.route('/api/cv/<int:cv_id>', methods=['DELETE'])
    @token_required
    def delete_cv(cv_id):
        """Delete a CV"""
        try:
            result = cv_service.delete_cv(cv_id, request.current_user_id)
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 400
            
        except Exception as e:
            logger.error(f"Error deleting CV {cv_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to delete CV'
            }), 500
    
    @app.route('/api/cv/<int:cv_id>/share', methods=['POST'])
    @token_required
    def create_cv_share(cv_id):
        """Create a shareable link for a CV"""
        try:
            data = request.get_json() or {}
            password = data.get('password')
            expires_days = data.get('expires_days')
            
            result = cv_service.create_cv_share(
                cv_id, 
                request.current_user_id, 
                password, 
                expires_days
            )
            
            if result['success']:
                return jsonify(result)
            else:
                return jsonify(result), 400
            
        except Exception as e:
            logger.error(f"Error creating CV share for {cv_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to create share link'
            }), 500
    
    @app.route('/api/cv/share/<share_token>', methods=['GET'])
    def view_shared_cv(share_token):
        """View a shared CV"""
        try:
            password = request.args.get('password')
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get share record
            cursor.execute('''
                SELECT cs.*, uc.cv_name, uc.cv_data, uc.user_id,
                       ct.name as template_name, ct.template_data
                FROM cv_shares cs
                JOIN user_cvs uc ON cs.cv_id = uc.id
                LEFT JOIN cv_templates ct ON uc.template_id = ct.id
                WHERE cs.share_token = ?
            ''', (share_token,))
            
            share_data = cursor.fetchone()
            
            if not share_data:
                return jsonify({
                    'success': False,
                    'message': 'Share link not found or expired'
                }), 404
            
            # Check if expired
            if share_data[3]:  # expires_at
                from datetime import datetime
                expires_at = datetime.fromisoformat(share_data[3])
                if datetime.utcnow() > expires_at:
                    return jsonify({
                        'success': False,
                        'message': 'Share link has expired'
                    }), 410
            
            # Check password if required
            if share_data[2]:  # password
                if not password:
                    return jsonify({
                        'success': False,
                        'message': 'Password required',
                        'password_required': True
                    }), 401
                
                import hashlib
                hashed_password = hashlib.sha256(password.encode()).hexdigest()
                if hashed_password != share_data[2]:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid password'
                    }), 401
            
            # Increment view count
            cursor.execute('''
                UPDATE cv_shares 
                SET view_count = view_count + 1 
                WHERE share_token = ?
            ''', (share_token,))
            conn.commit()
            
            # Return CV data
            cv_data = {
                'cv_name': share_data[5],
                'cv_data': json.loads(share_data[6]) if share_data[6] else {},
                'template': {
                    'name': share_data[8],
                    'template_data': json.loads(share_data[9]) if share_data[9] else {}
                },
                'view_count': share_data[4] + 1,
                'shared_at': share_data[5]
            }
            
            conn.close()
            
            return jsonify({
                'success': True,
                'cv': cv_data
            })
            
        except Exception as e:
            logger.error(f"Error viewing shared CV {share_token}: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to view shared CV'
            }), 500
    
    @app.route('/api/cv/<int:cv_id>/export/<format>', methods=['POST'])
    @token_required
    def export_cv(cv_id, format):
        """Export CV to different formats (PDF, DOCX, HTML)"""
        try:
            # Validate format
            if format not in ['pdf', 'docx', 'html']:
                return jsonify({
                    'success': False,
                    'message': 'Invalid export format. Supported: pdf, docx, html'
                }), 400
            
            # Get CV data
            cv = cv_service.get_cv_by_id(cv_id, request.current_user_id)
            
            if not cv:
                return jsonify({
                    'success': False,
                    'message': 'CV not found'
                }), 404
            
            # For now, return a placeholder response
            # TODO: Implement actual PDF/DOCX generation
            return jsonify({
                'success': False,
                'message': f'{format.upper()} export not yet implemented. This feature will be added soon!'
            }), 501
            
        except Exception as e:
            logger.error(f"Error exporting CV {cv_id} to {format}: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to export CV'
            }), 500
    
    @app.route('/api/cv/statistics', methods=['GET'])
    @token_required
    def get_cv_statistics():
        """Get CV statistics for the current user"""
        try:
            stats = cv_service.get_cv_statistics(request.current_user_id)
            
            return jsonify({
                'success': True,
                'statistics': stats
            })
            
        except Exception as e:
            logger.error(f"Error getting CV statistics: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to fetch CV statistics'
            }), 500
    
    @app.route('/api/cv/duplicate/<int:cv_id>', methods=['POST'])
    @token_required
    def duplicate_cv(cv_id):
        """Duplicate an existing CV"""
        try:
            data = request.get_json() or {}
            new_name = data.get('cv_name', f'Copy of CV {cv_id}')
            
            # Get original CV
            original_cv = cv_service.get_cv_by_id(cv_id, request.current_user_id)
            
            if not original_cv:
                return jsonify({
                    'success': False,
                    'message': 'Original CV not found'
                }), 404
            
            # Create duplicate
            result = cv_service.create_user_cv(
                request.current_user_id,
                original_cv['template_id'],
                new_name,
                original_cv['cv_data']
            )
            
            if result['success']:
                return jsonify(result), 201
            else:
                return jsonify(result), 400
            
        except Exception as e:
            logger.error(f"Error duplicating CV {cv_id}: {e}")
            return jsonify({
                'success': False,
                'message': 'Failed to duplicate CV'
            }), 500

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
    
    # Test endpoint for Socket.IO
    @app.route('/api/test-socketio', methods=['GET'])
    def test_socketio():
        """Test Socket.IO connection"""
        try:
            # Emit a test message to all connected clients
            socketio.emit('test_message', {'message': 'Socket.IO is working!'})
            return jsonify({'status': 'success', 'message': 'Test message sent'})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500
    
    return app, socketio

if __name__ == '__main__':
    # Initialize database tables
    try:
        auth_service.db.init_auth_tables()
        job_service.db.init_job_management_tables()
        blog_service.init_blog_tables()
        social_service.init_social_tables()
        cv_service.init_cv_tables()
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        sys.exit(1)
    
    # Create and run the app
    app, socketio = create_app()
    
    # Get port from environment or use default
    port = int(os.getenv('PORT', 5000))  # Changed from 5001 to 5000
    
    logger.info(f"Starting Job Portal API server with WebSocket support on port {port}")
    socketio.run(app, debug=True, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
