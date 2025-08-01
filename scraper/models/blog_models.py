import sqlite3
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import json

logger = logging.getLogger(__name__)

class BlogService:
    def __init__(self, db_path: str = 'jobs.db'):
        self.db_path = db_path
        self.init_blog_tables()
    
    def init_blog_tables(self):
        """Initialize blog-related database tables"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create blogs table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS blogs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    excerpt TEXT,
                    author_id INTEGER NOT NULL,
                    featured_image TEXT,
                    is_published BOOLEAN DEFAULT 0,
                    is_featured BOOLEAN DEFAULT 0,
                    views_count INTEGER DEFAULT 0,
                    likes_count INTEGER DEFAULT 0,
                    tags TEXT,  -- JSON array of tags
                    meta_description TEXT,
                    slug VARCHAR(255) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (author_id) REFERENCES users (id)
                )
            ''')
            
            # Create blog_likes table for tracking user likes
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS blog_likes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    blog_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(blog_id, user_id)
                )
            ''')
            
            # Create blog_comments table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS blog_comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    blog_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    parent_id INTEGER,  -- For nested comments
                    is_approved BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (parent_id) REFERENCES blog_comments (id) ON DELETE CASCADE
                )
            ''')
            
            # Create indexes for better performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs (author_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs (is_published)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blogs_created ON blogs (created_at)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs (slug)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_likes_blog ON blog_likes (blog_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_comments_blog ON blog_comments (blog_id)')
            
            conn.commit()
            conn.close()
            logger.info("Blog tables initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing blog tables: {e}")
            raise

    def create_blog(self, blog_data: Dict[str, Any], author_id: int) -> Dict[str, Any]:
        """Create a new blog post"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Generate slug from title
            slug = self._generate_slug(blog_data.get('title', ''))
            
            # Prepare blog data
            title = blog_data.get('title', '').strip()
            content = blog_data.get('content', '').strip()
            excerpt = blog_data.get('excerpt', '')[:500]  # Limit excerpt length
            featured_image = blog_data.get('featured_image', '')
            is_published = blog_data.get('is_published', False)
            is_featured = blog_data.get('is_featured', False)
            tags = json.dumps(blog_data.get('tags', []))
            meta_description = blog_data.get('meta_description', '')[:160]  # SEO limit
            
            if not title or not content:
                return {
                    'success': False,
                    'message': 'Title and content are required'
                }
            
            # Insert blog
            cursor.execute('''
                INSERT INTO blogs (title, content, excerpt, author_id, featured_image, 
                                 is_published, is_featured, tags, meta_description, slug)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (title, content, excerpt, author_id, featured_image, 
                  is_published, is_featured, tags, meta_description, slug))
            
            blog_id = cursor.lastrowid
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Blog created successfully',
                'blog_id': blog_id,
                'slug': slug
            }
            
        except sqlite3.IntegrityError as e:
            if 'slug' in str(e):
                return {
                    'success': False,
                    'message': 'A blog with this title already exists'
                }
            return {
                'success': False,
                'message': 'Database constraint error'
            }
        except Exception as e:
            logger.error(f"Error creating blog: {e}")
            return {
                'success': False,
                'message': 'Internal server error'
            }

    def get_blog_by_id(self, blog_id: int, increment_views: bool = False) -> Optional[Dict[str, Any]]:
        """Get a blog by ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Increment view count if requested
            if increment_views:
                cursor.execute('UPDATE blogs SET views_count = views_count + 1 WHERE id = ?', (blog_id,))
            
            cursor.execute('''
                SELECT b.*, u.email as author_email, u.user_type as author_type
                FROM blogs b
                JOIN users u ON b.author_id = u.id
                WHERE b.id = ?
            ''', (blog_id,))
            
            blog = cursor.fetchone()
            
            if blog:
                blog_dict = self._blog_row_to_dict(blog)
                conn.commit() if increment_views else None
                conn.close()
                return blog_dict
            
            conn.close()
            return None
            
        except Exception as e:
            logger.error(f"Error getting blog {blog_id}: {e}")
            return None

    def get_blog_by_slug(self, slug: str, increment_views: bool = False) -> Optional[Dict[str, Any]]:
        """Get a blog by slug"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Increment view count if requested
            if increment_views:
                cursor.execute('UPDATE blogs SET views_count = views_count + 1 WHERE slug = ?', (slug,))
            
            cursor.execute('''
                SELECT b.*, u.email as author_email, u.user_type as author_type
                FROM blogs b
                JOIN users u ON b.author_id = u.id
                WHERE b.slug = ?
            ''', (slug,))
            
            blog = cursor.fetchone()
            
            if blog:
                blog_dict = self._blog_row_to_dict(blog)
                conn.commit() if increment_views else None
                conn.close()
                return blog_dict
            
            conn.close()
            return None
            
        except Exception as e:
            logger.error(f"Error getting blog by slug {slug}: {e}")
            return None

    def search_blogs(self, filters: Dict[str, Any] = None, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Search and filter blogs with pagination"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Build WHERE clause
            where_conditions = []
            params = []
            
            if filters:
                if filters.get('published_only', True):
                    where_conditions.append('b.is_published = 1')
                
                if filters.get('author_id'):
                    where_conditions.append('b.author_id = ?')
                    params.append(filters['author_id'])
                
                if filters.get('search'):
                    search_term = f"%{filters['search']}%"
                    where_conditions.append('(b.title LIKE ? OR b.content LIKE ? OR b.excerpt LIKE ?)')
                    params.extend([search_term, search_term, search_term])
                
                if filters.get('featured_only'):
                    where_conditions.append('b.is_featured = 1')
                
                if filters.get('tags'):
                    # Simple tag search - could be improved with full-text search
                    tag_search = f"%{filters['tags']}%"
                    where_conditions.append('b.tags LIKE ?')
                    params.append(tag_search)
            
            where_clause = ' AND '.join(where_conditions) if where_conditions else '1=1'
            
            # Count total results
            count_query = f'''
                SELECT COUNT(*)
                FROM blogs b
                JOIN users u ON b.author_id = u.id
                WHERE {where_clause}
            '''
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Calculate pagination
            offset = (page - 1) * per_page
            total_pages = (total_count + per_page - 1) // per_page
            
            # Get blogs with pagination
            order_by = filters.get('order_by', 'created_at') if filters else 'created_at'
            order_direction = filters.get('order_direction', 'DESC') if filters else 'DESC'
            
            query = f'''
                SELECT b.*, u.email as author_email, u.user_type as author_type
                FROM blogs b
                JOIN users u ON b.author_id = u.id
                WHERE {where_clause}
                ORDER BY b.{order_by} {order_direction}
                LIMIT ? OFFSET ?
            '''
            params.extend([per_page, offset])
            
            cursor.execute(query, params)
            blogs = cursor.fetchall()
            
            conn.close()
            
            return {
                'success': True,
                'blogs': [self._blog_row_to_dict(blog) for blog in blogs],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total_count': total_count,
                    'total_pages': total_pages,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                }
            }
            
        except Exception as e:
            logger.error(f"Error searching blogs: {e}")
            return {
                'success': False,
                'message': 'Internal server error',
                'blogs': [],
                'pagination': {}
            }

    def update_blog(self, blog_id: int, blog_data: Dict[str, Any], author_id: int) -> Dict[str, Any]:
        """Update a blog post"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if blog exists and user owns it
            cursor.execute('SELECT author_id FROM blogs WHERE id = ?', (blog_id,))
            blog = cursor.fetchone()
            
            if not blog:
                return {
                    'success': False,
                    'message': 'Blog not found'
                }
            
            if blog[0] != author_id:
                return {
                    'success': False,
                    'message': 'Unauthorized to edit this blog'
                }
            
            # Update blog
            update_fields = []
            params = []
            
            if 'title' in blog_data:
                update_fields.append('title = ?')
                params.append(blog_data['title'].strip())
                # Regenerate slug if title changed
                update_fields.append('slug = ?')
                params.append(self._generate_slug(blog_data['title']))
            
            if 'content' in blog_data:
                update_fields.append('content = ?')
                params.append(blog_data['content'].strip())
            
            if 'excerpt' in blog_data:
                update_fields.append('excerpt = ?')
                params.append(blog_data['excerpt'][:500])
            
            if 'featured_image' in blog_data:
                update_fields.append('featured_image = ?')
                params.append(blog_data['featured_image'])
            
            if 'is_published' in blog_data:
                update_fields.append('is_published = ?')
                params.append(blog_data['is_published'])
            
            if 'is_featured' in blog_data:
                update_fields.append('is_featured = ?')
                params.append(blog_data['is_featured'])
            
            if 'tags' in blog_data:
                update_fields.append('tags = ?')
                params.append(json.dumps(blog_data['tags']))
            
            if 'meta_description' in blog_data:
                update_fields.append('meta_description = ?')
                params.append(blog_data['meta_description'][:160])
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            
            if update_fields:
                query = f"UPDATE blogs SET {', '.join(update_fields)} WHERE id = ?"
                params.append(blog_id)
                cursor.execute(query, params)
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Blog updated successfully'
            }
            
        except Exception as e:
            logger.error(f"Error updating blog {blog_id}: {e}")
            return {
                'success': False,
                'message': 'Internal server error'
            }

    def delete_blog(self, blog_id: int, author_id: int) -> Dict[str, Any]:
        """Delete a blog post"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if blog exists and user owns it
            cursor.execute('SELECT author_id FROM blogs WHERE id = ?', (blog_id,))
            blog = cursor.fetchone()
            
            if not blog:
                return {
                    'success': False,
                    'message': 'Blog not found'
                }
            
            if blog[0] != author_id:
                return {
                    'success': False,
                    'message': 'Unauthorized to delete this blog'
                }
            
            # Delete blog (cascade will handle related records)
            cursor.execute('DELETE FROM blogs WHERE id = ?', (blog_id,))
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Blog deleted successfully'
            }
            
        except Exception as e:
            logger.error(f"Error deleting blog {blog_id}: {e}")
            return {
                'success': False,
                'message': 'Internal server error'
            }

    def _blog_row_to_dict(self, row) -> Dict[str, Any]:
        """Convert database row to blog dictionary"""
        if not row:
            return {}
        
        return {
            'id': row[0],
            'title': row[1],
            'content': row[2],
            'excerpt': row[3],
            'author_id': row[4],
            'featured_image': row[5],
            'is_published': bool(row[6]),
            'is_featured': bool(row[7]),
            'views_count': row[8],
            'likes_count': row[9],
            'tags': json.loads(row[10]) if row[10] else [],
            'meta_description': row[11],
            'slug': row[12],
            'created_at': row[13],
            'updated_at': row[14],
            'author_email': row[15],
            'author_type': row[16]
        }

    def _generate_slug(self, title: str) -> str:
        """Generate URL-friendly slug from title"""
        import re
        import time
        
        # Convert to lowercase and replace spaces/special chars with hyphens
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.strip('-')
        
        # Add timestamp suffix to ensure uniqueness
        timestamp = str(int(time.time()))[-4:]
        slug = f"{slug}-{timestamp}"
        
        return slug[:100]  # Limit length
