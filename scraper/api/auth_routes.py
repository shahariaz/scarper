"""
Authentication API routes for the job portal
"""
from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import jwt
from datetime import datetime
from ..models.auth_models import AuthService
from ..models.messaging_simple import MessagingService
from ..utils.logger import setup_logger

logger = setup_logger(__name__)

# Create auth blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize services
auth_service = AuthService()
messaging_service = MessagingService()

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
        user_type = request.current_user['user_type']
        
        # Update user profile based on type
        result = auth_service.update_user_profile(user_id, user_type, data)
        
        if result['success']:
            # Get updated profile
            updated_profile = auth_service.get_user_profile(user_id)
            return jsonify({
                'success': True,
                'message': 'Profile updated successfully',
                'user': updated_profile
            }), 200
        else:
            return jsonify(result), 400
        
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
        data = request.get_json()
        refresh_token = data.get('refresh_token') if data else None
        
        # Invalidate refresh token if provided
        if refresh_token:
            auth_service.invalidate_refresh_token(refresh_token)
        
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
        
        # Refresh tokens
        result = auth_service.refresh_access_token(refresh_token)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 401
        
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
        
        # Validate new password strength
        if len(data['new_password']) < 6:
            return jsonify({
                'success': False,
                'message': 'New password must be at least 6 characters long'
            }), 400
        
        user_id = request.current_user['id']
        result = auth_service.change_password(
            user_id=user_id,
            current_password=data['current_password'],
            new_password=data['new_password']
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        logger.error(f"Change password error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to change password'
        }), 500

@auth_bp.route('/settings', methods=['GET'])
@token_required
def get_settings():
    """Get user settings"""
    try:
        user_id = request.current_user['id']
        settings = auth_service.get_user_settings(user_id)
        return jsonify({
            'success': True,
            'settings': settings
        }), 200
        
    except Exception as e:
        logger.error(f"Get settings error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get settings'
        }), 500

@auth_bp.route('/settings', methods=['PUT'])
@token_required
def update_settings():
    """Update user settings"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        result = auth_service.update_user_settings(user_id, data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        logger.error(f"Update settings error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update settings'
        }), 500
        
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

# Messaging routes
@auth_bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations():
    """Get user conversations"""
    try:
        user_id = request.current_user['id']
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        result = messaging_service.get_user_conversations(user_id, page, limit)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Get conversations error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get conversations'
        }), 500

@auth_bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation():
    """Create or get conversation with another user"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        if 'other_user_id' not in data:
            return jsonify({
                'success': False,
                'message': 'other_user_id is required'
            }), 400
        
        other_user_id = data['other_user_id']
        
        # Don't allow conversation with self
        if user_id == other_user_id:
            return jsonify({
                'success': False,
                'message': 'Cannot create conversation with yourself'
            }), 400
        
        result = messaging_service.create_or_get_conversation(user_id, other_user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Create conversation error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to create conversation'
        }), 500

@auth_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@token_required
def get_messages(conversation_id):
    """Get messages from a conversation"""
    try:
        user_id = request.current_user['id']
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        
        result = messaging_service.get_conversation_messages(conversation_id, user_id, page, limit)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Get messages error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get messages'
        }), 500

@auth_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@token_required
def send_message(conversation_id):
    """Send a message to a conversation"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        if 'content' not in data or not data['content'].strip():
            return jsonify({
                'success': False,
                'message': 'Message content is required'
            }), 400
        
        content = data['content'].strip()
        message_type = data.get('message_type', 'text')
        reply_to = data.get('reply_to_message_id')
        metadata = data.get('metadata', {})
        
        result = messaging_service.send_message(
            sender_id=user_id,
            conversation_id=conversation_id,
            content=content,
            message_type=message_type,
            reply_to=reply_to,
            metadata=metadata
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Send message error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to send message'
        }), 500

@auth_bp.route('/conversations/<int:conversation_id>/read', methods=['POST'])
@token_required
def mark_as_read(conversation_id):
    """Mark messages as read"""
    try:
        data = request.get_json() or {}
        user_id = request.current_user['id']
        up_to_message_id = data.get('up_to_message_id')
        
        result = messaging_service.mark_messages_as_read(conversation_id, user_id, up_to_message_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Mark as read error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to mark messages as read'
        }), 500

@auth_bp.route('/messages/unread-counts', methods=['GET'])
@token_required
def get_unread_counts():
    """Get unread message counts"""
    try:
        user_id = request.current_user['id']
        
        result = messaging_service.get_unread_counts(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Get unread counts error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get unread counts'
        }), 500
