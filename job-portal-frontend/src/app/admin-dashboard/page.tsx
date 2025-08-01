'use client'

import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { fetchUserProfile } from '@/store/slices/authSlice'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  Loader2,
  Shield,
  Briefcase,
  Users,
  Building2,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  BarChart3,
  Clock,
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
  UserCheck,
  UserX,
  Database,
  Server,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Mock analytics data for admin dashboard
const adminAnalyticsData = {
  platformStats: [
    { month: 'Jan', jobs: 120, users: 450, companies: 23, applications: 1200 },
    { month: 'Feb', jobs: 150, users: 620, companies: 31, applications: 1800 },
    { month: 'Mar', jobs: 180, users: 780, companies: 38, applications: 2200 },
    { month: 'Apr', jobs: 220, users: 940, companies: 45, applications: 2800 },
    { month: 'May', jobs: 280, users: 1150, companies: 52, applications: 3400 },
    { month: 'Jun', jobs: 320, users: 1320, companies: 58, applications: 4100 },
  ],
  jobsByCategory: [
    { name: 'Technology', value: 45, color: '#3B82F6' },
    { name: 'Marketing', value: 25, color: '#10B981' },
    { name: 'Design', value: 15, color: '#F59E0B' },
    { name: 'Sales', value: 10, color: '#EF4444' },
    { name: 'Other', value: 5, color: '#8B5CF6' },
  ],
  userGrowth: [
    { date: '2024-01', jobseekers: 320, companies: 45, admins: 5 },
    { date: '2024-02', jobseekers: 480, companies: 62, admins: 6 },
    { date: '2024-03', jobseekers: 620, companies: 78, admins: 7 },
    { date: '2024-04', jobseekers: 780, companies: 89, admins: 8 },
    { date: '2024-05', jobseekers: 920, companies: 105, admins: 9 },
    { date: '2024-06', jobseekers: 1120, companies: 120, admins: 10 },
  ],
  systemHealth: [
    { metric: 'API Response Time', value: 145, unit: 'ms', status: 'good' },
    { metric: 'Database Performance', value: 92, unit: '%', status: 'excellent' },
    { metric: 'Server Uptime', value: 99.9, unit: '%', status: 'excellent' },
    { metric: 'Error Rate', value: 0.2, unit: '%', status: 'good' },
  ]
}

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [pendingJobs, setPendingJobs] = useState<{
    id: number;
    title: string;
    company: string;
    location?: string;
    description: string;
    created_by_type: string;
    created_at: string;
  }[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [statistics, setStatistics] = useState<{
    total_jobs?: number;
    pending_jobs?: number;
    total_users?: number;
    total_companies?: number;
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user profile if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  // Fetch admin statistics and data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!tokens.access_token || user?.user_type !== 'admin') return
      
      setLoadingData(true)
      try {
        // Fetch pending jobs
        const jobsResponse = await fetch('/api/jobs/search?status=pending_approval', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json()
          setPendingJobs(jobsData.jobs || [])
        }

        // Fetch admin statistics
        const statsResponse = await fetch('/api/jobs/statistics', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          if (statsData.success) {
            setStatistics(statsData.statistics)
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    if (mounted && tokens.access_token && user?.user_type === 'admin') {
      fetchAdminData()
    }
  }, [mounted, tokens.access_token, user])

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300">Loading admin dashboard...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show auth error if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Authentication Required</h1>
            <p className="text-gray-300 mb-6">Please log in as an administrator to access this dashboard.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Check if user is admin
  if (user.user_type !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Access Denied</h1>
            <p className="text-gray-300 mb-6">This dashboard is only available for administrators.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleJobAction = async (jobId: number, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove the job from pending list
        setPendingJobs(prev => prev.filter(job => job.id !== jobId))
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error)
    }
  }

  interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    trend?: 'up' | 'down';
    description?: string;
    color?: string;
  }

  const StatCard = ({ title, value, change, icon: Icon, trend, description, color = 'blue' }: StatCardProps) => (
    <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">{value}</p>
              {change && (
                <div className="flex items-center space-x-1">
                  {trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-400" />
                  )}
                  <span className={`text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {change}
                  </span>
                  <span className="text-sm text-gray-400">{description}</span>
                </div>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${
            color === 'orange' ? 'bg-orange-600/10' :
            color === 'green' ? 'bg-green-600/10' :
            color === 'purple' ? 'bg-purple-600/10' : 'bg-blue-600/10'
          }`}>
            <Icon className={`h-6 w-6 ${
              color === 'orange' ? 'text-orange-400' :
              color === 'green' ? 'text-green-400' :
              color === 'purple' ? 'text-purple-400' : 'text-blue-400'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Admin Dashboard 🛡️  
            </h1>
            <p className="mt-2 text-gray-400">
              Monitor platform performance, manage content, and oversee system operations.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/admin/jobs'}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Manage Jobs
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="bg-green-600/20 border-green-600/30 text-green-300 hover:bg-green-600 hover:text-white"
              onClick={() => window.location.href = '/post-job'}
            >
              <Plus className="h-4 w-4 mr-2" />
              Post Job
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Pending Jobs"
            value={pendingJobs.length}
            change="8%"
            trend="up"
            description="vs last week"
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Total Jobs"
            value={statistics?.total_jobs || '1,234'}
            change="12%"
            trend="up"
            description="vs last month"
            icon={Briefcase}
            color="blue"
          />
          <StatCard
            title="Active Users"
            value={statistics?.total_users || '5,678'}
            change="18%"
            trend="up"
            description="vs last month"
            icon={Users}
            color="green"
          />
          <StatCard
            title="Companies"
            value={statistics?.total_companies || '89'}
            change="5%"
            trend="up"
            description="vs last month"
            icon={Building2}
            color="purple"
          />
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminAnalyticsData.systemHealth.map((metric, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">{metric.metric}</p>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-white">
                        {metric.value}{metric.unit}
                      </p>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          metric.status === 'excellent' ? 'bg-green-400' :
                          metric.status === 'good' ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <span className={`text-sm capitalize ${
                          metric.status === 'excellent' ? 'text-green-400' :
                          metric.status === 'good' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {metric.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-700 rounded-full">
                    {index === 0 && <Activity className="h-6 w-6 text-blue-400" />}
                    {index === 1 && <Database className="h-6 w-6 text-green-400" />}
                    {index === 2 && <Server className="h-6 w-6 text-purple-400" />}
                    {index === 3 && <AlertTriangle className="h-6 w-6 text-orange-400" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="pending-jobs" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Clock className="h-4 w-4 mr-2" />
              Pending Jobs ({pendingJobs.length})
            </TabsTrigger>
            <TabsTrigger value="user-management" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Building2 className="h-4 w-4 mr-2" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Platform Growth Chart */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Platform Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={adminAnalyticsData.platformStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }} 
                      />
                      <Legend />
                      <Area type="monotone" dataKey="jobs" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="users" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="applications" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Job Categories Distribution */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Job Categories Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={adminAnalyticsData.jobsByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {adminAnalyticsData.jobsByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* User Growth Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">User Growth by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={adminAnalyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="jobseekers" stroke="#3B82F6" strokeWidth={3} />
                    <Line type="monotone" dataKey="companies" stroke="#10B981" strokeWidth={3} />
                    <Line type="monotone" dataKey="admins" stroke="#F59E0B" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Jobs Tab */}
          <TabsContent value="pending-jobs" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Jobs Awaiting Approval</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.location.href = '/admin/jobs'}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Manage All Jobs
                  </Button>
                  <Button size="sm" variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-300">Loading pending jobs...</span>
                  </div>
                ) : pendingJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">All caught up!</h3>
                    <p className="text-gray-400">No jobs are currently pending approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingJobs.map((job) => (
                      <div key={job.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                              <Badge className={`${
                                job.created_by_type === 'company' ? 'bg-blue-600/20 text-blue-300 border-blue-600/30' :
                                job.created_by_type === 'admin' ? 'bg-purple-600/20 text-purple-300 border-purple-600/30' :
                                'bg-green-600/20 text-green-300 border-green-600/30'
                              }`}>
                                {job.created_by_type}
                              </Badge>
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
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleJobAction(job.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              onClick={() => handleJobAction(job.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
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

          {/* User Management Tab */}
          <TabsContent value="user-management" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    User Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Job Seekers</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">4,520</span>
                      <UserCheck className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                  <Progress value={80} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Companies</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">89</span>
                      <Building2 className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <Progress value={15} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Administrators</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">10</span>
                      <Shield className="h-4 w-4 text-purple-400" />
                    </div>
                  </div>
                  <Progress value={5} className="h-2" />
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">New company registered</p>
                        <p className="text-gray-400 text-xs">TechCorp Inc. - 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">User verification completed</p>
                        <p className="text-gray-400 text-xs">45 users - 4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">Suspicious activity detected</p>
                        <p className="text-gray-400 text-xs">Account flagged - 6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Approve Pending Users
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <UserX className="w-4 h-4 mr-2" />
                    Review Flagged Accounts
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Search className="w-4 h-4 mr-2" />
                    Search Users
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export User Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Company Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-white">Company Management System</h3>
                  <p className="text-gray-400 mb-6">Advanced company approval, verification, and management features.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                    <Button variant="outline" className="flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Companies
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Review Profiles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-white font-medium">Auto-approve jobs</h4>
                        <p className="text-gray-400 text-sm">Automatically approve jobs from verified companies</p>
                      </div>
                      <Button size="sm" variant="outline">Configure</Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-white font-medium">Email notifications</h4>
                        <p className="text-gray-400 text-sm">Send admin notifications for important events</p>
                      </div>
                      <Button size="sm" variant="outline">Configure</Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-white font-medium">Content moderation</h4>
                        <p className="text-gray-400 text-sm">Automated content filtering and flagging</p>
                      </div>
                      <Button size="sm" variant="outline">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform Version</span>
                      <span className="text-white">v2.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Database Size</span>
                      <span className="text-white">2.4 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Backup</span>
                      <span className="text-white">2 hours ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Sessions</span>
                      <span className="text-white">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Server Location</span>
                      <span className="text-white flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        US East
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
