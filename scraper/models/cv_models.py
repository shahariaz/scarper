"""
CV/Resume models and services for the job portal
Handles CV templates, user CVs, and PDF generation
"""
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from ..utils.logger import setup_logger

logger = setup_logger(__name__)

class CVService:
    """Service for managing CV/Resume functionality"""
    
    def __init__(self):
        self.init_cv_tables()
    
    def init_cv_tables(self):
        """Initialize CV-related database tables"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # CV Templates table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cv_templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    template_data TEXT NOT NULL,  -- JSON structure
                    preview_image_url TEXT,
                    category TEXT DEFAULT 'general',
                    is_premium BOOLEAN DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    created_by INTEGER,
                    created_at TEXT NOT NULL,
                    updated_at TEXT
                )
            ''')
            
            # User CVs table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_cvs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    template_id INTEGER,
                    cv_name TEXT NOT NULL,
                    cv_data TEXT NOT NULL,  -- JSON with user's CV content
                    is_public BOOLEAN DEFAULT 0,
                    is_default BOOLEAN DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (template_id) REFERENCES cv_templates (id) ON DELETE SET NULL
                )
            ''')
            
            # CV Shares table (for sharing CVs)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cv_shares (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cv_id INTEGER NOT NULL,
                    share_token TEXT UNIQUE NOT NULL,
                    password TEXT,  -- Optional password protection
                    expires_at TEXT,
                    view_count INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (cv_id) REFERENCES user_cvs (id) ON DELETE CASCADE
                )
            ''')
            
            # CV Export History table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cv_exports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cv_id INTEGER NOT NULL,
                    export_format TEXT NOT NULL,  -- pdf, docx, html
                    file_url TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (cv_id) REFERENCES user_cvs (id) ON DELETE CASCADE
                )
            ''')
            
            conn.commit()
            
            # Insert default templates if none exist
            cursor.execute("SELECT COUNT(*) FROM cv_templates")
            if cursor.fetchone()[0] == 0:
                self._insert_default_templates(cursor)
                conn.commit()
            
            conn.close()
            logger.info("CV tables initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing CV tables: {e}")
            raise
    
    def _insert_default_templates(self, cursor):
        """Insert default CV templates"""
        default_templates = [
            {
                'name': 'Modern Professional',
                'description': 'Clean and modern template perfect for tech professionals',
                'category': 'professional',
                'template_data': json.dumps({
                    'layout': 'two-column',
                    'color_scheme': 'blue',
                    'sections': ['header', 'summary', 'experience', 'education', 'skills', 'contact'],
                    'fonts': {'primary': 'Inter', 'secondary': 'Inter'},
                    'spacing': 'comfortable'
                })
            },
            {
                'name': 'Creative Designer',
                'description': 'Eye-catching template for creative professionals',
                'category': 'creative',
                'template_data': json.dumps({
                    'layout': 'single-column',
                    'color_scheme': 'purple',
                    'sections': ['header', 'portfolio', 'experience', 'skills', 'education', 'contact'],
                    'fonts': {'primary': 'Poppins', 'secondary': 'Inter'},
                    'spacing': 'compact'
                })
            },
            {
                'name': 'Executive Classic',
                'description': 'Traditional and elegant template for senior positions',
                'category': 'executive',
                'template_data': json.dumps({
                    'layout': 'single-column',
                    'color_scheme': 'black',
                    'sections': ['header', 'summary', 'experience', 'education', 'achievements', 'contact'],
                    'fonts': {'primary': 'Times', 'secondary': 'Arial'},
                    'spacing': 'spacious'
                })
            },
            {
                'name': 'Fresh Graduate',
                'description': 'Perfect template for students and fresh graduates',
                'category': 'entry-level',
                'template_data': json.dumps({
                    'layout': 'two-column',
                    'color_scheme': 'green',
                    'sections': ['header', 'objective', 'education', 'internships', 'projects', 'skills', 'contact'],
                    'fonts': {'primary': 'Roboto', 'secondary': 'Inter'},
                    'spacing': 'comfortable'
                })
            }
        ]
        
        for template in default_templates:
            cursor.execute('''
                INSERT INTO cv_templates (name, description, category, template_data, is_active, created_at)
                VALUES (?, ?, ?, ?, 1, ?)
            ''', (
                template['name'],
                template['description'],
                template['category'],
                template['template_data'],
                datetime.utcnow().isoformat()
            ))
    
    def get_cv_templates(self, category: Optional[str] = None, is_premium: Optional[bool] = None) -> List[Dict]:
        """Get available CV templates"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            query = "SELECT * FROM cv_templates WHERE is_active = 1"
            params = []
            
            if category:
                query += " AND category = ?"
                params.append(category)
            
            if is_premium is not None:
                query += " AND is_premium = ?"
                params.append(is_premium)
            
            query += " ORDER BY created_at DESC"
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            templates = []
            for row in rows:
                templates.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'template_data': json.loads(row[3]) if row[3] else {},
                    'preview_image_url': row[4],
                    'category': row[5],
                    'is_premium': bool(row[6]),
                    'is_active': bool(row[7]),
                    'created_by': row[8],
                    'created_at': row[9],
                    'updated_at': row[10]
                })
            
            conn.close()
            return templates
            
        except Exception as e:
            logger.error(f"Error getting CV templates: {e}")
            return []
    
    def create_user_cv(self, user_id: int, template_id: int, cv_name: str, cv_data: Dict) -> Dict:
        """Create a new CV for user"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if template exists
            cursor.execute("SELECT id FROM cv_templates WHERE id = ? AND is_active = 1", (template_id,))
            if not cursor.fetchone():
                return {'success': False, 'message': 'Template not found'}
            
            # Check if CV name already exists for user
            cursor.execute("SELECT id FROM user_cvs WHERE user_id = ? AND cv_name = ?", (user_id, cv_name))
            if cursor.fetchone():
                return {'success': False, 'message': 'CV with this name already exists'}
            
            # Insert new CV
            cursor.execute('''
                INSERT INTO user_cvs (user_id, template_id, cv_name, cv_data, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                user_id,
                template_id,
                cv_name,
                json.dumps(cv_data),
                datetime.utcnow().isoformat(),
                datetime.utcnow().isoformat()
            ))
            
            cv_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'CV created successfully',
                'cv_id': cv_id
            }
            
        except Exception as e:
            logger.error(f"Error creating user CV: {e}")
            return {'success': False, 'message': 'Failed to create CV'}
    
    def get_user_cvs(self, user_id: int) -> List[Dict]:
        """Get all CVs for a user"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    uc.id, uc.cv_name, uc.cv_data, uc.is_public, uc.is_default,
                    uc.created_at, uc.updated_at,
                    ct.name as template_name, ct.category as template_category
                FROM user_cvs uc
                LEFT JOIN cv_templates ct ON uc.template_id = ct.id
                WHERE uc.user_id = ?
                ORDER BY uc.updated_at DESC
            ''', (user_id,))
            
            cvs = []
            for row in cursor.fetchall():
                cvs.append({
                    'id': row[0],
                    'cv_name': row[1],
                    'cv_data': json.loads(row[2]) if row[2] else {},
                    'is_public': bool(row[3]),
                    'is_default': bool(row[4]),
                    'created_at': row[5],
                    'updated_at': row[6],
                    'template_name': row[7],
                    'template_category': row[8]
                })
            
            conn.close()
            return cvs
            
        except Exception as e:
            logger.error(f"Error getting user CVs: {e}")
            return []
    
    def get_cv_by_id(self, cv_id: int, user_id: Optional[int] = None) -> Optional[Dict]:
        """Get a specific CV by ID"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            query = '''
                SELECT 
                    uc.id, uc.user_id, uc.template_id, uc.cv_name, uc.cv_data,
                    uc.is_public, uc.is_default, uc.created_at, uc.updated_at,
                    ct.name as template_name, ct.template_data, ct.category as template_category
                FROM user_cvs uc
                LEFT JOIN cv_templates ct ON uc.template_id = ct.id
                WHERE uc.id = ?
            '''
            params = [cv_id]
            
            if user_id:
                query += " AND uc.user_id = ?"
                params.append(user_id)
            
            cursor.execute(query, params)
            row = cursor.fetchone()
            
            if not row:
                conn.close()
                return None
            
            cv = {
                'id': row[0],
                'user_id': row[1],
                'template_id': row[2],
                'cv_name': row[3],
                'cv_data': json.loads(row[4]) if row[4] else {},
                'is_public': bool(row[5]),
                'is_default': bool(row[6]),
                'created_at': row[7],
                'updated_at': row[8],
                'template': {
                    'name': row[9],
                    'template_data': json.loads(row[10]) if row[10] else {},
                    'category': row[11]
                }
            }
            
            conn.close()
            return cv
            
        except Exception as e:
            logger.error(f"Error getting CV by ID: {e}")
            return None
    
    def update_cv(self, cv_id: int, user_id: int, updates: Dict) -> Dict:
        """Update a CV"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if CV exists and belongs to user
            cursor.execute("SELECT id FROM user_cvs WHERE id = ? AND user_id = ?", (cv_id, user_id))
            if not cursor.fetchone():
                return {'success': False, 'message': 'CV not found'}
            
            # Build update query
            update_fields = []
            params = []
            
            if 'cv_name' in updates:
                update_fields.append('cv_name = ?')
                params.append(updates['cv_name'])
            
            if 'cv_data' in updates:
                update_fields.append('cv_data = ?')
                params.append(json.dumps(updates['cv_data']))
            
            if 'is_public' in updates:
                update_fields.append('is_public = ?')
                params.append(updates['is_public'])
            
            if 'is_default' in updates:
                update_fields.append('is_default = ?')
                params.append(updates['is_default'])
                
                # If setting as default, unset other default CVs
                if updates['is_default']:
                    cursor.execute("UPDATE user_cvs SET is_default = 0 WHERE user_id = ? AND id != ?", (user_id, cv_id))
            
            if not update_fields:
                return {'success': False, 'message': 'No fields to update'}
            
            update_fields.append('updated_at = ?')
            params.append(datetime.utcnow().isoformat())
            
            params.extend([cv_id, user_id])
            
            cursor.execute(f'''
                UPDATE user_cvs 
                SET {', '.join(update_fields)}
                WHERE id = ? AND user_id = ?
            ''', params)
            
            conn.commit()
            conn.close()
            
            return {'success': True, 'message': 'CV updated successfully'}
            
        except Exception as e:
            logger.error(f"Error updating CV: {e}")
            return {'success': False, 'message': 'Failed to update CV'}
    
    def delete_cv(self, cv_id: int, user_id: int) -> Dict:
        """Delete a CV"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if CV exists and belongs to user
            cursor.execute("SELECT id FROM user_cvs WHERE id = ? AND user_id = ?", (cv_id, user_id))
            if not cursor.fetchone():
                return {'success': False, 'message': 'CV not found'}
            
            # Delete CV and related data
            cursor.execute("DELETE FROM cv_shares WHERE cv_id = ?", (cv_id,))
            cursor.execute("DELETE FROM cv_exports WHERE cv_id = ?", (cv_id,))
            cursor.execute("DELETE FROM user_cvs WHERE id = ?", (cv_id,))
            
            conn.commit()
            conn.close()
            
            return {'success': True, 'message': 'CV deleted successfully'}
            
        except Exception as e:
            logger.error(f"Error deleting CV: {e}")
            return {'success': False, 'message': 'Failed to delete CV'}
    
    def create_cv_share(self, cv_id: int, user_id: int, password: Optional[str] = None, expires_days: Optional[int] = None) -> Dict:
        """Create a shareable link for a CV"""
        try:
            import secrets
            
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Check if CV exists and belongs to user
            cursor.execute("SELECT id FROM user_cvs WHERE id = ? AND user_id = ?", (cv_id, user_id))
            if not cursor.fetchone():
                return {'success': False, 'message': 'CV not found'}
            
            # Generate unique share token
            share_token = secrets.token_urlsafe(32)
            
            # Calculate expiry date if specified
            expires_at = None
            if expires_days:
                from datetime import timedelta
                expires_at = (datetime.utcnow() + timedelta(days=expires_days)).isoformat()
            
            # Hash password if provided
            hashed_password = None
            if password:
                import hashlib
                hashed_password = hashlib.sha256(password.encode()).hexdigest()
            
            # Insert share record
            cursor.execute('''
                INSERT INTO cv_shares (cv_id, share_token, password, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (cv_id, share_token, hashed_password, expires_at, datetime.utcnow().isoformat()))
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Share link created successfully',
                'share_token': share_token,
                'expires_at': expires_at
            }
            
        except Exception as e:
            logger.error(f"Error creating CV share: {e}")
            return {'success': False, 'message': 'Failed to create share link'}
    
    def get_cv_statistics(self, user_id: int) -> Dict:
        """Get CV statistics for a user"""
        try:
            conn = sqlite3.connect('jobs.db')
            cursor = conn.cursor()
            
            # Get basic CV counts
            cursor.execute("SELECT COUNT(*) FROM user_cvs WHERE user_id = ?", (user_id,))
            total_cvs = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM user_cvs WHERE user_id = ? AND is_public = 1", (user_id,))
            public_cvs = cursor.fetchone()[0]
            
            # Get total shares
            cursor.execute('''
                SELECT COUNT(*) FROM cv_shares cs
                JOIN user_cvs uc ON cs.cv_id = uc.id
                WHERE uc.user_id = ?
            ''', (user_id,))
            total_shares = cursor.fetchone()[0]
            
            # Get total views
            cursor.execute('''
                SELECT SUM(cs.view_count) FROM cv_shares cs
                JOIN user_cvs uc ON cs.cv_id = uc.id
                WHERE uc.user_id = ?
            ''', (user_id,))
            total_views = cursor.fetchone()[0] or 0
            
            conn.close()
            
            return {
                'total_cvs': total_cvs,
                'public_cvs': public_cvs,
                'total_shares': total_shares,
                'total_views': total_views
            }
            
        except Exception as e:
            logger.error(f"Error getting CV statistics: {e}")
            return {
                'total_cvs': 0,
                'public_cvs': 0,
                'total_shares': 0,
                'total_views': 0
            }
