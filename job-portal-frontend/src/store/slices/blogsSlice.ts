import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  author_id: number;
  featured_image?: string;
  is_published: boolean;
  is_featured: boolean;
  views_count: number;
  likes_count: number;
  tags: string[];
  meta_description?: string;
  slug: string;
  created_at: string;
  updated_at: string;
  author_email: string;
  author_type: string;
}

export interface BlogsState {
  blogs: Blog[];
  currentBlog: Blog | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters: {
    search: string;
    author_id?: number;
    featured_only: boolean;
    published_only: boolean;
    tags: string;
    order_by: string;
    order_direction: 'ASC' | 'DESC';
  };
}

const initialState: BlogsState = {
  blogs: [],
  currentBlog: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    per_page: 10,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  },
  filters: {
    search: '',
    featured_only: false,
    published_only: true,
    tags: '',
    order_by: 'created_at',
    order_direction: 'DESC',
  },
};

// Async thunks
export const fetchBlogs = createAsyncThunk(
  'blogs/fetchBlogs',
  async (params: { page?: number; filters?: Partial<BlogsState['filters']> } = {}) => {
    const { page = 1, filters = {} } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: '10',
      ...Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '' && value !== false) {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>),
    });

    const response = await fetch(`http://localhost:5000/api/blogs?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch blogs');
    }

    const data = await response.json();
    return data;
  }
);

export const fetchBlogById = createAsyncThunk(
  'blogs/fetchBlogById',
  async (params: { id: number; incrementViews?: boolean }) => {
    const { id, incrementViews = true } = params;
    
    const response = await fetch(
      `http://localhost:5000/api/blogs/${id}?increment_views=${incrementViews}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch blog');
    }

    const data = await response.json();
    return data.blog;
  }
);

export const fetchBlogBySlug = createAsyncThunk(
  'blogs/fetchBlogBySlug',
  async (params: { slug: string; incrementViews?: boolean }) => {
    const { slug, incrementViews = true } = params;
    
    const response = await fetch(
      `http://localhost:5000/api/blogs/slug/${slug}?increment_views=${incrementViews}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch blog');
    }

    const data = await response.json();
    return data.blog;
  }
);

export const createBlog = createAsyncThunk(
  'blogs/createBlog',
  async (blogData: {
    title: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    is_published?: boolean;
    is_featured?: boolean;
    tags?: string[];
    meta_description?: string;
  }) => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('http://localhost:5000/api/blogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(blogData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create blog');
    }

    const data = await response.json();
    return data;
  }
);

export const updateBlog = createAsyncThunk(
  'blogs/updateBlog',
  async (params: {
    id: number;
    blogData: {
      title?: string;
      content?: string;
      excerpt?: string;
      featured_image?: string;
      is_published?: boolean;
      is_featured?: boolean;
      tags?: string[];
      meta_description?: string;
    };
  }) => {
    const { id, blogData } = params;
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`http://localhost:5000/api/blogs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(blogData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update blog');
    }

    const data = await response.json();
    return { id, ...data };
  }
);

export const deleteBlog = createAsyncThunk(
  'blogs/deleteBlog',
  async (id: number) => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`http://localhost:5000/api/blogs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete blog');
    }

    return id;
  }
);

const blogsSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<BlogsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentBlog: (state) => {
      state.currentBlog = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetBlogs: (state) => {
      state.blogs = [];
      state.pagination = initialState.pagination;
    },
    updateBlogLikes: (state, action: PayloadAction<{ blogId: number; likesCount: number }>) => {
      // Update like count in the current blog
      if (state.currentBlog && state.currentBlog.id === action.payload.blogId) {
        state.currentBlog.likes_count = action.payload.likesCount;
      }
      
      // Update like count in the blogs list
      const blogIndex = state.blogs.findIndex(blog => blog.id === action.payload.blogId);
      if (blogIndex !== -1) {
        state.blogs[blogIndex].likes_count = action.payload.likesCount;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch blogs
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload.blogs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch blogs';
      })
      
      // Fetch blog by ID
      .addCase(fetchBlogById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBlog = action.payload;
      })
      .addCase(fetchBlogById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch blog';
      })
      
      // Fetch blog by slug
      .addCase(fetchBlogBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBlog = action.payload;
      })
      .addCase(fetchBlogBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch blog';
      })
      
      // Create blog
      .addCase(createBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBlog.fulfilled, (state) => {
        state.loading = false;
        // Optionally refresh blogs list or redirect
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create blog';
      })
      
      // Update blog
      .addCase(updateBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.loading = false;
        // Update blog in current list if it exists
        const index = state.blogs.findIndex(blog => blog.id === action.payload.id);
        if (index !== -1) {
          // Refresh the list to get updated blog
        }
      })
      .addCase(updateBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update blog';
      })
      
      // Delete blog
      .addCase(deleteBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = state.blogs.filter(blog => blog.id !== action.payload);
        if (state.currentBlog?.id === action.payload) {
          state.currentBlog = null;
        }
      })
      .addCase(deleteBlog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete blog';
      });
  },
});

export const { setFilters, clearCurrentBlog, clearError, resetBlogs, updateBlogLikes } = blogsSlice.actions;
export default blogsSlice.reducer;
