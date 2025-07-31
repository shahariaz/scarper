'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  Briefcase, 
  Eye, 
  Plus, 
  TrendingUp, 
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Star,
  MessageSquare,
  FileText,
  Settings,
  BarChart3,
  Home,
  Building2,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  Activity,
  Target,
  Award
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mock data
  const stats = {
    totalJobs: 24,
    activeJobs: 18,
    totalApplicants: 347,
    newApplicants: 23,
    interviews: 12,
    hires: 3
  }

  // Analytics mock data
  const applicationTrends = [
    { month: 'Jan', applications: 65, views: 450 },
    { month: 'Feb', applications: 78, views: 520 },
    { month: 'Mar', applications: 89, views: 680 },
    { month: 'Apr', applications: 95, views: 750 },
    { month: 'May', applications: 110, views: 820 },
    { month: 'Jun', applications: 89, views: 690 },
    { month: 'Jul', applications: 134, views: 920 }
  ]

  const jobCategoryData = [
    { name: 'Tech', value: 45, color: '#FBBF24' },
    { name: 'Design', value: 25, color: '#3B82F6' },
    { name: 'Marketing', value: 15, color: '#10B981' },
    { name: 'Sales', value: 10, color: '#F59E0B' },
    { name: 'Other', value: 5, color: '#6B7280' }
  ]

  const performanceMetrics = [
    { metric: 'Application Rate', current: 75, target: 80, color: '#10B981' },
    { metric: 'Interview Rate', current: 45, target: 50, color: '#3B82F6' },
    { metric: 'Hire Rate', current: 12, target: 15, color: '#F59E0B' },
    { metric: 'Response Time', current: 85, target: 90, color: '#8B5CF6' }
  ]

  const recentJobs = [
    {
      id: 1,
      title: 'Senior React Developer',
      location: 'Dhaka, Bangladesh',
      type: 'Full-time',
      salary: '৳80,000 - ৳120,000',
      applicants: 45,
      views: 234,
      status: 'Active',
      postedAt: '2 days ago'
    },
    {
      id: 2,
      title: 'UI/UX Designer',
      location: 'Remote',
      type: 'Part-time',
      salary: '৳40,000 - ৳60,000',
      applicants: 28,
      views: 156,
      status: 'Active',
      postedAt: '1 week ago'
    },
    {
      id: 3,
      title: 'DevOps Engineer',
      location: 'Chittagong, Bangladesh',
      type: 'Full-time',
      salary: '৳90,000 - ৳140,000',
      applicants: 31,
      views: 189,
      status: 'Draft',
      postedAt: '3 days ago'
    }
  ]

  const recentApplicants = [
    {
      id: 1,
      name: 'Ahmed Rahman',
      position: 'Senior React Developer',
      experience: '5 years',
      education: 'BSc in CSE, BUET',
      appliedAt: '2 hours ago',
      status: 'New'
    },
    {
      id: 2,
      name: 'Fatima Khan',
      position: 'UI/UX Designer',
      experience: '3 years',
      education: 'BFA in Design, DU',
      appliedAt: '5 hours ago',
      status: 'Reviewed'
    },
    {
      id: 3,
      name: 'Mohammad Ali',
      position: 'DevOps Engineer',
      experience: '4 years',
      education: 'BSc in CSE, NSU',
      appliedAt: '1 day ago',
      status: 'Interview'
    }
  ]

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'applicants', label: 'Applicants', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Jobs</CardTitle>
                  <Briefcase className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalJobs}</div>
                  <p className="text-xs text-green-400">+2 from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Active Jobs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.activeJobs}</div>
                  <p className="text-xs text-green-400">+5 from last week</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Applicants</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalApplicants}</div>
                  <p className="text-xs text-green-400">+23 new today</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">New Applications</CardTitle>
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.newApplicants}</div>
                  <p className="text-xs text-gray-400">Last 24 hours</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Interviews</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.interviews}</div>
                  <p className="text-xs text-yellow-400">3 scheduled today</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Hires</CardTitle>
                  <Star className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.hires}</div>
                  <p className="text-xs text-green-400">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Jobs */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Jobs</CardTitle>
                  <CardDescription className="text-gray-400">Your latest job postings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentJobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{job.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {job.postedAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {job.applicants} applicants
                          </Badge>
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {job.views} views
                          </Badge>
                        </div>
                      </div>
                      <Badge 
                        variant={job.status === 'Active' ? 'default' : 'secondary'}
                        className={job.status === 'Active' ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Applicants */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Applicants</CardTitle>
                  <CardDescription className="text-gray-400">Latest job applications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentApplicants.map((applicant) => (
                    <div key={applicant.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{applicant.name}</h4>
                        <p className="text-sm text-gray-400">{applicant.position}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>{applicant.experience}</span>
                          <span>{applicant.appliedAt}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`text-xs border-gray-600 ${
                          applicant.status === 'New' ? 'text-green-400 border-green-400' :
                          applicant.status === 'Interview' ? 'text-yellow-400 border-yellow-400' :
                          'text-blue-400 border-blue-400'
                        }`}
                      >
                        {applicant.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'jobs':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">All Jobs</h2>
                <p className="text-gray-400">Manage your job postings</p>
              </div>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </div>

            <div className="space-y-4">
              {recentJobs.map((job) => (
                <Card key={job.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.type}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.postedAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-gray-300">
                            <Users className="h-4 w-4" />
                            {job.applicants} applicants
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-300">
                            <Eye className="h-4 w-4" />
                            {job.views} views
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={job.status === 'Active' ? 'default' : 'secondary'}
                          className={job.status === 'Active' ? 'bg-green-600' : 'bg-gray-600'}
                        >
                          {job.status}
                        </Badge>
                        <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-700">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 'applicants':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">All Applicants</h2>
              <p className="text-gray-400">Review and manage job applications</p>
            </div>

            <div className="space-y-4">
              {recentApplicants.map((applicant) => (
                <Card key={applicant.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{applicant.name}</h3>
                          <Badge 
                            variant="outline"
                            className={`text-xs border-gray-600 ${
                              applicant.status === 'New' ? 'text-green-400 border-green-400' :
                              applicant.status === 'Interview' ? 'text-yellow-400 border-yellow-400' :
                              'text-blue-400 border-blue-400'
                            }`}
                          >
                            {applicant.status}
                          </Badge>
                        </div>
                        <p className="text-gray-300 mb-2">Applied for: {applicant.position}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Experience: {applicant.experience}</span>
                          <span>Education: {applicant.education}</span>
                          <span>Applied: {applicant.appliedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-700">
                          <FileText className="h-4 w-4 mr-2" />
                          View CV
                        </Button>
                        <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-gray-900">
                          Contact
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <p className="text-gray-400">Comprehensive insights and performance metrics</p>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {performanceMetrics.map((metric, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Target className="h-4 w-4" style={{ color: metric.color }} />
                      {metric.metric}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-white">
                          {metric.current}%
                        </span>
                        <span className="text-sm text-gray-400">
                          Target: {metric.target}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        <Progress 
                          value={metric.current} 
                          className="h-2" 
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {metric.current >= metric.target ? (
                          <TrendingUp className="h-3 w-3 text-green-400" />
                        ) : (
                          <Activity className="h-3 w-3 text-yellow-400" />
                        )}
                        <span className={`text-xs ${
                          metric.current >= metric.target ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {metric.current >= metric.target ? 'On Target' : 'Below Target'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Application Trends Chart */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    Application Trends
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly applications and job views over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={applicationTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="applications"
                          stackId="1"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.6}
                          name="Applications"
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stackId="2"
                          stroke="#FBBF24"
                          fill="#FBBF24"
                          fillOpacity={0.4}
                          name="Job Views"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Job Categories Distribution */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-400" />
                    Job Categories
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Distribution of jobs by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={jobCategoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {jobCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Performance */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Applications Received</span>
                    <span className="text-white font-semibold">134</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Jobs Posted</span>
                    <span className="text-white font-semibold">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Interviews Conducted</span>
                    <span className="text-white font-semibold">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Successful Hires</span>
                    <span className="text-green-400 font-semibold">5</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Success Rate</span>
                      <span className="text-green-400 font-semibold">21.7%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Jobs */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-400" />
                    Top Performers
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Jobs with highest engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentJobs.slice(0, 3).map((job, index) => (
                      <div key={job.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-500 text-gray-900 rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{job.title}</p>
                            <p className="text-xs text-gray-400">{job.applicants} applications</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold text-sm">{job.views}</p>
                          <p className="text-xs text-gray-400">views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white text-sm">New application received</p>
                        <p className="text-xs text-gray-400">Ahmed Rahman applied for React Developer</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white text-sm">Job posted successfully</p>
                        <p className="text-xs text-gray-400">UI/UX Designer position is now live</p>
                        <p className="text-xs text-gray-500">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white text-sm">Interview scheduled</p>
                        <p className="text-xs text-gray-400">Meeting with Fatima Khan tomorrow</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white text-sm">Candidate hired</p>
                        <p className="text-xs text-gray-400">Mohammad Ali joined as DevOps Engineer</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <p className="text-gray-400">Manage your dashboard preferences</p>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Company Profile</CardTitle>
                <CardDescription className="text-gray-400">Update your company information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-gray-300">
                    <p>Feature coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-yellow-500" />
            <span className="text-xl font-bold text-white">Dashboard</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-yellow-500 text-gray-900'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* User Profile in Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/api/placeholder/40/40" />
              <AvatarFallback className="bg-yellow-500 text-gray-900 font-semibold">
                AC
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                ABC Company
              </p>
              <p className="text-xs text-gray-400 truncate">
                company@example.com
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-white capitalize">
              {activeSection}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="h-12 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-6">
          <p className="text-sm text-gray-400">
            © 2025 BD Jobs Portal. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <button className="hover:text-white transition-colors">Help</button>
            <button className="hover:text-white transition-colors">Support</button>
            <button className="hover:text-white transition-colors">Privacy</button>
          </div>
        </footer>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
