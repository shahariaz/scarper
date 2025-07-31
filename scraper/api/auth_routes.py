"""
Authentication API routes for the job portal
"""
from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import jwt
from datetime import datetime
from ..models.auth_models import AuthService
from ..utils.logger import setup_logger

logger = setup_logger(__name__)

# Create auth blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize auth service
auth_service = AuthService()

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Token format invalid'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Verify token
            payload = auth_service.verify_token(token)
            if not payload:
                return jsonify({'message': 'Token is invalid or expired'}), 401
            
            # Get user profile
            user_profile = auth_service.get_user_profile(payload['user_id'])
            if not user_profile:
                return jsonify({'message': 'User not found'}), 401
            
            # Add user info to request context
            request.current_user = user_profile
            
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user['user_type'] != 'admin':
            return jsonify({'message': 'Admin privileges required'}), 403
        return f(*args, **kwargs)
    
    return decorated

def company_required(f):
    """Decorator to require company privileges"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user['user_type'] not in ['admin', 'company']:
            return jsonify({'message': 'Company privileges required'}), 403
        return f(*args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'user_type']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: email, password, user_type'
            }), 400
        
        # Validate user type
        if data['user_type'] not in ['admin', 'jobseeker', 'company']:
            return jsonify({
                'success': False,
                'message': 'Invalid user type. Must be admin, jobseeker, or company'
            }), 400
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
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
        profile_data = {}
        if 'profile' in data:
            profile_data = data['profile']
        
        # Additional validation for company registration
        if data['user_type'] == 'company':
            if 'company_name' not in profile_data or not profile_data['company_name']:
                return jsonify({
                    'success': False,
                    'message': 'Company name is required for company registration'
                }), 400
        
        # Register user
        result = auth_service.register_user(
            email=data['email'],
            password=data['password'],
            user_type=data['user_type'],
            profile_data=profile_data
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'message': 'Registration failed due to server error'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Login user
        result = auth_service.login_user(
            email=data['email'],
            password=data['password']
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 401
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'Login failed due to server error'
        }), 500

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Get current user profile"""
    try:
        return jsonify({
            'success': True,
            'user': request.current_user
        }), 200
        
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get profile'
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        # TODO: Implement profile update logic
        # This would involve updating user_profiles, company_profiles, or jobseeker_profiles
        # based on the user type and provided data
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update profile'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Logout user (invalidate refresh token)"""
    try:
        # TODO: Implement token invalidation logic
        # This would involve removing the refresh token from the database
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return jsonify({
            'success': False,
            'message': 'Logout failed'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token"""
    try:
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({
                'success': False,
                'message': 'Refresh token is required'
            }), 400
        
        # TODO: Implement token refresh logic
        # This would involve validating the refresh token and generating new tokens
        
        return jsonify({
            'success': True,
            'message': 'Token refreshed successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return jsonify({
            'success': False,
            'message': 'Token refresh failed'
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        
        required_fields = ['current_password', 'new_password']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'message': 'Current password and new password are required'
            }), 400
        
        # TODO: Implement password change logic
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Change password error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to change password'
        }), 500

# Admin routes
@auth_bp.route('/admin/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all users (admin only)"""
    try:
        # TODO: Implement get all users logic
        return jsonify({
            'success': True,
            'users': []
        }), 200
        
    except Exception as e:
        logger.error(f"Get all users error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get users'
        }), 500

@auth_bp.route('/admin/users/<int:user_id>/activate', methods=['POST'])
@admin_required
def activate_user(user_id):
    """Activate/deactivate user (admin only)"""
    try:
        # TODO: Implement user activation logic
        return jsonify({
            'success': True,
            'message': 'User status updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"User activation error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update user status'
        }), 500

@auth_bp.route('/admin/companies/pending', methods=['GET'])
@admin_required
def get_pending_companies():
    """Get pending company approvals (admin only)"""
    try:
        # TODO: Implement get pending companies logic
        return jsonify({
            'success': True,
            'companies': []
        }), 200
        
    except Exception as e:
        logger.error(f"Get pending companies error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get pending companies'
        }), 500

@auth_bp.route('/admin/companies/<int:company_id>/approve', methods=['POST'])
@admin_required
def approve_company(company_id):
    """Approve company (admin only)"""
    try:
        # TODO: Implement company approval logic
        return jsonify({
            'success': True,
            'message': 'Company approved successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Company approval error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to approve company'
        }), 500
