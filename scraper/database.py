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
                view_count INTEGER DEFAULT 0,
                job_source TEXT DEFAULT 'scraped',
                created_by TEXT DEFAULT 'system'
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
        import hashlib
        # Use title + company + location + first 100 chars of description for better uniqueness
        title = job['title'].lower().strip()
        company = job['company'].lower().strip()
        location = job.get('location', '').lower().strip()
        description_snippet = (job.get('description', '') or '')[:100].lower().strip()
        
        unique_string = f"{title}|{company}|{location}|{description_snippet}"
        return hashlib.md5(unique_string.encode()).hexdigest()
    
    def add_job(self, job: Dict, job_source: str = 'scraped', created_by: str = 'system') -> bool:
        """Add a job to the database. Returns True if job is new, False if duplicate."""
        job_hash = self._generate_job_hash(job)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Check if job already exists with same hash
            cursor.execute('SELECT id, job_source, created_by FROM jobs WHERE hash = ?', (job_hash,))
            existing = cursor.fetchone()
            
            if existing:
                logger.debug(f"Duplicate job skipped: {job['title']} at {job['company']} (existing: {existing[1]}/{existing[2]})")
                return False
            
            cursor.execute('''
                INSERT INTO jobs (title, company, location, type, description, apply_link, source_url, hash, job_source, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                job['title'],
                job['company'], 
                job.get('location', ''),
                job.get('type', ''),
                job.get('description', ''),
                job.get('apply_link', ''),
                job.get('source_url', ''),
                job_hash,
                job_source,
                created_by
            ))
            conn.commit()
            logger.info(f"Added new job: {job['title']} at {job['company']} (source: {job_source}/{created_by})")
            return True
            
        except sqlite3.IntegrityError:
            # Duplicate job (backup check)
            logger.debug(f"Duplicate job skipped (integrity): {job['title']} at {job['company']}")
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
                       apply_link, source_url, posted_date, deadline, scraped_at, view_count,
                       job_source, created_by
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
                'job_type': job[4],
                'description': job[5],
                'requirements': job[6],
                'responsibilities': job[7],
                'benefits': job[8],
                'salary': job[9],
                'experience_level': job[10],
                'skills': job[11],
                'apply_link': job[12],
                'source_url': job[13],
                'posted_date': job[14],
                'deadline': job[15],
                'scraped_at': job[16],
                'view_count': job[17] + 1,  # Include the updated count
                'job_source': job[18],  # scraped, manual, admin, etc.
                'created_by': job[19],  # company name or admin name
                'status': 'active'
            }
            
            return job_dict
            
        except sqlite3.Error as e:
            logger.error(f"Error getting job details: {e}")
            return None
        finally:
            conn.close()

    def search_jobs(self, query: str = "", limit: int = 20, offset: int = 0, 
                   company_filter: str = "", location_filter: str = "", type_filter: str = "", 
                   experience_filter: str = "") -> Dict:
        """Search jobs with pagination and filters."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Build the WHERE clause
            where_conditions = ["is_active = TRUE"]
            params = []
            
            # Add search query
            if query:
                where_conditions.append("(title LIKE ? OR company LIKE ? OR description LIKE ? OR skills LIKE ?)")
                params.extend([f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%'])
            
            # Add filters
            if company_filter:
                where_conditions.append("company = ?")
                params.append(company_filter)
            
            if location_filter:
                where_conditions.append("location LIKE ?")
                params.append(f'%{location_filter}%')
            
            if type_filter:
                where_conditions.append("type LIKE ?")
                params.append(f'%{type_filter}%')
            
            if experience_filter:
                where_conditions.append("experience_level LIKE ?")
                params.append(f'%{experience_filter}%')
            
            where_clause = " AND ".join(where_conditions)
            
            # Get total count
            count_query = f"SELECT COUNT(*) FROM jobs WHERE {where_clause}"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Get paginated results
            query_sql = f'''
                SELECT id, title, company, location, type, description, apply_link, scraped_at,
                       COALESCE(experience_level, '') as experience_level, 
                       COALESCE(salary_range, '') as salary_range, 
                       COALESCE(skills, '') as skills, 
                       COALESCE(posted_date, '') as posted_date,
                       COALESCE(requirements, '') as requirements,
                       COALESCE(responsibilities, '') as responsibilities,
                       COALESCE(benefits, '') as benefits
                FROM jobs 
                WHERE {where_clause}
                ORDER BY scraped_at DESC
                LIMIT ? OFFSET ?
            '''
            
            cursor.execute(query_sql, params + [limit, offset])
            
            jobs = []
            for row in cursor.fetchall():
                jobs.append({
                    'id': row[0],
                    'title': row[1],
                    'company': row[2],
                    'location': row[3],
                    'job_type': row[4] or 'Full-time',
                    'description': row[5][:300] + '...' if row[5] and len(row[5]) > 300 else row[5],
                    'apply_link': row[6],
                    'scraped_at': row[7],
                    'experience_level': row[8],
                    'salary': row[9],
                    'skills': row[10],
                    'posted_date': row[11],
                    'requirements': row[12],
                    'responsibilities': row[13],
                    'benefits': row[14],
                    'status': 'active'
                })
            
            return {
                'jobs': jobs,
                'total': total_count,
                'page': (offset // limit) + 1,
                'per_page': limit,
                'pages': (total_count + limit - 1) // limit
            }
            
        except sqlite3.Error as e:
            logger.error(f"Error searching jobs: {e}")
            return {'jobs': [], 'total': 0, 'page': 1, 'per_page': limit, 'pages': 0}
        finally:
            conn.close()
    
    def get_companies(self) -> List[str]:
        """Get list of all companies."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT DISTINCT company FROM jobs WHERE is_active = TRUE ORDER BY company")
            companies = [row[0] for row in cursor.fetchall() if row[0]]
            return companies
        except sqlite3.Error as e:
            logger.error(f"Error getting companies: {e}")
            return []
        finally:
            conn.close()
    
    def get_locations(self) -> List[str]:
        """Get list of all locations."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT DISTINCT location FROM jobs WHERE is_active = TRUE AND location IS NOT NULL AND location != '' ORDER BY location")
            locations = [row[0] for row in cursor.fetchall() if row[0]]
            return locations
        except sqlite3.Error as e:
            logger.error(f"Error getting locations: {e}")
            return []
        finally:
            conn.close()
    
    def get_job_types(self) -> List[str]:
        """Get list of all job types."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT DISTINCT type FROM jobs WHERE is_active = TRUE AND type IS NOT NULL AND type != '' ORDER BY type")
            types = [row[0] for row in cursor.fetchall() if row[0]]
            return types
        except sqlite3.Error as e:
            logger.error(f"Error getting job types: {e}")
            return []
        finally:
            conn.close()
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

    def get_experience_levels(self):
        """Get all unique experience levels."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT DISTINCT experience_level 
            FROM jobs 
            WHERE experience_level IS NOT NULL 
            AND experience_level != '' 
            ORDER BY experience_level
        """)
        
        experience_levels = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        return experience_levels

    def get_recent_jobs(self, company=None, days=7):
        """Get recent jobs from the database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Build the WHERE clause
            where_conditions = ["is_active = TRUE"]
            params = []
            
            # Add company filter if specified
            if company:
                where_conditions.append("company = ?")
                params.append(company)
            
            # Add date filter
            where_conditions.append("scraped_at >= datetime('now', '-{} days')".format(days))
            
            where_clause = " AND ".join(where_conditions)
            
            query = f'''
                SELECT id, title, company, location, type, description, apply_link, 
                       scraped_at, experience_level, salary_range, skills, posted_date
                FROM jobs 
                WHERE {where_clause}
                ORDER BY scraped_at DESC
            '''
            
            cursor.execute(query, params)
            jobs = []
            for row in cursor.fetchall():
                jobs.append({
                    'id': row[0],
                    'title': row[1],
                    'company': row[2],
                    'location': row[3],
                    'job_type': row[4] or 'Full-time',
                    'description': row[5],
                    'apply_link': row[6],
                    'scraped_at': row[7],
                    'experience_level': row[8],
                    'salary': row[9],
                    'skills': row[10],
                    'posted_date': row[11],
                    'status': 'active'
                })
            
            return jobs
            
        except sqlite3.Error as e:
            logger.error(f"Error getting recent jobs: {e}")
            return []
        finally:
            conn.close()
