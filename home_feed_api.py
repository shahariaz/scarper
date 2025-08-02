# Home Feed API Endpoint for Unified Content
# This will be added to backend_server.py

@app.route('/api/home/feed', methods=['GET'])
def get_home_feed():
    """
    Unified home feed API that combines jobs, blogs, user activities, and trending content
    Optimized for high-load scenarios with caching and pagination
    """
    try:
        # Get pagination and filter parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)  # Limit max items
        category = request.args.get('category', 'all')
        personalized = request.args.get('personalized', 'false').lower() == 'true'
        user_id = request.args.get('user_id', None)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Base content array
        content_items = []
        
        # Define content weights for algorithmic ranking
        content_weights = {
            'job': 1.0,
            'blog': 0.8,
            'user_activity': 0.6,
            'company_update': 0.7,
            'trending': 0.9
        }
        
        # 1. FETCH JOBS (if category allows)
        if category in ['all', 'jobs']:
            job_limit = per_page if category == 'jobs' else per_page // 4
            
            cursor.execute('''
                SELECT j.*, c.company_name, c.logo_url,
                       COALESCE(jv.views_count, 0) as views_count,
                       COALESCE(jc.comments_count, 0) as comments_count,
                       (JULIANDAY('now') - JULIANDAY(j.created_at)) as days_old
                FROM jobs j
                LEFT JOIN companies c ON j.company_id = c.id
                LEFT JOIN (
                    SELECT job_id, COUNT(*) as views_count 
                    FROM job_views 
                    GROUP BY job_id
                ) jv ON j.id = jv.job_id
                LEFT JOIN (
                    SELECT job_id, COUNT(*) as comments_count 
                    FROM job_comments 
                    GROUP BY job_id
                ) jc ON j.id = jc.job_id
                WHERE j.is_active = 1
                ORDER BY 
                    CASE WHEN ? = 'true' THEN 
                        (j.salary_max * 0.3 + COALESCE(jv.views_count, 0) * 0.2 + 
                         (7 - MIN(days_old, 7)) * 0.5)
                    ELSE j.created_at END DESC
                LIMIT ? OFFSET ?
            ''', (str(personalized), job_limit, 0))
            
            jobs = cursor.fetchall()
            
            for job in jobs:
                content_items.append({
                    'id': f"job_{job[0]}",
                    'type': 'job',
                    'data': {
                        'id': job[0],
                        'title': job[1],
                        'description': job[2],
                        'company': job[13] or 'Unknown Company',
                        'location': job[4],
                        'salary_min': job[5],
                        'salary_max': job[6],
                        'job_type': job[7],
                        'experience_level': job[8],
                        'created_at': job[11],
                        'logo_url': job[14]
                    },
                    'created_at': job[11],
                    'engagement': {
                        'likes': 0,  # Jobs don't have likes yet
                        'comments': job[16] or 0,
                        'shares': 0,
                        'views': job[15] or 0
                    },
                    'priority': content_weights['job'] * (1 / max(job[17], 0.1))  # Newer = higher priority
                })
        
        # 2. FETCH BLOGS (if category allows)
        if category in ['all', 'blogs']:
            blog_limit = per_page if category == 'blogs' else per_page // 3
            
            cursor.execute('''
                SELECT b.*, u.email, u.user_type,
                       COALESCE(up.first_name, '') as first_name,
                       COALESCE(up.last_name, '') as last_name,
                       COALESCE(cp.company_name, '') as company_name,
                       (JULIANDAY('now') - JULIANDAY(b.created_at)) as days_old
                FROM blogs b
                JOIN users u ON b.author_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN company_profiles cp ON u.id = cp.user_id
                WHERE b.is_published = 1
                ORDER BY 
                    CASE WHEN ? = 'true' THEN 
                        (b.likes_count * 0.3 + b.views_count * 0.1 + 
                         (7 - MIN(days_old, 7)) * 0.6)
                    ELSE b.created_at END DESC
                LIMIT ? OFFSET ?
            ''', (str(personalized), blog_limit, 0))
            
            blogs = cursor.fetchall()
            
            for blog in blogs:
                author_name = blog[19] or blog[15]  # company_name or email
                if blog[17] and blog[18]:  # first_name and last_name
                    author_name = f"{blog[17]} {blog[18]}"
                
                content_items.append({
                    'id': f"blog_{blog[0]}",
                    'type': 'blog',
                    'data': {
                        'id': blog[0],
                        'title': blog[1],
                        'content': blog[2][:500] + '...' if len(blog[2]) > 500 else blog[2],
                        'excerpt': blog[3],
                        'author_id': blog[4],
                        'author_name': author_name,
                        'author_type': blog[16],
                        'slug': blog[12],
                        'created_at': blog[13],
                        'tags': json.loads(blog[10]) if blog[10] else []
                    },
                    'created_at': blog[13],
                    'engagement': {
                        'likes': blog[9] or 0,
                        'comments': 0,  # Would need separate query
                        'shares': 0,
                        'views': blog[8] or 0
                    },
                    'priority': content_weights['blog'] * (1 / max(blog[20], 0.1))
                })
        
        # 3. FETCH USER ACTIVITIES (if category allows)
        if category in ['all', 'people'] and user_id:
            activity_limit = per_page // 6
            
            # Get activities from users the current user follows
            cursor.execute('''
                SELECT ua.*, u.email,
                       COALESCE(up.first_name, '') as first_name,
                       COALESCE(up.last_name, '') as last_name,
                       COALESCE(cp.company_name, '') as company_name,
                       u.user_type
                FROM user_activities ua
                JOIN users u ON ua.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN company_profiles cp ON u.id = cp.user_id
                WHERE ua.user_id IN (
                    SELECT following_id FROM user_follows WHERE follower_id = ?
                ) OR ua.user_id = ?
                ORDER BY ua.created_at DESC
                LIMIT ? OFFSET ?
            ''', (user_id, user_id, activity_limit, 0))
            
            activities = cursor.fetchall()
            
            for activity in activities:
                user_name = activity[8] or activity[4]  # company_name or email
                if activity[6] and activity[7]:  # first_name and last_name
                    user_name = f"{activity[6]} {activity[7]}"
                
                content_items.append({
                    'id': f"activity_{activity[0]}",
                    'type': 'user_activity',
                    'data': {
                        'id': activity[0],
                        'user_id': activity[1],
                        'user_name': user_name,
                        'user_type': activity[9],
                        'activity_type': activity[2],
                        'description': activity[3],
                        'created_at': activity[4]
                    },
                    'created_at': activity[4],
                    'engagement': {
                        'likes': 0,
                        'comments': 0,
                        'shares': 0,
                        'views': 0
                    },
                    'priority': content_weights['user_activity']
                })
        
        # 4. FETCH TRENDING CONTENT
        if category in ['all', 'trending']:
            # Get trending jobs (most viewed/applied in last 7 days)
            cursor.execute('''
                SELECT j.*, c.company_name, COUNT(jv.id) as trend_score
                FROM jobs j
                LEFT JOIN companies c ON j.company_id = c.id
                LEFT JOIN job_views jv ON j.id = jv.job_id 
                WHERE j.created_at > datetime('now', '-7 days')
                GROUP BY j.id
                HAVING trend_score > 5
                ORDER BY trend_score DESC
                LIMIT 3
            ''')
            
            trending_jobs = cursor.fetchall()
            
            for job in trending_jobs:
                content_items.append({
                    'id': f"trending_job_{job[0]}",
                    'type': 'trending',
                    'data': {
                        'content_type': 'job',
                        'id': job[0],
                        'title': job[1],
                        'company': job[13] or 'Unknown Company',
                        'trend_score': job[14],
                        'trend_reason': 'Most viewed this week',
                        'created_at': job[11]
                    },
                    'created_at': job[11],
                    'engagement': {
                        'likes': 0,
                        'comments': 0,
                        'shares': 0,
                        'views': job[14]
                    },
                    'priority': content_weights['trending']
                })
        
        conn.close()
        
        # 5. SORT BY PRIORITY AND RECENCY
        if personalized and user_id:
            # Personalized algorithm: mix priority with recency
            content_items.sort(key=lambda x: (
                x['priority'] * 0.6 + 
                (1.0 / max((datetime.now() - datetime.fromisoformat(x['created_at'].replace('Z', '+00:00'))).days + 1, 1)) * 0.4
            ), reverse=True)
        else:
            # Default: sort by recency
            content_items.sort(key=lambda x: x['created_at'], reverse=True)
        
        # 6. APPLY PAGINATION
        start_idx = offset
        end_idx = offset + per_page
        paginated_content = content_items[start_idx:end_idx]
        
        # 7. CALCULATE PAGINATION INFO
        total_count = len(content_items)
        total_pages = (total_count + per_page - 1) // per_page
        
        return jsonify({
            'success': True,
            'content': paginated_content,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            },
            'meta': {
                'category': category,
                'personalized': personalized,
                'algorithm_version': '1.0',
                'cache_ttl': 300  # 5 minutes
            }
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': f'Invalid parameter: {str(e)}',
            'content': [],
            'pagination': {}
        }), 400
        
    except Exception as e:
        logger.error(f"Error fetching home feed: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'content': [],
            'pagination': {}
        }), 500


