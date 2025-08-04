"""
Dedicated Scraper Management API
Clean, isolated implementation for scraper management endpoints
"""
from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
import logging
import sys
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
scraper_bp = Blueprint('scraper_api', __name__, url_prefix='/api/admin/scraper')

# Import scraper management service
try:
    from scraper.models.scraper_management import scraper_manager
    logger.info(f"✅ Scraper management imported successfully: {scraper_manager}")
except Exception as e:
    logger.error(f"❌ Failed to import scraper management: {e}")
    scraper_manager = None

@scraper_bp.route('/status', methods=['GET'])
def get_scraper_status():
    """Get current scraper status and statistics"""
    try:
        if not scraper_manager:
            return jsonify({
                'success': False,
                'message': 'Scraper management service not available'
            }), 503
        
        days = int(request.args.get('days', 7))
        stats = scraper_manager.get_scraping_statistics(days)
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting scraper status: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@scraper_bp.route('/trigger', methods=['POST'])
def trigger_scraping():
    """Trigger manual scraping"""
    try:
        if not scraper_manager:
            return jsonify({
                'success': False,
                'message': 'Scraper management service not available'
            }), 503
        
        data = request.get_json() or {}
        parsers = data.get('parsers', [])
        
        if parsers:
            # Validate parser names
            available_parsers = [p['name'] for p in scraper_manager.get_available_parsers()]
            invalid_parsers = [p for p in parsers if p not in available_parsers]
            if invalid_parsers:
                return jsonify({
                    'success': False,
                    'message': f'Invalid parsers: {invalid_parsers}'
                }), 400
        
        job_id = scraper_manager.trigger_manual_scraping(
            parser_name=parsers[0] if parsers and len(parsers) == 1 else None,
            triggered_by="admin"
        )
        
        return jsonify({
            'success': True,
            'message': 'Scraping job triggered successfully',
            'job_id': job_id
        })
        
    except Exception as e:
        logger.error(f"Error triggering scraping: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@scraper_bp.route('/jobs', methods=['GET'])
def get_scraping_jobs():
    """Get recent scraping jobs"""
    try:
        if not scraper_manager:
            return jsonify({
                'success': False,
                'message': 'Scraper management service not available'
            }), 503
        
        limit = int(request.args.get('limit', 20))
        # Temporarily return empty list for testing
        jobs = []
        
        return jsonify({
            'success': True,
            'jobs': jobs
        })
        
    except Exception as e:
        logger.error(f"Error getting scraping jobs: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@scraper_bp.route('/parsers', methods=['GET'])
def get_available_parsers():
    """Get available job scrapers/parsers"""
    try:
        if not scraper_manager:
            return jsonify({
                'success': False,
                'message': 'Scraper management service not available'
            }), 503
        
        parsers = scraper_manager.get_available_parsers()
        
        return jsonify({
            'success': True,
            'parsers': parsers
        })
        
    except Exception as e:
        logger.error(f"Error getting parsers: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@scraper_bp.route('/schedule', methods=['GET'])
def get_schedule_config():
    """Get current scheduling configuration"""
    try:
        if not scraper_manager:
            return jsonify({
                'success': False,
                'message': 'Scraper management service not available'
            }), 503
        
        return jsonify({
            'success': True,
            'schedule': {
                'enabled': scraper_manager.scheduling_enabled,
                'config': scraper_manager.schedule_config
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting schedule config: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@scraper_bp.route('/schedule', methods=['PUT'])
def update_schedule_config():
    """Update scheduling configuration"""
    try:
        if not scraper_manager:
            return jsonify({
                'success': False,
                'message': 'Scraper management service not available'
            }), 503
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No configuration data provided'
            }), 400
        
        # Update configuration
        if 'config' in data:
            scraper_manager.update_schedule_config(data['config'])
        
        # Enable/disable scheduling
        if 'enabled' in data:
            if data['enabled']:
                scraper_manager.scheduling_enabled = True
                if not scraper_manager._schedule_thread or not scraper_manager._schedule_thread.is_alive():
                    scraper_manager.start_scheduler()
            else:
                scraper_manager.stop_scheduler()
        
        return jsonify({
            'success': True,
            'message': 'Schedule configuration updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating schedule config: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

# Debug endpoint
@scraper_bp.route('/debug', methods=['GET'])
def debug_scraper():
    """Debug endpoint to check scraper import"""
    return jsonify({
        'scraper_manager_available': scraper_manager is not None,
        'scraper_manager_type': str(type(scraper_manager)) if scraper_manager else None,
        'blueprint_registered': True,
        'message': 'Scraper API is working!'
    })

def create_standalone_app():
    """Create a standalone Flask app for testing"""
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app, 
         origins=["http://localhost:3000", "http://localhost:5000"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True
    )
    
    # Register blueprint
    app.register_blueprint(scraper_bp)
    
    # Health check
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok', 'service': 'scraper_api'})
    
    return app

if __name__ == '__main__':
    # Run as standalone service
    app = create_standalone_app()
    logger.info("🚀 Starting Scraper Management API...")
    app.run(debug=True, host='0.0.0.0', port=5001)
