import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from .utils.logger import setup_logger

logger = setup_logger("Database")

class JobDatabase:
    """Local SQLite database for job storage and deduplication."""
    
    def __init__(self, db_path: str = "jobs.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create jobs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                type TEXT,
                description TEXT,
                requirements TEXT,
                responsibilities TEXT,
                benefits TEXT,
                salary_range TEXT,
                experience_level TEXT,
                skills TEXT,
                apply_link TEXT,
                source_url TEXT,
                posted_date TEXT,
                deadline TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                posted_to_api BOOLEAN DEFAULT FALSE,
                hash TEXT UNIQUE,
                is_active BOOLEAN DEFAULT TRUE,
                view_count INTEGER DEFAULT 0
            )
        ''')
        
        # Create scraping_runs table for monitoring
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scraping_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT NOT NULL,
                jobs_found INTEGER DEFAULT 0,
                jobs_new INTEGER DEFAULT 0,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT,
                run_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create index for faster lookups
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_hash ON jobs(hash)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_company ON jobs(company)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_scraped_at ON jobs(scraped_at)')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    
    def _generate_job_hash(self, job: Dict) -> str:
        """Generate a unique hash for job deduplication."""
        # Use title + company + location for uniqueness
        unique_string = f"{job['title'].lower().strip()}_{job['company'].lower().strip()}_{job.get('location', '').lower().strip()}"
        return str(hash(unique_string))
    
    def add_job(self, job: Dict) -> bool:
        """Add a job to the database. Returns True if job is new, False if duplicate."""
        job_hash = self._generate_job_hash(job)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO jobs (title, company, location, type, description, apply_link, source_url, hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                job['title'],
                job['company'], 
                job.get('location', ''),
                job.get('type', ''),
                job.get('description', ''),
                job.get('apply_link', ''),
                job.get('source_url', ''),
                job_hash
            ))
            conn.commit()
            logger.info(f"Added new job: {job['title']} at {job['company']}")
            return True
            
        except sqlite3.IntegrityError:
            # Duplicate job
            logger.debug(f"Duplicate job skipped: {job['title']} at {job['company']}")
            return False
        finally:
            conn.close()

    def get_job_details(self, job_id: int) -> Optional[Dict]:
        """Get detailed job information by ID and increment view count."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Get job details
            cursor.execute('''
                SELECT id, title, company, location, type, description, requirements, 
                       responsibilities, benefits, salary_range, experience_level, skills,
                       apply_link, source_url, posted_date, deadline, scraped_at, view_count
                FROM jobs WHERE id = ? AND is_active = TRUE
            ''', (job_id,))
            
            job = cursor.fetchone()
            if not job:
                return None
                
            # Increment view count
            cursor.execute('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?', (job_id,))
            conn.commit()
            
            # Convert to dictionary
            job_dict = {
                'id': job[0],
                'title': job[1],
                'company': job[2],
                'location': job[3],
                'type': job[4],
                'description': job[5],
                'requirements': job[6],
                'responsibilities': job[7],
                'benefits': job[8],
                'salary_range': job[9],
                'experience_level': job[10],
                'skills': job[11],
                'apply_link': job[12],
                'source_url': job[13],
                'posted_date': job[14],
                'deadline': job[15],
                'scraped_at': job[16],
                'view_count': job[17] + 1  # Include the updated count
            }
            
            return job_dict
            
        except sqlite3.Error as e:
            logger.error(f"Error getting job details: {e}")
            return None
        finally:
            conn.close()

    def search_jobs(self, query: str, limit: int = 20) -> List[Dict]:
        """Search jobs by title, company, or description."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT id, title, company, location, type, description, apply_link, scraped_at
                FROM jobs 
                WHERE is_active = TRUE AND (
                    title LIKE ? OR 
                    company LIKE ? OR 
                    description LIKE ? OR
                    skills LIKE ?
                )
                ORDER BY scraped_at DESC
                LIMIT ?
            ''', (f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%', limit))
            
            jobs = []
            for row in cursor.fetchall():
                jobs.append({
                    'id': row[0],
                    'title': row[1],
                    'company': row[2],
                    'location': row[3],
                    'type': row[4],
                    'description': row[5][:200] + '...' if row[5] and len(row[5]) > 200 else row[5],
                    'apply_link': row[6],
                    'scraped_at': row[7]
                })
            
            return jobs
            
        except sqlite3.Error as e:
            logger.error(f"Error searching jobs: {e}")
            return []
        finally:
            conn.close()
    
    def get_recent_jobs(self, company: Optional[str] = None, days: int = 7) -> List[Dict]:
        """Get jobs scraped in the last N days."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = '''
            SELECT id, title, company, location, type, description, apply_link, scraped_at, 
                   COALESCE(experience_level, '') as experience_level, 
                   COALESCE(salary_range, '') as salary_range, 
                   COALESCE(skills, '') as skills, 
                   COALESCE(posted_date, '') as posted_date
            FROM jobs 
            WHERE COALESCE(is_active, 1) = 1 AND scraped_at >= datetime('now', '-{} days')
        '''.format(days)
        
        params = []
        if company:
            query += " AND company = ?"
            params.append(company)
        
        query += " ORDER BY scraped_at DESC"
        
        cursor.execute(query, params)
        jobs = []
        for row in cursor.fetchall():
            jobs.append({
                'id': row[0],
                'title': row[1],
                'company': row[2],
                'location': row[3],
                'type': row[4],
                'description': row[5][:200] + '...' if row[5] and len(row[5]) > 200 else row[5],
                'apply_link': row[6],
                'scraped_at': row[7],
                'experience_level': row[8],
                'salary_range': row[9],
                'skills': row[10],
                'posted_date': row[11]
            })
        
        conn.close()
        return jobs
    
    def record_scraping_run(self, company: str, jobs_found: int, jobs_new: int, success: bool = True, error: str = None):
        """Record a scraping run for monitoring."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO scraping_runs (company, jobs_found, jobs_new, success, error_message)
            VALUES (?, ?, ?, ?, ?)
        ''', (company, jobs_found, jobs_new, success, error))
        
        conn.commit()
        conn.close()
    
    def get_statistics(self) -> Dict:
        """Get overall statistics."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Total jobs
        cursor.execute("SELECT COUNT(*) FROM jobs")
        total_jobs = cursor.fetchone()[0]
        
        # Jobs by company
        cursor.execute("SELECT company, COUNT(*) FROM jobs GROUP BY company ORDER BY COUNT(*) DESC")
        jobs_by_company = dict(cursor.fetchall())
        
        # Recent runs
        cursor.execute("""
            SELECT company, jobs_found, jobs_new, success, run_time 
            FROM scraping_runs 
            WHERE run_time >= datetime('now', '-24 hours')
            ORDER BY run_time DESC
        """)
        recent_runs = cursor.fetchall()
        
        conn.close()
        
        return {
            'total_jobs': total_jobs,
            'jobs_by_company': jobs_by_company,
            'recent_runs': recent_runs
        }
    
    def cleanup_old_jobs(self, days: int = 90):
        """Remove jobs older than specified days."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM jobs WHERE scraped_at < datetime('now', '-{} days')".format(days))
        deleted = cursor.rowcount
        
        cursor.execute("DELETE FROM scraping_runs WHERE run_time < datetime('now', '-{} days')".format(days))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Cleaned up {deleted} old jobs")
        return deleted
