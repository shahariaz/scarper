"""
Job management API endpoints
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from functools import wraps
from datetime import datetime, timedelta
import json
from typing import Dict, Any, Optional

from ..models.auth_models import AuthService
from ..models.job_models import JobService
from ..utils.logger import setup_logger

logger = setup_logger(__name__)

# Initialize services
auth_service = AuthService()
job_service = JobService()

def create_job_management_app():
    """Create Flask app for job management"""
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000"])  # Allow Next.js frontend
    
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
    
    @app.route('/api/jobs', methods=['POST'])
    @token_required
    def create_job():
        """Create a new job posting"""
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
            if 'Authorization' in request.headers:
                # If user is authenticated, we might want different behavior
                pass
            
            job = job_service.get_job_posting(job_id, increment_views)
            
            if not job:
                return jsonify({'success': False, 'message': 'Job not found'}), 404
            
            # Don't show unapproved jobs to non-admin users
            if not job['approved_by_admin']:
                # Check if user is admin or job creator
                is_authorized = False
                if 'Authorization' in request.headers:
                    try:
                        auth_header = request.headers['Authorization']
                        token = auth_header.split(" ")[1]
                        payload = auth_service.verify_token(token)
                        if payload:
                            user_type = payload['user_type']
                            user_id = payload['user_id']
                            is_authorized = (
                                user_type == 'admin' or 
                                (user_type == 'company' and user_id == job['created_by_user_id'])
                            )
                    except:
                        pass
                
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
            # This could be expanded to get actual values from database
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
    
    @app.route('/api/jobs/bulk', methods=['POST'])
    @token_required
    @admin_required
    def bulk_job_action():
        """Perform bulk actions on jobs (admin only)"""
        try:
            data = request.get_json()
            
            if not data or 'job_ids' not in data or 'action' not in data:
                return jsonify({
                    'success': False, 
                    'message': 'Missing job_ids or action'
                }), 400
            
            job_ids = data['job_ids']
            action = data['action']
            
            if not isinstance(job_ids, list) or not job_ids:
                return jsonify({
                    'success': False, 
                    'message': 'job_ids must be a non-empty list'
                }), 400
            
            results = []
            success_count = 0
            
            for job_id in job_ids:
                try:
                    if action == 'approve':
                        result = job_service.approve_job_posting(
                            job_id, 
                            request.current_user_id, 
                            data.get('admin_notes', '')
                        )
                    elif action == 'reject':
                        result = job_service.reject_job_posting(
                            job_id, 
                            request.current_user_id, 
                            data.get('admin_notes', '')
                        )
                    elif action == 'delete':
                        result = job_service.delete_job_posting(
                            job_id, 
                            request.current_user_id, 
                            request.current_user_type
                        )
                    else:
                        result = {'success': False, 'message': 'Invalid action'}
                    
                    results.append({
                        'job_id': job_id,
                        'success': result['success'],
                        'message': result.get('message', '')
                    })
                    
                    if result['success']:
                        success_count += 1
                        
                except Exception as e:
                    results.append({
                        'job_id': job_id,
                        'success': False,
                        'message': str(e)
                    })
            
            return jsonify({
                'success': True,
                'message': f'{success_count} of {len(job_ids)} jobs processed successfully',
                'results': results
            })
            
        except Exception as e:
            logger.error(f"Error in bulk job action: {e}")
            return jsonify({
                'success': False, 
                'message': 'Internal server error'
            }), 500
    
    # Error handlers
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
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500
    
    return app

if __name__ == '__main__':
    app = create_job_management_app()
    app.run(debug=True, host='0.0.0.0', port=5001)
