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
import { 
  Loader2,
  Shield,
  Users,
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Ban,
  UserX,
  UserCheck,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  Filter,
  Download,
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

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: 'jobseeker' | 'company' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  is_suspended: boolean;
  company_name?: string;
  phone?: string;
  location?: string;
  created_at: string;
  last_login?: string;
  profile_completion?: number;
  job_count?: number;
  application_count?: number;
  avatar_url?: string;
}

interface UserFilters {
  search: string;
  user_type: string;
  status: string;
  verification: string;
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

export default function AdminUsersPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(20)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null)
  const [showSuspendConfirm, setShowSuspendConfirm] = useState<User | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    user_type: 'all',
    status: 'all',
    verification: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    companies: 0,
    jobseekers: 0,
    admins: 0,
    verified: 0
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

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    if (!tokens.access_token) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: usersPerPage.toString(),
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.user_type !== 'all') params.append('user_type', filters.user_type)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.verification !== 'all') params.append('verification', filters.verification)

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
        setPagination(data.pagination)
        setStatistics(data.statistics || statistics)
      } else {
        throw new Error(data.message || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      // You might want to show a toast notification here
    } finally {
      setLoading(false)
    }
  }, [currentPage, usersPerPage, filters, tokens.access_token, statistics])

  useEffect(() => {
    if (mounted && tokens.access_token && user?.user_type === 'admin') {
      fetchUsers()
    }
  }, [mounted, fetchUsers, tokens.access_token, user])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (mounted) {
      setCurrentPage(1)
    }
  }, [filters, mounted])

  const handleUserAction = async (userId: number, action: string, data?: Record<string, unknown>) => {
    if (!tokens.access_token) return
    
    setActionLoading(`${action}-${userId}`)
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
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
        // Refresh users list
        fetchUsers()
        // Close modals
        setShowDeleteConfirm(null)
        setShowSuspendConfirm(null)
        setShowEditUser(false)
        setShowUserDetails(false)
        // Refresh admin counts
        window.dispatchEvent(new CustomEvent('refreshAdminCounts'))
      } else {
        throw new Error(result.message || `Failed to ${action} user`)
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error)
      // You might want to show a toast notification here
    } finally {
      setActionLoading(null)
    }
  }

  const getUserInitials = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const getStatusBadge = (user: User) => {
    if (user.is_suspended) {
      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Suspended</Badge>
    }
    if (!user.is_active) {
      return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Inactive</Badge>
    }
    return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Active</Badge>
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Shield className="h-4 w-4 text-purple-400" />
      case 'company':
        return <Briefcase className="h-4 w-4 text-blue-400" />
      case 'jobseeker':
        return <Users className="h-4 w-4 text-green-400" />
      default:
        return <Users className="h-4 w-4 text-gray-400" />
    }
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
              <Users className="h-8 w-8 text-yellow-400" />
              User Management
            </h1>
            <p className="text-gray-400 mt-2">
              Manage all users, companies, and administrators
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => fetchUsers()}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white">{statistics.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active</p>
                  <p className="text-3xl font-bold text-green-400">{statistics.active}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-400" />
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
                <UserX className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Companies</p>
                  <p className="text-3xl font-bold text-blue-400">{statistics.companies}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Job Seekers</p>
                  <p className="text-3xl font-bold text-green-400">{statistics.jobseekers}</p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Admins</p>
                  <p className="text-3xl font-bold text-purple-400">{statistics.admins}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-400" />
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
                <Shield className="h-8 w-8 text-yellow-400" />
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
                  placeholder="Search users by name, email, or company..."
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
                    value={filters.user_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, user_type: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-1 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="jobseeker">Job Seekers</option>
                    <option value="company">Companies</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                
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
                  value={filters.verification}
                  onChange={(e) => setFilters(prev => ({ ...prev, verification: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
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
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                  <option value="last_login-desc">Recent Login</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Users ({pagination.total})</span>
              <Badge className="bg-yellow-500/20 text-yellow-300">
                Page {currentPage} of {pagination.total_pages}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
                <span className="ml-3 text-gray-300">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">No Users Found</h3>
                <p className="text-gray-400">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url} alt={user.email} />
                        <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-semibold">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {user.user_type === 'company' 
                              ? (user.company_name || 'Company Account')
                              : `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
                            }
                          </h3>
                          {getUserTypeIcon(user.user_type)}
                          {getStatusBadge(user)}
                          {user.is_verified && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </span>
                          )}
                          {user.location && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {user.location}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                          {user.last_login && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Last: {new Date(user.last_login).toLocaleDateString()}
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
                          setSelectedUser(user)
                          setShowUserDetails(true)
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditUser(true)
                        }}
                        className="border-blue-600 text-blue-300 hover:bg-blue-600/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSuspendConfirm(user)}
                        disabled={actionLoading === `suspend-${user.id}` || actionLoading === `activate-${user.id}`}
                        className={user.is_suspended 
                          ? "border-green-600 text-green-300 hover:bg-green-600/20" 
                          : "border-orange-600 text-orange-300 hover:bg-orange-600/20"
                        }
                      >
                        {actionLoading === `suspend-${user.id}` || actionLoading === `activate-${user.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.is_suspended ? (
                          <UserCheck className="h-4 w-4" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(user)}
                        disabled={actionLoading === `delete-${user.id}`}
                        className="border-red-600 text-red-300 hover:bg-red-600/20"
                      >
                        {actionLoading === `delete-${user.id}` ? (
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
              Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, pagination.total)} of {pagination.total} users
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
              <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to delete &quot;{showDeleteConfirm?.email}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteConfirm && handleUserAction(showDeleteConfirm.id, 'delete')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Suspend/Activate Confirmation Dialog */}
        <AlertDialog open={!!showSuspendConfirm} onOpenChange={() => setShowSuspendConfirm(null)}>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                {showSuspendConfirm?.is_suspended ? 'Activate' : 'Suspend'} User
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to {showSuspendConfirm?.is_suspended ? 'activate' : 'suspend'} &quot;{showSuspendConfirm?.email}&quot;?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showSuspendConfirm && handleUserAction(
                  showSuspendConfirm.id, 
                  showSuspendConfirm.is_suspended ? 'activate' : 'suspend'
                )}
                className={showSuspendConfirm?.is_suspended 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                }
              >
                {showSuspendConfirm?.is_suspended ? 'Activate' : 'Suspend'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* User Details Modal - You can expand this as needed */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.email} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-semibold text-lg">
                      {getUserInitials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {selectedUser.user_type === 'company' 
                        ? (selectedUser.company_name || 'Company Account')
                        : `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email
                      }
                    </h3>
                    <p className="text-gray-400">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {getStatusBadge(selectedUser)}
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 capitalize">
                        {selectedUser.user_type}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                  <div>
                    <Label className="text-gray-400">Created</Label>
                    <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  {selectedUser.last_login && (
                    <div>
                      <Label className="text-gray-400">Last Login</Label>
                      <p className="text-white">{new Date(selectedUser.last_login).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div>
                      <Label className="text-gray-400">Phone</Label>
                      <p className="text-white">{selectedUser.phone}</p>
                    </div>
                  )}
                  {selectedUser.location && (
                    <div>
                      <Label className="text-gray-400">Location</Label>
                      <p className="text-white">{selectedUser.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowUserDetails(false)} className="bg-gray-700 hover:bg-gray-600 text-white">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal - You can expand this as needed */}
        <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Edit User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Make changes to user account settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-300">Edit functionality will be implemented here.</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowEditUser(false)} variant="outline" className="border-gray-600 text-gray-300">
                Cancel
              </Button>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
