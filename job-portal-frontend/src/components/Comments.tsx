'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchComments,
  addComment,
  likeComment,
  unlikeComment,
  selectComments,
  selectCommentLikeStatus,
  selectSocialLoading,
  Comment,
} from '@/store/slices/socialSlice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWebSocket } from '@/lib/websocket';
import {
  MessageCircle,
  Reply,
  Heart,
  Send,
} from 'lucide-react';

interface CommentsProps {
  blogId: number;
}

interface CommentItemProps {
  comment: Comment;
  blogId: number;
  depth?: number;
  onReply?: (parentId: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  blogId, 
  depth = 0, 
  onReply 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isLiked = useSelector((state: RootState) => 
    selectCommentLikeStatus(state, comment.id)
  );
  const loading = useSelector(selectSocialLoading);
  
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      if (isLiked) {
        await dispatch(unlikeComment(comment.id)).unwrap();
      } else {
        await dispatch(likeComment(comment.id)).unwrap();
      }
    } catch (error) {
      console.error('Like comment error:', error);
    }
  };

  const handleReply = async () => {
    if (!currentUser || !replyContent.trim()) return;
    
    try {
      await dispatch(addComment({
        blogId,
        content: replyContent.trim(),
        parentId: comment.id,
      })).unwrap();
      
      setReplyContent('');
      setShowReplyForm(false);
      
      // Refresh comments to show new reply
      dispatch(fetchComments({ blogId }));
    } catch (error) {
      console.error('Reply error:', error);
    }
  };

  const displayName = comment.author.first_name && comment.author.last_name
    ? `${comment.author.first_name} ${comment.author.last_name}`
    : comment.author.email;
  
  const avatarFallback = comment.author.first_name && comment.author.last_name
    ? `${comment.author.first_name[0]}${comment.author.last_name[0]}`
    : comment.author.email[0].toUpperCase();

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-indigo-100 pl-6' : ''}`}>
      <div className="flex gap-4 mb-6">
        <Avatar className="w-12 h-12 ring-2 ring-indigo-100">
          <AvatarImage src={comment.author.avatar_url} alt={displayName} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 mb-3 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-semibold text-gray-900">{displayName}</span>
              <span className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full capitalize">
                {comment.author.user_type}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">(edited)</span>
              )}
            </div>
            
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <Button
              variant="ghost"
              size="sm"
              className={`text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 h-auto rounded-full transition-all duration-200 ${
                isLiked ? 'text-pink-500 bg-pink-50' : ''
              }`}
              onClick={handleLike}
              disabled={!currentUser || loading.like}
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {comment.likes_count || 0}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 h-auto rounded-full transition-all duration-200"
              onClick={() => setShowReplyForm(!showReplyForm)}
              disabled={!currentUser}
            >
              <Reply className="w-4 h-4 mr-2" />
              Reply
            </Button>
            
            {comment.replies_count > 0 && (
              <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
          
          {/* Reply Form */}
          {showReplyForm && currentUser && (
            <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
              <Textarea
                placeholder="Write a thoughtful reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mb-3 bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none rounded-xl text-gray-800 placeholder-gray-500"
                rows={3}
              />
              <div className="flex gap-3">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyContent.trim() || loading.comment}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-6 py-2 font-medium shadow-lg transition-all duration-200"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading.comment ? 'Posting...' : 'Reply'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full px-4 py-2 transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  blogId={blogId}
                  depth={depth + 1}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Comments({ blogId }: CommentsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const commentsData = useSelector((state: RootState) => selectComments(state, blogId));
  const loading = useSelector(selectSocialLoading);
  
  const [newComment, setNewComment] = useState('');

  // Load comments on mount
  useEffect(() => {
    dispatch(fetchComments({ blogId }));
  }, [dispatch, blogId]);

  // Listen for real-time comment updates
  useWebSocket('new_comment', (data: Record<string, unknown>) => {
    if ((data as { blog_id: number }).blog_id === blogId) {
      // Refresh comments when new comment is added
      dispatch(fetchComments({ blogId }));
    }
  });

  useWebSocket('comment_reply', (data: Record<string, unknown>) => {
    if ((data as { blog_id: number }).blog_id === blogId) {
      // Refresh comments when new reply is added
      dispatch(fetchComments({ blogId }));
    }
  });

  const handleAddComment = async () => {
    if (!currentUser || !newComment.trim()) return;
    
    try {
      await dispatch(addComment({
        blogId,
        content: newComment.trim(),
      })).unwrap();
      
      setNewComment('');
      
      // Refresh comments to show new comment
      dispatch(fetchComments({ blogId }));
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAddComment();
    }
  };

  return (
    <div className="space-y-8">
      {/* Comment Form */}
      {currentUser && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex gap-4">
            <Avatar className="w-12 h-12 ring-2 ring-indigo-100">
              <AvatarImage src={currentUser.avatar_url} alt="You" />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                {currentUser.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                placeholder="Share your thoughts and join the conversation..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyPress}
                className="mb-4 bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none rounded-xl text-gray-800 placeholder-gray-500"
                rows={4}
              />
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 bg-white/70 px-3 py-1 rounded-full">
                  💡 Press Ctrl+Enter to post
                </div>
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || loading.comment}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {loading.comment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!currentUser && (
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4 text-lg">Sign in to join the conversation</p>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-8 py-3 font-semibold">
            Sign In
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            Comments ({commentsData.data.length})
          </h3>
        </div>

        {commentsData.loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-lg">Loading comments...</p>
          </div>
        )}

        {commentsData.error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-700 mb-4 text-lg">Error loading comments: {commentsData.error}</p>
            <Button
              onClick={() => dispatch(fetchComments({ blogId }))}
              className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-full px-6 py-2 font-medium"
            >
              Try Again
            </Button>
          </div>
        )}

        {!commentsData.loading && !commentsData.error && (
          <>
            {commentsData.data.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-8 h-8 text-gray-500" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">No comments yet</h4>
                <p className="text-gray-600 text-lg">
                  Be the first to share your thoughts on this blog post.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {commentsData.data.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    blogId={blogId}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
