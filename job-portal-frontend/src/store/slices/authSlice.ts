import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: number
  email: string
  user_type: 'admin' | 'jobseeker' | 'company'
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login?: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  bio?: string
  // Company specific fields
  company_name?: string
  company_description?: string
  website?: string
  industry?: string
  company_size?: string
  location?: string
  logo_url?: string
  is_approved?: boolean
  // Job seeker specific fields
  resume_url?: string
  skills?: string
  experience_level?: string
  current_position?: string
  expected_salary?: string
  available_for_work?: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tokens: {
    access_token: string | null
    refresh_token: string | null
  }
}

const getInitialTokens = () => {
  if (typeof window !== 'undefined') {
    return {
      access_token: localStorage.getItem('access_token'),
      refresh_token: localStorage.getItem('refresh_token'),
    }
  }
  return {
    access_token: null,
    refresh_token: null,
  }
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokens: getInitialTokens(),
}

// API base URL
const API_BASE_URL = 'http://localhost:5000/api/auth'

// Async thunks for auth actions
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string
    password: string
    user_type: 'admin' | 'jobseeker' | 'company'
    profile?: Record<string, unknown>
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.message || 'Registration failed')
      }

      // Store tokens in localStorage
      if (data.access_token && typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
      }

      return data
    } catch {
      return rejectWithValue('Network error occurred')
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.message || 'Login failed')
      }

      // Store tokens in localStorage
      if (data.access_token && typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
      }

      return data
    } catch {
      return rejectWithValue('Network error occurred')
    }
  }
)

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const token = state.auth.tokens.access_token

      if (!token) {
        return rejectWithValue('No access token found')
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch profile')
      }

      return data.user
    } catch {
      return rejectWithValue('Network error occurred')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const state = getState() as { auth: AuthState }
      const token = state.auth.tokens.access_token

      if (token) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }

      // Clear tokens from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }

      return null
    } catch {
      // Even if the API call fails, we still want to clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
      return null
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setTokens: (state, action: PayloadAction<{ access_token: string; refresh_token: string }>) => {
      state.tokens = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', action.payload.access_token)
        localStorage.setItem('refresh_token', action.payload.refresh_token)
      }
    },
    clearAuth: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.tokens = { access_token: null, refresh_token: null }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Register user
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.tokens = {
          access_token: action.payload.access_token,
          refresh_token: action.payload.refresh_token,
        }
        // Note: We'll fetch the full profile separately
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.tokens = {
          access_token: action.payload.access_token,
          refresh_token: action.payload.refresh_token,
        }
        // Note: We'll fetch the full profile separately
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        // If profile fetch fails, likely token is invalid
        state.isAuthenticated = false
        state.tokens = { access_token: null, refresh_token: null }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      })
      
      // Logout user
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.tokens = { access_token: null, refresh_token: null }
        state.error = null
      })
  },
})

export const { clearError, setTokens, clearAuth } = authSlice.actions
export default authSlice.reducer
