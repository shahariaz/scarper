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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2,
  Shield,
  Briefcase,
  Search,
  RefreshCw,
  MapPin,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Building2,
  ExternalLink,
  Filter,
  Download,
  Star,
  TrendingUp,
  Globe,
  Plus,
  Clock
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Company {
  id: number;
  user_id: number;
  email: string;
  company_name: string;
  industry?: string;
  company_size?: string;
  location?: string;
  website?: string;
  bio?: string;
  description?: string;
  avatar_url?: string;
  logo_url?: string;
  is_approved: boolean;
  is_active: boolean;
  is_suspended: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  job_count?: number;
  application_count?: number;
  rating?: number;
  phone?: string;
  linkedin?: string;
  twitter?: string;
  profile_completion?: number;
  suspended_until?: string;
  suspension_reason?: string;
}

interface CompanyFilters {
  search: string;
  industry: string;
  company_size: string;
  location: string;
  status: string;
  approval: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface PaginationInfo {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface EditFormData {
  company_name: string;
  email: string;
  industry: string;
  company_size: string;
  location: string;
  website: string;
  bio: string;
  phone: string;
  is_verified: boolean;
}

interface SuspensionData {
  duration: string;
  reason: string;
}

export default function AdminCompaniesPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, tokens, isLoading } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [companiesPerPage] = useState(20)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  const [showEditCompany, setShowEditCompany] = useState(false)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Company | null>(null)
  const [showSuspendDialog, setShowSuspendDialog] = useState<Company | null>(null)
  const [showApprovalConfirm, setShowApprovalConfirm] = useState<Company | null>(null)
  const [suspensionData, setSuspensionData] = useState<SuspensionData>({ duration: '7', reason: '' })
  const [editFormData, setEditFormData] = useState<EditFormData>({
    company_name: '',
    email: '',
    industry: '',
    company_size: '',
    location: '',
    website: '',
    bio: '',
    phone: '',
    is_verified: false
  })

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  
  const [filters, setFilters] = useState<CompanyFilters>({
    search: '',
    industry: 'all',
    company_size: 'all',
    location: 'all',
    status: 'all',
    approval: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const [statistics, setStatistics] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    suspended: 0,
    active: 0,
    verified: 0,
    totalJobs: 0,
    totalApplications: 0
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user profile if needed
  useEffect(() => {
    if (tokens.access_token && !user) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user])

  // Redirect if not admin
  useEffect(() => {
    if (mounted && user && user.user_type !== 'admin') {
      window.location.href = '/dashboard'
    }
  }, [mounted, user])

  // Fetch companies data
  const fetchCompanies = useCallback(async () => {
    if (!tokens.access_token) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: companiesPerPage.toString(),
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.industry !== 'all') params.append('industry', filters.industry)
      if (filters.company_size !== 'all') params.append('company_size', filters.company_size)
      if (filters.location !== 'all') params.append('location', filters.location)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.approval !== 'all') params.append('approval', filters.approval)

      const response = await fetch(`/api/admin/companies?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setCompanies(data.companies)
        setPagination(data.pagination)
        setStatistics(data.statistics || statistics)
      } else {
        throw new Error(data.message || 'Failed to fetch companies')
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      // Fallback with empty data
      setCompanies([])
      setPagination({
        page: 1,
        per_page: 20,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, companiesPerPage, filters, tokens.access_token, statistics])

  useEffect(() => {
    if (mounted && tokens.access_token && user?.user_type === 'admin') {
      fetchCompanies()
    }
  }, [mounted, fetchCompanies, tokens.access_token, user])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (mounted) {
      setCurrentPage(1)
    }
  }, [filters, mounted])

  const handleCompanyAction = async (companyId: number, action: string, data?: Record<string, unknown>) => {
    if (!tokens.access_token) return
    
    setActionLoading(`${action}-${companyId}`)
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data || {})
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Refresh companies list
        fetchCompanies()
        // Close modals
        setShowDeleteConfirm(null)
        setShowSuspendDialog(null)
        setShowApprovalConfirm(null)
        setShowEditCompany(false)
        setShowCompanyDetails(false)
        // Refresh admin counts
        window.dispatchEvent(new CustomEvent('refreshAdminCounts'))
      } else {
        throw new Error(result.message || `Failed to ${action} company`)
      }
    } catch (error) {
      console.error(`Error ${action} company:`, error)
      // You might want to show a toast notification here
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateCompany = async () => {
    if (!tokens.access_token) return
    
    setActionLoading('create')
    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        fetchCompanies()
        setShowCreateCompany(false)
        setEditFormData({
          company_name: '',
          email: '',
          industry: '',
          company_size: '',
          location: '',
          website: '',
          bio: '',
          phone: '',
          is_verified: false
        })
      } else {
        throw new Error(result.message || 'Failed to create company')
      }
    } catch (error) {
      console.error('Error creating company:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateCompany = async () => {
    if (!selectedCompany || !tokens.access_token) return
    
    setActionLoading('update')
    try {
      const response = await fetch(`/api/admin/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        fetchCompanies()
        setShowEditCompany(false)
        setSelectedCompany(null)
      } else {
        throw new Error(result.message || 'Failed to update company')
      }
    } catch (error) {
      console.error('Error updating company:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspendCompany = async () => {
    if (!showSuspendDialog || !tokens.access_token) return
    
    const data = {
      duration: suspensionData.duration,
      reason: suspensionData.reason
    }
    
    await handleCompanyAction(showSuspendDialog.id, 'suspend', data)
    setSuspensionData({ duration: '7', reason: '' })
  }

  const getCompanyInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
  }

  const getStatusBadge = (company: Company) => {
    if (company.is_suspended) {
      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Suspended</Badge>
    }
    if (!company.is_active) {
      return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Inactive</Badge>
    }
    return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
  }

  const getApprovalBadge = (company: Company) => {
    if (!company.is_approved) {
      return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Pending</Badge>
    }
    return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Approved</Badge>
  }

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company)
    setEditFormData({
      company_name: company.company_name,
      email: company.email,
      industry: company.industry || '',
      company_size: company.company_size || '',
      location: company.location || '',
      website: company.website || '',
      bio: company.bio || company.description || '',
      phone: company.phone || '',
      is_verified: company.is_verified
    })
    setShowEditCompany(true)
  }

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user || user.user_type !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">Access Denied</h3>
            <p className="text-gray-400">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="h-8 w-8 text-yellow-400" />
              Company Management
            </h1>
            <p className="text-gray-400 mt-2">
              Manage all companies, approvals, and business profiles
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => fetchCompanies()}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => {
                setEditFormData({
                  company_name: '',
                  email: '',
                  industry: '',
                  company_size: '',
                  location: '',
                  website: '',
                  bio: '',
                  phone: '',
                  is_verified: false
                })
                setShowCreateCompany(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total</p>
                  <p className="text-3xl font-bold text-white">{statistics.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Approved</p>
                  <p className="text-3xl font-bold text-green-400">{statistics.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Pending</p>
                  <p className="text-3xl font-bold text-orange-400">{statistics.pending}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Suspended</p>
                  <p className="text-3xl font-bold text-red-400">{statistics.suspended}</p>
                </div>
                <Ban className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active</p>
                  <p className="text-3xl font-bold text-blue-400">{statistics.active}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Verified</p>
                  <p className="text-3xl font-bold text-yellow-400">{statistics.verified}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Jobs</p>
                  <p className="text-3xl font-bold text-purple-400">{statistics.totalJobs}</p>
                </div>
                <Briefcase className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Applications</p>
                  <p className="text-3xl font-bold text-cyan-400">{statistics.totalApplications}</p>
                </div>
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search companies by name, email, or industry..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filters.industry}
                    onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-1 text-sm"
                  >
                    <option value="all">All Industries</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Manufacturing">Manufacturing</option>
                  </select>
                </div>
                
                <select
                  value={filters.company_size}
                  onChange={(e) => setFilters(prev => ({ ...prev, company_size: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Sizes</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="10-50">10-50 employees</option>
                  <option value="50-200">50-200 employees</option>
                  <option value="200-500">200-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                
                <select
                  value={filters.approval}
                  onChange={(e) => setFilters(prev => ({ ...prev, approval: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Approval</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
                
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }))
                  }}
                  className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-1 text-sm"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="company_name-asc">Name A-Z</option>
                  <option value="company_name-desc">Name Z-A</option>
                  <option value="job_count-desc">Most Jobs</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Companies ({pagination.total})</span>
              <Badge className="bg-yellow-500/20 text-yellow-300">
                Page {currentPage} of {pagination.total_pages}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
                <span className="ml-3 text-gray-300">Loading companies...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">No Companies Found</h3>
                <p className="text-gray-400">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={company.avatar_url || company.logo_url} alt={company.company_name} />
                        <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-semibold">
                          {getCompanyInitials(company.company_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {company.company_name}
                          </h3>
                          {getStatusBadge(company)}
                          {getApprovalBadge(company)}
                          {company.is_verified && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              <Star className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {company.email}
                          </span>
                          {company.industry && (
                            <span className="flex items-center">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {company.industry}
                            </span>
                          )}
                          {company.location && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {company.location}
                            </span>
                          )}
                          {company.company_size && (
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {company.company_size}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(company.created_at).toLocaleDateString()}
                          </span>
                          {company.job_count !== undefined && (
                            <span className="flex items-center">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {company.job_count} jobs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCompany(company)
                          setShowCompanyDetails(true)
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(company)}
                        className="border-blue-600 text-blue-300 hover:bg-blue-600/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {!company.is_approved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowApprovalConfirm(company)}
                          disabled={actionLoading === `approve-${company.id}`}
                          className="border-green-600 text-green-300 hover:bg-green-600/20"
                        >
                          {actionLoading === `approve-${company.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSuspendDialog(company)}
                        disabled={actionLoading === `suspend-${company.id}` || actionLoading === `activate-${company.id}`}
                        className={company.is_suspended 
                          ? "border-green-600 text-green-300 hover:bg-green-600/20" 
                          : "border-orange-600 text-orange-300 hover:bg-orange-600/20"
                        }
                      >
                        {actionLoading === `suspend-${company.id}` || actionLoading === `activate-${company.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : company.is_suspended ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(company)}
                        disabled={actionLoading === `delete-${company.id}`}
                        className="border-red-600 text-red-300 hover:bg-red-600/20"
                      >
                        {actionLoading === `delete-${company.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * companiesPerPage) + 1} to {Math.min(currentPage * companiesPerPage, pagination.total)} of {pagination.total} companies
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.has_prev}
                className="border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(currentPage - 2 + i, pagination.total_pages - 4 + i))
                  if (pageNum > pagination.total_pages) return null
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' 
                        : 'border-gray-600 text-gray-300 hover:bg-gray-600'
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
                disabled={!pagination.has_next}
                className="border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Company</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to delete &quot;{showDeleteConfirm?.company_name}&quot;? This action cannot be undone and will also delete all associated jobs and applications.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteConfirm && handleCompanyAction(showDeleteConfirm.id, 'delete')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Suspend/Activate Dialog */}
        <Dialog open={!!showSuspendDialog} onOpenChange={() => setShowSuspendDialog(null)}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {showSuspendDialog?.is_suspended ? 'Activate' : 'Suspend'} Company
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                {showSuspendDialog?.is_suspended 
                  ? `Activate "${showSuspendDialog?.company_name}" to restore their access.`
                  : `Suspend "${showSuspendDialog?.company_name}" to restrict their access.`
                }
              </DialogDescription>
            </DialogHeader>
            
            {showSuspendDialog && !showSuspendDialog.is_suspended && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Suspension Duration (days)</Label>
                  <Select
                    value={suspensionData.duration}
                    onValueChange={(value) => setSuspensionData(prev => ({ ...prev, duration: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-gray-300">Reason for Suspension</Label>
                  <Textarea
                    value={suspensionData.reason}
                    onChange={(e) => setSuspensionData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for suspension..."
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => setShowSuspendDialog(null)} variant="outline" className="border-gray-600 text-gray-300">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (showSuspendDialog?.is_suspended) {
                    handleCompanyAction(showSuspendDialog.id, 'activate')
                  } else {
                    handleSuspendCompany()
                  }
                }}
                className={showSuspendDialog?.is_suspended 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                }
              >
                {showSuspendDialog?.is_suspended ? 'Activate' : 'Suspend'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approval Confirmation Dialog */}
        <AlertDialog open={!!showApprovalConfirm} onOpenChange={() => setShowApprovalConfirm(null)}>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Approve Company</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to approve &quot;{showApprovalConfirm?.company_name}&quot;? This will allow them to post jobs and access all company features.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showApprovalConfirm && handleCompanyAction(showApprovalConfirm.id, 'approve')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Company Details Modal */}
        <Dialog open={showCompanyDetails} onOpenChange={setShowCompanyDetails}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Company Details</DialogTitle>
            </DialogHeader>
            {selectedCompany && (
              <div className="space-y-6">
                {/* Company Header */}
                <div className="flex items-start space-x-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedCompany.avatar_url || selectedCompany.logo_url} alt={selectedCompany.company_name} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-semibold text-xl">
                      {getCompanyInitials(selectedCompany.company_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">{selectedCompany.company_name}</h3>
                      {selectedCompany.website && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(selectedCompany.website, '_blank')}
                          className="border-gray-600 text-gray-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-400 mb-3">{selectedCompany.email}</p>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(selectedCompany)}
                      {getApprovalBadge(selectedCompany)}
                      {selectedCompany.is_verified && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          <Star className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {selectedCompany.industry && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {selectedCompany.industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Basic Information</h4>
                    
                    {selectedCompany.location && (
                      <div>
                        <Label className="text-gray-400">Location</Label>
                        <p className="text-white flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {selectedCompany.location}
                        </p>
                      </div>
                    )}
                    
                    {selectedCompany.company_size && (
                      <div>
                        <Label className="text-gray-400">Company Size</Label>
                        <p className="text-white flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {selectedCompany.company_size} employees
                        </p>
                      </div>
                    )}
                    
                    {selectedCompany.phone && (
                      <div>
                        <Label className="text-gray-400">Phone</Label>
                        <p className="text-white flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {selectedCompany.phone}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Statistics</h4>
                    
                    <div>
                      <Label className="text-gray-400">Jobs Posted</Label>
                      <p className="text-white flex items-center">
                        <Briefcase className="h-4 w-4 mr-2" />
                        {selectedCompany.job_count || 0}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-gray-400">Applications Received</Label>
                      <p className="text-white flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {selectedCompany.application_count || 0}
                      </p>
                    </div>
                    
                    {selectedCompany.rating && (
                      <div>
                        <Label className="text-gray-400">Rating</Label>
                        <p className="text-white flex items-center">
                          <Star className="h-4 w-4 mr-2" />
                          {selectedCompany.rating}/5.0
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Account Info</h4>
                    
                    <div>
                      <Label className="text-gray-400">Created</Label>
                      <p className="text-white flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(selectedCompany.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {selectedCompany.last_login && (
                      <div>
                        <Label className="text-gray-400">Last Login</Label>
                        <p className="text-white">
                          {new Date(selectedCompany.last_login).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {selectedCompany.profile_completion && (
                      <div>
                        <Label className="text-gray-400">Profile Completion</Label>
                        <p className="text-white">{selectedCompany.profile_completion}%</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suspension Info */}
                {selectedCompany.is_suspended && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-red-300 mb-2">Suspension Details</h4>
                    <div className="space-y-2">
                      {selectedCompany.suspended_until && (
                        <p className="text-red-200">
                          <Clock className="h-4 w-4 inline mr-2" />
                          Suspended until: {new Date(selectedCompany.suspended_until).toLocaleDateString()}
                        </p>
                      )}
                      {selectedCompany.suspension_reason && (
                        <p className="text-red-200">
                          <AlertTriangle className="h-4 w-4 inline mr-2" />
                          Reason: {selectedCompany.suspension_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Company Description */}
                {(selectedCompany.bio || selectedCompany.description) && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">About Company</h4>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-gray-300 leading-relaxed">
                        {selectedCompany.bio || selectedCompany.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowCompanyDetails(false)} className="bg-gray-700 hover:bg-gray-600 text-white">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Company Modal */}
        <Dialog open={showEditCompany || showCreateCompany} onOpenChange={(open) => {
          if (!open) {
            setShowEditCompany(false)
            setShowCreateCompany(false)
            setSelectedCompany(null)
          }
        }}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {showCreateCompany ? 'Create New Company' : 'Edit Company'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {showCreateCompany 
                  ? 'Add a new company to the platform.' 
                  : 'Make changes to company information and settings.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Company Name *</Label>
                  <Input
                    value={editFormData.company_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-300">Email *</Label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Industry</Label>
                  <Select
                    value={editFormData.industry}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-gray-300">Company Size</Label>
                  <Select
                    value={editFormData.company_size}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, company_size: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="10-50">10-50 employees</SelectItem>
                      <SelectItem value="50-200">50-200 employees</SelectItem>
                      <SelectItem value="200-500">200-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Location</Label>
                  <Input
                    value={editFormData.location}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter location"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-300">Phone</Label>
                  <Input
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-gray-300">Website</Label>
                <Input
                  value={editFormData.website}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Company Description</Label>
                <Textarea
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter company description..."
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  checked={editFormData.is_verified}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, is_verified: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700"
                />
                <Label htmlFor="is_verified" className="text-gray-300">
                  Mark as verified company
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => {
                  setShowEditCompany(false)
                  setShowCreateCompany(false)
                  setSelectedCompany(null)
                }} 
                variant="outline" 
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={showCreateCompany ? handleCreateCompany : handleUpdateCompany}
                disabled={actionLoading === 'create' || actionLoading === 'update'}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              >
                {actionLoading === 'create' || actionLoading === 'update' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {showCreateCompany ? 'Create Company' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
