'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RootState, AppDispatch } from '@/store/store';
import { fetchBlogs, setFilters } from '@/store/slices/blogsSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Calendar, 
  User, 
  Eye, 
  Heart,
  Filter,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BlogsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { blogs, loading, error, pagination, filters } = useSelector((state: RootState) => state.blogs);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchBlogs({ page: 1, filters }));
  }, [dispatch, filters]);

  const handleSearch = (searchTerm: string) => {
    dispatch(setFilters({ search: searchTerm }));
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchBlogs({ page, filters }));
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog</h1>
          <p className="text-gray-600">
            Discover insights, tips, and stories from our community
          </p>
        </div>
        
        {isAuthenticated && (
          <Button
            onClick={() => router.push('/blogs/create')}
            className="mt-4 md:mt-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Write Blog
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search blogs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchInput)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSearch(searchInput)}
            >
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sort by</label>
                <select
                  value={filters.order_by}
                  onChange={(e) => handleFilterChange({ order_by: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="created_at">Latest</option>
                  <option value="views_count">Most Viewed</option>
                  <option value="likes_count">Most Liked</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Order</label>
                <select
                  value={filters.order_direction}
                  onChange={(e) => handleFilterChange({ order_direction: e.target.value as 'ASC' | 'DESC' })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="DESC">Descending</option>
                  <option value="ASC">Ascending</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.featured_only}
                    onChange={(e) => handleFilterChange({ featured_only: e.target.checked })}
                    className="mr-2"
                  />
                  Featured only
                </label>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Blogs Grid */}
      {!loading && !error && (
        <>
          {blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No blogs found</p>
              {isAuthenticated && (
                <Button onClick={() => router.push('/blogs/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Write the first blog
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {blogs.map((blog) => (
                <Card
                  key={blog.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/blogs/${blog.slug}`)}
                >
                  {blog.featured_image && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <Image
                        src={blog.featured_image}
                        alt={blog.title}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-1" />
                        {blog.author_email}
                      </div>
                      {blog.is_featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>
                    
                    <CardTitle className="line-clamp-2 text-lg">
                      {blog.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {blog.excerpt || truncateText(stripHtml(blog.content))}
                    </p>
                    
                    {blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {blog.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {blog.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{blog.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {blog.views_count}
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {blog.likes_count}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.has_prev}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.has_next}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