# Additional helper endpoints for home page

@app.route('/api/home/stats', methods=['GET'])
def get_home_stats():
    """Get overall platform statistics for home page widgets"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get active jobs count
        cursor.execute('SELECT COUNT(*) FROM jobs WHERE is_active = 1')
        active_jobs = cursor.fetchone()[0]
        
        # Get new jobs this week
        cursor.execute('''
            SELECT COUNT(*) FROM jobs 
            WHERE is_active = 1 AND created_at > datetime('now', '-7 days')
        ''')
        new_jobs_week = cursor.fetchone()[0]
        
        # Get companies hiring
        cursor.execute('''
            SELECT COUNT(DISTINCT company_id) FROM jobs 
            WHERE is_active = 1 AND created_at > datetime('now', '-30 days')
        ''')
        companies_hiring = cursor.fetchone()[0]
        
        # Get total registered users
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_active = 1')
        total_users = cursor.fetchone()[0]
        
        # Get total blog posts
        cursor.execute('SELECT COUNT(*) FROM blogs WHERE is_published = 1')
        total_blogs = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'active_jobs': active_jobs,
                'new_jobs_week': new_jobs_week,
                'companies_hiring': companies_hiring,
                'total_users': total_users,
                'total_blogs': total_blogs,
                'platform_growth': '+12%',  # This would be calculated
                'last_updated': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching home stats: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch statistics'
        }), 500


@app.route('/api/home/trending', methods=['GET'])
def get_trending_topics():
    """Get trending hashtags and topics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get trending job titles (most searched/viewed)
        cursor.execute('''
            SELECT j.title, COUNT(*) as frequency
            FROM jobs j
            LEFT JOIN job_views jv ON j.id = jv.job_id
            WHERE j.created_at > datetime('now', '-7 days')
            GROUP BY LOWER(j.title)
            ORDER BY frequency DESC
            LIMIT 10
        ''')
        
        trending_jobs = cursor.fetchall()
        
        # Get trending blog tags
        cursor.execute('''
            SELECT b.tags, b.views_count
            FROM blogs b
            WHERE b.is_published = 1 AND b.created_at > datetime('now', '-7 days')
            ORDER BY b.views_count DESC
            LIMIT 20
        ''')
        
        blog_tags = cursor.fetchall()
        
        # Process tags
        tag_counts = {}
        for blog_tag, views in blog_tags:
            if blog_tag:
                try:
                    tags = json.loads(blog_tag)
                    for tag in tags:
                        tag_counts[tag] = tag_counts.get(tag, 0) + (views or 1)
                except:
                    continue
        
        # Sort tags by frequency
        trending_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'trending': {
                'job_titles': [{'title': title, 'count': count} for title, count in trending_jobs],
                'tags': [{'tag': tag, 'count': count} for tag, count in trending_tags],
                'last_updated': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching trending topics: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch trending topics'
        }), 500


