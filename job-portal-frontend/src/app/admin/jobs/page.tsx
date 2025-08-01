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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2,
  Shield,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight
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
  salary_max?: number;
  job_type?: string;
  work_mode?: string;
  category?: string;
  view_count?: number;
  application_count?: number;
  admin_notes?: string;
}

interface Company {
  id: number;
  user_id: number;
  company_name: string;
  company_description?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  logo_url?: string;
  created_at: string;
  email: string;
  user_created_at: string;
}

interface JobFilters {
  status: string;
  created_by_type: string;
  category: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function AdminJobsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [pendingCompanies, setPendingCompanies] = useState<Company[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  const [processingJobs, setProcessingJobs] = useState<Set<number>>(new Set())
  const [processingCompanies, setProcessingCompanies] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [jobsPerPage] = useState(10)
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  const [filters, setFilters] = useState<JobFilters>({
    status: 'all',
    created_by_type: 'all',
    category: 'all',
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

  // Fetch jobs data
  useEffect(() => {
    const fetchJobs = async () => {
      if (!tokens.access_token || user?.user_type !== 'admin') return
      
      setLoadingJobs(true)
      try {
        // Fetch all jobs for admin
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
            pending: data.jobs?.filter((job: Job) => job.status === 'pending_approval' || !job.approved_by_admin).length || 0,
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
    }

    if (mounted && tokens.access_token && user?.user_type === 'admin') {
      fetchJobs()
    }
  }, [mounted, tokens.access_token, user])

  // Fetch pending companies
  const fetchPendingCompanies = useCallback(async () => {
    if (!tokens.access_token || user?.user_type !== 'admin') return
    
    setLoadingCompanies(true)
    try {
      const response = await fetch('/api/companies/pending', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPendingCompanies(data.companies || [])
      } else {
        console.error('Failed to fetch pending companies')
      }
    } catch (error) {
      console.error('Error fetching pending companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }, [tokens.access_token, user])

  // Handle company approval/rejection
  const handleCompanyAction = async (companyId: number, action: 'approve' | 'reject') => {
    setProcessingCompanies(prev => new Set(prev).add(companyId))
    
    try {
      const response = await fetch(`/api/companies/${companyId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })
      
      if (response.ok) {
        // Remove the company from the list after successful action
        setPendingCompanies(prev => prev.filter(company => company.id !== companyId))
      } else {
        console.error(`Failed to ${action} company`)
      }
    } catch (error) {
      console.error(`Error ${action}ing company:`, error)
    } finally {
      setProcessingCompanies(prev => {
        const newSet = new Set(prev)
        newSet.delete(companyId)
        return newSet
      })
    }
  }

  // Load pending companies when component mounts
  useEffect(() => {
    if (mounted && tokens.access_token && user?.user_type === 'admin') {
      fetchPendingCompanies()
    }
  }, [mounted, tokens.access_token, user?.user_type, fetchPendingCompanies])

  // Filter and sort jobs
  useEffect(() => {
    let filtered = [...jobs]

    // Apply filters
    if (filters.status !== 'all') {
      if (filters.status === 'pending') {
        filtered = filtered.filter(job => job.status === 'pending_approval' || !job.approved_by_admin)
      } else if (filters.status === 'approved') {
        filtered = filtered.filter(job => job.approved_by_admin && job.status === 'active')
      } else if (filters.status === 'rejected') {
        filtered = filtered.filter(job => job.status === 'inactive')
      }
    }

    if (filters.created_by_type !== 'all') {
      filtered = filtered.filter(job => job.created_by_type === filters.created_by_type)
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(job => job.category === filters.category)
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
    setCurrentPage(1) // Reset to first page when filters change
  }, [jobs, filters])

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300">Loading admin jobs...</span>
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
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Access Denied</h1>
            <p className="text-gray-300 mb-6">This page is only available for administrators.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleJobAction = async (jobId: number, action: 'approve' | 'reject', notes: string = '') => {
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

      if (response.ok) {
        // Update job in local state
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                approved_by_admin: action === 'approve',
                status: action === 'approve' ? 'active' : 'inactive',
                admin_notes: notes 
              }
            : job
        ))
        
        // Update statistics
        setStatistics(prev => ({
          ...prev,
          pending: prev.pending - 1,
          [action === 'approve' ? 'approved' : 'rejected']: prev[action === 'approve' ? 'approved' : 'rejected'] + 1
        }))
      } else {
        console.error(`Failed to ${action} job`)
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error)
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
        // Deselect all on current page
        currentPageJobs.forEach(job => newSelected.delete(job.id))
      } else {
        // Select all on current page
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
      return <Badge className="bg-orange-600/20 text-orange-300 border-orange-600/30">Pending</Badge>
    } else if (job.approved_by_admin && job.status === 'active') {
      return <Badge className="bg-green-600/20 text-green-300 border-green-600/30">Approved</Badge>
    } else if (job.status === 'inactive') {
      return <Badge className="bg-red-600/20 text-red-300 border-red-600/30">Rejected</Badge>
    }
    return <Badge className="bg-gray-600/20 text-gray-300 border-gray-600/30">{job.status}</Badge>
  }

  const getCreatedByBadge = (createdByType: string) => {
    const colors = {
      company: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
      admin: 'bg-purple-600/20 text-purple-300 border-purple-600/30',
      scraper: 'bg-green-600/20 text-green-300 border-green-600/30'
    }
    return <Badge className={colors[createdByType as keyof typeof colors] || colors.scraper}>{createdByType}</Badge>
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Job Management 📋
            </h1>
            <p className="mt-2 text-gray-400">
              Review, approve, and manage all job postings on the platform.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/post-job'}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Post Job
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Jobs</p>
                  <p className="text-2xl font-bold text-white">{statistics.total}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Pending Approval</p>
                  <p className="text-2xl font-bold text-white">{statistics.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-white">{statistics.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Rejected</p>
                  <p className="text-2xl font-bold text-white">{statistics.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label className="text-gray-300">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-gray-300">Created By</Label>
                <Select value={filters.created_by_type} onValueChange={(value) => setFilters(prev => ({ ...prev, created_by_type: value }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="scraper">Scraper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-gray-300">Sort By</Label>
                <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-')
                  setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
                }}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title A-Z</SelectItem>
                    <SelectItem value="title-desc">Title Z-A</SelectItem>
                    <SelectItem value="company-asc">Company A-Z</SelectItem>
                    <SelectItem value="view_count-desc">Most Viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {bulkActions.showBulkActions && (
          <Card className="bg-blue-600/10 border-blue-600/30">
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
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="jobs" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Briefcase className="h-4 w-4 mr-2" />
              Jobs ({filteredJobs.length})
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Shield className="h-4 w-4 mr-2" />
              Company Approvals
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Eye className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6 mt-6">
            {/* Jobs content will go here */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">
                  Jobs ({filteredJobs.length})
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={selectAllJobs}
                  >
                    {currentPageJobs.every(job => bulkActions.selectedJobs.has(job.id)) ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-300">Loading jobs...</span>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">No jobs found</h3>
                    <p className="text-gray-400">Try adjusting your filters or search criteria.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {currentPageJobs.map((job) => (
                        <div key={job.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="flex items-start space-x-4">
                            <input
                              type="checkbox"
                              checked={bulkActions.selectedJobs.has(job.id)}
                              onChange={() => toggleJobSelection(job.id)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                                {getStatusBadge(job)}
                                {getCreatedByBadge(job.created_by_type)}
                              </div>
                              
                              <p className="text-gray-300 mb-2 font-medium">{job.company}</p>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                                {job.location && (
                                  <span className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {job.location}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(job.created_at).toLocaleDateString()}
                                </span>
                                {job.salary_min && job.salary_max && (
                                  <span className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    {job.salary_min}-{job.salary_max}
                                  </span>
                                )}
                                {job.view_count !== undefined && (
                                  <span className="flex items-center">
                                    <Eye className="h-4 w-4 mr-1" />
                                    {job.view_count} views
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                {job.description}
                              </p>
                              
                              {job.admin_notes && (
                                <div className="p-2 bg-gray-600 rounded text-sm">
                                  <span className="text-gray-300 font-medium">Admin Notes: </span>
                                  <span className="text-gray-400">{job.admin_notes}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedJob(job)
                                  setShowJobDetails(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {(job.status === 'pending_approval' || !job.approved_by_admin) && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleJobAction(job.id, 'approve')}
                                    disabled={processingJobs.has(job.id)}
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
                                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                    onClick={() => handleJobAction(job.id, 'reject')}
                                    disabled={processingJobs.has(job.id)}
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
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-400">
                          Showing {((currentPage - 1) * jobsPerPage) + 1} to {Math.min(currentPage * jobsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = i + 1
                              return (
                                <Button
                                  key={pageNum}
                                  size="sm"
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-8 h-8 p-0"
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
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">
                  Company Approval Management ({pendingCompanies.length} pending)
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={fetchPendingCompanies}
                  disabled={loadingCompanies}
                >
                  {loadingCompanies ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loadingCompanies ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-300">Loading companies...</span>
                  </div>
                ) : pendingCompanies.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">No Pending Companies</h3>
                    <p className="text-gray-400">All company registrations have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingCompanies.map((company) => (
                      <div key={company.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-white">{company.company_name}</h3>
                              <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                                Pending Approval
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label className="text-gray-300">Industry</Label>
                                <p className="text-white">{company.industry || 'Not specified'}</p>
                              </div>
                              <div>
                                <Label className="text-gray-300">Company Size</Label>
                                <p className="text-white">{company.company_size || 'Not specified'}</p>
                              </div>
                              <div>
                                <Label className="text-gray-300">Location</Label>
                                <p className="text-white">{company.location || 'Not specified'}</p>
                              </div>
                              <div>
                                <Label className="text-gray-300">Registration Date</Label>
                                <p className="text-white">
                                  {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'Unknown'}
                                </p>
                              </div>
                            </div>

                            {company.company_description && (
                              <div className="mb-4">
                                <Label className="text-gray-300">Description</Label>
                                <div className="mt-2 p-3 bg-gray-600 rounded">
                                  <p className="text-white text-sm">{company.company_description}</p>
                                </div>
                              </div>
                            )}

                            {company.website && (
                              <div className="mb-4">
                                <Label className="text-gray-300">Website</Label>
                                <a 
                                  href={company.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 underline"
                                >
                                  {company.website}
                                </a>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleCompanyAction(company.id, 'approve')}
                              disabled={processingCompanies.has(company.id)}
                            >
                              {processingCompanies.has(company.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Approve
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              onClick={() => handleCompanyAction(company.id, 'reject')}
                              disabled={processingCompanies.has(company.id)}
                            >
                              {processingCompanies.has(company.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-white">Analytics Dashboard</h3>
                  <p className="text-gray-400">Detailed analytics and insights for job and company management.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Job Details Modal */}
        {showJobDetails && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Job Details</CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowJobDetails(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <h2 className="text-2xl font-bold text-white">{selectedJob.title}</h2>
                    {getStatusBadge(selectedJob)}
                    {getCreatedByBadge(selectedJob.created_by_type)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label className="text-gray-300">Company</Label>
                      <p className="text-white">{selectedJob.company}</p>
                    </div>
                    {selectedJob.location && (
                      <div>
                        <Label className="text-gray-300">Location</Label>
                        <p className="text-white">{selectedJob.location}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-300">Created Date</Label>
                      <p className="text-white">{new Date(selectedJob.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Created By</Label>
                      <p className="text-white capitalize">{selectedJob.created_by_type}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <Label className="text-gray-300">Description</Label>
                    <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                      <p className="text-white whitespace-pre-wrap">{selectedJob.description}</p>
                    </div>
                  </div>
                  
                  {selectedJob.admin_notes && (
                    <div className="mb-6">
                      <Label className="text-gray-300">Admin Notes</Label>
                      <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                        <p className="text-white">{selectedJob.admin_notes}</p>
                      </div>
                    </div>
                  )}
                  
                  {(selectedJob.status === 'pending_approval' || !selectedJob.approved_by_admin) && (
                    <div className="flex items-center space-x-4">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          handleJobAction(selectedJob.id, 'approve')
                          setShowJobDetails(false)
                        }}
                        disabled={processingJobs.has(selectedJob.id)}
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
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        onClick={() => {
                          handleJobAction(selectedJob.id, 'reject')
                          setShowJobDetails(false)
                        }}
                        disabled={processingJobs.has(selectedJob.id)}
                      >
                        {processingJobs.has(selectedJob.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject Job
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
