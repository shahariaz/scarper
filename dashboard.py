from flask import Flask, render_template, jsonify, request
from scraper.database import JobDatabase
from scraper.job_api import get_job_statistics, get_recent_jobs
import json
from datetime import datetime

app = Flask(__name__)
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
    """Search jobs."""
    query = request.args.get('q', '')
    limit = int(request.args.get('limit', 20))
    
    if not query:
        return jsonify([])
    
    jobs = db.search_jobs(query, limit)
    return jsonify(jobs)

@app.route('/api/jobs')
def api_jobs():
    """Get recent jobs."""
    company = request.args.get('company')
    days = int(request.args.get('days', 7))
    
    jobs = get_recent_jobs(company, days)
    return jsonify(jobs)

@app.route('/api/jobs/<company>')
def api_company_jobs(company):
    """Get jobs for a specific company."""
    jobs = get_recent_jobs(company, days=30)
    return jsonify(jobs)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
