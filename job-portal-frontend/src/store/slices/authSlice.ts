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
  experience_years?: string
  linkedin?: string
  github?: string
  portfolio?: string
  twitter?: string
  instagram?: string
  facebook?: string
  website_personal?: string
  dribbble?: string
  behance?: string
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
  settings: Record<string, unknown> | null
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

const getInitialState = () => {
  const tokens = getInitialTokens()
  return {
    user: null,
    isAuthenticated: !!tokens.access_token, // Set to true if access token exists
    isLoading: false,
    error: null,
    tokens,
    settings: null,
  }
}

const initialState: AuthState = getInitialState()

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
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          user_type: userData.user_type,
          profile_data: userData.profile || {}
        }),
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

      return data.profile
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

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: Partial<User>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const token = state.auth.tokens.access_token

      if (!token) {
        return rejectWithValue('No access token available')
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update profile')
      }

      return data.profile
    } catch {
      return rejectWithValue('Network error occurred')
    }
  }
)

// Change password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: { current_password: string; new_password: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const token = state.auth.tokens.access_token

      if (!token) {
        return rejectWithValue('No access token available')
      }

      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to change password')
      }

      return data.message
    } catch {
      return rejectWithValue('Network error occurred')
    }
  }
)

// Get user settings
export const getUserSettings = createAsyncThunk(
  'auth/getSettings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const token = state.auth.tokens.access_token

      if (!token) {
        return rejectWithValue('No access token available')
      }

      const response = await fetch('http://localhost:5000/api/auth/settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to get settings')
      }

      return data.settings
    } catch {
      return rejectWithValue('Network error occurred')
    }
  }
)

// Update user settings
export const updateUserSettings = createAsyncThunk(
  'auth/updateSettings',
  async (settingsData: Record<string, unknown>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const token = state.auth.tokens.access_token

      if (!token) {
        return rejectWithValue('No access token available')
      }

      const response = await fetch('http://localhost:5000/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settingsData),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update settings')
      }

      return settingsData
    } catch {
      return rejectWithValue('Network error occurred')
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
        state.settings = null
      })
      
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Get settings
      .addCase(getUserSettings.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getUserSettings.fulfilled, (state, action) => {
        state.isLoading = false
        state.settings = action.payload
      })
      .addCase(getUserSettings.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Update settings
      .addCase(updateUserSettings.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.isLoading = false
        state.settings = action.payload
      })
      .addCase(updateUserSettings.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, setTokens, clearAuth } = authSlice.actions
export default authSlice.reducer
