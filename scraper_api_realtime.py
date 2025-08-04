"""
Real-time Scraper Management API with WebSocket support
"""
from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import logging
import sys
import os
import threading
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global SocketIO instance for real-time updates
socketio_instance = None

# Create blueprint
scraper_bp = Blueprint('scraper_api', __name__, url_prefix='/api/admin/scraper')

# Import scraper management service
try:
    from scraper.models.scraper_management import scraper_manager
    logger.info(f"✅ Scraper management imported successfully: {scraper_manager}")
except Exception as e:
    logger.error(f"❌ Failed to import scraper management: {e}")
    scraper_manager = None

def emit_scraper_update(event_type, data):
    """Emit real-time scraper updates to connected clients"""
    if socketio_instance:
        socketio_instance.emit('scraper_update', {
            'type': event_type,
            'data': data,
            'timestamp': time.time()
        }, room='scraper_updates')

def emit_log_update(message):
    """Emit real-time log updates to connected clients"""
    if socketio_instance:
        socketio_instance.emit('log_update', {
            'message': message,
            'timestamp': time.time()
        }, room='scraper_updates')

# Patch scraper manager to emit real-time updates
if scraper_manager:
    original_trigger = scraper_manager.trigger_manual_scraping
    def trigger_with_updates(*args, **kwargs):
        job_id = original_trigger(*args, **kwargs)
        emit_scraper_update('job_started', {
            'job_id': job_id,
            'parser_name': kwargs.get('parser_name'),
            'triggered_by': kwargs.get('triggered_by', 'admin')
        })
        return job_id
    
    scraper_manager.trigger_manual_scraping = trigger_with_updates

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
    """Trigger manual scraping job"""
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
        jobs = scraper_manager.get_recent_jobs(limit)
        
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

@scraper_bp.route('/schedule', methods=['GET', 'PUT'])
def handle_schedule():
    """Get or update scraping schedule"""
    try:
        if not scraper_manager:
            return jsonify({
                'success': False,
                'message': 'Scraper management service not available'
            }), 503
        
        if request.method == 'GET':
            # Return current schedule configuration
            schedule = {
                'enabled': True,
                'config': {
                    'daily_runs': 2,
                    'run_times': ['09:00', '18:00'],
                    'timezone': 'UTC'
                }
            }
            
            return jsonify({
                'success': True,
                'schedule': schedule
            })
        
        elif request.method == 'PUT':
            # Update schedule configuration
            data = request.get_json() or {}
            
            # TODO: Implement schedule update logic
            return jsonify({
                'success': True,
                'message': 'Schedule updated successfully'
            })
            
    except Exception as e:
        logger.error(f"Error handling schedule: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

def create_realtime_app():
    """Create a standalone Flask app with WebSocket support"""
    global socketio_instance
    
    app = Flask(__name__)
    
    # Initialize SocketIO
    socketio_instance = SocketIO(app, 
                               cors_allowed_origins=["http://localhost:3000", "http://localhost:5000"],
                               logger=True, 
                               engineio_logger=True)
    
    # Enable CORS
    CORS(app, 
         origins=["http://localhost:3000", "http://localhost:5000"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True
    )
    
    # Register blueprint
    app.register_blueprint(scraper_bp)
    
    # WebSocket events
    @socketio_instance.on('connect')
    def handle_connect():
        logger.info('Client connected to scraper WebSocket')
        join_room('scraper_updates')
        emit('status', {'message': 'Connected to scraper updates'})
    
    @socketio_instance.on('disconnect')
    def handle_disconnect():
        logger.info('Client disconnected from scraper WebSocket')
        leave_room('scraper_updates')
    
    @socketio_instance.on('join_scraper_room')
    def handle_join_scraper_room():
        join_room('scraper_updates')
        emit('status', {'message': 'Joined scraper updates room'})
    
    # Health check
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok', 'service': 'scraper_api_realtime'})
    
    # Start background task to emit periodic updates
    def background_updates():
        """Send periodic updates about scraper status"""
        while True:
            try:
                if scraper_manager:
                    stats = scraper_manager.get_scraping_statistics(1)
                    socketio_instance.emit('stats_update', stats, room='scraper_updates')
                time.sleep(30)  # Update every 30 seconds
            except Exception as e:
                logger.error(f"Error in background updates: {e}")
                time.sleep(30)
    
    # Start background thread
    background_thread = threading.Thread(target=background_updates)
    background_thread.daemon = True
    background_thread.start()
    
    return app, socketio_instance

if __name__ == '__main__':
    # Run as standalone service
    app, socketio = create_realtime_app()
    logger.info("🚀 Starting Real-time Scraper Management API...")
    socketio.run(app, debug=True, host='0.0.0.0', port=5001)
