'use client'

import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { fetchUserProfile } from '@/store/slices/authSlice'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2, 
  Building2, 
  Briefcase, 
  Users, 
  Eye, 
  Plus, 
  Settings,
  BarChart3,
  TrendingUp,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  UserCheck,
  Clock,
  MapPin
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

// Mock data for company analytics
const companyAnalyticsData = {
  jobPostingTrends: [
    { month: 'Jan', posted: 5, applications: 45, hired: 2 },
    { month: 'Feb', posted: 8, applications: 72, hired: 3 },
    { month: 'Mar', posted: 6, applications: 54, hired: 2 },
    { month: 'Apr', posted: 10, applications: 89, hired: 4 },
    { month: 'May', posted: 12, applications: 106, hired: 5 },
    { month: 'Jun', posted: 9, applications: 78, hired: 3 },
  ],
  applicationsByStatus: [
    { name: 'Pending Review', value: 35, color: '#F59E0B' },
    { name: 'Under Review', value: 25, color: '#3B82F6' },
    { name: 'Interviewed', value: 15, color: '#10B981' },
    { name: 'Hired', value: 10, color: '#059669' },
    { name: 'Rejected', value: 15, color: '#EF4444' },
  ],
  salaryRanges: [
    { range: '30-50k', jobs: 5, applications: 45 },
    { range: '50-70k', jobs: 8, applications: 78 },
    { range: '70-100k', jobs: 6, applications: 62 },
    { range: '100k+', jobs: 3, applications: 35 },
  ],
  jobViews: [
    { date: '2024-01', views: 320, applications: 45 },
    { date: '2024-02', views: 480, applications: 72 },
    { date: '2024-03', views: 380, applications: 54 },
    { date: '2024-04', views: 620, applications: 89 },
    { date: '2024-05', views: 560, applications: 106 },
    { date: '2024-06', views: 720, applications: 78 },
  ]
}

