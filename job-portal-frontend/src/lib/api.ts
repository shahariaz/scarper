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
  benefits?: string
  salary?: string
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
  // Get all jobs
  getJobs: async (): Promise<Job[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs`)
    if (!response.ok) {
      throw new Error('Failed to fetch jobs')
    }
    return response.json()
  },

  // Get job by ID
  getJobById: async (id: number): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch job')
    }
    return response.json()
  },

  // Search jobs
  searchJobs: async (query: string): Promise<Job[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs/search?q=${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error('Failed to search jobs')
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
}
