export interface Job {
  id: number
  title: string
  company: string
  location: string
  job_type: string
  posted_date: string
  scraped_at: string
  apply_link: string
  status: string
  description?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  salary?: string
  experience_level?: string
  skills?: string
}

export interface PaginatedResponse<T> {
  jobs: T[]
  total: number
  page: number
  per_page: number
  pages: number
  total_pages?: number // For backward compatibility
}

export interface SearchFilters {
  query?: string
  company?: string
  location?: string
  type?: string
  experience?: string
  page?: number
  per_page?: number
}

export interface StatsData {
  total_jobs: number
  total_companies: number
  latest_run: string
  active_jobs: number
  jobs_by_company: Array<{
    company: string
    count: number
  }>
  jobs_by_location: Array<{
    location: string
    count: number
  }>
  recent_jobs: Job[]
}

const API_BASE_URL = 'http://localhost:5000/api'

export const jobsApi = {
  // Get jobs with pagination and filters
  getJobs: async (filters: SearchFilters = {}): Promise<PaginatedResponse<Job>> => {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.per_page) params.append('per_page', filters.per_page.toString())
    if (filters.company) params.append('company', filters.company)
    if (filters.location) params.append('location', filters.location)
    if (filters.type) params.append('type', filters.type)
    if (filters.experience) params.append('experience', filters.experience)
    
    const response = await fetch(`${API_BASE_URL}/jobs?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to fetch jobs')
    }
    return response.json()
  },

  // Search jobs with pagination and filters
  searchJobs: async (filters: SearchFilters = {}): Promise<PaginatedResponse<Job>> => {
    const params = new URLSearchParams()
    
    if (filters.query) params.append('q', filters.query)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.per_page) params.append('per_page', filters.per_page.toString())
    if (filters.company) params.append('company', filters.company)
    if (filters.location) params.append('location', filters.location)
    if (filters.type) params.append('type', filters.type)
    if (filters.experience) params.append('experience', filters.experience)
    
    const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to search jobs')
    }
    return response.json()
  },

  // Get job by ID
  getJobById: async (id: number): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/job/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch job')
    }
    return response.json()
  },

  // Get dashboard stats
  getStats: async (): Promise<StatsData> => {
    const response = await fetch(`${API_BASE_URL}/stats`)
    if (!response.ok) {
      throw new Error('Failed to fetch stats')
    }
    return response.json()
  },

  // Get companies
  getCompanies: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/companies`)
    if (!response.ok) {
      throw new Error('Failed to fetch companies')
    }
    return response.json()
  },

  // Get locations
  getLocations: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/locations`)
    if (!response.ok) {
      throw new Error('Failed to fetch locations')
    }
    return response.json()
  },

  // Get job types
  getJobTypes: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/job-types`)
    if (!response.ok) {
      throw new Error('Failed to fetch job types')
    }
    return response.json()
  },

  // Get experience levels
  getExperienceLevels: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/experience-levels`)
    if (!response.ok) {
      throw new Error('Failed to fetch experience levels')
    }
    return response.json()
  },
}
