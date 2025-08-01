"""
Social features models for the job portal blog system
"""
import sqlite3
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from ..utils.logger import setup_logger

logger = setup_logger(__name__)

class SocialService:
    def __init__(self, db_path: str = 'jobs.db'):
        self.db_path = db_path
        self.init_social_tables()
    
    def init_social_tables(self):
        """Initialize social features related tables"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # User follows table for following/followers system
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_follows (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    follower_id INTEGER NOT NULL,
                    following_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(follower_id, following_id),
                    CHECK(follower_id != following_id)
                )
            ''')
            
            # Blog likes table (already exists in blog_models.py but let's ensure it's compatible)
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
            
            # Blog comments table with nested replies support
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS blog_comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    blog_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    parent_id INTEGER,  -- For nested replies
                    content TEXT NOT NULL,
                    is_approved BOOLEAN DEFAULT 1,
                    is_edited BOOLEAN DEFAULT 0,
                    likes_count INTEGER DEFAULT 0,
                    replies_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (parent_id) REFERENCES blog_comments (id) ON DELETE CASCADE
                )
            ''')
            
            # Comment likes table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS comment_likes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    comment_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (comment_id) REFERENCES blog_comments (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(comment_id, user_id)
                )
            ''')
            
            # User activity feed table for tracking user actions
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    activity_type VARCHAR(50) NOT NULL,  -- 'blog_post', 'blog_like', 'comment', 'follow', etc.
                    target_type VARCHAR(50),  -- 'blog', 'comment', 'user'
                    target_id INTEGER,
                    metadata TEXT,  -- JSON data for additional info
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            ''')
            
            # Notifications table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,  -- Recipient
                    from_user_id INTEGER,  -- Who triggered the notification
                    type VARCHAR(50) NOT NULL,  -- 'like', 'comment', 'follow', 'mention'
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    target_type VARCHAR(50),  -- 'blog', 'comment'
                    target_id INTEGER,
                    is_read BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE SET NULL
                )
            ''')
            
            # Create indexes for better performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows (follower_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows (following_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_likes_blog ON blog_likes (blog_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_likes_user ON blog_likes (user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_comments_blog ON blog_comments (blog_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments (parent_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes (comment_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities (user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (user_id, is_read)')
            
            conn.commit()
            conn.close()
            logger.info("Social tables initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing social tables: {e}")
            raise

    # === FOLLOW/UNFOLLOW SYSTEM ===
    
    def follow_user(self, follower_id: int, following_id: int) -> Dict[str, Any]:
        """Follow a user"""
        if follower_id == following_id:
            return {'success': False, 'message': 'Cannot follow yourself'}
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if already following
            cursor.execute('''
                SELECT id FROM user_follows 
                WHERE follower_id = ? AND following_id = ?
            ''', (follower_id, following_id))
            
            if cursor.fetchone():
                return {'success': False, 'message': 'Already following this user'}
            
            # Check if users exist
            cursor.execute('SELECT id FROM users WHERE id IN (?, ?)', (follower_id, following_id))
            if len(cursor.fetchall()) != 2:
                return {'success': False, 'message': 'One or both users not found'}
            
            # Add follow relationship
            cursor.execute('''
                INSERT INTO user_follows (follower_id, following_id)
                VALUES (?, ?)
            ''', (follower_id, following_id))
            
            # Create notification
            self._create_notification(
                conn, following_id, follower_id, 'follow',
                'New Follower', 'Someone started following you',
                'user', follower_id
            )
            
            # Log activity
            self._log_activity(
                conn, follower_id, 'follow', 'user', following_id,
                {'following_id': following_id}
            )
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Successfully followed user'
            }
            
        except Exception as e:
            logger.error(f"Error following user: {e}")
            return {'success': False, 'message': 'Failed to follow user'}

    def unfollow_user(self, follower_id: int, following_id: int) -> Dict[str, Any]:
        """Unfollow a user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                DELETE FROM user_follows 
                WHERE follower_id = ? AND following_id = ?
            ''', (follower_id, following_id))
            
            if cursor.rowcount == 0:
                return {'success': False, 'message': 'Not following this user'}
            
            # Log activity
            self._log_activity(
                conn, follower_id, 'unfollow', 'user', following_id,
                {'following_id': following_id}
            )
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Successfully unfollowed user'
            }
            
        except Exception as e:
            logger.error(f"Error unfollowing user: {e}")
            return {'success': False, 'message': 'Failed to unfollow user'}

    def get_user_followers(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get user's followers with pagination"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Count total followers
            cursor.execute('''
                SELECT COUNT(*) FROM user_follows WHERE following_id = ?
            ''', (user_id,))
            total_count = cursor.fetchone()[0]
            
            # Calculate pagination
            offset = (page - 1) * per_page
            total_pages = (total_count + per_page - 1) // per_page
            
            # Get followers with user details
            cursor.execute('''
                SELECT u.id, u.email, u.user_type, p.first_name, p.last_name, 
                       p.avatar_url, p.bio, uf.created_at
                FROM user_follows uf
                JOIN users u ON uf.follower_id = u.id
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE uf.following_id = ?
                ORDER BY uf.created_at DESC
                LIMIT ? OFFSET ?
            ''', (user_id, per_page, offset))
            
            followers = []
            for row in cursor.fetchall():
                followers.append({
                    'id': row[0],
                    'email': row[1],
                    'user_type': row[2],
                    'first_name': row[3],
                    'last_name': row[4],
                    'avatar_url': row[5],
                    'bio': row[6],
                    'followed_at': row[7]
                })
            
            conn.close()
            
            return {
                'success': True,
                'followers': followers,
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
            logger.error(f"Error getting followers: {e}")
            return {'success': False, 'message': 'Failed to get followers'}

    def get_user_following(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get users that a user is following with pagination"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Count total following
            cursor.execute('''
                SELECT COUNT(*) FROM user_follows WHERE follower_id = ?
            ''', (user_id,))
            total_count = cursor.fetchone()[0]
            
            # Calculate pagination
            offset = (page - 1) * per_page
            total_pages = (total_count + per_page - 1) // per_page
            
            # Get following with user details
            cursor.execute('''
                SELECT u.id, u.email, u.user_type, p.first_name, p.last_name, 
                       p.avatar_url, p.bio, uf.created_at
                FROM user_follows uf
                JOIN users u ON uf.following_id = u.id
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE uf.follower_id = ?
                ORDER BY uf.created_at DESC
                LIMIT ? OFFSET ?
            ''', (user_id, per_page, offset))
            
            following = []
            for row in cursor.fetchall():
                following.append({
                    'id': row[0],
                    'email': row[1],
                    'user_type': row[2],
                    'first_name': row[3],
                    'last_name': row[4],
                    'avatar_url': row[5],
                    'bio': row[6],
                    'followed_at': row[7]
                })
            
            conn.close()
            
            return {
                'success': True,
                'following': following,
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
            logger.error(f"Error getting following: {e}")
            return {'success': False, 'message': 'Failed to get following'}

    def is_following(self, follower_id: int, following_id: int) -> bool:
        """Check if user is following another user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 1 FROM user_follows 
                WHERE follower_id = ? AND following_id = ?
            ''', (follower_id, following_id))
            
            result = cursor.fetchone() is not None
            conn.close()
            return result
            
        except Exception as e:
            logger.error(f"Error checking follow status: {e}")
            return False

    # === BLOG LIKES SYSTEM ===
    
    def like_blog(self, blog_id: int, user_id: int) -> Dict[str, Any]:
        """Like a blog post"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if blog exists
            cursor.execute('SELECT author_id FROM blogs WHERE id = ?', (blog_id,))
            blog = cursor.fetchone()
            if not blog:
                return {'success': False, 'message': 'Blog not found'}
            
            author_id = blog[0]
            
            # Check if already liked
            cursor.execute('''
                SELECT id FROM blog_likes 
                WHERE blog_id = ? AND user_id = ?
            ''', (blog_id, user_id))
            
            if cursor.fetchone():
                return {'success': False, 'message': 'Already liked this blog'}
            
            # Add like
            cursor.execute('''
                INSERT INTO blog_likes (blog_id, user_id)
                VALUES (?, ?)
            ''', (blog_id, user_id))
            
            # Update blog likes count
            cursor.execute('''
                UPDATE blogs SET likes_count = likes_count + 1 
                WHERE id = ?
            ''', (blog_id,))
            
            # Create notification for blog author (if not self-like)
            if user_id != author_id:
                self._create_notification(
                    conn, author_id, user_id, 'like',
                    'Blog Liked', 'Someone liked your blog post',
                    'blog', blog_id
                )
            
            # Log activity
            self._log_activity(
                conn, user_id, 'blog_like', 'blog', blog_id,
                {'blog_id': blog_id}
            )
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Blog liked successfully'
            }
            
        except Exception as e:
            logger.error(f"Error liking blog: {e}")
            return {'success': False, 'message': 'Failed to like blog'}

    def unlike_blog(self, blog_id: int, user_id: int) -> Dict[str, Any]:
        """Unlike a blog post"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                DELETE FROM blog_likes 
                WHERE blog_id = ? AND user_id = ?
            ''', (blog_id, user_id))
            
            if cursor.rowcount == 0:
                return {'success': False, 'message': 'Not liked this blog'}
            
            # Update blog likes count
            cursor.execute('''
                UPDATE blogs SET likes_count = likes_count - 1 
                WHERE id = ? AND likes_count > 0
            ''', (blog_id,))
            
            # Log activity
            self._log_activity(
                conn, user_id, 'blog_unlike', 'blog', blog_id,
                {'blog_id': blog_id}
            )
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Blog unliked successfully'
            }
            
        except Exception as e:
            logger.error(f"Error unliking blog: {e}")
            return {'success': False, 'message': 'Failed to unlike blog'}

    def is_blog_liked(self, blog_id: int, user_id: int) -> bool:
        """Check if user has liked a blog"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 1 FROM blog_likes 
                WHERE blog_id = ? AND user_id = ?
            ''', (blog_id, user_id))
            
            result = cursor.fetchone() is not None
            conn.close()
            return result
            
        except Exception as e:
            logger.error(f"Error checking blog like status: {e}")
            return False

    # === COMMENTS SYSTEM ===
    
    def add_comment(self, blog_id: int, user_id: int, content: str, parent_id: Optional[int] = None) -> Dict[str, Any]:
        """Add a comment to a blog post"""
        try:
            if not content.strip():
                return {'success': False, 'message': 'Comment content cannot be empty'}
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if blog exists
            cursor.execute('SELECT author_id FROM blogs WHERE id = ?', (blog_id,))
            blog = cursor.fetchone()
            if not blog:
                return {'success': False, 'message': 'Blog not found'}
            
            blog_author_id = blog[0]
            
            # If it's a reply, check if parent comment exists
            parent_author_id = None
            if parent_id:
                cursor.execute('''
                    SELECT user_id FROM blog_comments 
                    WHERE id = ? AND blog_id = ?
                ''', (parent_id, blog_id))
                parent = cursor.fetchone()
                if not parent:
                    return {'success': False, 'message': 'Parent comment not found'}
                parent_author_id = parent[0]
            
            # Add comment
            cursor.execute('''
                INSERT INTO blog_comments (blog_id, user_id, parent_id, content)
                VALUES (?, ?, ?, ?)
            ''', (blog_id, user_id, parent_id, content.strip()))
            
            comment_id = cursor.lastrowid
            
            # Update parent comment replies count if it's a reply
            if parent_id:
                cursor.execute('''
                    UPDATE blog_comments SET replies_count = replies_count + 1 
                    WHERE id = ?
                ''', (parent_id,))
            
            # Create notifications
            # Notify blog author (if not self-comment)
            if user_id != blog_author_id:
                self._create_notification(
                    conn, blog_author_id, user_id, 'comment',
                    'New Comment', 'Someone commented on your blog post',
                    'blog', blog_id
                )
            
            # Notify parent comment author (if reply and not self-reply)
            if parent_id and parent_author_id and user_id != parent_author_id:
                self._create_notification(
                    conn, parent_author_id, user_id, 'reply',
                    'Comment Reply', 'Someone replied to your comment',
                    'comment', parent_id
                )
            
            # Log activity
            activity_type = 'comment_reply' if parent_id else 'comment'
            self._log_activity(
                conn, user_id, activity_type, 'comment', comment_id,
                {'blog_id': blog_id, 'parent_id': parent_id}
            )
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Comment added successfully',
                'comment_id': comment_id
            }
            
        except Exception as e:
            logger.error(f"Error adding comment: {e}")
            return {'success': False, 'message': 'Failed to add comment'}

    def get_blog_comments(self, blog_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get comments for a blog post with nested replies"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get top-level comments first
            offset = (page - 1) * per_page
            
            cursor.execute('''
                SELECT c.id, c.user_id, c.content, c.likes_count, c.replies_count,
                       c.is_edited, c.created_at, c.updated_at,
                       u.email, p.first_name, p.last_name, p.avatar_url, u.user_type
                FROM blog_comments c
                JOIN users u ON c.user_id = u.id
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE c.blog_id = ? AND c.parent_id IS NULL AND c.is_approved = 1
                ORDER BY c.created_at DESC
                LIMIT ? OFFSET ?
            ''', (blog_id, per_page, offset))
            
            comments = []
            for row in cursor.fetchall():
                comment = {
                    'id': row[0],
                    'user_id': row[1],
                    'content': row[2],
                    'likes_count': row[3],
                    'replies_count': row[4],
                    'is_edited': bool(row[5]),
                    'created_at': row[6],
                    'updated_at': row[7],
                    'author': {
                        'email': row[8],
                        'first_name': row[9],
                        'last_name': row[10],
                        'avatar_url': row[11],
                        'user_type': row[12]
                    },
                    'replies': []
                }
                
                # Get replies for this comment (limit to prevent deep nesting)
                cursor.execute('''
                    SELECT c.id, c.user_id, c.content, c.likes_count, c.replies_count,
                           c.is_edited, c.created_at, c.updated_at,
                           u.email, p.first_name, p.last_name, p.avatar_url, u.user_type
                    FROM blog_comments c
                    JOIN users u ON c.user_id = u.id
                    LEFT JOIN user_profiles p ON u.id = p.user_id
                    WHERE c.parent_id = ? AND c.is_approved = 1
                    ORDER BY c.created_at ASC
                    LIMIT 5
                ''', (comment['id'],))
                
                for reply_row in cursor.fetchall():
                    reply = {
                        'id': reply_row[0],
                        'user_id': reply_row[1],
                        'content': reply_row[2],
                        'likes_count': reply_row[3],
                        'replies_count': reply_row[4],
                        'is_edited': bool(reply_row[5]),
                        'created_at': reply_row[6],
                        'updated_at': reply_row[7],
                        'author': {
                            'email': reply_row[8],
                            'first_name': reply_row[9],
                            'last_name': reply_row[10],
                            'avatar_url': reply_row[11],
                            'user_type': reply_row[12]
                        }
                    }
                    comment['replies'].append(reply)
                
                comments.append(comment)
            
            # Count total top-level comments
            cursor.execute('''
                SELECT COUNT(*) FROM blog_comments 
                WHERE blog_id = ? AND parent_id IS NULL AND is_approved = 1
            ''', (blog_id,))
            total_count = cursor.fetchone()[0]
            
            conn.close()
            
            total_pages = (total_count + per_page - 1) // per_page
            
            return {
                'success': True,
                'comments': comments,
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
            logger.error(f"Error getting blog comments: {e}")
            return {'success': False, 'message': 'Failed to get comments'}

    def like_comment(self, comment_id: int, user_id: int) -> Dict[str, Any]:
        """Like a comment"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if comment exists
            cursor.execute('SELECT user_id FROM blog_comments WHERE id = ?', (comment_id,))
            comment = cursor.fetchone()
            if not comment:
                return {'success': False, 'message': 'Comment not found'}
            
            comment_author_id = comment[0]
            
            # Check if already liked
            cursor.execute('''
                SELECT id FROM comment_likes 
                WHERE comment_id = ? AND user_id = ?
            ''', (comment_id, user_id))
            
            if cursor.fetchone():
                return {'success': False, 'message': 'Already liked this comment'}
            
            # Add like
            cursor.execute('''
                INSERT INTO comment_likes (comment_id, user_id)
                VALUES (?, ?)
            ''', (comment_id, user_id))
            
            # Update comment likes count
            cursor.execute('''
                UPDATE blog_comments SET likes_count = likes_count + 1 
                WHERE id = ?
            ''', (comment_id,))
            
            # Create notification for comment author (if not self-like)
            if user_id != comment_author_id:
                self._create_notification(
                    conn, comment_author_id, user_id, 'comment_like',
                    'Comment Liked', 'Someone liked your comment',
                    'comment', comment_id
                )
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Comment liked successfully'
            }
            
        except Exception as e:
            logger.error(f"Error liking comment: {e}")
            return {'success': False, 'message': 'Failed to like comment'}

    def unlike_comment(self, comment_id: int, user_id: int) -> Dict[str, Any]:
        """Unlike a comment"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                DELETE FROM comment_likes 
                WHERE comment_id = ? AND user_id = ?
            ''', (comment_id, user_id))
            
            if cursor.rowcount == 0:
                return {'success': False, 'message': 'Not liked this comment'}
            
            # Update comment likes count
            cursor.execute('''
                UPDATE blog_comments SET likes_count = likes_count - 1 
                WHERE id = ? AND likes_count > 0
            ''', (comment_id,))
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Comment unliked successfully'
            }
            
        except Exception as e:
            logger.error(f"Error unliking comment: {e}")
            return {'success': False, 'message': 'Failed to unlike comment'}

    def is_comment_liked(self, comment_id: int, user_id: int) -> bool:
        """Check if user has liked a comment"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 1 FROM comment_likes 
                WHERE comment_id = ? AND user_id = ?
            ''', (comment_id, user_id))
            
            result = cursor.fetchone() is not None
            conn.close()
            return result
            
        except Exception as e:
            logger.error(f"Error checking comment like status: {e}")
            return False

    # === NOTIFICATIONS SYSTEM ===
    
    def get_user_notifications(self, user_id: int, page: int = 1, per_page: int = 20, unread_only: bool = False) -> Dict[str, Any]:
        """Get user notifications"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            where_clause = 'WHERE n.user_id = ?'
            params = [user_id]
            
            if unread_only:
                where_clause += ' AND n.is_read = 0'
            
            # Count total notifications
            cursor.execute(f'''
                SELECT COUNT(*) FROM notifications n {where_clause}
            ''', params)
            total_count = cursor.fetchone()[0]
            
            # Get notifications with pagination
            offset = (page - 1) * per_page
            cursor.execute(f'''
                SELECT n.id, n.type, n.title, n.message, n.target_type, n.target_id,
                       n.is_read, n.created_at, n.from_user_id,
                       u.email, p.first_name, p.last_name, p.avatar_url
                FROM notifications n
                LEFT JOIN users u ON n.from_user_id = u.id
                LEFT JOIN user_profiles p ON u.id = p.user_id
                {where_clause}
                ORDER BY n.created_at DESC
                LIMIT ? OFFSET ?
            ''', params + [per_page, offset])
            
            notifications = []
            for row in cursor.fetchall():
                notification = {
                    'id': row[0],
                    'type': row[1],
                    'title': row[2],
                    'message': row[3],
                    'target_type': row[4],
                    'target_id': row[5],
                    'is_read': bool(row[6]),
                    'created_at': row[7],
                    'from_user': None
                }
                
                if row[8]:  # from_user_id exists
                    notification['from_user'] = {
                        'id': row[8],
                        'email': row[9],
                        'first_name': row[10],
                        'last_name': row[11],
                        'avatar_url': row[12]
                    }
                
                notifications.append(notification)
            
            conn.close()
            
            total_pages = (total_count + per_page - 1) // per_page
            
            return {
                'success': True,
                'notifications': notifications,
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
            logger.error(f"Error getting notifications: {e}")
            return {'success': False, 'message': 'Failed to get notifications'}

    def mark_notification_read(self, notification_id: int, user_id: int) -> Dict[str, Any]:
        """Mark a notification as read"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE notifications 
                SET is_read = 1 
                WHERE id = ? AND user_id = ?
            ''', (notification_id, user_id))
            
            if cursor.rowcount == 0:
                return {'success': False, 'message': 'Notification not found'}
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': 'Notification marked as read'
            }
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return {'success': False, 'message': 'Failed to mark notification as read'}

    def mark_all_notifications_read(self, user_id: int) -> Dict[str, Any]:
        """Mark all notifications as read for a user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE notifications 
                SET is_read = 1 
                WHERE user_id = ? AND is_read = 0
            ''', (user_id,))
            
            count = cursor.rowcount
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': f'{count} notifications marked as read'
            }
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
            return {'success': False, 'message': 'Failed to mark notifications as read'}

    def get_unread_notification_count(self, user_id: int) -> int:
        """Get count of unread notifications"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT COUNT(*) FROM notifications 
                WHERE user_id = ? AND is_read = 0
            ''', (user_id,))
            
            count = cursor.fetchone()[0]
            conn.close()
            return count
            
        except Exception as e:
            logger.error(f"Error getting unread notification count: {e}")
            return 0

    # === USER PROFILE ENHANCEMENTS ===
    
    def get_user_social_stats(self, user_id: int) -> Dict[str, Any]:
        """Get user's social statistics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get followers count
            cursor.execute('''
                SELECT COUNT(*) FROM user_follows WHERE following_id = ?
            ''', (user_id,))
            followers_count = cursor.fetchone()[0]
            
            # Get following count
            cursor.execute('''
                SELECT COUNT(*) FROM user_follows WHERE follower_id = ?
            ''', (user_id,))
            following_count = cursor.fetchone()[0]
            
            # Get blogs count
            cursor.execute('''
                SELECT COUNT(*) FROM blogs WHERE author_id = ? AND is_published = 1
            ''', (user_id,))
            blogs_count = cursor.fetchone()[0]
            
            # Get total blog likes received
            cursor.execute('''
                SELECT SUM(likes_count) FROM blogs WHERE author_id = ?
            ''', (user_id,))
            total_likes = cursor.fetchone()[0] or 0
            
            # Get total blog views
            cursor.execute('''
                SELECT SUM(views_count) FROM blogs WHERE author_id = ?
            ''', (user_id,))
            total_views = cursor.fetchone()[0] or 0
            
            # Get comments count (comments made by user)
            cursor.execute('''
                SELECT COUNT(*) FROM blog_comments WHERE user_id = ?
            ''', (user_id,))
            comments_count = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'followers_count': followers_count,
                'following_count': following_count,
                'blogs_count': blogs_count,
                'total_likes_received': total_likes,
                'total_views': total_views,
                'comments_count': comments_count
            }
            
        except Exception as e:
            logger.error(f"Error getting user social stats: {e}")
            return {}

    # === UTILITY METHODS ===
    
    def _create_notification(self, conn, user_id: int, from_user_id: Optional[int], 
                           notification_type: str, title: str, message: str, 
                           target_type: Optional[str] = None, target_id: Optional[int] = None):
        """Create a notification"""
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO notifications (user_id, from_user_id, type, title, message, target_type, target_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, from_user_id, notification_type, title, message, target_type, target_id))

    def _log_activity(self, conn, user_id: int, activity_type: str, 
                     target_type: Optional[str], target_id: Optional[int], 
                     metadata: Optional[Dict] = None):
        """Log user activity"""
        cursor = conn.cursor()
        metadata_json = json.dumps(metadata) if metadata else None
        cursor.execute('''
            INSERT INTO user_activities (user_id, activity_type, target_type, target_id, metadata)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, activity_type, target_type, target_id, metadata_json))

    def get_user_activity_feed(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get user's activity feed"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get activities from users that this user follows
            offset = (page - 1) * per_page
            
            cursor.execute('''
                SELECT ua.id, ua.user_id, ua.activity_type, ua.target_type, ua.target_id,
                       ua.metadata, ua.created_at,
                       u.email, p.first_name, p.last_name, p.avatar_url
                FROM user_activities ua
                JOIN users u ON ua.user_id = u.id
                LEFT JOIN user_profiles p ON u.id = p.user_id
                JOIN user_follows uf ON ua.user_id = uf.following_id
                WHERE uf.follower_id = ?
                ORDER BY ua.created_at DESC
                LIMIT ? OFFSET ?
            ''', (user_id, per_page, offset))
            
            activities = []
            for row in cursor.fetchall():
                activity = {
                    'id': row[0],
                    'user_id': row[1],
                    'activity_type': row[2],
                    'target_type': row[3],
                    'target_id': row[4],
                    'metadata': json.loads(row[5]) if row[5] else {},
                    'created_at': row[6],
                    'user': {
                        'email': row[7],
                        'first_name': row[8],
                        'last_name': row[9],
                        'avatar_url': row[10]
                    }
                }
                activities.append(activity)
            
            conn.close()
            
            return {
                'success': True,
                'activities': activities,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'has_next': len(activities) == per_page,
                    'has_prev': page > 1
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting activity feed: {e}")
            return {'success': False, 'message': 'Failed to get activity feed'}
