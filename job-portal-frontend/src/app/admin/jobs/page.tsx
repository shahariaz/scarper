'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { fetchUserProfile } from '@/store/slices/authSlice'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Loader2,
  Shield,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  RefreshCw,
  MapPin,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileText,
  Edit,
  Trash2
} from 'lucide-react'

interface Job {
  id: number;
  title: string;
  company: string;
  location?: string;
  description: string;
  created_by_type: string;
  created_at: string;
  status: string;
  approved_by_admin: boolean;
  salary_min?: number;
  salary_max?: string;
  job_type?: string;
  work_mode?: string;
  category?: string;
  view_count?: number;
  application_count?: number;
  admin_notes?: string;
  job_source?: string;  // scraped, manual, admin, etc.
  created_by?: string;  // company name or admin name
}

interface JobFilters {
  status: string;
  created_by_type: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function AdminJobs() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [processingJobs, setProcessingJobs] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [jobsPerPage] = useState(8)
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  const [filters, setFilters] = useState<JobFilters>({
    status: 'pending',  // Default to showing only pending jobs for approval
    created_by_type: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const [bulkActions, setBulkActions] = useState({
    selectedJobs: new Set<number>(),
    showBulkActions: false
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user profile if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  // Redirect non-admin users
  useEffect(() => {
    if (mounted && user && user.user_type !== 'admin') {
      window.location.href = '/dashboard'
    }
  }, [mounted, user])

  // Fetch jobs data
  const fetchJobs = useCallback(async () => {
    if (!tokens.access_token || user?.user_type !== 'admin') return
    
    setLoadingJobs(true)
    try {
      const response = await fetch('/api/jobs/search?show_unapproved=true&limit=1000', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
        
        // Calculate statistics
        const stats = {
          total: data.jobs?.length || 0,
          pending: data.jobs?.filter((job: Job) => !job.approved_by_admin && job.status !== 'inactive').length || 0,
          approved: data.jobs?.filter((job: Job) => job.approved_by_admin && job.status === 'active').length || 0,
          rejected: data.jobs?.filter((job: Job) => job.status === 'inactive').length || 0
        }
        
        setStatistics(stats)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoadingJobs(false)
    }
  }, [tokens.access_token, user?.user_type])

  useEffect(() => {
    if (mounted && tokens.access_token && user?.user_type === 'admin') {
      fetchJobs()
    }
  }, [mounted, tokens.access_token, user, fetchJobs])

  // Filter and sort jobs
  useEffect(() => {
    let filtered = [...jobs]

    // Apply filters
    if (filters.status !== 'all') {
      if (filters.status === 'pending') {
        // Show only jobs that are NOT approved by admin and NOT rejected
        filtered = filtered.filter(job => !job.approved_by_admin && job.status !== 'inactive')
      } else if (filters.status === 'approved') {
        // Show only jobs that are approved by admin and active
        filtered = filtered.filter(job => job.approved_by_admin && job.status === 'active')
      } else if (filters.status === 'rejected') {
        // Show only jobs that are explicitly rejected (inactive)
        filtered = filtered.filter(job => job.status === 'inactive')
      }
    }

    if (filters.created_by_type !== 'all') {
      filtered = filtered.filter(job => job.created_by_type === filters.created_by_type)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | boolean = a[filters.sortBy as keyof Job] as string | number | boolean
      let bValue: string | number | boolean = b[filters.sortBy as keyof Job] as string | number | boolean

      if (filters.sortBy === 'created_at') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredJobs(filtered)
    setCurrentPage(1)
  }, [jobs, filters])

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show auth error if not authenticated or not admin
  if (!isAuthenticated || !user || user.user_type !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Access Denied</h1>
            <p className="text-gray-300 mb-6">You need admin privileges to access this page.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleJobAction = async (jobId: number, action: 'approve' | 'reject', notes: string = '') => {
    console.log(`Starting ${action} action for job ${jobId}`) // Debug log
    console.log('User type:', user?.user_type) // Debug log
    console.log('Access token exists:', !!tokens.access_token) // Debug log
    
    setProcessingJobs(prev => new Set(prev).add(jobId))
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_notes: notes })
      })

      console.log(`${action} response status:`, response.status) // Debug log

      if (response.ok) {
        const result = await response.json()
        console.log(`${action} result:`, result) // Debug log
        
        // Refresh the job list from server to get latest data
        await fetchJobs()
        
        // Also trigger a refresh of sidebar badge counts by dispatching a custom event
        window.dispatchEvent(new CustomEvent('refreshAdminCounts'))
        
        alert(`Job ${action}d successfully!`)
      } else {
        const errorData = await response.json()
        console.error(`Failed to ${action} job:`, response.status, errorData)
        alert(`Failed to ${action} job: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error)
      alert(`Error ${action}ing job. Please try again.`)
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    setProcessingJobs(prev => new Set(prev).add(jobId))
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })

      if (response.ok) {
        // Remove job from local state
        setJobs(prev => prev.filter(job => job.id !== jobId))
        
        // Update statistics
        setStatistics(prev => ({
          ...prev,
          total: prev.total - 1,
          pending: prev.pending - 1
        }))
      } else {
        console.error('Failed to delete job')
        alert('Failed to delete job. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Error deleting job. Please try again.')
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const handleEditJob = (job: Job) => {
    setEditingJob(job)
    setShowEditModal(true)
  }

  const handleUpdateJob = async (jobId: number, jobData: Partial<Job>) => {
    setProcessingJobs(prev => new Set(prev).add(jobId))
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      })

      if (response.ok) {
        // Update job in local state
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, ...jobData } : job
        ))
        
        setShowEditModal(false)
        setEditingJob(null)
      } else {
        console.error('Failed to update job')
        alert('Failed to update job. Please try again.')
      }
    } catch (error) {
      console.error('Error updating job:', error)
      alert('Error updating job. Please try again.')
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const selectedIds = Array.from(bulkActions.selectedJobs)
    
    for (const jobId of selectedIds) {
      await handleJobAction(jobId, action)
    }
    
    setBulkActions({ selectedJobs: new Set(), showBulkActions: false })
  }

  const toggleJobSelection = (jobId: number) => {
    setBulkActions(prev => {
      const newSelected = new Set(prev.selectedJobs)
      if (newSelected.has(jobId)) {
        newSelected.delete(jobId)
      } else {
        newSelected.add(jobId)
      }
      return {
        ...prev,
        selectedJobs: newSelected,
        showBulkActions: newSelected.size > 0
      }
    })
  }

  const selectAllJobs = () => {
    const currentPageJobs = getCurrentPageJobs()
    const allSelected = currentPageJobs.every(job => bulkActions.selectedJobs.has(job.id))
    
    setBulkActions(prev => {
      const newSelected = new Set(prev.selectedJobs)
      
      if (allSelected) {
        currentPageJobs.forEach(job => newSelected.delete(job.id))
      } else {
        currentPageJobs.forEach(job => newSelected.add(job.id))
      }
      
      return {
        ...prev,
        selectedJobs: newSelected,
        showBulkActions: newSelected.size > 0
      }
    })
  }

  const getCurrentPageJobs = () => {
    const startIndex = (currentPage - 1) * jobsPerPage
    const endIndex = startIndex + jobsPerPage
    return filteredJobs.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage)
  const currentPageJobs = getCurrentPageJobs()

  const getStatusBadge = (job: Job) => {
    if (job.status === 'pending_approval' || !job.approved_by_admin) {
      return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Pending</Badge>
    } else if (job.approved_by_admin && job.status === 'active') {
      return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Approved</Badge>
    } else if (job.status === 'inactive') {
      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Rejected</Badge>
    }
    return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">{job.status}</Badge>
  }

  const getCreatedByBadge = (createdByType: string) => {
    const colors = {
      company: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      scraper: 'bg-green-500/20 text-green-300 border-green-500/30'
    }
    return <Badge className={colors[createdByType as keyof typeof colors] || colors.scraper}>{createdByType}</Badge>
  }

  const getJobSourceBadge = (jobSource?: string, createdBy?: string) => {
    if (!jobSource) return null;
    
    const colors = {
      scraped: 'bg-green-500/20 text-green-300 border-green-500/30',
      manual: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
    
    const displayText = jobSource === 'scraped' && createdBy 
      ? `Scraped from ${createdBy}` 
      : jobSource.charAt(0).toUpperCase() + jobSource.slice(1);
    
    return (
      <Badge className={colors[jobSource as keyof typeof colors] || colors.manual}>
        {displayText}
      </Badge>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              Job Approvals
            </h1>
            <p className="mt-2 text-gray-400">
              Review and approve job postings to maintain platform quality.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={fetchJobs}
              disabled={loadingJobs}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              {loadingJobs ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin/companies'}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Manage Companies
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-300">Total Jobs</p>
                  <p className="text-2xl font-bold text-white">{statistics.total}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-300">Pending Review</p>
                  <p className="text-2xl font-bold text-white">{statistics.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-300">Approved</p>
                  <p className="text-2xl font-bold text-white">{statistics.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500/20 to-rose-600/20 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-300">Rejected</p>
                  <p className="text-2xl font-bold text-white">{statistics.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search jobs by title, company, or description..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={filters.created_by_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, created_by_type: e.target.value }))}
                  className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                  <option value="scraper">Scraper</option>
                </select>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
                  }}
                  className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="company-asc">Company A-Z</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {bulkActions.showBulkActions && (
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">
                    {bulkActions.selectedJobs.size} job(s) selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleBulkAction('approve')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve Selected
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    onClick={() => handleBulkAction('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject Selected
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setBulkActions({ selectedJobs: new Set(), showBulkActions: false })}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {filters.status === 'pending' ? 'Pending Jobs' : 
               filters.status === 'approved' ? 'Approved Jobs' : 
               filters.status === 'rejected' ? 'Rejected Jobs' : 
               'All Jobs'} ({filteredJobs.length})
            </CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={selectAllJobs}
              className="bg-gray-700 border-gray-600 hover:bg-gray-600"
            >
              {currentPageJobs.every(job => bulkActions.selectedJobs.has(job.id)) ? 'Deselect All' : 'Select All'}
            </Button>
          </CardHeader>
          <CardContent>
            {loadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-300">Loading jobs...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {jobs.length === 0 ? 'No Jobs Found' : 'No jobs match your filters'}
                </h3>
                <p className="text-gray-400 mb-6">
                  {jobs.length === 0 
                    ? 'There are no job postings to review at the moment.' 
                    : 'Try adjusting your search criteria or filters.'
                  }
                </p>
                {jobs.length === 0 && (
                  <Button 
                    onClick={fetchJobs}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Jobs
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentPageJobs.map((job) => (
                  <Card key={job.id} className="bg-gray-700/50 border-gray-600 hover:bg-gray-700 transition-all duration-200 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={bulkActions.selectedJobs.has(job.id)}
                          onChange={() => toggleJobSelection(job.id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-400 rounded bg-gray-800"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {job.title}
                            </h3>
                            {getStatusBadge(job)}
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-3">
                            <Building2 className="h-4 w-4 inline mr-1" />
                            {job.company}
                          </p>
                          
                          <div className="flex items-center gap-2 mb-3">
                            {getCreatedByBadge(job.created_by_type)}
                            {getJobSourceBadge(job.job_source, job.created_by)}
                            <Badge className="text-xs bg-gray-600/50 text-gray-300 border-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            {job.location && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <MapPin className="h-4 w-4 text-red-400" />
                                <span className="truncate">{job.location}</span>
                              </div>
                            )}
                            {job.salary_min && job.salary_max && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <DollarSign className="h-4 w-4 text-green-400" />
                                <span>
                                  {job.salary_max === 'Negotiable' 
                                    ? 'Negotiable' 
                                    : `${job.salary_min}-${job.salary_max}`
                                  }
                                </span>
                              </div>
                            )}
                            {job.view_count !== undefined && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Eye className="h-4 w-4 text-blue-400" />
                                <span>{job.view_count} views</span>
                              </div>
                            )}
                            {job.job_type && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Briefcase className="h-4 w-4 text-purple-400" />
                                <span>{job.job_type}</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                            {job.description}
                          </p>
                          
                          {job.admin_notes && (
                            <div className="p-3 bg-gray-600/50 rounded-lg mb-4">
                              <p className="text-xs text-gray-300">
                                <FileText className="h-3 w-3 inline mr-1" />
                                <span className="font-medium">Admin Notes:</span> {job.admin_notes}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedJob(job)
                                setShowJobDetails(true)
                              }}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            
                            <div className="flex items-center gap-2">
                              {/* Edit and Delete buttons - available for all jobs */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditJob(job)}
                                disabled={processingJobs.has(job.id)}
                                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                              >
                                {processingJobs.has(job.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteJob(job.id)}
                                disabled={processingJobs.has(job.id)}
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              >
                                {processingJobs.has(job.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>

                              {/* Approval buttons - only for pending jobs */}
                              {(job.status === 'pending_approval' || !job.approved_by_admin) && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleJobAction(job.id, 'approve')}
                                    disabled={processingJobs.has(job.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {processingJobs.has(job.id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleJobAction(job.id, 'reject')}
                                    disabled={processingJobs.has(job.id)}
                                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                  >
                                    {processingJobs.has(job.id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loadingJobs && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * jobsPerPage) + 1} to {Math.min(currentPage * jobsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
                      if (pageNum > totalPages) return null
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 p-0 ${currentPage === pageNum 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Details Modal */}
        {showJobDetails && selectedJob && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-gray-600">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                      {selectedJob.company.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-white">{selectedJob.title}</CardTitle>
                    <p className="text-sm text-gray-400">{selectedJob.company}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowJobDetails(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center gap-3 mb-4">
                  {getStatusBadge(selectedJob)}
                  {getCreatedByBadge(selectedJob.created_by_type)}
                  {getJobSourceBadge(selectedJob.job_source, selectedJob.created_by)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedJob.location && (
                    <div>
                      <Label className="text-gray-300 font-medium">Location</Label>
                      <p className="text-white mt-1">{selectedJob.location}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-300 font-medium">Posted Date</Label>
                    <p className="text-white mt-1">
                      {new Date(selectedJob.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-300 font-medium">Created By</Label>
                    <p className="text-white mt-1 capitalize">{selectedJob.created_by_type}</p>
                  </div>
                  {selectedJob.job_type && (
                    <div>
                      <Label className="text-gray-300 font-medium">Job Type</Label>
                      <p className="text-white mt-1">{selectedJob.job_type}</p>
                    </div>
                  )}
                  {selectedJob.salary_min && selectedJob.salary_max && (
                    <div>
                      <Label className="text-gray-300 font-medium">Salary Range</Label>
                      <p className="text-white mt-1">
                        {selectedJob.salary_max === 'Negotiable' 
                          ? 'Negotiable' 
                          : `${selectedJob.salary_min} - ${selectedJob.salary_max}`
                        }
                      </p>
                    </div>
                  )}
                  {selectedJob.view_count !== undefined && (
                    <div>
                      <Label className="text-gray-300 font-medium">Views</Label>
                      <p className="text-white mt-1">{selectedJob.view_count}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-gray-300 font-medium">Job Description</Label>
                  <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                    <p className="text-white leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                  </div>
                </div>
                
                {selectedJob.admin_notes && (
                  <div>
                    <Label className="text-gray-300 font-medium">Admin Notes</Label>
                    <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                      <p className="text-white">{selectedJob.admin_notes}</p>
                    </div>
                  </div>
                )}
                
                {(selectedJob.status === 'pending_approval' || !selectedJob.approved_by_admin) && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      Review this job posting carefully before making a decision.
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => {
                          handleJobAction(selectedJob.id, 'approve')
                          setShowJobDetails(false)
                        }}
                        disabled={processingJobs.has(selectedJob.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingJobs.has(selectedJob.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve Job
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleJobAction(selectedJob.id, 'reject')
                          setShowJobDetails(false)
                        }}
                        disabled={processingJobs.has(selectedJob.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        {processingJobs.has(selectedJob.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject Job
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Job Modal */}
        {showEditModal && editingJob && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
                <CardTitle className="text-white">Edit Job: {editingJob.title}</CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingJob(null)
                  }}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const jobData = {
                    title: formData.get('title') as string,
                    company: formData.get('company') as string,
                    location: formData.get('location') as string,
                    description: formData.get('description') as string,
                    salary_min: formData.get('salary_min') ? Number(formData.get('salary_min')) : undefined,
                    salary_max: (() => {
                      const maxSalary = formData.get('salary_max') as string
                      if (!maxSalary || maxSalary.toLowerCase() === 'negotiable') {
                        return 'Negotiable'
                      }
                      return isNaN(Number(maxSalary)) ? 'Negotiable' : maxSalary
                    })(),
                    job_type: formData.get('job_type') as string,
                    work_mode: formData.get('work_mode') as string,
                    category: formData.get('category') as string,
                  }
                  handleUpdateJob(editingJob.id, jobData)
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Job Title</Label>
                      <Input 
                        name="title"
                        defaultValue={editingJob.title}
                        className="bg-gray-700 border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Company</Label>
                      <Input 
                        name="company"
                        defaultValue={editingJob.company}
                        className="bg-gray-700 border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Location</Label>
                      <Input 
                        name="location"
                        defaultValue={editingJob.location || ''}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Job Type</Label>
                      <Input 
                        name="job_type"
                        defaultValue={editingJob.job_type || ''}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Full-time, Part-time, Contract"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Work Mode</Label>
                      <Input 
                        name="work_mode"
                        defaultValue={editingJob.work_mode || ''}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Remote, On-site, Hybrid"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Category</Label>
                      <Input 
                        name="category"
                        defaultValue={editingJob.category || ''}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Technology, Marketing, etc."
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Min Salary</Label>
                      <Input 
                        name="salary_min"
                        type="number"
                        defaultValue={editingJob.salary_min || ''}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Max Salary</Label>
                      <Input 
                        name="salary_max"
                        defaultValue={editingJob.salary_max === 'Negotiable' ? '' : editingJob.salary_max || ''}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="80000 or leave empty for negotiable"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Leave empty to set as &quot;Negotiable&quot;, or enter &quot;Negotiable&quot; directly
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label className="text-gray-300">Job Description</Label>
                    <textarea 
                      name="description"
                      defaultValue={editingJob.description}
                      className="w-full mt-1 p-3 bg-gray-700 border border-gray-600 rounded-md text-white resize-none"
                      rows={6}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditModal(false)
                        setEditingJob(null)
                      }}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={processingJobs.has(editingJob.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {processingJobs.has(editingJob.id) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Job
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
