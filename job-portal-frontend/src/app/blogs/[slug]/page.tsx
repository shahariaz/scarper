'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { RootState, AppDispatch } from '@/store/store';
import { fetchBlogBySlug, clearCurrentBlog } from '@/store/slices/blogsSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Eye, 
  Heart,
  Share2,
  Edit
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function BlogViewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const { currentBlog, loading, error } = useSelector((state: RootState) => state.blogs);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      dispatch(fetchBlogBySlug({ slug, incrementViews: true }));
    }
    
    return () => {
      dispatch(clearCurrentBlog());
    };
  }, [dispatch, slug]);

  const handleShare = async () => {
    if (navigator.share && currentBlog) {
      try {
        await navigator.share({
          title: currentBlog.title,
          text: currentBlog.excerpt || currentBlog.title,
          url: window.location.href,
        });
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
      }
    } else if (currentBlog) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const canEdit = isAuthenticated && user && currentBlog && (user.id === currentBlog.author_id || user.user_type === 'admin');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !currentBlog) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Not Found</h1>
          <p className="text-gray-600 mb-8">
            {error || 'The blog post you are looking for does not exist.'}
          </p>
          <Button onClick={() => router.push('/blogs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/blogs')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blogs
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/blogs/edit/${currentBlog.id}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {/* Tags */}
            {currentBlog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentBlog.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {currentBlog.title}
            </h1>
            
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span>{currentBlog.author_email}</span>
                {currentBlog.author_type === 'admin' && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Admin
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{format(new Date(currentBlog.created_at), 'MMMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                <span>{currentBlog.views_count} views</span>
              </div>
              
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                <span>{currentBlog.likes_count} likes</span>
              </div>
              
              {currentBlog.updated_at !== currentBlog.created_at && (
                <div className="text-sm">
                  Updated {formatDistanceToNow(new Date(currentBlog.updated_at), { addSuffix: true })}
                </div>
              )}
            </div>
            
            {/* Featured Image */}
            {currentBlog.featured_image && (
              <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
                <Image
                  src={currentBlog.featured_image}
                  alt={currentBlog.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-pink-600 prose-pre:bg-gray-100"
                dangerouslySetInnerHTML={{ __html: currentBlog.content }}
              />
            </CardContent>
          </Card>
          
          {/* Author Card */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {currentBlog.author_email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {currentBlog.author_email}
                    {currentBlog.author_type === 'admin' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Admin
                      </Badge>
                    )}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Published on {format(new Date(currentBlog.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Related Actions */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => router.push('/blogs')}
              variant="outline"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Blogs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
