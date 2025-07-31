import requests
from .utils.logger import setup_logger
from .config import API_URL, API_TOKEN
from .database import JobDatabase

logger = setup_logger("JobAPI")
db = JobDatabase()

def post_job(job_data: dict):
    """Post job data to the API endpoint and store in local database."""
    
    # Add to local database first (with deduplication)
    is_new_job = db.add_job(job_data)
    
    if not is_new_job:
        logger.debug(f"Skipping duplicate job: {job_data.get('title')} ({job_data.get('company')})")
        return {"status": "duplicate", "job": job_data}
    
    # Only post new jobs to API
    try:
        headers = {"Content-Type": "application/json"}
        if API_TOKEN:
            headers["Authorization"] = f"Bearer {API_TOKEN}"
        
        response = requests.post(API_URL, json=job_data, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Mark as posted to API in database
        # (We could add this field update here if needed)
        
        logger.info(f"Posted new job: {job_data.get('title')} ({job_data.get('company')})")
        return response.json()
        
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error posting job {job_data.get('title')}: {e}")
        return {"status": "api_error", "error": str(e)}
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error posting job {job_data.get('title')}: {e}")
        return {"status": "request_error", "error": str(e)}
    except Exception as e:
        logger.error(f"Unexpected error posting job {job_data.get('title')}: {e}")
        return {"status": "error", "error": str(e)}

def get_job_statistics():
    """Get job statistics from local database."""
    return db.get_statistics()

def get_recent_jobs(company=None, days=7):
    """Get recent jobs from local database."""
    return db.get_recent_jobs(company, days)
