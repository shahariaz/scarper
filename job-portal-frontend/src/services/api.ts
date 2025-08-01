/**
 * API service for job portal backend integration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export interface User {
  id: number
  email: string
  user_type: 'admin' | 'company' | 'jobseeker'
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
}

export interface Job {
  id: number
  title: string
  company: string
  location?: string
  job_type?: string
  work_mode?: string
  description: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  experience_level?: string
  skills?: string
  education_requirements?: string
  apply_link?: string
  apply_email?: string
  source_url?: string
  posted_date?: string
  deadline?: string
  scraped_at?: string
  is_active: boolean
  is_featured?: boolean
  view_count: number
  application_count: number
  created_by_user_id: number
  created_by_type: 'admin' | 'company' | 'scraper'
  approved_by_admin: boolean
  admin_notes?: string
  status: string
  priority?: number
  meta_title?: string
  meta_description?: string
  tags?: string
  category?: string
  industry?: string
  company_size?: string
  contact_person?: string
  contact_phone?: string
  company_logo_url?: string
  company_website?: string
  created_at: string
  updated_at: string
  approved_at?: string
  closed_at?: string
}

export interface JobStatistics {
  total_jobs: number
  active_jobs: number
  pending_jobs: number
  draft_jobs: number
  total_applications: number
  total_views: number
  jobs_by_category: Array<{
    category: string
    count: number
  }>
  jobs_by_status: Array<{
    status: string
    count: number
  }>
  monthly_stats: Array<{
    month: string
    jobs_posted: number
    applications: number
    views: number
  }>
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginResponse extends ApiResponse<{
  user_id: number
  user_type: string
  is_verified: boolean
}> {
  access_token?: string
  refresh_token?: string
  token_type?: string
}

export interface JobSearchParams {
  q?: string
  company?: string
  location?: string
  job_type?: string
  work_mode?: string
  experience_level?: string
  category?: string
  industry?: string
  created_by_type?: string
  status?: string
  salary_min?: number
  salary_max?: number
  posted_after?: string
  deadline_before?: string
  show_unapproved?: boolean
  my_jobs?: boolean
  page?: number
  per_page?: number
  sort?: string
}

export interface JobSearchResponse extends ApiResponse<{
  jobs: Job[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}> {
  jobs?: Job[]
  pagination?: {
    page: number
    per_page: number
    total: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

class ApiService {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = API_BASE_URL
    
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token')
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })

    if (response.success && response.access_token) {
      this.token = response.access_token
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.access_token)
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token)
        }
      }
    }

    return response
  }

  async register(userData: {
    email: string
    password: string
    user_type: 'company' | 'jobseeker'
    profile_data?: Record<string, unknown>
  }): Promise<ApiResponse<{ user_id: number } & AuthTokens>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async logout(): Promise<void> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null

    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      this.token = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
  }

  async getProfile(): Promise<ApiResponse<{ profile: User }>> {
    return this.request('/auth/profile')
  }

  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await this.request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    if (response.access_token) {
      this.token = response.access_token
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.access_token)
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token)
        }
      }
    }

    return response
  }

  // ============================================================================
  // JOB METHODS
  // ============================================================================

  async searchJobs(params: JobSearchParams = {}): Promise<JobSearchResponse> {
    const queryString = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryString.append(key, value.toString())
      }
    })

    const endpoint = `/jobs/search${queryString.toString() ? `?${queryString.toString()}` : ''}`
    return this.request<JobSearchResponse>(endpoint)
  }

  async getJob(jobId: number): Promise<ApiResponse<{ job: Job }>> {
    return this.request(`/jobs/${jobId}`)
  }

  async createJob(jobData: Partial<Job>): Promise<ApiResponse<{ job: Job }>> {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    })
  }

  async updateJob(jobId: number, jobData: Partial<Job>): Promise<ApiResponse<{ job: Job }>> {
    return this.request(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData)
    })
  }

  async deleteJob(jobId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/jobs/${jobId}`, {
      method: 'DELETE'
    })
  }

  async approveJob(jobId: number, adminNotes?: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/jobs/${jobId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ admin_notes: adminNotes || '' })
    })
  }

  async rejectJob(jobId: number, adminNotes?: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/jobs/${jobId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ admin_notes: adminNotes || '' })
    })
  }

  async getJobStatistics(): Promise<ApiResponse<{ statistics: JobStatistics }>> {
    return this.request('/jobs/statistics')
  }

  async getJobCategories(): Promise<ApiResponse<{ categories: string[] }>> {
    return this.request('/jobs/categories')
  }

  async getJobFilters(): Promise<ApiResponse<{ 
    filters: {
      job_types: string[]
      work_modes: string[]
      experience_levels: string[]
      salary_ranges: Array<{
        label: string
        min: number
        max: number | null
      }>
    }
  }>> {
    return this.request('/jobs/filters')
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async healthCheck(): Promise<ApiResponse<{
    message: string
    timestamp: string
    version: string
  }>> {
    return this.request('/health')
  }

  async getApiInfo(): Promise<ApiResponse<{
    api_name: string
    version: string
    description: string
    endpoints: Record<string, string>
  }>> {
    return this.request('/info')
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token
  }

  // Get current token
  getToken(): string | null {
    return this.token
  }

  // Set token manually (useful for SSR)
  setToken(token: string): void {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  }

  // Clear authentication
  clearAuth(): void {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService()
export default apiService
