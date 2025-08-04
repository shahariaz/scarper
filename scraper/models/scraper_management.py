"""
Scraper Management Service
Handles manual triggers, scheduling, and monitoring of job scraping operations.
"""

import json
import sqlite3
import threading
import time
import subprocess
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scraper.utils.logger import setup_logger
from scraper.main import PARSER_MODULES, run_all_parsers, run_single_parser

logger = setup_logger("ScraperManagement")

class ScrapingStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    SCHEDULED = "scheduled"
    ERROR = "error"
    COMPLETED = "completed"

@dataclass
class ScrapingJob:
    id: str
    parser_name: Optional[str]  # None for all parsers
    status: ScrapingStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    triggered_by: str = "system"  # "system", "admin", "schedule"
    jobs_found: int = 0
    error_message: Optional[str] = None
    logs: List[str] = None

    def __post_init__(self):
        if self.logs is None:
            self.logs = []

class ScraperManager:
    def __init__(self, db_path: str = "jobs.db"):
        self.db_path = db_path
        self.current_jobs: Dict[str, ScrapingJob] = {}
        self.scheduling_enabled = True
        self.schedule_config = {
            "daily_runs": 2,  # Run 2 times per day
            "run_times": ["09:00", "21:00"],  # 9 AM and 9 PM
            "timezone": "UTC"
        }
        self.init_database()
        self._schedule_thread = None
        self.start_scheduler()

    def init_database(self):
        """Initialize database tables for scraper management."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create scraping_jobs table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS scraping_jobs (
                        id TEXT PRIMARY KEY,
                        parser_name TEXT,
                        status TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        started_at TEXT,
                        completed_at TEXT,
                        triggered_by TEXT DEFAULT 'system',
                        jobs_found INTEGER DEFAULT 0,
                        error_message TEXT,
                        logs TEXT
                    )
                ''')
                
                # Create scraping_schedule table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS scraping_schedule (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        schedule_type TEXT NOT NULL,
                        schedule_time TEXT NOT NULL,
                        parser_name TEXT,
                        enabled BOOLEAN DEFAULT 1,
                        created_at TEXT NOT NULL,
                        last_run TEXT,
                        next_run TEXT
                    )
                ''')
                
                # Create scraping_stats table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS scraping_stats (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        parser_name TEXT NOT NULL,
                        jobs_found INTEGER NOT NULL,
                        run_duration REAL,
                        timestamp TEXT NOT NULL,
                        triggered_by TEXT DEFAULT 'system'
                    )
                ''')
                
                conn.commit()
                logger.info("Scraper management database initialized")
                
        except Exception as e:
            logger.error(f"Failed to initialize scraper database: {e}")
            raise

    def generate_job_id(self) -> str:
        """Generate unique job ID."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"scrape_{timestamp}_{len(self.current_jobs)}"

    def trigger_manual_scraping(self, parser_name: Optional[str] = None, triggered_by: str = "admin") -> str:
        """
        Trigger manual scraping job.
        
        Args:
            parser_name: Specific parser to run, None for all parsers
            triggered_by: Who triggered the job
            
        Returns:
            Job ID
        """
        job_id = self.generate_job_id()
        
        # Check if there's already a running job
        if self.is_scraping_active():
            raise ValueError("Scraping is already in progress. Please wait for current job to complete.")
        
        # Create new scraping job
        job = ScrapingJob(
            id=job_id,
            parser_name=parser_name,
            status=ScrapingStatus.SCHEDULED,
            created_at=datetime.now(),
            triggered_by=triggered_by
        )
        
        self.current_jobs[job_id] = job
        self.save_job_to_db(job)
        
        # Start scraping in background thread
        thread = threading.Thread(target=self._run_scraping_job, args=(job_id,))
        thread.daemon = True
        thread.start()
        
        logger.info(f"Manual scraping triggered: {job_id} (parser: {parser_name or 'all'})")
        return job_id

    def _run_scraping_job(self, job_id: str):
        """Execute scraping job in background."""
        if job_id not in self.current_jobs:
            logger.error(f"Job {job_id} not found")
            return
            
        job = self.current_jobs[job_id]
        
        try:
            # Update job status to running
            job.status = ScrapingStatus.RUNNING
            job.started_at = datetime.now()
            job.logs.append(f"Started scraping at {job.started_at}")
            self.save_job_to_db(job)
            
            # Run the actual scraping
            if job.parser_name:
                # Run single parser
                job.logs.append(f"Running parser: {job.parser_name}")
                result = self._run_single_parser_with_stats(job.parser_name)
                job.jobs_found = result.get('jobs_found', 0)
            else:
                # Run all parsers
                job.logs.append("Running all parsers")
                result = self._run_all_parsers_with_stats()
                job.jobs_found = result.get('jobs_found', 0)
            
            # Update job completion
            job.status = ScrapingStatus.COMPLETED
            job.completed_at = datetime.now()
            job.logs.append(f"Completed scraping at {job.completed_at}")
            job.logs.append(f"Total jobs found: {job.jobs_found}")
            
            # Save statistics
            self.save_scraping_stats(job)
            
        except Exception as e:
            job.status = ScrapingStatus.ERROR
            job.error_message = str(e)
            job.completed_at = datetime.now()
            job.logs.append(f"Error: {str(e)}")
            logger.error(f"Scraping job {job_id} failed: {e}")
        
        finally:
            self.save_job_to_db(job)
            # Keep job in memory for a while for status checking
            threading.Timer(3600, lambda: self.current_jobs.pop(job_id, None)).start()

    def _run_single_parser_with_stats(self, parser_name: str) -> Dict[str, Any]:
        """Run single parser and return statistics."""
        start_time = time.time()
        jobs_found = 0
        
        try:
            # Import and run the specific parser
            module_name = f"scraper.parsers.{parser_name}"
            if module_name in PARSER_MODULES:
                jobs_found = run_single_parser(parser_name)
            else:
                raise ValueError(f"Parser {parser_name} not found")
                
            duration = time.time() - start_time
            return {
                'jobs_found': jobs_found,
                'duration': duration,
                'success': True
            }
            
        except Exception as e:
            duration = time.time() - start_time
            return {
                'jobs_found': 0,
                'duration': duration,
                'success': False,
                'error': str(e)
            }

    def _run_all_parsers_with_stats(self) -> Dict[str, Any]:
        """Run all parsers and return statistics."""
        start_time = time.time()
        jobs_found = 0
        
        try:
            jobs_found = run_all_parsers()
            duration = time.time() - start_time
            return {
                'jobs_found': jobs_found,
                'duration': duration,
                'success': True
            }
            
        except Exception as e:
            duration = time.time() - start_time
            return {
                'jobs_found': 0,
                'duration': duration,
                'success': False,
                'error': str(e)
            }

    def save_job_to_db(self, job: ScrapingJob):
        """Save scraping job to database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO scraping_jobs 
                    (id, parser_name, status, created_at, started_at, completed_at, 
                     triggered_by, jobs_found, error_message, logs)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    job.id,
                    job.parser_name,
                    job.status.value,
                    job.created_at.isoformat() if job.created_at else None,
                    job.started_at.isoformat() if job.started_at else None,
                    job.completed_at.isoformat() if job.completed_at else None,
                    job.triggered_by,
                    job.jobs_found,
                    job.error_message,
                    json.dumps(job.logs)
                ))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Failed to save job to database: {e}")

    def save_scraping_stats(self, job: ScrapingJob):
        """Save scraping statistics."""
        try:
            duration = None
            if job.started_at and job.completed_at:
                duration = (job.completed_at - job.started_at).total_seconds()
                
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO scraping_stats 
                    (parser_name, jobs_found, run_duration, timestamp, triggered_by)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    job.parser_name or 'all_parsers',
                    job.jobs_found,
                    duration,
                    datetime.now().isoformat(),
                    job.triggered_by
                ))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Failed to save scraping stats: {e}")

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a scraping job."""
        # Check current jobs first
        if job_id in self.current_jobs:
            job = self.current_jobs[job_id]
            return asdict(job)
        
        # Check database for completed jobs
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM scraping_jobs WHERE id = ?
                ''', (job_id,))
                row = cursor.fetchone()
                
                if row:
                    return {
                        'id': row[0],
                        'parser_name': row[1],
                        'status': row[2],
                        'created_at': row[3],
                        'started_at': row[4],
                        'completed_at': row[5],
                        'triggered_by': row[6],
                        'jobs_found': row[7],
                        'error_message': row[8],
                        'logs': json.loads(row[9]) if row[9] else []
                    }
                    
        except Exception as e:
            logger.error(f"Failed to get job status: {e}")
            
        return None

    def get_recent_jobs(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent scraping jobs."""
        jobs = []
        
        # Add current jobs
        for job in self.current_jobs.values():
            job_dict = asdict(job)
            # Convert datetime to string for consistency
            if isinstance(job_dict.get('created_at'), datetime):
                job_dict['created_at'] = job_dict['created_at'].isoformat()
            if isinstance(job_dict.get('started_at'), datetime):
                job_dict['started_at'] = job_dict['started_at'].isoformat()
            if isinstance(job_dict.get('completed_at'), datetime):
                job_dict['completed_at'] = job_dict['completed_at'].isoformat()
            jobs.append(job_dict)
        
        # Add completed jobs from database
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM scraping_jobs 
                    ORDER BY created_at DESC 
                    LIMIT ?
                ''', (limit,))
                
                for row in cursor.fetchall():
                    jobs.append({
                        'id': row[0],
                        'parser_name': row[1],
                        'status': row[2],
                        'created_at': row[3],
                        'started_at': row[4],
                        'completed_at': row[5],
                        'triggered_by': row[6],
                        'jobs_found': row[7],
                        'error_message': row[8],
                        'logs': json.loads(row[9]) if row[9] else []
                    })
                    
        except Exception as e:
            logger.error(f"Failed to get recent jobs: {e}")
        
        # Sort by created_at (all strings now) and return limited results
        jobs.sort(key=lambda x: x['created_at'] or '', reverse=True)
        return jobs[:limit]

    def is_scraping_active(self) -> bool:
        """Check if any scraping job is currently active."""
        return any(
            job.status in [ScrapingStatus.RUNNING, ScrapingStatus.SCHEDULED]
            for job in self.current_jobs.values()
        )

    def get_available_parsers(self) -> List[Dict[str, str]]:
        """Get list of available parsers."""
        parsers = []
        
        for module_name in PARSER_MODULES:
            parser_name = module_name.split('.')[-1]
            try:
                module = __import__(module_name, fromlist=[parser_name])
                for attr in dir(module):
                    obj = getattr(module, attr)
                    if hasattr(obj, 'company') and hasattr(obj, 'url'):
                        parsers.append({
                            'name': parser_name,
                            'company': obj.company,
                            'url': obj.url
                        })
                        break
            except Exception as e:
                logger.error(f"Error loading parser {parser_name}: {e}")
                parsers.append({
                    'name': parser_name,
                    'company': f"Error: {str(e)}",
                    'url': 'N/A'
                })
        
        return parsers

    def get_scraping_statistics(self, days: int = 7) -> Dict[str, Any]:
        """Get scraping statistics for the last N days."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get stats for the last N days
                since_date = (datetime.now() - timedelta(days=days)).isoformat()
                
                cursor.execute('''
                    SELECT 
                        COUNT(*) as total_runs,
                        SUM(jobs_found) as total_jobs_found,
                        AVG(jobs_found) as avg_jobs_per_run,
                        AVG(run_duration) as avg_duration,
                        MAX(timestamp) as last_run
                    FROM scraping_stats 
                    WHERE timestamp >= ?
                ''', (since_date,))
                
                stats = cursor.fetchone()
                
                # Get parser-specific stats
                cursor.execute('''
                    SELECT 
                        parser_name,
                        COUNT(*) as runs,
                        SUM(jobs_found) as jobs_found,
                        AVG(run_duration) as avg_duration,
                        MAX(timestamp) as last_run
                    FROM scraping_stats 
                    WHERE timestamp >= ?
                    GROUP BY parser_name
                    ORDER BY jobs_found DESC
                ''', (since_date,))
                
                parser_stats = cursor.fetchall()
                
                # Get daily breakdown
                cursor.execute('''
                    SELECT 
                        DATE(timestamp) as date,
                        COUNT(*) as runs,
                        SUM(jobs_found) as jobs_found
                    FROM scraping_stats 
                    WHERE timestamp >= ?
                    GROUP BY DATE(timestamp)
                    ORDER BY date DESC
                ''', (since_date,))
                
                daily_stats = cursor.fetchall()
                
                return {
                    'overview': {
                        'total_runs': stats[0] or 0,
                        'total_jobs_found': stats[1] or 0,
                        'avg_jobs_per_run': round(stats[2] or 0, 2),
                        'avg_duration_seconds': round(stats[3] or 0, 2),
                        'last_run': stats[4]
                    },
                    'parser_performance': [
                        {
                            'parser_name': row[0],
                            'runs': row[1],
                            'jobs_found': row[2],
                            'avg_duration': round(row[3] or 0, 2),
                            'last_run': row[4]
                        }
                        for row in parser_stats
                    ],
                    'daily_breakdown': [
                        {
                            'date': row[0],
                            'runs': row[1],
                            'jobs_found': row[2]
                        }
                        for row in daily_stats
                    ],
                    'current_status': {
                        'is_scraping_active': self.is_scraping_active(),
                        'active_jobs': len([
                            job for job in self.current_jobs.values() 
                            if job.status == ScrapingStatus.RUNNING
                        ]),
                        'scheduled_jobs': len([
                            job for job in self.current_jobs.values() 
                            if job.status == ScrapingStatus.SCHEDULED
                        ])
                    }
                }
                
        except Exception as e:
            logger.error(f"Failed to get scraping statistics: {e}")
            return {
                'overview': {},
                'parser_performance': [],
                'daily_breakdown': [],
                'current_status': {
                    'is_scraping_active': self.is_scraping_active(),
                    'active_jobs': 0,
                    'scheduled_jobs': 0
                }
            }

    def start_scheduler(self):
        """Start the automatic scheduler."""
        if self._schedule_thread and self._schedule_thread.is_alive():
            return
            
        self._schedule_thread = threading.Thread(target=self._schedule_worker, daemon=True)
        self._schedule_thread.start()
        logger.info("Scraper scheduler started")

    def _schedule_worker(self):
        """Background worker for scheduled scraping."""
        while self.scheduling_enabled:
            try:
                current_time = datetime.now().strftime("%H:%M")
                
                # Check if current time matches any scheduled time
                if current_time in self.schedule_config["run_times"]:
                    # Check if we already ran at this time today
                    if not self._already_ran_today(current_time):
                        logger.info(f"Triggering scheduled scraping at {current_time}")
                        self.trigger_manual_scraping(
                            parser_name=None,  # Run all parsers
                            triggered_by="schedule"
                        )
                
                # Sleep for 60 seconds before checking again
                time.sleep(60)
                
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(60)

    def _already_ran_today(self, scheduled_time: str) -> bool:
        """Check if scraping already ran at this scheduled time today."""
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT COUNT(*) FROM scraping_jobs 
                    WHERE triggered_by = 'schedule' 
                    AND DATE(created_at) = ?
                    AND TIME(created_at) BETWEEN ? AND ?
                ''', (today, scheduled_time, f"{int(scheduled_time[:2])+1:02d}:00"))
                
                count = cursor.fetchone()[0]
                return count > 0
                
        except Exception as e:
            logger.error(f"Error checking daily run: {e}")
            return False

    def update_schedule_config(self, config: Dict[str, Any]):
        """Update scheduling configuration."""
        self.schedule_config.update(config)
        logger.info(f"Schedule config updated: {self.schedule_config}")

    def stop_scheduler(self):
        """Stop the automatic scheduler."""
        self.scheduling_enabled = False
        logger.info("Scraper scheduler stopped")

# Global instance
scraper_manager = ScraperManager()
