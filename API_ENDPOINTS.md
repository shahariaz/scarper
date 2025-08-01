# Blog and Social API Endpoints Documentation

This document describes the newly implemented blog and social API endpoints for real-time updates.

## Blog Endpoints

### GET /api/blogs
Get all blog posts with pagination and filtering.

**Parameters:**
- `page` (int, optional): Page number (default: 1)
- `per_page` (int, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search in title, content, excerpt
- `author_id` (int, optional): Filter by author ID
- `tag` (string, optional): Filter by tag
- `status` (string, optional): 'published' or 'draft' (default: 'published')

**Response:**
```json
{
  "success": true,
  "blogs": [...],
  "pagination": {...}
}
```

### POST /api/blogs
Create a new blog post (requires authentication).

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Blog Title",
  "content": "Blog content",
  "excerpt": "Short description",
  "featured_image": "image_url",
  "tags": ["tag1", "tag2"],
  "is_published": true
}
```

### GET /api/blogs/{id}
Get single blog post and increment view count.

### PUT /api/blogs/{id}
Update blog post (author only, requires authentication).

### DELETE /api/blogs/{id}
Delete blog post (author only, requires authentication).

## Social Endpoints

### POST /api/blogs/{id}/like
Like a blog post (requires authentication).
Emits WebSocket event: `blog_liked`

### POST /api/blogs/{id}/unlike
Unlike a blog post (requires authentication).
Emits WebSocket event: `blog_unliked`

### POST /api/users/{id}/follow
Follow a user (requires authentication).
Creates notification and emits WebSocket event: `new_follower`

### POST /api/users/{id}/unfollow
Unfollow a user (requires authentication).

### GET /api/users/search
Search for users by name or email.

**Parameters:**
- `q` (string, required): Search query
- `page` (int, optional): Page number
- `per_page` (int, optional): Items per page

## Comment Endpoints

### GET /api/blogs/{id}/comments
Get comments for a blog post.

### POST /api/blogs/{id}/comments
Add comment to blog (requires authentication).
Emits WebSocket event: `new_comment`

**Body:**
```json
{
  "content": "Comment text",
  "parent_id": 123  // optional for replies
}
```

### POST /api/comments/{id}/like
Like a comment (requires authentication).
Emits WebSocket event: `comment_liked`

### POST /api/comments/{id}/unlike
Unlike a comment (requires authentication).
Emits WebSocket event: `comment_unliked`

## Notification Endpoints

### GET /api/notifications
Get user notifications (requires authentication).

**Parameters:**
- `page` (int, optional): Page number
- `per_page` (int, optional): Items per page
- `unread_only` (boolean, optional): Show only unread notifications

### POST /api/notifications/{id}/read
Mark notification as read (requires authentication).

## WebSocket Events

The server supports real-time updates via WebSocket connection at `ws://localhost:5000`.

### Client Events (send to server):
- `connect` - Connect to server
- `join_blog` - Join blog room for updates: `{blog_id: 123}`
- `leave_blog` - Leave blog room: `{blog_id: 123}`
- `join_user` - Join user room for notifications: `{user_id: 123}`

### Server Events (receive from server):
- `connected` - Connection successful
- `joined_blog` - Joined blog room
- `blog_liked` - Blog was liked: `{blog_id, like_count, user_id}`
- `blog_unliked` - Blog was unliked: `{blog_id, like_count, user_id}`
- `new_comment` - New comment added: `{blog_id, comment_id, user_id}`
- `comment_liked` - Comment was liked: `{comment_id, like_count, user_id}`
- `comment_unliked` - Comment was unliked: `{comment_id, like_count, user_id}`
- `new_follower` - New follower: `{follower_id, message}`

## Authentication

Most endpoints require authentication using Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Error Handling

All endpoints return standard error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Testing

Use the provided test scripts:
- `test_new_endpoints.py` - Test all REST API endpoints
- `test_websocket.py` - Test WebSocket real-time functionality

## Integration

The backend server now supports both REST API and WebSocket connections on port 5000. Frontend applications can:

1. Use REST APIs for standard CRUD operations
2. Connect to WebSocket for real-time updates
3. Join specific rooms (blog or user) to receive targeted updates
4. Handle real-time events for seamless user experience

All endpoints integrate with the existing authentication system and database schema without breaking existing functionality.