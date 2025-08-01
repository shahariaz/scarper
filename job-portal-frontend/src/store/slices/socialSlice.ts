import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Types
export interface User {
  id: number;
  email: string;
  user_type: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  followed_at?: string;
}

export interface Comment {
  id: number;
  user_id: number;
  content: string;
  likes_count: number;
  replies_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    user_type: string;
  };
  replies: Comment[];
  is_liked?: boolean;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  target_type?: string;
  target_id?: number;
  is_read: boolean;
  created_at: string;
  from_user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export interface SocialStats {
  followers_count: number;
  following_count: number;
  blogs_count: number;
  total_likes_received: number;
  total_views: number;
  comments_count: number;
}

export interface UserProfile {
  id: number;
  email: string;
  user_type: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  social_stats: SocialStats;
  company_name?: string;
  industry?: string;
  location?: string;
  website?: string;
  logo_url?: string;
  is_approved?: boolean;
  experience_level?: string;
  current_position?: string;
  available_for_work?: boolean;
}

interface SocialState {
  // Follow/Unfollow
  followers: {
    [userId: number]: {
      data: User[];
      pagination: any;
      loading: boolean;
      error: string | null;
    };
  };
  following: {
    [userId: number]: {
      data: User[];
      pagination: any;
      loading: boolean;
      error: string | null;
    };
  };
  followStatus: {
    [userId: number]: boolean;
  };
  
  // Comments
  comments: {
    [blogId: number]: {
      data: Comment[];
      pagination: any;
      loading: boolean;
      error: string | null;
    };
  };
  
  // Notifications
  notifications: {
    data: Notification[];
    pagination: any;
    loading: boolean;
    error: string | null;
    unreadCount: number;
  };
  
  // User Profiles
  userProfiles: {
    [userId: number]: UserProfile;
  };
  
  // Like Status
  blogLikes: {
    [blogId: number]: boolean;
  };
  commentLikes: {
    [commentId: number]: boolean;
  };
  
  // Loading states
  loading: {
    follow: boolean;
    like: boolean;
    comment: boolean;
    notification: boolean;
  };
  
  error: string | null;
}

const initialState: SocialState = {
  followers: {},
  following: {},
  followStatus: {},
  comments: {},
  notifications: {
    data: [],
    pagination: {},
    loading: false,
    error: null,
    unreadCount: 0,
  },
  userProfiles: {},
  blogLikes: {},
  commentLikes: {},
  loading: {
    follow: false,
    like: false,
    comment: false,
    notification: false,
  },
  error: null,
};

