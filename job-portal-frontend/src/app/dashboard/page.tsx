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
  BarChart3, 
  Users, 
  Briefcase, 
  TrendingUp, 
  User,
  Eye,
  Calendar,
  Target,
  Activity,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  Heart,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Loader2
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

// Mock data for analytics (replace with real API calls)
const analyticsData = {
  applicationTrends: [
    { month: 'Jan', applications: 12, interviews: 3, offers: 1 },
    { month: 'Feb', applications: 19, interviews: 5, offers: 2 },
    { month: 'Mar', applications: 15, interviews: 4, offers: 1 },
    { month: 'Apr', applications: 22, interviews: 7, offers: 3 },
    { month: 'May', applications: 28, interviews: 8, offers: 2 },
    { month: 'Jun', applications: 25, interviews: 6, offers: 4 },
  ],
  jobsByCategory: [
    { name: 'Technology', value: 45, color: '#3B82F6' },
    { name: 'Marketing', value: 25, color: '#10B981' },
    { name: 'Design', value: 15, color: '#F59E0B' },
    { name: 'Sales', value: 10, color: '#EF4444' },
    { name: 'Other', value: 5, color: '#8B5CF6' },
  ],
  salaryRanges: [
    { range: '30-50k', count: 45 },
    { range: '50-70k', count: 78 },
    { range: '70-100k', count: 62 },
    { range: '100k+', count: 35 },
  ],
  activityData: [
    { date: '2024-01', views: 120, applications: 15 },
    { date: '2024-02', views: 180, applications: 22 },
    { date: '2024-03', views: 240, applications: 18 },
    { date: '2024-04', views: 320, applications: 28 },
    { date: '2024-05', views: 280, applications: 25 },
    { date: '2024-06', views: 380, applications: 32 },
  ]
}

export default function Dashboard() {
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
            <span className="text-gray-300">Loading dashboard...</span>
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
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Authentication Required</h1>
            <p className="text-gray-300 mb-6">Please log in to access your dashboard.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Redirect company users to company dashboard
  if (user.user_type === 'company') {
    window.location.href = '/company-dashboard'
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300">Redirecting to company dashboard...</span>
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
              Welcome back, {user?.first_name || user?.email?.split('@')[0] || 'User'}! 👋
            </h1>
            <p className="mt-2 text-gray-400">
              {user?.user_type === 'admin' 
                ? 'Monitor system performance and manage platform operations.' 
                : 'Track your job search progress and discover new opportunities.'}
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
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {user?.user_type === 'admin' ? 'Add Report' : 'Apply to Job'}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={user?.user_type === 'admin' ? 'Total Jobs' : 'Applications Sent'}
            value={user?.user_type === 'admin' ? '1,234' : '42'}
            change="12%"
            trend="up"
            description="vs last month"
            icon={Briefcase}
          />
          <StatCard
            title={user?.user_type === 'admin' ? 'Active Companies' : 'Interview Invites'}
            value={user?.user_type === 'admin' ? '89' : '8'}
            change="5%"
            trend="up"
            description="vs last month"
            icon={Users}
          />
          <StatCard
            title={user?.user_type === 'admin' ? 'Job Applications' : 'Profile Views'}
            value={user?.user_type === 'admin' ? '12,459' : '156'}
            change="8%"
            trend="up"
            description="vs last month"
            icon={Eye}
          />
          <StatCard
            title={user?.user_type === 'admin' ? 'Success Rate' : 'Response Rate'}
            value={user?.user_type === 'admin' ? '94%' : '19%'}
            change="2%"
            trend="down"
            description="vs last month"
            icon={Target}
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
            <TabsTrigger value="activity" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Target className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Application Trends Chart */}
              <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Application Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.applicationTrends}>
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
                      <Area type="monotone" dataKey="applications" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="interviews" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="offers" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
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
                    onClick={() => window.location.href = '/'}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse Jobs
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.location.href = '/profile'}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.location.href = '/saved-jobs'}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Saved Jobs
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => window.location.href = '/my-applications'}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    My Applications
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Job Categories & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job Categories Pie Chart */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Job Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.jobsByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {analyticsData.jobsByCategory.map((entry, index) => (
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

              {/* Recent Activity */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Applied to Senior Developer at TechCorp</p>
                        <p className="text-gray-400 text-sm">2 hours ago</p>
                      </div>
                      <Badge className="bg-blue-600 text-white">New</Badge>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Interview scheduled with StartupXYZ</p>
                        <p className="text-gray-400 text-sm">1 day ago</p>
                      </div>
                      <Badge className="bg-green-600 text-white">Interview</Badge>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Profile viewed by 5 companies</p>
                        <p className="text-gray-400 text-sm">2 days ago</p>
                      </div>
                      <Badge className="bg-yellow-600 text-white">Views</Badge>
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
                  <CardTitle className="text-white">Salary Range Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.salaryRanges}>
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
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Activity */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Monthly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.activityData}>
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
                      <Line type="monotone" dataKey="views" stroke="#10B981" strokeWidth={2} />
                      <Line type="monotone" dataKey="applications" stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { time: '2 hours ago', action: 'Applied to Senior Developer position', company: 'TechCorp Inc.', status: 'pending', icon: Briefcase },
                    { time: '1 day ago', action: 'Interview scheduled', company: 'StartupXYZ', status: 'interview', icon: Calendar },
                    { time: '2 days ago', action: 'Profile viewed', company: 'Multiple companies', status: 'viewed', icon: Eye },
                    { time: '3 days ago', action: 'Job saved', company: 'DesignHub', status: 'saved', icon: Heart },
                    { time: '5 days ago', action: 'Application rejected', company: 'OldTech Ltd.', status: 'rejected', icon: XCircle },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        item.status === 'pending' ? 'bg-blue-600/20' :
                        item.status === 'interview' ? 'bg-green-600/20' :
                        item.status === 'viewed' ? 'bg-purple-600/20' :
                        item.status === 'saved' ? 'bg-yellow-600/20' : 'bg-red-600/20'
                      }`}>
                        <item.icon className={`h-4 w-4 ${
                          item.status === 'pending' ? 'text-blue-400' :
                          item.status === 'interview' ? 'text-green-400' :
                          item.status === 'viewed' ? 'text-purple-400' :
                          item.status === 'saved' ? 'text-yellow-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.action}</p>
                        <p className="text-gray-400 text-sm">{item.company}</p>
                        <p className="text-gray-500 text-xs">{item.time}</p>
                      </div>
                      <Badge variant="outline" className={`${
                        item.status === 'pending' ? 'border-blue-500 text-blue-400' :
                        item.status === 'interview' ? 'border-green-500 text-green-400' :
                        item.status === 'viewed' ? 'border-purple-500 text-purple-400' :
                        item.status === 'saved' ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'
                      }`}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Current Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-medium">Apply to 50 jobs this month</p>
                        <span className="text-sm text-gray-400">42/50</span>
                      </div>
                      <Progress value={84} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-medium">Get 5 interviews</p>
                        <span className="text-sm text-gray-400">3/5</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white font-medium">Update skills section</p>
                        <span className="text-sm text-gray-400">Complete</span>
                      </div>
                      <Progress value={100} className="h-2" />
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
                        <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Optimize your profile</p>
                          <p className="text-gray-400 text-sm">Add more skills and experience details to increase visibility.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Star className="h-5 w-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Follow up on applications</p>
                          <p className="text-gray-400 text-sm">You have 3 pending applications that could benefit from follow-up.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">Expand your search</p>
                          <p className="text-gray-400 text-sm">Consider looking at remote opportunities to increase your options.</p>
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