export default function CompanyDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [statistics, setStatistics] = useState<{
    total_jobs?: number;
    total_applications?: number;
    pending_applications?: number;
    accepted_applications?: number;
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user profile if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!tokens.access_token) return
      
      setLoadingStats(true)
      try {
        const response = await fetch('/api/jobs/statistics', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })
        const data = await response.json()
        if (data.success) {
          setStatistics(data.statistics)
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    if (mounted && tokens.access_token) {
      fetchStatistics()
    }
  }, [mounted, tokens.access_token])

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300">Loading company dashboard...</span>
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
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Authentication Required</h1>
            <p className="text-gray-300 mb-6">Please log in as a company user to access this dashboard.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show access denied if not a company user  
  if (user.user_type !== 'company') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Access Denied</h1>
            <p className="text-gray-300 mb-6">This dashboard is only available for company accounts.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    trend?: 'up' | 'down';
    description?: string;
  }

  const StatCard = ({ title, value, change, icon: Icon, trend, description }: StatCardProps) => (
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
          <div className="p-3 bg-blue-600/10 rounded-full">
            <Icon className="h-6 w-6 text-blue-400" />
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
              Welcome back, {user?.company_name || user?.first_name || 'Company'}! 🏢
            </h1>
            <p className="mt-2 text-gray-400">
              {user?.is_approved 
                ? 'Manage your job postings and track candidate applications.' 
                : 'Your account is pending approval. Complete your setup to start posting jobs.'}
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
              onClick={() => window.location.href = '/post-job'}
            >
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>

        {/* Account Status Banner */}
        {!user.is_approved && (
          <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-orange-600/20 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <h3 className="text-orange-300 font-semibold">Account Pending Approval</h3>
                <p className="text-orange-400 text-sm">Your company account is under review. You can create job postings, but they won&apos;t be visible until approved.</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Job Posts"
            value="12"
            change="8%"
            trend="up"
            description="vs last month"
            icon={Briefcase}
          />
          <StatCard
            title="Total Applications"
            value="324"
            change="15%"
            trend="up"
            description="vs last month"
            icon={Users}
          />
          <StatCard
            title="Profile Views"
            value="1,284"
            change="12%"
            trend="up"
            description="vs last month"
            icon={Eye}
          />
          <StatCard
            title="Hired Candidates"
            value="18"
            change="22%"
            trend="up"
            description="vs last month"
            icon={UserCheck}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <FileText className="h-4 w-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Job Posting Trends Chart */}
              <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Job Posting Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={companyAnalyticsData.jobPostingTrends}>
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
                      <Area type="monotone" dataKey="posted" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="applications" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="hired" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => window.location.href = '/post-job'}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Applications
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.location.href = '/profile'}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Company Profile
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Find Candidates
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Applications Status & Company Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Applications by Status Pie Chart */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Applications Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={companyAnalyticsData.applicationsByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {companyAnalyticsData.applicationsByStatus.map((entry, index) => (
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

              {/* Company Information */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Company Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Company Name</span>
                      <span className="text-white font-medium">{user.company_name || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Industry</span>
                      <span className="text-white font-medium">{user.industry || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Company Size</span>
                      <span className="text-white font-medium">{user.company_size || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Location</span>
                      <span className="text-white font-medium flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {user.location || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status</span>
                      {user.is_approved ? (
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Salary Range Analysis */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Jobs by Salary Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={companyAnalyticsData.salaryRanges}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="range" stroke="#9CA3AF" />
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
                      <Bar dataKey="jobs" fill="#3B82F6" name="Posted Jobs" />
                      <Bar dataKey="applications" fill="#10B981" name="Applications" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Job Views & Applications Trend */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Views vs Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={companyAnalyticsData.jobViews}>
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
                      <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} name="Job Views" />
                      <Line type="monotone" dataKey="applications" stroke="#10B981" strokeWidth={2} name="Applications" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { time: '2 hours ago', candidate: 'John Doe', position: 'Senior Developer', status: 'pending', experience: '5+ years' },
                    { time: '5 hours ago', candidate: 'Jane Smith', position: 'UX Designer', status: 'interview', experience: '3+ years' },
                    { time: '1 day ago', candidate: 'Mike Johnson', position: 'Product Manager', status: 'hired', experience: '7+ years' },
                    { time: '2 days ago', candidate: 'Sarah Wilson', position: 'Marketing Specialist', status: 'rejected', experience: '2+ years' },
                    { time: '3 days ago', candidate: 'David Brown', position: 'Data Analyst', status: 'pending', experience: '4+ years' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        item.status === 'pending' ? 'bg-yellow-600/20' :
                        item.status === 'interview' ? 'bg-blue-600/20' :
                        item.status === 'hired' ? 'bg-green-600/20' : 'bg-red-600/20'
                      }`}>
                        {item.status === 'pending' ? <Clock className="h-4 w-4 text-yellow-400" /> :
                         item.status === 'interview' ? <Calendar className="h-4 w-4 text-blue-400" /> :
                         item.status === 'hired' ? <CheckCircle className="h-4 w-4 text-green-400" /> : 
                         <XCircle className="h-4 w-4 text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.candidate}</p>
                        <p className="text-gray-400 text-sm">Applied for {item.position} • {item.experience}</p>
                        <p className="text-gray-500 text-xs">{item.time}</p>
                      </div>
                      <Badge variant="outline" className={`${
                        item.status === 'pending' ? 'border-yellow-500 text-yellow-400' :
                        item.status === 'interview' ? 'border-blue-500 text-blue-400' :
                        item.status === 'hired' ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'
                      }`}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-medium">Profile Completion</p>
                        <span className="text-sm text-gray-400">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-medium">Job Posting Limit</p>
                        <span className="text-sm text-gray-400">12/20</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div className="pt-4 space-y-2">
                      <Button className="w-full" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Company Profile
                      </Button>
                      <Button className="w-full" variant="outline">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Manage Team Access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Star className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Complete your profile</p>
                          <p className="text-gray-400 text-sm">Add company logo and detailed description to attract more candidates.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Optimize job posts</p>
                          <p className="text-gray-400 text-sm">Jobs with detailed requirements get 40% more qualified applications.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Respond to applications</p>
                          <p className="text-gray-400 text-sm">You have 15 pending applications waiting for review.</p>
                        </div>
                      </div>
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
