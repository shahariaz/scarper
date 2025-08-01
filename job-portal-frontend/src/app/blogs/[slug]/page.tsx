'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { RootState, AppDispatch } from '@/store/store';
import { fetchBlogBySlug, clearCurrentBlog } from '@/store/slices/blogsSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Heart,
  Twitter,
  Facebook,
  Link2,
  BookOpen,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function BlogViewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const { currentBlog, loading, error } = useSelector((state: RootState) => state.blogs);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      dispatch(fetchBlogBySlug({ slug, incrementViews: true }));
    }
    
    return () => {
      dispatch(clearCurrentBlog());
    };
  }, [dispatch, slug]);

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
    <div className="min-h-screen bg-white">
      {/* Top Navigation - Medium style */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/blogs')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-4">
              {/* Engagement Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`rounded-full p-2 ${isLiked ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="text-gray-600 hover:bg-gray-100 rounded-full p-2"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="text-gray-600 hover:bg-gray-100 rounded-full p-2"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('copy')}
                    className="text-gray-600 hover:bg-gray-100 rounded-full p-2"
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/blogs/edit/${currentBlog.id}`)}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Article Content - Medium/Dev.to style */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Tags */}
        {currentBlog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {currentBlog.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-full font-normal text-sm border-0"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Title - Large and bold like Medium */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
          {currentBlog.title}
        </h1>
        
        {/* Subtitle/Excerpt */}
        {currentBlog.excerpt && (
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed font-light">
            {currentBlog.excerpt}
          </p>
        )}
        
        {/* Author and Meta - Medium style */}
        <div className="flex items-center justify-between mb-12 pb-8 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium">
              {currentBlog.author_email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{currentBlog.author_email}</span>
                {currentBlog.author_type === 'admin' && (
                  <Badge className="bg-green-100 text-green-800 text-xs border-0 px-2 py-1">
                    Admin
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span>{format(new Date(currentBlog.created_at), 'MMM d, yyyy')}</span>
                <span>·</span>
                <span>{calculateReadingTime(currentBlog.content)} min read</span>
                <span>·</span>
                <span>{currentBlog.views_count.toLocaleString()} views</span>
              </div>
            </div>
          </div>
          
          {/* Engagement Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>{currentBlog.likes_count}</span>
            </div>
          </div>
        </div>
        
        {/* Featured Image - Full width like Medium */}
        {currentBlog.featured_image && (
          <div className="mb-12 -mx-6 md:mx-0">
            <div className="aspect-video w-full overflow-hidden md:rounded-lg">
              <Image
                src={currentBlog.featured_image}
                alt={currentBlog.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}
        
        {/* Article Content */}
        <article 
          className="prose prose-lg max-w-none
            prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight prose-headings:mb-4
            prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-12
            prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10
            prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8
            prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
            prose-a:text-green-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-em:text-gray-800 prose-em:italic
            prose-code:text-red-600 prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-code:text-sm
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-6 prose-pre:overflow-x-auto
            prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-gray-700
            prose-ul:space-y-2 prose-ol:space-y-2 prose-li:text-gray-800 prose-li:leading-relaxed
            prose-img:rounded-lg prose-img:shadow-sm prose-img:mx-auto prose-img:my-8
            prose-hr:border-gray-300 prose-hr:my-12"
          dangerouslySetInnerHTML={{ __html: currentBlog.content }}
        />
        
        {/* Bottom CTA */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="text-center">
            <Button
              onClick={() => router.push('/blogs')}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-8 py-3"
            >
              Read more articles
            </Button>
          </div>
        </div>
      </main>

      {/* Author Footer Card - Dev.to style */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {currentBlog.author_email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {currentBlog.author_email}
                </h3>
                {currentBlog.author_type === 'admin' && (
                  <Badge className="bg-green-100 text-green-800 text-xs border-0">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mb-4">
                Published on {format(new Date(currentBlog.created_at), 'MMMM d, yyyy')}
                {currentBlog.updated_at !== currentBlog.created_at && (
                  <span className="text-gray-500">
                    {' · Updated '}
                    {formatDistanceToNow(new Date(currentBlog.updated_at), { addSuffix: true })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top - Subtle like Medium */}
      {showScrollToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg z-50"
          size="sm"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
