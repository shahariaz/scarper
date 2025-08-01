'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { RootState, AppDispatch } from '@/store/store';
import { fetchBlogBySlug, clearCurrentBlog } from '@/store/slices/blogsSlice';
import { 
  likeBlog, 
  unlikeBlog, 
  checkBlogLikeStatus,
  selectBlogLikeStatus,
  selectSocialLoading 
} from '@/store/slices/socialSlice';
import { updateBlogLikes } from '@/store/slices/blogsSlice';
import { Button } from '@/components/ui/button';
import Comments from '@/components/Comments';
import { useWebSocket, webSocketService } from '@/lib/websocket';
import { 
  ArrowLeft, 
  Heart,
  Twitter,
  Facebook,
  Link2,
  BookOpen,
  ChevronUp,
  Edit,
  Calendar,
  Clock,
  Eye
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-hot-toast';

// WebSocket event types
interface BlogLikeEvent {
  blog_id: number;
  likes_count: number;
  user_id: number;
}

export default function BlogViewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const { currentBlog, loading, error } = useSelector((state: RootState) => state.blogs);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isLiked = useSelector((state: RootState) => 
    currentBlog ? selectBlogLikeStatus(state, currentBlog.id) : false
  );
  const socialLoading = useSelector(selectSocialLoading);
  
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      dispatch(fetchBlogBySlug({ slug, incrementViews: true }));
    }
    
    return () => {
      dispatch(clearCurrentBlog());
    };
  }, [dispatch, slug]);

  // Check like status when blog loads and connect to WebSocket if authenticated
  useEffect(() => {
    if (currentBlog && isAuthenticated) {
      dispatch(checkBlogLikeStatus(currentBlog.id));
      
      // Ensure WebSocket is connected for authenticated users
      webSocketService.connectIfAuthenticated();
      
      // Join WebSocket room for this blog to receive real-time updates
      webSocketService.subscribeToBlog(currentBlog.id);
    }
    
    return () => {
      // Leave the blog room when component unmounts
      if (currentBlog) {
        webSocketService.unsubscribeFromBlog(currentBlog.id);
      }
    };
  }, [dispatch, currentBlog, isAuthenticated]);

  // Listen for real-time like updates via WebSocket
  useWebSocket('blog_liked', (data: Record<string, unknown>) => {
    const likeData = data as unknown as BlogLikeEvent;
    if (currentBlog && likeData.blog_id === currentBlog.id) {
      // Update the blog's like count in real-time
      dispatch(updateBlogLikes({
        blogId: currentBlog.id,
        likesCount: likeData.likes_count
      }));
    }
  });

  useWebSocket('blog_unliked', (data: Record<string, unknown>) => {
    const likeData = data as unknown as BlogLikeEvent;
    if (currentBlog && likeData.blog_id === currentBlog.id) {
      // Update the blog's like count in real-time
      dispatch(updateBlogLikes({
        blogId: currentBlog.id,
        likesCount: likeData.likes_count
      }));
    }
  });

  // Handle scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = async () => {
    if (!currentBlog || !isAuthenticated) {
      toast.error('Please sign in to like this post');
      return;
    }

    try {
      if (isLiked) {
        const result = await dispatch(unlikeBlog(currentBlog.id)).unwrap();
        // Update the blog like count immediately
        dispatch(updateBlogLikes({
          blogId: currentBlog.id,
          likesCount: result.likesCount
        }));
        toast.success('Post unliked');
      } else {
        const result = await dispatch(likeBlog(currentBlog.id)).unwrap();
        // Update the blog like count immediately
        dispatch(updateBlogLikes({
          blogId: currentBlog.id,
          likesCount: result.likesCount
        }));
        toast.success('Post liked!');
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleShare = async (platform?: string) => {
    if (!currentBlog) return;

    const url = window.location.href;
    const title = currentBlog.title;

    try {
      if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      } else if (platform === 'copy') {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const canEdit = isAuthenticated && user && currentBlog && (user.id === currentBlog.author_id || user.user_type === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !currentBlog) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Article not found</h1>
          <p className="text-gray-600 mb-8">
            {error || 'The article you are looking for does not exist or has been removed.'}
          </p>
          <Button 
            onClick={() => router.push('/blogs')}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to articles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-12">
            <Button
              variant="ghost"
              onClick={() => router.push('/blogs')}
              className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-3 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-4">
              {/* Engagement Actions */}
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-full p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={socialLoading.like}
                  className={`rounded-full p-2 transition-all duration-200 ${
                    isLiked 
                      ? 'text-pink-300 bg-pink-500/20 hover:bg-pink-500/30' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  {currentBlog.likes_count > 0 && (
                    <span className="ml-1 text-sm font-medium">{currentBlog.likes_count}</span>
                  )}
                </Button>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('copy')}
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/blogs/edit/${currentBlog.id}`)}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm rounded-full px-6 py-2 font-medium transition-all duration-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Tags with modern styling */}
          {currentBlog.tags.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              {currentBlog.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="bg-white/20 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium border border-white/30 hover:bg-white/30 transition-all duration-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Title with gradient text */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            {currentBlog.title}
          </h1>
          
          {/* Subtitle */}
          {currentBlog.excerpt && (
            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed font-light max-w-4xl">
              {currentBlog.excerpt}
            </p>
          )}
          
          {/* Author and Meta with glass effect */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm border border-white/30">
                  {currentBlog.author_email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-white text-lg">{currentBlog.author_email}</span>
                    {currentBlog.author_type === 'admin' && (
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-white/80 mt-2">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(currentBlog.created_at), 'MMM d, yyyy')}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{calculateReadingTime(currentBlog.content)} min read</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{currentBlog.views_count.toLocaleString()} views</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Engagement Stats */}
              <div className="flex items-center space-x-6 text-white/80">
                <button
                  onClick={handleLike}
                  disabled={socialLoading.like}
                  className={`flex items-center space-x-2 rounded-full px-4 py-2 transition-all duration-200 ${
                    isLiked 
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                      : 'bg-white/10 hover:bg-white/20'
                  } ${socialLoading.like ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Heart 
                    className={`w-5 h-5 transition-all duration-200 ${
                      isLiked ? 'fill-red-300 text-red-300' : ''
                    }`} 
                  />
                  <span className="font-medium">{currentBlog.likes_count}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="white"></path>
          </svg>
        </div>
      </div>

      {/* Main Content with modern card design */}
      <main className="relative -mt-8 z-10">
        <div className="max-w-4xl mx-auto px-6">
          {/* Featured Image with modern styling */}
          {currentBlog.featured_image && (
            <div className="mb-12">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src={currentBlog.featured_image}
                  alt={currentBlog.title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
            </div>
          )}

          {/* Article Content Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12">
              {/* Article Content */}
              <article 
                className="prose prose-xl max-w-none
                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight prose-headings:mb-6
                  prose-h1:text-5xl prose-h1:mb-8 prose-h1:mt-12 prose-h1:bg-gradient-to-r prose-h1:from-indigo-600 prose-h1:to-purple-600 prose-h1:bg-clip-text prose-h1:text-transparent
                  prose-h2:text-4xl prose-h2:mb-6 prose-h2:mt-12 prose-h2:text-gray-800
                  prose-h3:text-3xl prose-h3:mb-4 prose-h3:mt-10 prose-h3:text-gray-700
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-8 prose-p:text-xl
                  prose-a:text-indigo-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-a:transition-all
                  prose-strong:text-gray-900 prose-strong:font-bold
                  prose-em:text-gray-700 prose-em:italic
                  prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-3 prose-code:py-2 prose-code:rounded-lg prose-code:font-mono prose-code:text-lg prose-code:border prose-code:border-pink-200
                  prose-pre:bg-gradient-to-br prose-pre:from-gray-900 prose-pre:to-gray-800 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-8 prose-pre:shadow-2xl prose-pre:border prose-pre:border-gray-700
                  prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50 prose-blockquote:pl-8 prose-blockquote:py-6 prose-blockquote:italic prose-blockquote:text-gray-800 prose-blockquote:rounded-r-lg prose-blockquote:my-8
                  prose-ul:space-y-3 prose-ol:space-y-3 prose-li:text-gray-700 prose-li:leading-relaxed prose-li:text-xl
                  prose-img:rounded-2xl prose-img:shadow-lg prose-img:mx-auto prose-img:my-12 prose-img:border prose-img:border-gray-200
                  prose-hr:border-gray-300 prose-hr:my-16 prose-hr:border-t-2"
                dangerouslySetInnerHTML={{ __html: currentBlog.content }}
              />
            </div>

            {/* Article Footer with gradient background */}
            <div className="bg-gradient-to-r from-gray-50 to-white px-8 md:px-12 py-8 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {currentBlog.author_email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Written by</p>
                    <p className="font-semibold text-gray-900">{currentBlog.author_email}</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => router.push('/blogs')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  Read more articles
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Author Spotlight Card */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-3xl p-8 md:p-12 shadow-xl border border-indigo-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">About the Author</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl">
              {currentBlog.author_email.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <h4 className="text-xl font-bold text-gray-900">
                  {currentBlog.author_email}
                </h4>
                {currentBlog.author_type === 'admin' && (
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    ✨ Admin
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="bg-white/70 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-indigo-600" />
                  <p className="font-medium">Published</p>
                  <p>{format(new Date(currentBlog.created_at), 'MMM d, yyyy')}</p>
                </div>
                
                {currentBlog.updated_at !== currentBlog.created_at && (
                  <div className="bg-white/70 rounded-xl p-4 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                    <p className="font-medium">Updated</p>
                    <p>{formatDistanceToNow(new Date(currentBlog.updated_at), { addSuffix: true })}</p>
                  </div>
                )}
                
                <div className="bg-white/70 rounded-xl p-4 text-center">
                  <Eye className="w-5 h-5 mx-auto mb-2 text-pink-600" />
                  <p className="font-medium">Views</p>
                  <p>{currentBlog.views_count.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section with modern design */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 md:px-12 py-8 border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <Heart className="w-4 h-4 text-white" />
              </div>
              Join the Discussion
            </h3>
            <p className="text-gray-600 mt-2">Share your thoughts and engage with the community</p>
          </div>
          
          <div className="p-8 md:p-12">
            <Comments blogId={currentBlog.id} />
          </div>
        </div>
      </div>

      {/* Modern Scroll to Top Button */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl z-50 transition-all duration-300 hover:shadow-indigo-500/25 hover:scale-110"
          size="sm"
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}
