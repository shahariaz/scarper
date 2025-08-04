"""
Job management models for the job portal
"""
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from ..utils.logger import setup_logger

logger = setup_logger(__name__)

class JobManagementDatabase:
    def __init__(self, db_path: str = "jobs.db"):
        self.db_path = db_path
        self.init_job_management_tables()
    
    def init_job_management_tables(self):
        """Initialize job management related tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Update existing jobs table to add new fields
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_postings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                job_type TEXT DEFAULT 'Full-time',
                work_mode TEXT DEFAULT 'On-site', -- Remote, Hybrid, On-site
                description TEXT,
                requirements TEXT,
                responsibilities TEXT,
                benefits TEXT,
                salary_min INTEGER,
                salary_max INTEGER,
                salary_currency TEXT DEFAULT 'BDT',
                experience_level TEXT,
                skills TEXT, -- JSON array of skills
                education_requirements TEXT,
                apply_link TEXT,
                apply_email TEXT,
                source_url TEXT,
                posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deadline TIMESTAMP,
                scraped_at TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                is_featured BOOLEAN DEFAULT FALSE,
                view_count INTEGER DEFAULT 0,
                application_count INTEGER DEFAULT 0,
                -- Role-based creation flags
                created_by_user_id INTEGER,
                created_by_type TEXT CHECK (created_by_type IN ('admin', 'company', 'scraper')) DEFAULT 'scraper',
                job_source TEXT DEFAULT 'scraped', -- scraped, manual, admin, etc.
                created_by TEXT, -- company name or admin name who created/scraped this job
                approved_by_admin BOOLEAN DEFAULT FALSE,
                admin_notes TEXT,
                -- Status tracking
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed', 'draft', 'pending_approval')),
                priority INTEGER DEFAULT 0, -- For featured/promoted jobs
                -- SEO and metadata
                meta_title TEXT,
                meta_description TEXT,
                tags TEXT, -- JSON array of tags
                category TEXT,
                industry TEXT,
                company_size TEXT,
                -- Contact information
                contact_person TEXT,
                contact_phone TEXT,
                company_logo_url TEXT,
                company_website TEXT,
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_at TIMESTAMP,
                closed_at TIMESTAMP,
                FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
            )
        ''')
        
        # Add migration for job_source and created_by columns if they don't exist
        try:
            # Check if job_source column exists in job_postings
            cursor.execute("PRAGMA table_info(job_postings)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'job_source' not in columns:
                cursor.execute('ALTER TABLE job_postings ADD COLUMN job_source TEXT DEFAULT "scraped"')
                logger.info("Added job_source column to job_postings table")
            
            if 'created_by' not in columns:
                cursor.execute('ALTER TABLE job_postings ADD COLUMN created_by TEXT')
                logger.info("Added created_by column to job_postings table")
                
        except Exception as e:
            logger.error(f"Error adding migration columns: {e}")
        
        # Apply same migration to original jobs table for backward compatibility
        try:
            cursor.execute("PRAGMA table_info(jobs)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'job_source' not in columns:
                cursor.execute('ALTER TABLE jobs ADD COLUMN job_source TEXT DEFAULT "scraped"')
                logger.info("Added job_source column to jobs table")
            
            if 'created_by' not in columns:
                cursor.execute('ALTER TABLE jobs ADD COLUMN created_by TEXT')
                logger.info("Added created_by column to jobs table")
                
        except Exception as e:
            logger.error(f"Error adding migration columns to jobs table: {e}")
        
        # Job applications table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                applicant_user_id INTEGER NOT NULL,
                cover_letter TEXT,
                resume_url TEXT,
                additional_info TEXT,
                status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn')),
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_by_user_id INTEGER,
                reviewed_at TIMESTAMP,
                notes TEXT,
                interview_date TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES job_postings (id) ON DELETE CASCADE,
                FOREIGN KEY (applicant_user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id) ON DELETE SET NULL
            )
        ''')
        
        # Job bookmarks/saved jobs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                job_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES job_postings (id) ON DELETE CASCADE,
                UNIQUE(user_id, job_id)
            )
        ''')
        
        # Job alerts/notifications
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                alert_name TEXT NOT NULL,
                keywords TEXT, -- JSON array
                location TEXT,
                job_type TEXT,
                experience_level TEXT,
                salary_min INTEGER,
                salary_max INTEGER,
                is_active BOOLEAN DEFAULT TRUE,
                email_notifications BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_sent_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Job categories
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                description TEXT,
                parent_id INTEGER,
                is_active BOOLEAN DEFAULT TRUE,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES job_categories (id) ON DELETE SET NULL
            )
        ''')
        
        # Insert default categories
        default_categories = [
            ('Technology', 'technology', 'Software development, IT, and tech roles'),
            ('Design', 'design', 'UI/UX, graphic design, and creative roles'),
            ('Marketing', 'marketing', 'Digital marketing, content, and advertising'),
            ('Sales', 'sales', 'Sales, business development, and customer relations'),
            ('Finance', 'finance', 'Accounting, finance, and investment roles'),
            ('Healthcare', 'healthcare', 'Medical, nursing, and healthcare roles'),
            ('Education', 'education', 'Teaching, training, and academic roles'),
            ('Engineering', 'engineering', 'Civil, mechanical, and other engineering roles'),
            ('Human Resources', 'human-resources', 'HR, recruitment, and people operations'),
            ('Operations', 'operations', 'Operations, logistics, and supply chain'),
            ('Customer Service', 'customer-service', 'Support, service, and client relations'),
            ('Other', 'other', 'Miscellaneous job categories')
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO job_categories (name, slug, description)
            VALUES (?, ?, ?)
        ''', default_categories)
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_postings_created_by ON job_postings(created_by_user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_postings_type ON job_postings(created_by_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(is_active)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_postings_location ON job_postings(location)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_postings_category ON job_postings(category)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(applicant_user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status)')
        
        conn.commit()
        conn.close()
        logger.info("Job management tables initialized successfully")

class JobService:
    def __init__(self, db_path: str = "jobs.db"):
        self.db = JobManagementDatabase(db_path)
        self.db_path = db_path
    
    def create_job_posting(self, job_data: Dict[str, Any], created_by_user_id: int = None, 
                          created_by_type: str = 'scraper') -> Dict[str, Any]:
        """Create a new job posting"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Validate required fields
            required_fields = ['title', 'company', 'description']
            for field in required_fields:
                if field not in job_data or not job_data[field]:
                    return {'success': False, 'message': f'Missing required field: {field}'}
            
            # Determine approval status based on creator type
            approved_by_admin = True if created_by_type in ['admin', 'scraper'] else False
            status = 'active' if approved_by_admin else 'pending_approval'
            
            # Parse skills and tags as JSON if they're strings
            skills = job_data.get('skills', '[]')
            if isinstance(skills, list):
                skills = json.dumps(skills)
            
            tags = job_data.get('tags', '[]')
            if isinstance(tags, list):
                tags = json.dumps(tags)
            
            # Insert job posting
            # Get the next available ID
            cursor.execute('SELECT MAX(id) FROM job_postings')
            max_id = cursor.fetchone()[0]
            next_id = (max_id or 0) + 1
            
            cursor.execute('''
                INSERT INTO job_postings (
                    id, title, company, location, job_type, work_mode, description, requirements,
                    responsibilities, benefits, salary_min, salary_max, salary_currency,
                    experience_level, skills, education_requirements, apply_link, apply_email,
                    source_url, deadline, created_by_user_id, created_by_type, approved_by_admin,
                    status, meta_title, meta_description, tags, category, industry, company_size,
                    contact_person, contact_phone, company_logo_url, company_website, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ''', (
                next_id,
                job_data['title'],
                job_data['company'],
                job_data.get('location', ''),
                job_data.get('job_type', 'Full-time'),
                job_data.get('work_mode', 'On-site'),
                job_data['description'],
                job_data.get('requirements', ''),
                job_data.get('responsibilities', ''),
                job_data.get('benefits', ''),
                job_data.get('salary_min'),
                job_data.get('salary_max'),
                job_data.get('salary_currency', 'BDT'),
                job_data.get('experience_level', ''),
                skills,
                job_data.get('education_requirements', ''),
                job_data.get('apply_link', ''),
                job_data.get('apply_email', ''),
                job_data.get('source_url', ''),
                job_data.get('deadline'),
                created_by_user_id,
                created_by_type,
                approved_by_admin,
                status,
                job_data.get('meta_title', job_data['title']),
                job_data.get('meta_description', job_data['description'][:160]),
                tags,
                job_data.get('category', ''),
                job_data.get('industry', ''),
                job_data.get('company_size', ''),
                job_data.get('contact_person', ''),
                job_data.get('contact_phone', ''),
                job_data.get('company_logo_url', ''),
                job_data.get('company_website', '')
            ))
            
            job_id = next_id
            conn.commit()
            
            # If created by admin, approve immediately
            if created_by_type == 'admin' and not approved_by_admin:
                self.approve_job_posting(job_id, created_by_user_id, "Auto-approved by admin")
            
            message = "Job posted successfully"
            if not approved_by_admin:
                message += " and is pending admin approval"
            
            return {
                'success': True,
                'message': message,
                'job_id': job_id,
                'status': status,
                'approved': approved_by_admin
            }
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Error creating job posting: {e}")
            return {'success': False, 'message': 'Failed to create job posting'}
        
        finally:
            conn.close()
    
    def update_job_posting(self, job_id: int, job_data: Dict[str, Any], 
                          updated_by_user_id: int, user_type: str) -> Dict[str, Any]:
        """Update an existing job posting"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Check if job exists and user has permission to edit
            cursor.execute('''
                SELECT created_by_user_id, created_by_type, status
                FROM job_postings 
                WHERE id = ?
            ''', (job_id,))
            
            job = cursor.fetchone()
            if not job:
                return {'success': False, 'message': 'Job not found'}
            
            created_by_user_id, created_by_type, current_status = job
            
            # Check permissions
            can_edit = (
                user_type == 'admin' or  # Admin can edit any job
                (user_type == 'company' and created_by_user_id == updated_by_user_id)  # Company can edit their own jobs
            )
            
            if not can_edit:
                return {'success': False, 'message': 'Permission denied'}
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            
            updatable_fields = [
                'title', 'location', 'job_type', 'work_mode', 'description', 'requirements',
                'responsibilities', 'benefits', 'salary_min', 'salary_max', 'salary_currency',
                'experience_level', 'education_requirements', 'apply_link', 'apply_email',
                'deadline', 'category', 'industry', 'company_size', 'contact_person',
                'contact_phone', 'company_website', 'meta_title', 'meta_description'
            ]
            
            for field in updatable_fields:
                if field in job_data:
                    update_fields.append(f"{field} = ?")
                    update_values.append(job_data[field])
            
            # Handle special fields
            if 'skills' in job_data:
                skills = job_data['skills']
                if isinstance(skills, list):
                    skills = json.dumps(skills)
                update_fields.append("skills = ?")
                update_values.append(skills)
            
            if 'tags' in job_data:
                tags = job_data['tags']
                if isinstance(tags, list):
                    tags = json.dumps(tags)
                update_fields.append("tags = ?")
                update_values.append(tags)
            
            if 'status' in job_data and user_type == 'admin':
                update_fields.append("status = ?")
                update_values.append(job_data['status'])
            
            if not update_fields:
                return {'success': False, 'message': 'No fields to update'}
            
            # Add updated_at timestamp
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.append(job_id)
            
            # Execute update
            update_query = f"UPDATE job_postings SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(update_query, update_values)
            
            conn.commit()
            
            return {
                'success': True,
                'message': 'Job updated successfully',
                'job_id': job_id
            }
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Error updating job posting: {e}")
            return {'success': False, 'message': 'Failed to update job posting'}
        
        finally:
            conn.close()
    
    def get_job_posting(self, job_id: int, increment_views: bool = True) -> Optional[Dict[str, Any]]:
        """Get a job posting by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Get job details
            cursor.execute('''
                SELECT jp.*, u.email as creator_email, up.first_name, up.last_name,
                       cp.company_name as profile_company_name
                FROM job_postings jp
                LEFT JOIN users u ON jp.created_by_user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN company_profiles cp ON u.id = cp.user_id
                WHERE jp.id = ?
            ''', (job_id,))
            
            job = cursor.fetchone()
            if not job:
                return None
            
            # Increment view count if requested
            if increment_views:
                cursor.execute('UPDATE job_postings SET view_count = view_count + 1 WHERE id = ?', (job_id,))
                conn.commit()
            
            # Convert to dictionary
            columns = [description[0] for description in cursor.description]
            job_dict = dict(zip(columns, job))
            
            # Parse JSON fields
            try:
                job_dict['skills'] = json.loads(job_dict['skills']) if job_dict['skills'] else []
            except (json.JSONDecodeError, TypeError):
                job_dict['skills'] = []
            
            try:
                job_dict['tags'] = json.loads(job_dict['tags']) if job_dict['tags'] else []
            except (json.JSONDecodeError, TypeError):
                job_dict['tags'] = []
            
            # Get application count
            cursor.execute('SELECT COUNT(*) FROM job_applications WHERE job_id = ?', (job_id,))
            job_dict['application_count'] = cursor.fetchone()[0]
            
            return job_dict
            
        except Exception as e:
            logger.error(f"Error getting job posting: {e}")
            return None
        
        finally:
            conn.close()
    
    def search_job_postings(self, filters: Dict[str, Any] = None, 
                           page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Search job postings with filters and pagination"""
        if filters is None:
            filters = {}
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Build WHERE clause
            where_conditions = ["jp.is_active = 1"]
            params = []
            
            # Search query
            if filters.get('query'):
                where_conditions.append("""
                    (jp.title LIKE ? OR jp.company LIKE ? OR jp.description LIKE ? 
                     OR jp.skills LIKE ? OR jp.category LIKE ?)
                """)
                query_param = f"%{filters['query']}%"
                params.extend([query_param] * 5)
            
            # Filters
            filter_mappings = {
                'company': 'jp.company',
                'location': 'jp.location',
                'job_type': 'jp.job_type',
                'work_mode': 'jp.work_mode',
                'experience_level': 'jp.experience_level',
                'category': 'jp.category',
                'industry': 'jp.industry',
                'created_by_type': 'jp.created_by_type',
                'status': 'jp.status'
            }
            
            for filter_key, db_field in filter_mappings.items():
                if filters.get(filter_key):
                    if filter_key in ['location', 'category', 'industry']:
                        where_conditions.append(f"{db_field} LIKE ?")
                        params.append(f"%{filters[filter_key]}%")
                    else:
                        where_conditions.append(f"{db_field} = ?")
                        params.append(filters[filter_key])
            
            # Salary range filter
            if filters.get('salary_min'):
                where_conditions.append("jp.salary_max >= ?")
                params.append(filters['salary_min'])
            
            if filters.get('salary_max'):
                where_conditions.append("jp.salary_min <= ?")
                params.append(filters['salary_max'])
            
            # Date filters
            if filters.get('posted_after'):
                where_conditions.append("jp.posted_date >= ?")
                params.append(filters['posted_after'])
            
            if filters.get('deadline_before'):
                where_conditions.append("jp.deadline <= ?")
                params.append(filters['deadline_before'])
            
            # User-specific filters
            if filters.get('created_by_user_id'):
                where_conditions.append("jp.created_by_user_id = ?")
                params.append(filters['created_by_user_id'])
            
            # Only show approved jobs for non-admin users
            if not filters.get('show_unapproved', False):
                where_conditions.append("jp.approved_by_admin = 1")
                logger.info("Filtering to approved jobs only")
            else:
                logger.info("Including unapproved jobs in search (admin view)")
            
            where_clause = " AND ".join(where_conditions)
            
            # Get total count
            count_query = f"""
                SELECT COUNT(*) 
                FROM job_postings jp
                WHERE {where_clause}
            """
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Get paginated results
            offset = (page - 1) * per_page
            
            # Order by clause
            order_by = "jp.is_featured DESC, jp.priority DESC, jp.posted_date DESC"
            if filters.get('sort') == 'salary_high':
                order_by = "jp.salary_max DESC, " + order_by
            elif filters.get('sort') == 'salary_low':
                order_by = "jp.salary_min ASC, " + order_by
            elif filters.get('sort') == 'relevance' and filters.get('query'):
                # Simple relevance scoring
                order_by = "jp.is_featured DESC, jp.priority DESC, jp.posted_date DESC"
            
            jobs_query = f"""
                SELECT jp.id, jp.title, jp.company, jp.location, jp.job_type, jp.work_mode,
                       jp.description, jp.salary_min, jp.salary_max, jp.salary_currency,
                       jp.experience_level, jp.skills, jp.category, jp.industry,
                       jp.posted_date, jp.deadline, jp.view_count, jp.is_featured,
                       jp.created_by_type, jp.status, jp.company_logo_url, jp.approved_by_admin,
                       jp.created_at, jp.admin_notes, jp.job_source, jp.created_by,
                       (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as application_count
                FROM job_postings jp
                WHERE {where_clause}
                ORDER BY {order_by}
                LIMIT ? OFFSET ?
            """
            
            cursor.execute(jobs_query, params + [per_page, offset])
            
            jobs = []
            for row in cursor.fetchall():
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
                    'skills': json.loads(row[11]) if row[11] else [],
                    'category': row[12],
                    'industry': row[13],
                    'posted_date': row[14],
                    'deadline': row[15],
                    'view_count': row[16],
                    'is_featured': row[17],
                    'created_by_type': row[18],
                    'status': row[19],
                    'company_logo_url': row[20],
                    'approved_by_admin': bool(row[21]),  # Convert SQLite boolean to Python boolean
                    'created_at': row[22],  # Add created_at field for frontend
                    'admin_notes': row[23],  # Add admin_notes field
                    'job_source': row[24],  # scraped, manual, admin, etc.
                    'created_by': row[25],  # company name or admin name
                    'application_count': row[26]
                }
                jobs.append(job_dict)
            
            total_pages = (total_count + per_page - 1) // per_page
            
            return {
                'jobs': jobs,
                'pagination': {
                    'total': total_count,
                    'page': page,
                    'per_page': per_page,
                    'pages': total_pages,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                }
            }
            
        except Exception as e:
            logger.error(f"Error searching job postings: {e}")
            return {'jobs': [], 'pagination': {'total': 0, 'page': 1, 'per_page': per_page, 'pages': 0}}
        
        finally:
            conn.close()
    
    def approve_job_posting(self, job_id: int, approved_by_user_id: int, 
                           admin_notes: str = "") -> Dict[str, Any]:
        """Approve a job posting (admin only)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # First check if the job exists and its current status
            cursor.execute('''
                SELECT id, title, approved_by_admin, status 
                FROM job_postings WHERE id = ?
            ''', (job_id,))
            job = cursor.fetchone()
            
            logger.info(f"Approving job {job_id}: Current job data: {job}")
            
            if not job:
                logger.warning(f"Job {job_id} not found")
                return {'success': False, 'message': 'Job not found'}
            
            if job[2]:  # approved_by_admin is True
                logger.warning(f"Job {job_id} is already approved")
                return {'success': False, 'message': 'Job already approved'}
            
            cursor.execute('''
                UPDATE job_postings 
                SET approved_by_admin = 1, status = 'active', 
                    admin_notes = ?, approved_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND approved_by_admin = FALSE
            ''', (admin_notes, job_id))
            
            logger.info(f"Update query affected {cursor.rowcount} rows")
            
            if cursor.rowcount == 0:
                return {'success': False, 'message': 'Job not found or already approved'}
            
            conn.commit()
            logger.info(f"Job {job_id} approved successfully by user {approved_by_user_id}")
            
            return {
                'success': True,
                'message': 'Job posting approved successfully',
                'job_id': job_id
            }
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Error approving job posting: {e}")
            return {'success': False, 'message': 'Failed to approve job posting'}
        
        finally:
            conn.close()
    
    def reject_job_posting(self, job_id: int, rejected_by_user_id: int, 
                          admin_notes: str = "") -> Dict[str, Any]:
        """Reject a job posting (admin only)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                UPDATE job_postings 
                SET status = 'inactive', admin_notes = ?, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (admin_notes, job_id))
            
            if cursor.rowcount == 0:
                return {'success': False, 'message': 'Job not found'}
            
            conn.commit()
            
            return {
                'success': True,
                'message': 'Job posting rejected',
                'job_id': job_id
            }
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Error rejecting job posting: {e}")
            return {'success': False, 'message': 'Failed to reject job posting'}
        
        finally:
            conn.close()
    
    def delete_job_posting(self, job_id: int, deleted_by_user_id: int, 
                          user_type: str) -> Dict[str, Any]:
        """Delete a job posting"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Check if job exists and user has permission to delete
            cursor.execute('''
                SELECT created_by_user_id, created_by_type
                FROM job_postings 
                WHERE id = ?
            ''', (job_id,))
            
            job = cursor.fetchone()
            if not job:
                return {'success': False, 'message': 'Job not found'}
            
            created_by_user_id, created_by_type = job
            
            # Check permissions
            can_delete = (
                user_type == 'admin' or  # Admin can delete any job
                (user_type == 'company' and created_by_user_id == deleted_by_user_id)  # Company can delete their own jobs
            )
            
            if not can_delete:
                return {'success': False, 'message': 'Permission denied'}
            
            # Soft delete - just mark as inactive
            cursor.execute('''
                UPDATE job_postings 
                SET is_active = FALSE, status = 'inactive',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (job_id,))
            
            conn.commit()
            
            return {
                'success': True,
                'message': 'Job posting deleted successfully',
                'job_id': job_id
            }
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Error deleting job posting: {e}")
            return {'success': False, 'message': 'Failed to delete job posting'}
        
        finally:
            conn.close()
    
    def get_job_statistics(self, user_id: int = None, user_type: str = None) -> Dict[str, Any]:
        """Get job statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            stats = {}
            
            # Base conditions
            base_conditions = ["jp.is_active = 1"]
            base_params = []
            
            # User-specific stats
            if user_id and user_type == 'company':
                base_conditions.append("jp.created_by_user_id = ?")
                base_params.append(user_id)
            
            base_where = " AND ".join(base_conditions)
            
            # Total jobs
            cursor.execute(f"SELECT COUNT(*) FROM job_postings jp WHERE {base_where}", base_params)
            stats['total_jobs'] = cursor.fetchone()[0]
            
            # Active jobs
            cursor.execute(f"SELECT COUNT(*) FROM job_postings jp WHERE {base_where} AND jp.status = 'active'", base_params)
            stats['active_jobs'] = cursor.fetchone()[0]
            
            # Pending approval
            cursor.execute(f"SELECT COUNT(*) FROM job_postings jp WHERE {base_where} AND jp.approved_by_admin = FALSE", base_params)
            stats['pending_approval'] = cursor.fetchone()[0]
            
            # Jobs by type
            cursor.execute(f"""
                SELECT jp.created_by_type, COUNT(*) 
                FROM job_postings jp 
                WHERE {base_where}
                GROUP BY jp.created_by_type
            """, base_params)
            stats['jobs_by_type'] = dict(cursor.fetchall())
            
            # Jobs by category
            cursor.execute(f"""
                SELECT jp.category, COUNT(*) 
                FROM job_postings jp 
                WHERE {base_where} AND jp.category IS NOT NULL AND jp.category != ''
                GROUP BY jp.category
                ORDER BY COUNT(*) DESC
                LIMIT 10
            """, base_params)
            stats['jobs_by_category'] = dict(cursor.fetchall())
            
            # Recent applications (if user is company)
            if user_id and user_type == 'company':
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM job_applications ja
                    JOIN job_postings jp ON ja.job_id = jp.id
                    WHERE jp.created_by_user_id = ? AND ja.applied_at >= datetime('now', '-7 days')
                """, (user_id,))
                stats['recent_applications'] = cursor.fetchone()[0]
                
                # Total applications
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM job_applications ja
                    JOIN job_postings jp ON ja.job_id = jp.id
                    WHERE jp.created_by_user_id = ?
                """, (user_id,))
                stats['total_applications'] = cursor.fetchone()[0]
            
            # Admin-only stats
            if user_type == 'admin':
                # Total applications
                cursor.execute("SELECT COUNT(*) FROM job_applications")
                stats['total_applications'] = cursor.fetchone()[0]
                
                # Recent applications
                cursor.execute("SELECT COUNT(*) FROM job_applications WHERE applied_at >= datetime('now', '-7 days')")
                stats['recent_applications'] = cursor.fetchone()[0]
                
                # Companies with most jobs
                cursor.execute("""
                    SELECT jp.company, COUNT(*) 
                    FROM job_postings jp 
                    WHERE jp.is_active = 1
                    GROUP BY jp.company
                    ORDER BY COUNT(*) DESC
                    LIMIT 10
                """)
                stats['top_companies'] = dict(cursor.fetchall())
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting job statistics: {e}")
            return {}
        
        finally:
            conn.close()
    
    def get_job_categories(self) -> List[Dict[str, Any]]:
        """Get all job categories"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, name, slug, description, parent_id, display_order
                FROM job_categories
                WHERE is_active = 1
                ORDER BY display_order, name
            """)
            
            categories = []
            for row in cursor.fetchall():
                categories.append({
                    'id': row[0],
                    'name': row[1],
                    'slug': row[2],
                    'description': row[3],
                    'parent_id': row[4],
                    'display_order': row[5]
                })
            
            return categories
            
        except Exception as e:
            logger.error(f"Error getting job categories: {e}")
            return []
        
        finally:
            conn.close()
