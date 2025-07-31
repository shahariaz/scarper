from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from scraper.database import JobDatabase
from scraper.job_api import get_job_statistics, get_recent_jobs
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
db = JobDatabase()

@app.route('/')
def dashboard():
    """Main dashboard page."""
    return render_template('dashboard.html')

@app.route('/api/stats')
def api_stats():
    """Get statistics for the dashboard."""
    stats = get_job_statistics()
    
    # Add some additional stats
    recent_jobs = get_recent_jobs(days=1)
    today_jobs = len(recent_jobs)
    
    week_jobs = get_recent_jobs(days=7)
    week_count = len(week_jobs)
    
    return jsonify({
        'total_jobs': stats['total_jobs'],
        'today_jobs': today_jobs,
        'week_jobs': week_count,
        'companies': len(stats['jobs_by_company']),
        'jobs_by_company': stats['jobs_by_company'],
        'recent_runs': stats['recent_runs'][:10]  # Last 10 runs
    })

@app.route('/api/job/<int:job_id>')
def api_job_details(job_id):
    """Get detailed job information."""
    job = db.get_job_details(job_id)
    if job:
        return jsonify(job)
    else:
        return jsonify({'error': 'Job not found'}), 404

@app.route('/api/search')
def api_search():
    """Search jobs with pagination and filters."""
    # Get query parameters
    query = request.args.get('q', '')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 20)), 100)  # Max 100 per page
    company_filter = request.args.get('company', '')
    location_filter = request.args.get('location', '')
    type_filter = request.args.get('type', '')
    experience_filter = request.args.get('experience', '')
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    # Search with filters and pagination
    result = db.search_jobs(
        query=query,
        limit=per_page,
        offset=offset,
        company_filter=company_filter,
        location_filter=location_filter,
        type_filter=type_filter,
        experience_filter=experience_filter
    )
    
    return jsonify(result)

@app.route('/api/companies')
def api_companies():
    """Get list of all companies."""
    companies = db.get_companies()
    return jsonify(companies)

@app.route('/api/locations')
def api_locations():
    """Get list of all locations."""
    locations = db.get_locations()
    return jsonify(locations)

@app.route('/api/job-types')
def api_job_types():
    """Get list of all job types."""
    job_types = db.get_job_types()
    return jsonify(job_types)

@app.route('/api/experience-levels')
def api_experience_levels():
    """Get list of all experience levels."""
    experience_levels = db.get_experience_levels()
    return jsonify(experience_levels)

@app.route('/api/jobs')
def api_jobs():
    """Get jobs with pagination and filters."""
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 20)), 100)
    company = request.args.get('company', '')
    location = request.args.get('location', '')
    job_type = request.args.get('type', '')
    experience = request.args.get('experience', '')
    
    # Calculate offset
    offset = (page - 1) * per_page
    
    # Get jobs with pagination
    result = db.search_jobs(
        query="",
        limit=per_page,
        offset=offset,
        company_filter=company,
        location_filter=location,
        type_filter=job_type,
        experience_filter=experience
    )
    
    return jsonify(result)

@app.route('/api/jobs/<company>')
def api_company_jobs(company):
    """Get jobs for a specific company."""
    jobs = get_recent_jobs(company, days=30)
    return jsonify(jobs)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
