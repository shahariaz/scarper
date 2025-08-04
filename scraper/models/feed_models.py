"""
Personalized job feed models for the job portal
"""
import sqlite3
import json
import math
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from ..utils.logger import setup_logger

logger = setup_logger(__name__)

class JobFeedService:
    def __init__(self, db_path: str = "jobs.db"):
        self.db_path = db_path
    
    def get_personalized_feed(self, user_id: Optional[int] = None, 
                            page: int = 1, per_page: int = 20,
                            filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get personalized job feed with infinite scroll support.
        Combines scraped jobs, admin jobs, and company-posted jobs.
        
        Args:
            user_id: User ID for personalization (optional)
            page: Page number for pagination
            per_page: Number of jobs per page
            filters: Additional filters (query, location, etc.)
        
        Returns:
            Dict with jobs, pagination info, and personalization metadata
        """
        if filters is None:
            filters = {}
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Get user skills for personalization
            user_skills = []
            if user_id:
                user_skills = self._get_user_skills(cursor, user_id)
            
            # Build the query
            where_conditions = ["jp.is_active = 1", "jp.approved_by_admin = 1"]
            params = []
            
            # Add search query
            if filters.get('query'):
                where_conditions.append("""
                    (jp.title LIKE ? OR jp.company LIKE ? OR jp.description LIKE ? 
                     OR jp.skills LIKE ? OR jp.category LIKE ?)
                """)
                query_param = f"%{filters['query']}%"
                params.extend([query_param] * 5)
            
            # Add location filter
            if filters.get('location'):
                where_conditions.append("jp.location LIKE ?")
                params.append(f"%{filters['location']}%")
            
            # Add job type filter
            if filters.get('job_type'):
                where_conditions.append("jp.job_type LIKE ?")
                params.append(f"%{filters['job_type']}%")
            
            # Add experience level filter
            if filters.get('experience_level'):
                where_conditions.append("jp.experience_level LIKE ?")
                params.append(f"%{filters['experience_level']}%")
            
            where_clause = " AND ".join(where_conditions)
            
            # Calculate offset
            offset = (page - 1) * per_page
            
            # Get total count
            count_query = f"""
                SELECT COUNT(*) 
                FROM job_postings jp
                WHERE {where_clause}
            """
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Build personalized scoring query
            if user_skills:
                # Create skill matching score
                skill_conditions = []
                skill_params = []
                for skill in user_skills:
                    skill_conditions.append("jp.skills LIKE ?")
                    skill_params.append(f"%{skill}%")
                
                skill_match_case = f"""
                    CASE WHEN ({' OR '.join(skill_conditions)}) THEN 1 ELSE 0 END
                """ if skill_conditions else "0"
                
                # Calculate recency score (jobs posted in last 30 days get higher score)
                recency_score = """
                    CASE 
                        WHEN jp.posted_date >= datetime('now', '-1 days') THEN 10
                        WHEN jp.posted_date >= datetime('now', '-3 days') THEN 8
                        WHEN jp.posted_date >= datetime('now', '-7 days') THEN 6
                        WHEN jp.posted_date >= datetime('now', '-14 days') THEN 4
                        WHEN jp.posted_date >= datetime('now', '-30 days') THEN 2
                        ELSE 1
                    END
                """
                
                # Calculate engagement score based on view count
                engagement_score = """
                    CASE 
                        WHEN jp.view_count >= 100 THEN 3
                        WHEN jp.view_count >= 50 THEN 2
                        WHEN jp.view_count >= 10 THEN 1
                        ELSE 0
                    END
                """
                
                # Combine scores with weights
                order_by = f"""
                    (
                        ({skill_match_case}) * 5 +
                        ({recency_score}) * 3 +
                        ({engagement_score}) * 1 +
                        (CASE WHEN jp.is_featured = 1 THEN 15 ELSE 0 END)
                    ) DESC,
                    jp.posted_date DESC,
                    jp.created_at DESC
                """
                
                query_params = params + skill_params + params
            else:
                # Non-personalized: just sort by recency and features
                order_by = """
                    jp.is_featured DESC,
                    jp.posted_date DESC,
                    jp.created_at DESC
                """
                query_params = params
            
            # Main jobs query
            jobs_query = f"""
                SELECT jp.id, jp.title, jp.company, jp.location, jp.job_type, jp.work_mode,
                       jp.description, jp.salary_min, jp.salary_max, jp.salary_currency,
                       jp.experience_level, jp.skills, jp.category, jp.industry,
                       jp.posted_date, jp.deadline, jp.view_count, jp.is_featured,
                       jp.created_by_type, jp.status, jp.company_logo_url, 
                       jp.created_at, jp.job_source, jp.created_by,
                       jp.apply_link, jp.apply_email,
                       (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as application_count
                FROM job_postings jp
                WHERE {where_clause}
                ORDER BY {order_by}
                LIMIT ? OFFSET ?
            """
            
            cursor.execute(jobs_query, query_params + [per_page, offset])
            
            jobs = []
            for row in cursor.fetchall():
                # Parse skills JSON
                skills_list = []
                if row[11]:  # skills field
                    try:
                        skills_list = json.loads(row[11]) if isinstance(row[11], str) else row[11]
                    except (json.JSONDecodeError, TypeError):
                        skills_list = row[11].split(',') if row[11] else []
                
                # Calculate skill match percentage for this job
                skill_match_percentage = 0
                if user_skills and skills_list:
                    matched_skills = set(user_skills).intersection(set(skills_list))
                    skill_match_percentage = (len(matched_skills) / len(skills_list)) * 100 if skills_list else 0
                
                job_dict = {
                    'id': row[0],
                    'title': row[1],
                    'company': row[2],
                    'location': row[3],
                    'job_type': row[4],
                    'work_mode': row[5],
                    'description': row[6][:300] + '...' if row[6] and len(row[6]) > 300 else row[6],
                    'salary_min': row[7],
                    'salary_max': row[8],
                    'salary_currency': row[9],
                    'experience_level': row[10],
                    'skills': skills_list,
                    'category': row[12],
                    'industry': row[13],
                    'posted_date': row[14],
                    'deadline': row[15],
                    'view_count': row[16],
                    'is_featured': row[17],
                    'created_by_type': row[18],
                    'status': row[19],
                    'company_logo_url': row[20],
                    'created_at': row[21],
                    'apply_link': row[24],
                    'apply_email': row[25],
                    'application_count': row[26],
                    # Personalization metadata (don't expose source info to frontend)
                    'skill_match_percentage': round(skill_match_percentage, 1) if user_id else 0,
                    'is_personalized': bool(user_id and skill_match_percentage > 0),
                }
                jobs.append(job_dict)
            
            # Calculate pagination
            total_pages = math.ceil(total_count / per_page)
            has_next = page < total_pages
            has_prev = page > 1
            
            # Get feed statistics
            feed_stats = self._get_feed_statistics(cursor, user_id, user_skills)
            
            return {
                'jobs': jobs,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_count,
                    'total_pages': total_pages,
                    'has_next': has_next,
                    'has_prev': has_prev,
                },
                'personalization': {
                    'is_personalized': bool(user_id and user_skills),
                    'user_skills': user_skills if user_id else [],
                    'skill_count': len(user_skills) if user_skills else 0,
                },
                'feed_stats': feed_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting personalized feed: {e}")
            return {
                'jobs': [],
                'pagination': {'page': page, 'per_page': per_page, 'total': 0, 'total_pages': 0, 'has_next': False, 'has_prev': False},
                'personalization': {'is_personalized': False, 'user_skills': [], 'skill_count': 0},
                'feed_stats': {}
            }
        finally:
            conn.close()
    
    def _get_user_skills(self, cursor, user_id: int) -> List[str]:
        """Get user skills for personalization"""
        try:
            cursor.execute("SELECT skills FROM users WHERE id = ?", (user_id,))
            result = cursor.fetchone()
            
            if result and result[0]:
                skills_str = result[0]
                # Handle both JSON array and comma-separated string formats
                try:
                    if skills_str.startswith('['):
                        skills = json.loads(skills_str)
                    else:
                        skills = [s.strip() for s in skills_str.split(',') if s.strip()]
                    
                    # Clean and normalize skills
                    normalized_skills = []
                    for skill in skills:
                        if isinstance(skill, str):
                            normalized_skills.append(skill.strip().lower())
                    
                    return normalized_skills
                except (json.JSONDecodeError, AttributeError):
                    return [s.strip().lower() for s in skills_str.split(',') if s.strip()]
            
            return []
        except Exception as e:
            logger.error(f"Error getting user skills: {e}")
            return []
    
    def _get_feed_statistics(self, cursor, user_id: Optional[int], user_skills: List[str]) -> Dict[str, Any]:
        """Get statistics about the feed composition"""
        try:
            stats = {}
            
            # Total active jobs by source
            cursor.execute("""
                SELECT 
                    COALESCE(created_by_type, 'unknown') as source_type,
                    COUNT(*) as count
                FROM job_postings 
                WHERE is_active = 1 AND approved_by_admin = 1
                GROUP BY created_by_type
            """)
            
            source_breakdown = {}
            total_jobs = 0
            for row in cursor.fetchall():
                source_breakdown[row[0]] = row[1]
                total_jobs += row[1]
            
            stats['total_jobs'] = total_jobs
            stats['source_breakdown'] = source_breakdown
            
            # If user has skills, get skill-matched jobs count
            if user_skills:
                skill_conditions = []
                skill_params = []
                for skill in user_skills:
                    skill_conditions.append("skills LIKE ?")
                    skill_params.append(f"%{skill}%")
                
                if skill_conditions:
                    cursor.execute(f"""
                        SELECT COUNT(*) 
                        FROM job_postings 
                        WHERE is_active = 1 AND approved_by_admin = 1 
                        AND ({' OR '.join(skill_conditions)})
                    """, skill_params)
                    
                    matched_jobs = cursor.fetchone()[0]
                    stats['skill_matched_jobs'] = matched_jobs
                    stats['match_percentage'] = round((matched_jobs / total_jobs) * 100, 1) if total_jobs > 0 else 0
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting feed statistics: {e}")
            return {}
    
    def increment_job_view(self, job_id: int, user_id: Optional[int] = None) -> bool:
        """Increment job view count and optionally track user engagement"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Increment view count
            cursor.execute("""
                UPDATE job_postings 
                SET view_count = view_count + 1 
                WHERE id = ?
            """, (job_id,))
            
            # Optionally track user engagement for better recommendations
            if user_id:
                cursor.execute("""
                    INSERT OR REPLACE INTO job_views (job_id, user_id, viewed_at, view_count)
                    VALUES (?, ?, CURRENT_TIMESTAMP, 
                           COALESCE((SELECT view_count FROM job_views WHERE job_id = ? AND user_id = ?), 0) + 1)
                """, (job_id, user_id, job_id, user_id))
            
            conn.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error incrementing job view: {e}")
            return False
        finally:
            conn.close()
    
    def init_engagement_tables(self):
        """Initialize tables for tracking user engagement"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Table for tracking job views by users
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS job_views (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    view_count INTEGER DEFAULT 1,
                    UNIQUE(job_id, user_id),
                    FOREIGN KEY (job_id) REFERENCES job_postings (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            ''')
            
            # Index for performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_views_user ON job_views(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_views_job ON job_views(job_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_views_time ON job_views(viewed_at)')
            
            conn.commit()
            logger.info("Engagement tracking tables initialized")
            
        except Exception as e:
            logger.error(f"Error initializing engagement tables: {e}")
        finally:
            conn.close()
