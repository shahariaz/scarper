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
  Plus,
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
  user_type: 'jobseeker' | 'company' | 'admin' | 'manager';
  is_active: boolean;
  is_verified: boolean;
  is_suspended: boolean;
  is_banned: boolean;
  company_name?: string;
  phone?: string;
  location?: string;
  created_at: string;
  last_login?: string;
  profile_completion?: number;
  job_count?: number;
  application_count?: number;
  avatar_url?: string;
  banned_reason?: string;
  suspended_reason?: string;
  suspended_until?: string;
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
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null)
  const [showSuspendConfirm, setShowSuspendConfirm] = useState<User | null>(null)
  const [showBanConfirm, setShowBanConfirm] = useState<User | null>(null)
  const [banForm, setBanForm] = useState({
    reason: '',
    duration: '' // empty for permanent
  })
  const [suspendForm, setSuspendForm] = useState({
    reason: '',
    duration: '7' // default 7 days
  })
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'jobseeker' as 'jobseeker' | 'company' | 'admin' | 'manager',
    phone: '',
    location: '',
    company_name: ''
  })
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

  const [editForm, setEditForm] = useState({
    email: '',
    is_active: true,
    is_banned: false,
    is_suspended: false
  })

  // Initialize edit form when selectedUser changes
  useEffect(() => {
    if (selectedUser && showEditUser) {
      setEditForm({
        email: selectedUser.email,
        is_active: selectedUser.is_active,
        is_banned: selectedUser.is_suspended || false, // Assuming is_banned from backend
        is_suspended: selectedUser.is_suspended
      })
    }
  }, [selectedUser, showEditUser])

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(`edit-${selectedUser.id}`);
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: editForm.email,
          is_active: editForm.is_active,
          is_banned: editForm.is_banned,
          is_suspended: editForm.is_suspended
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Update the users list with the edited user
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUser.id 
              ? { ...user, ...updatedUser.user }
              : user
          )
        );
        
        // Refresh statistics
        fetchUsers();
        
        // Close modal and reset form
        setShowEditUser(false);
        setSelectedUser(null);
        setEditForm({
          email: '',
          is_active: true,
          is_banned: false,
          is_suspended: false
        });
        
        console.log('User updated successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to update user:', errorData.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    banned: 0,
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

      const response = await fetch(`http://localhost:5000/api/admin/users?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
        setPagination(data.pagination)
        setStatistics(data.statistics || {
          total: 0,
          active: 0,
          suspended: 0,
          companies: 0,
          jobseekers: 0,
          admins: 0,
          verified: 0
        })
      } else {
        throw new Error(data.message || 'Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      // You might want to show a toast notification here
    } finally {
      setLoading(false)
    }
  }, [currentPage, usersPerPage, filters])

  useEffect(() => {
    if (mounted) {
      fetchUsers()
    }
  }, [mounted, fetchUsers])

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
      const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${userId}/${action}`, {
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

  const handleBanUser = async () => {
    if (!showBanConfirm || !banForm.reason.trim()) return;
    
    console.log('Ban user attempt:', { 
      userId: showBanConfirm.id, 
      reason: banForm.reason, 
      duration: banForm.duration,
      hasToken: !!tokens.access_token,
      tokenPreview: tokens.access_token ? tokens.access_token.substring(0, 20) + '...' : 'none',
      user: user
    });
    
    if (!tokens.access_token) {
      alert('No authentication token found. Please log in again.');
      return;
    }
    
    const actionKey = `ban-${showBanConfirm.id}`;
    setActionLoading(actionKey);
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${showBanConfirm.id}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: banForm.reason,
          duration: banForm.duration ? parseInt(banForm.duration) : null
        })
      });
      
      if (response.ok) {
        await fetchUsers();
        setShowBanConfirm(null);
        setBanForm({ reason: '', duration: '' });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to ban user:', response.status, response.statusText, errorData);
        alert(`Failed to ban user: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error banning user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async () => {
    if (!showSuspendConfirm || !suspendForm.reason.trim() || !suspendForm.duration.trim()) return;
    
    const actionKey = `suspend-${showSuspendConfirm.id}`;
    setActionLoading(actionKey);
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${showSuspendConfirm.id}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: suspendForm.reason,
          duration: parseInt(suspendForm.duration)
        })
      });
      
      if (response.ok) {
        await fetchUsers();
        setShowSuspendConfirm(null);
        setSuspendForm({ reason: '', duration: '7' });
      } else {
        console.error('Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async () => {
    if (!createUserForm.email || !createUserForm.password) return;
    
    setActionLoading('creating-user');
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createUserForm)
      });
      
      if (response.ok) {
        await fetchUsers();
        setShowCreateUser(false);
        setCreateUserForm({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          user_type: 'jobseeker',
          phone: '',
          location: '',
          company_name: ''
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to create user:', errorData.message);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setActionLoading(null);
    }
  };

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
    if (user.is_banned) {
      return <Badge className="bg-red-600/20 text-red-300 border-red-600/30">Banned</Badge>
    }
    if (user.is_suspended) {
      return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Suspended</Badge>
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
              onClick={() => setShowCreateUser(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
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
                  <p className="text-sm font-medium text-gray-400">Banned</p>
                  <p className="text-3xl font-bold text-red-600">{statistics.banned}</p>
                </div>
                <Ban className="h-8 w-8 text-red-600" />
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
                        onClick={() => setShowBanConfirm(user)}
                        disabled={actionLoading === `ban-${user.id}` || actionLoading === `unban-${user.id}`}
                        className={user.is_banned 
                          ? "border-green-600 text-green-300 hover:bg-green-600/20" 
                          : "border-red-600 text-red-300 hover:bg-red-600/20"
                        }
                      >
                        {actionLoading === `ban-${user.id}` || actionLoading === `unban-${user.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.is_banned ? (
                          <UserCheck className="h-4 w-4" />
                        ) : (
                          <UserX className="h-4 w-4" />
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

        {/* Ban Confirmation Dialog */}
        <AlertDialog open={!!showBanConfirm} onOpenChange={() => setShowBanConfirm(null)}>
          <AlertDialogContent className="bg-gray-800 border-gray-700 max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                {showBanConfirm?.is_banned ? 'Unban' : 'Ban'} User
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                {showBanConfirm?.is_banned 
                  ? `Unban "${showBanConfirm?.email}" and restore their access.`
                  : `Permanently ban "${showBanConfirm?.email}" from accessing the platform.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            {!showBanConfirm?.is_banned && (
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="ban-reason" className="text-sm font-medium text-gray-300">
                    Reason for Ban *
                  </Label>
                  <Input
                    id="ban-reason"
                    value={banForm.reason}
                    onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for banning this user..."
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="ban-duration" className="text-sm font-medium text-gray-300">
                    Duration (leave empty for permanent)
                  </Label>
                  <Input
                    id="ban-duration"
                    type="number"
                    value={banForm.duration}
                    onChange={(e) => setBanForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Days (optional for permanent ban)"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={showBanConfirm?.is_banned ? 
                  () => showBanConfirm && handleUserAction(showBanConfirm.id, 'unban') :
                  handleBanUser
                }
                disabled={!showBanConfirm?.is_banned && (!banForm.reason.trim())}
                className={showBanConfirm?.is_banned 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                }
              >
                {actionLoading === `ban-${showBanConfirm?.id}` ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {showBanConfirm?.is_banned ? 'Unbanning...' : 'Banning...'}
                  </>
                ) : (
                  showBanConfirm?.is_banned ? 'Unban User' : 'Ban User'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Suspend Confirmation Dialog */}
        <AlertDialog open={!!showSuspendConfirm} onOpenChange={() => setShowSuspendConfirm(null)}>
          <AlertDialogContent className="bg-gray-800 border-gray-700 max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                {showSuspendConfirm?.is_suspended ? 'Activate' : 'Suspend'} User
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                {showSuspendConfirm?.is_suspended 
                  ? `Activate "${showSuspendConfirm?.email}" and restore their access.`
                  : `Temporarily suspend "${showSuspendConfirm?.email}" from accessing the platform.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            {!showSuspendConfirm?.is_suspended && (
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="suspend-reason" className="text-sm font-medium text-gray-300">
                    Reason for Suspension *
                  </Label>
                  <Input
                    id="suspend-reason"
                    value={suspendForm.reason}
                    onChange={(e) => setSuspendForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for suspending this user..."
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="suspend-duration" className="text-sm font-medium text-gray-300">
                    Duration (days) *
                  </Label>
                  <Input
                    id="suspend-duration"
                    type="number"
                    value={suspendForm.duration}
                    onChange={(e) => setSuspendForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="7"
                    min="1"
                    max="365"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={showSuspendConfirm?.is_suspended ? 
                  () => showSuspendConfirm && handleUserAction(showSuspendConfirm.id, 'activate') :
                  handleSuspendUser
                }
                disabled={!showSuspendConfirm?.is_suspended && (!suspendForm.reason.trim() || !suspendForm.duration.trim())}
                className={showSuspendConfirm?.is_suspended 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50'
                }
              >
                {actionLoading === `suspend-${showSuspendConfirm?.id}` ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {showSuspendConfirm?.is_suspended ? 'Activating...' : 'Suspending...'}
                  </>
                ) : (
                  showSuspendConfirm?.is_suspended ? 'Activate' : 'Suspend'
                )}
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

        {/* Edit User Modal */}
        <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Edit User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update user account settings and status.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedUser.avatar_url} />
                      <AvatarFallback className="bg-gray-700 text-white">
                        {selectedUser.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedUser.email}</h3>
                    <p className="text-sm text-gray-400 capitalize">{selectedUser.user_type}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-email" className="text-sm font-medium text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-300">Account Status</Label>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-active"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="edit-active" className="text-sm text-gray-300">
                        Active Account
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-banned"
                        checked={editForm.is_banned}
                        onChange={(e) => setEditForm(prev => ({ ...prev, is_banned: e.target.checked }))}
                        className="rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
                      />
                      <Label htmlFor="edit-banned" className="text-sm text-gray-300">
                        Banned
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-suspended"
                        checked={editForm.is_suspended}
                        onChange={(e) => setEditForm(prev => ({ ...prev, is_suspended: e.target.checked }))}
                        className="rounded border-gray-600 bg-gray-700 text-yellow-600 focus:ring-yellow-500"
                      />
                      <Label htmlFor="edit-suspended" className="text-sm text-gray-300">
                        Suspended
                      </Label>
                    </div>
                  </div>

                  {selectedUser.user_type === 'company' && selectedUser.company_name && (
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Company</Label>
                      <p className="mt-1 text-sm text-gray-400">{selectedUser.company_name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                onClick={() => setShowEditUser(false)} 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={actionLoading === `edit-${selectedUser?.id}`}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditUser}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={actionLoading === `edit-${selectedUser?.id}`}
              >
                {actionLoading === `edit-${selectedUser?.id}` ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New User</DialogTitle>
              <DialogDescription className="text-gray-300">
                Create a new user account with specified role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-email" className="text-sm font-medium text-gray-300">
                    Email Address *
                  </Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="create-password" className="text-sm font-medium text-gray-300">
                    Password *
                  </Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-first-name" className="text-sm font-medium text-gray-300">
                    First Name
                  </Label>
                  <Input
                    id="create-first-name"
                    value={createUserForm.first_name}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="John"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="create-last-name" className="text-sm font-medium text-gray-300">
                    Last Name
                  </Label>
                  <Input
                    id="create-last-name"
                    value={createUserForm.last_name}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Doe"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="create-user-type" className="text-sm font-medium text-gray-300">
                  User Role *
                </Label>
                <select
                  id="create-user-type"
                  value={createUserForm.user_type}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, user_type: e.target.value as 'jobseeker' | 'company' | 'admin' | 'manager' }))}
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                >
                  <option value="jobseeker">Job Seeker</option>
                  <option value="company">Company</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {createUserForm.user_type === 'manager' && 'Manager has limited admin functionality'}
                  {createUserForm.user_type === 'admin' && 'Administrator has full system access'}
                  {createUserForm.user_type === 'company' && 'Company can post jobs and manage applications'}
                  {createUserForm.user_type === 'jobseeker' && 'Job seeker can browse and apply for jobs'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-phone" className="text-sm font-medium text-gray-300">
                    Phone Number
                  </Label>
                  <Input
                    id="create-phone"
                    value={createUserForm.phone}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1234567890"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="create-location" className="text-sm font-medium text-gray-300">
                    Location
                  </Label>
                  <Input
                    id="create-location"
                    value={createUserForm.location}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {createUserForm.user_type === 'company' && (
                <div>
                  <Label htmlFor="create-company-name" className="text-sm font-medium text-gray-300">
                    Company Name
                  </Label>
                  <Input
                    id="create-company-name"
                    value={createUserForm.company_name}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Company Inc."
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline" 
                onClick={() => {
                  setShowCreateUser(false);
                  setCreateUserForm({
                    email: '',
                    password: '',
                    first_name: '',
                    last_name: '',
                    user_type: 'jobseeker',
                    phone: '',
                    location: '',
                    company_name: ''
                  });
                }}
                className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={!createUserForm.email || !createUserForm.password || actionLoading === 'creating-user'}
              >
                {actionLoading === 'creating-user' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
