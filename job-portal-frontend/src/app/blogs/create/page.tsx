'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { RootState, AppDispatch } from '@/store/store';
import { createBlog, updateBlog, fetchBlogById, clearCurrentBlog } from '@/store/slices/blogsSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/RichTextEditor';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  X, 
  Plus, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  Tag,
  Search,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BlogFormData {
  title: string;
  content: string;
  excerpt: string;
  featured_image: string;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
  meta_description: string;
}

export default function BlogEditorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const { currentBlog, loading, error } = useSelector((state: RootState) => state.blogs);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const isEditing = !!params.id;
  const blogId = params.id ? parseInt(params.id as string) : null;
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    is_published: false,
    is_featured: false,
    tags: [],
    meta_description: '',
  });
  
  const [tagInput, setTagInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  // Calculate word count and reading time
  useEffect(() => {
    if (formData.content) {
      const doc = new DOMParser().parseFromString(formData.content, 'text/html');
      const textContent = doc.body.textContent || '';
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      const readingTime = Math.ceil(wordCount / 200); // Average reading speed
      
      setWordCount(wordCount);
      setReadingTime(readingTime);
    }
  }, [formData.content]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/blogs/create');
      return;
    }
  }, [isAuthenticated, router]);

  // Load blog for editing
  useEffect(() => {
    if (isEditing && blogId) {
      dispatch(fetchBlogById({ id: blogId, incrementViews: false }));
    }
    
    return () => {
      dispatch(clearCurrentBlog());
    };
  }, [dispatch, isEditing, blogId]);

  // Populate form when editing
  useEffect(() => {
    if (currentBlog && isEditing) {
      setFormData({
        title: currentBlog.title,
        content: currentBlog.content,
        excerpt: currentBlog.excerpt || '',
        featured_image: currentBlog.featured_image || '',
        is_published: currentBlog.is_published,
        is_featured: currentBlog.is_featured,
        tags: currentBlog.tags,
        meta_description: currentBlog.meta_description || '',
      });
    }
  }, [currentBlog, isEditing]);

  const handleInputChange = (field: keyof BlogFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const generateExcerpt = () => {
    if (formData.content) {
      // Strip HTML and take first 150 characters
      const doc = new DOMParser().parseFromString(formData.content, 'text/html');
      const textContent = doc.body.textContent || '';
      const excerpt = textContent.substr(0, 150).trim();
      handleInputChange('excerpt', excerpt + (textContent.length > 150 ? '...' : ''));
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    
    try {
      const blogData = {
        ...formData,
        is_published: publish || formData.is_published,
      };

      if (isEditing && blogId) {
        await dispatch(updateBlog({ id: blogId, blogData })).unwrap();
        toast.success('Blog updated successfully');
      } else {
        const result = await dispatch(createBlog(blogData)).unwrap();
        toast.success('Blog created successfully');
        router.push(`/blogs/${result.slug}`);
        return;
      }
      
      setIsDirty(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save blog';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // For now, open in same tab - could be improved with modal
    if (currentBlog?.slug) {
      window.open(`/blogs/${currentBlog.slug}`, '_blank');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">Authentication Required</h2>
            <p className="text-gray-400 mb-4">Please login to create or edit blogs.</p>
            <Button 
              onClick={() => router.push('/auth/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading blog...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">Error Loading Blog</h2>
            <p className="text-red-400 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push('/blogs')}
              className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
            >
              Back to Blogs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/blogs')}
                className="p-2 text-gray-300 hover:text-white hover:bg-slate-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white">
                    {isEditing ? 'Edit Blog' : 'Create New Blog'}
                  </h1>
                  {isDirty && (
                    <div className="flex items-center text-amber-400 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      Unsaved changes
                    </div>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {isEditing ? 'Update your blog post' : 'Share your thoughts with the community'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Stats */}
              <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-400 mr-4">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {wordCount} words
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {readingTime} min read
                </div>
              </div>
              
              {isEditing && currentBlog?.slug && (
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  size="sm"
                  className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
              
              <Button
                onClick={() => handleSave(false)}
                disabled={saving || !isDirty}
                variant="outline"
                size="sm"
                className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {saving ? 'Publishing...' : (formData.is_published ? 'Update' : 'Publish')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Title */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-lg text-white">Blog Title</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter a compelling title for your blog post..."
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="text-xl font-medium border-slate-600 bg-slate-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <CardTitle className="text-lg text-white">Content</CardTitle>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{wordCount} words</span>
                    <span>{readingTime} min read</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => handleInputChange('content', content)}
                  placeholder="Start writing your amazing blog post..."
                  className="min-h-[500px] border-0 rounded-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-lg text-white">Publishing</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${formData.is_published ? 'text-green-400' : 'text-gray-500'}`} />
                    <Label htmlFor="is_published" className="font-medium text-white">
                      Published
                    </Label>
                  </div>
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => handleInputChange('is_published', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="flex items-center space-x-2">
                    <Sparkles className={`w-4 h-4 ${formData.is_featured ? 'text-yellow-400' : 'text-gray-500'}`} />
                    <Label htmlFor="is_featured" className="font-medium text-white">
                      Featured
                    </Label>
                  </div>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-lg text-white">Featured Image</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={formData.featured_image}
                  onChange={(e) => handleInputChange('featured_image', e.target.value)}
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
                {formData.featured_image && (
                  <div className="relative">
                    <Image
                      src={formData.featured_image}
                      alt="Featured"
                      width={300}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg border border-slate-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-sm text-gray-400">
                  Add an engaging cover image for your blog post
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-lg text-white">Tags</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="border-slate-600 bg-slate-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTag}
                    className="px-3 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 border border-blue-500"
                      >
                        {tag}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-300"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-400">
                  Add relevant tags to help readers find your content
                </p>
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <CardTitle className="text-lg text-white">Excerpt</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateExcerpt}
                    type="button"
                    className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Auto Generate
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Write a compelling summary of your blog post..."
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows={3}
                  className="resize-none border-slate-600 bg-slate-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Brief description for previews</span>
                  <span className={formData.excerpt.length > 500 ? 'text-red-400' : 'text-gray-400'}>
                    {formData.excerpt.length}/500
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-lg text-white">SEO Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Meta description for search engines..."
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  rows={2}
                  className="resize-none border-slate-600 bg-slate-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Search engine description</span>
                  <span className={formData.meta_description.length > 160 ? 'text-red-400' : 'text-gray-400'}>
                    {formData.meta_description.length}/160
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
