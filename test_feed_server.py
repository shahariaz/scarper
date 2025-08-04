#!/usr/bin/env python3
"""
Minimal Flask app to test feed endpoint
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from scraper.models.feed_models import JobFeedService

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize services
feed_service = JobFeedService()

@app.route('/api/jobs/feed', methods=['GET'])
def get_job_feed():
    """Get personalized job feed with infinite scroll support"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)  # Max 50 per page
        user_id = request.args.get('user_id')
        
        # Get filters
        filters = {}
        if request.args.get('query'):
            filters['query'] = request.args.get('query')
        if request.args.get('location'):
            filters['location'] = request.args.get('location')
        if request.args.get('job_type'):
            filters['job_type'] = request.args.get('job_type')
        if request.args.get('experience_level'):
            filters['experience_level'] = request.args.get('experience_level')
        
        # Get personalized feed
        result = feed_service.get_personalized_feed(
            user_id=int(user_id) if user_id else None,
            page=page,
            per_page=per_page,
            filters=filters
        )
        
        return jsonify({
            'success': True,
            **result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        'success': True,
        'message': 'Test endpoint working'
    })

if __name__ == '__main__':
    print("Starting minimal feed test server on port 5001...")
    app.run(debug=True, port=5001)
