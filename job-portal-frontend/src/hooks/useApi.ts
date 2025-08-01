/**
 * Custom React hooks for API data fetching
 */

import { useState, useEffect, useCallback } from 'react'
import { apiService, Job, JobSearchParams, JobStatistics, User } from '../services/api'

// Hook for authentication state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    if (!apiService.isAuthenticated()) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await apiService.getProfile()
      if (response.success && response.data?.profile) {
        setUser(response.data.profile)
      } else {
        setError(response.message || 'Failed to load profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
      // Clear auth if profile fetch fails
      apiService.clearAuth()
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.login(email, password)
      
      if (response.success) {
        await loadProfile()
        return response
      } else {
        setError(response.message || 'Login failed')
        return response
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      setError(null)
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      setLoading(true)
      const response = await apiService.updateProfile(profileData)
      
      if (response.success) {
        await loadProfile() // Reload profile after update
      } else {
        setError(response.message || 'Failed to update profile')
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return {
    user,
    loading,
    error,
    login,
    logout,
    updateProfile,
    isAuthenticated: apiService.isAuthenticated(),
    reload: loadProfile
  }
}

// Hook for job search
export function useJobs(initialParams: JobSearchParams = {}) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  })

  const searchJobs = useCallback(async (params: JobSearchParams = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.searchJobs({
        ...initialParams,
        ...params
      })

      if (response.success) {
        setJobs(response.jobs || [])
        setPagination(response.pagination || {
          page: 1,
          per_page: 20,
          total: 0,
          pages: 0,
          has_next: false,
          has_prev: false
        })
      } else {
        setError(response.message || 'Failed to load jobs')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [initialParams])

  const createJob = async (jobData: Partial<Job>) => {
    try {
      const response = await apiService.createJob(jobData)
      
      if (response.success) {
        // Refresh the job list
        await searchJobs()
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job'
      return { success: false, message }
    }
  }

  const updateJob = async (jobId: number, jobData: Partial<Job>) => {
    try {
      const response = await apiService.updateJob(jobId, jobData)
      
      if (response.success) {
        // Refresh the job list
        await searchJobs()
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update job'
      return { success: false, message }
    }
  }

  const deleteJob = async (jobId: number) => {
    try {
      const response = await apiService.deleteJob(jobId)
      
      if (response.success) {
        // Refresh the job list
        await searchJobs()
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete job'
      return { success: false, message }
    }
  }

  const approveJob = async (jobId: number, adminNotes?: string) => {
    try {
      const response = await apiService.approveJob(jobId, adminNotes)
      
      if (response.success) {
        // Refresh the job list
        await searchJobs()
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve job'
      return { success: false, message }
    }
  }

  const rejectJob = async (jobId: number, adminNotes?: string) => {
    try {
      const response = await apiService.rejectJob(jobId, adminNotes)
      
      if (response.success) {
        // Refresh the job list
        await searchJobs()
      }
      
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject job'
      return { success: false, message }
    }
  }

  useEffect(() => {
    searchJobs()
  }, [searchJobs])

  return {
    jobs,
    loading,
    error,
    pagination,
    searchJobs,
    createJob,
    updateJob,
    deleteJob,
    approveJob,
    rejectJob,
    reload: () => searchJobs()
  }
}

// Hook for single job
export function useJob(jobId: number | null) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadJob = useCallback(async () => {
    if (!jobId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getJob(jobId)

      if (response.success && response.data?.job) {
        setJob(response.data.job)
      } else {
        setError(response.message || 'Job not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    loadJob()
  }, [loadJob])

  return {
    job,
    loading,
    error,
    reload: loadJob
  }
}

// Hook for job statistics
export function useJobStatistics() {
  const [statistics, setStatistics] = useState<JobStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getJobStatistics()

      if (response.success && response.data?.statistics) {
        setStatistics(response.data.statistics)
      } else {
        setError(response.message || 'Failed to load statistics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (apiService.isAuthenticated()) {
      loadStatistics()
    }
  }, [loadStatistics])

  return {
    statistics,
    loading,
    error,
    reload: loadStatistics
  }
}

// Hook for job categories
export function useJobCategories() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getJobCategories()

      if (response.success && response.data?.categories) {
        setCategories(response.data.categories)
      } else {
        setError(response.message || 'Failed to load categories')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  return {
    categories,
    loading,
    error,
    reload: loadCategories
  }
}

// Hook for API health check
export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.healthCheck()
      setIsHealthy(response.success)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed')
      setIsHealthy(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  return {
    isHealthy,
    loading,
    error,
    checkHealth
  }
}