// Async thunks
export const followUser = createAsyncThunk(
  'social/followUser',
  async (userId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      return { userId };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'social/unfollowUser',
  async (userId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`/api/users/${userId}/unfollow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      return { userId };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'social/fetchFollowers',
  async ({ userId, page = 1 }: { userId: number; page?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}/followers?page=${page}`);
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return { userId, ...data };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchFollowing = createAsyncThunk(
  'social/fetchFollowing',
  async ({ userId, page = 1 }: { userId: number; page?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}/following?page=${page}`);
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return { userId, ...data };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const checkFollowStatus = createAsyncThunk(
  'social/checkFollowStatus',
  async (userId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`/api/users/${userId}/is-following`, {
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return { userId, isFollowing: data.is_following };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const likeBlog = createAsyncThunk(
  'social/likeBlog',
  async (blogId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`http://localhost:5000/api/blogs/${blogId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return { blogId, likesCount: data.likes_count };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const unlikeBlog = createAsyncThunk(
  'social/unlikeBlog',
  async (blogId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`http://localhost:5000/api/blogs/${blogId}/unlike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return { blogId, likesCount: data.likes_count };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const checkBlogLikeStatus = createAsyncThunk(
  'social/checkBlogLikeStatus',
  async (blogId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`http://localhost:5000/api/blogs/${blogId}/is-liked`, {
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return { blogId, isLiked: data.is_liked };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const addComment = createAsyncThunk(
  'social/addComment',
  async ({ blogId, content, parentId }: { blogId: number; content: string; parentId?: number }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const url = `http://localhost:5000/api/blogs/${blogId}/comments`;
      console.log('addComment API URL:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, parent_id: parentId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return { blogId, commentId: data.comment_id };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchComments = createAsyncThunk(
  'social/fetchComments',
  async ({ blogId, page = 1 }: { blogId: number; page?: number }, { rejectWithValue }) => {
    try {
      const url = `http://localhost:5000/api/blogs/${blogId}/comments?page=${page}`;
      console.log('fetchComments API URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return { blogId, ...data };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const likeComment = createAsyncThunk(
  'social/likeComment',
  async (commentId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      return { commentId };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const unlikeComment = createAsyncThunk(
  'social/unlikeComment',
  async (commentId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}/unlike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      return { commentId };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'social/fetchNotifications',
  async ({ page = 1, unreadOnly = false }: { page?: number; unreadOnly?: boolean }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`/api/notifications?page=${page}&unread_only=${unreadOnly}`, {
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return data;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'social/markNotificationRead',
  async (notificationId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      return { notificationId };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchUnreadNotificationCount = createAsyncThunk(
  'social/fetchUnreadNotificationCount',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${auth.tokens.access_token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return data.unread_count;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'social/fetchUserProfile',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`);
      
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue((error as Error).message);
      }
      
      const data = await response.json();
      return { userId, profile: data.profile };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Social slice
const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateBlogLikeCount: (state, _action: PayloadAction<{ blogId: number; increment: boolean }>) => {
      // This will be handled by WebSocket updates
    },
    updateCommentLikeCount: (state, _action: PayloadAction<{ commentId: number; increment: boolean }>) => {
      // This will be handled by WebSocket updates
    },
    addNewNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.data.unshift(action.payload);
      state.notifications.unreadCount += 1;
    },
    updateFollowCount: (state, action: PayloadAction<{ userId: number; followers: number; following: number }>) => {
      if (state.userProfiles[action.payload.userId]) {
        state.userProfiles[action.payload.userId].social_stats.followers_count = action.payload.followers;
        state.userProfiles[action.payload.userId].social_stats.following_count = action.payload.following;
      }
    },
  },
  extraReducers: (builder) => {
    // Follow/Unfollow
    builder
      .addCase(followUser.pending, (state) => {
        state.loading.follow = true;
        state.error = null;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        state.loading.follow = false;
        state.followStatus[action.payload.userId] = true;
      })
      .addCase(followUser.rejected, (state, action) => {
        state.loading.follow = false;
        state.error = action.payload as string;
      })
      .addCase(unfollowUser.pending, (state) => {
        state.loading.follow = true;
        state.error = null;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.loading.follow = false;
        state.followStatus[action.payload.userId] = false;
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.loading.follow = false;
        state.error = action.payload as string;
      })
      
      // Followers/Following
      .addCase(fetchFollowers.pending, (state, action) => {
        const userId = action.meta.arg.userId;
        if (!state.followers[userId]) {
          state.followers[userId] = { data: [], pagination: {}, loading: false, error: null };
        }
        state.followers[userId].loading = true;
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        const { userId, followers, pagination } = action.payload;
        state.followers[userId] = {
          data: followers,
          pagination,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        const userId = action.meta.arg.userId;
        if (state.followers[userId]) {
          state.followers[userId].loading = false;
          state.followers[userId].error = action.payload as string;
        }
      })
      
      .addCase(fetchFollowing.pending, (state, action) => {
        const userId = action.meta.arg.userId;
        if (!state.following[userId]) {
          state.following[userId] = { data: [], pagination: {}, loading: false, error: null };
        }
        state.following[userId].loading = true;
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        const { userId, following, pagination } = action.payload;
        state.following[userId] = {
          data: following,
          pagination,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        const userId = action.meta.arg.userId;
        if (state.following[userId]) {
          state.following[userId].loading = false;
          state.following[userId].error = action.payload as string;
        }
      })
      
      // Follow Status
      .addCase(checkFollowStatus.fulfilled, (state, action) => {
        const { userId, isFollowing } = action.payload;
        state.followStatus[userId] = isFollowing;
      })
      
      // Blog Likes
      .addCase(likeBlog.pending, (state) => {
        state.loading.like = true;
      })
      .addCase(likeBlog.fulfilled, (state, action) => {
        state.loading.like = false;
        state.blogLikes[action.payload.blogId] = true;
        // Note: Blog like count will be updated via WebSocket or by dispatching updateBlogLikes separately
      })
      .addCase(likeBlog.rejected, (state, action) => {
        state.loading.like = false;
        state.error = action.payload as string;
      })
      
      .addCase(unlikeBlog.pending, (state) => {
        state.loading.like = true;
      })
      .addCase(unlikeBlog.fulfilled, (state, action) => {
        state.loading.like = false;
        state.blogLikes[action.payload.blogId] = false;
        // Note: Blog like count will be updated via WebSocket or by dispatching updateBlogLikes separately
      })
      .addCase(unlikeBlog.rejected, (state, action) => {
        state.loading.like = false;
        state.error = action.payload as string;
      })
      
      .addCase(checkBlogLikeStatus.fulfilled, (state, action) => {
        const { blogId, isLiked } = action.payload;
        state.blogLikes[blogId] = isLiked;
      })
      
      // Comments
      .addCase(addComment.pending, (state) => {
        state.loading.comment = true;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading.comment = false;
        // Refresh comments after adding
      })
      .addCase(addComment.rejected, (state, action) => {
        state.loading.comment = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchComments.pending, (state, action) => {
        const blogId = action.meta.arg.blogId;
        if (!state.comments[blogId]) {
          state.comments[blogId] = { data: [], pagination: {}, loading: false, error: null };
        }
        state.comments[blogId].loading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { blogId, comments, pagination } = action.payload;
        state.comments[blogId] = {
          data: comments,
          pagination,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchComments.rejected, (state, action) => {
        const blogId = action.meta.arg.blogId;
        if (state.comments[blogId]) {
          state.comments[blogId].loading = false;
          state.comments[blogId].error = action.payload as string;
        }
      })
      
      // Comment Likes
      .addCase(likeComment.fulfilled, (state, action) => {
        state.commentLikes[action.payload.commentId] = true;
      })
      .addCase(unlikeComment.fulfilled, (state, action) => {
        state.commentLikes[action.payload.commentId] = false;
      })
      
      // Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.notifications.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications.loading = false;
        state.notifications.data = action.payload.notifications;
        state.notifications.pagination = action.payload.pagination;
        state.notifications.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.notifications.loading = false;
        state.notifications.error = action.payload as string;
      })
      
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notification = state.notifications.data.find(n => n.id === action.payload.notificationId);
        if (notification && !notification.is_read) {
          notification.is_read = true;
          state.notifications.unreadCount = Math.max(0, state.notifications.unreadCount - 1);
        }
      })
      
      .addCase(fetchUnreadNotificationCount.fulfilled, (state, action) => {
        state.notifications.unreadCount = action.payload;
      })
      
      // User Profiles
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        const { userId, profile } = action.payload;
        state.userProfiles[userId] = profile;
      });
  },
});

export const {
  clearError,
  updateBlogLikeCount,
  updateCommentLikeCount,
  addNewNotification,
  updateFollowCount,
} = socialSlice.actions;

export default socialSlice.reducer;

// Selectors
export const selectFollowStatus = (state: RootState, userId: number) => 
  state.social.followStatus[userId] || false;

export const selectBlogLikeStatus = (state: RootState, blogId: number) => 
  state.social.blogLikes[blogId] || false;

export const selectCommentLikeStatus = (state: RootState, commentId: number) => 
  state.social.commentLikes[commentId] || false;

export const selectFollowers = (state: RootState, userId: number) => 
  state.social.followers[userId] || { data: [], pagination: {}, loading: false, error: null };

export const selectFollowing = (state: RootState, userId: number) => 
  state.social.following[userId] || { data: [], pagination: {}, loading: false, error: null };

export const selectComments = (state: RootState, blogId: number) => 
  state.social.comments[blogId] || { data: [], pagination: {}, loading: false, error: null };

export const selectNotifications = (state: RootState) => state.social.notifications;

export const selectUserProfile = (state: RootState, userId: number) => 
  state.social.userProfiles[userId];

export const selectSocialLoading = (state: RootState) => state.social.loading;