@app.route('/api/home/recommendations', methods=['GET'])
@token_required
def get_user_recommendations(current_user):
    """Get personalized recommendations for users"""
    try:
        user_id = current_user[0]
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        recommendations = {
            'people_to_follow': [],
            'companies_to_follow': [],
            'jobs_for_you': [],
            'articles_to_read': []
        }
        
        # Get user's profile to understand interests
        cursor.execute('''
            SELECT up.*, u.user_type
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = ?
        ''', (user_id,))
        
        user_profile = cursor.fetchone()
        
        if user_profile:
            # Recommend people in similar fields
            cursor.execute('''
                SELECT u.id, u.email, up.first_name, up.last_name, up.current_position,
                       CASE WHEN uf.follower_id IS NULL THEN 0 ELSE 1 END as is_following
                FROM users u
                JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN user_follows uf ON u.id = uf.following_id AND uf.follower_id = ?
                WHERE u.id != ? 
                  AND u.user_type = 'jobseeker'
                  AND uf.follower_id IS NULL
                  AND (up.industry = ? OR up.current_position LIKE ?)
                ORDER BY RANDOM()
                LIMIT 5
            ''', (user_id, user_id, user_profile[7] or '', f"%{user_profile[6] or ''}%"))
            
            people = cursor.fetchall()
            recommendations['people_to_follow'] = [
                {
                    'id': person[0],
                    'name': f"{person[2] or ''} {person[3] or ''}".strip() or person[1],
                    'position': person[4],
                    'is_following': bool(person[5])
                } for person in people
            ]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
        
    except Exception as e:
        logger.error(f"Error fetching recommendations: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch recommendations'
        }), 500
