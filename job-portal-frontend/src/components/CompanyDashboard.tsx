'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { RootState, AppDispatch } from '../store/store'
import { fetchUserProfile } from '../store/slices/authSlice'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  Building2, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  MessageSquare,
  BarChart3,
  Clock,
  CheckCircle,
  Home,
  ChevronRight,
  MapPin
} from 'lucide-react'

interface JobPosting {
  id: number
  title: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  status: 'active' | 'paused' | 'closed'
  applications: number
  views: number
  created_at: string
  expires_at: string
}

interface Applicant {
  id: number
  name: string
  email: string
  position: string
  status: 'pending' | 'shortlisted' | 'interviewed' | 'hired' | 'rejected'
  applied_at: string
  resume_url?: string
  avatar_url?: string
}

export default function CompanyDashboard() {
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch<AppDispatch>()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Mock data - in real app, this would come from API
  const [jobPostings] = useState<JobPosting[]>([
    {
      id: 1,
      title: 'Senior Frontend Developer',
      location: 'Dhaka, Bangladesh',
      type: 'full-time',
      status: 'active',
      applications: 24,
      views: 156,
      created_at: '2024-01-15',
      expires_at: '2024-02-15'
    },
    {
      id: 2,
      title: 'UI/UX Designer',
      location: 'Remote',
      type: 'full-time',
      status: 'active',
      applications: 18,
      views: 89,
      created_at: '2024-01-20',
      expires_at: '2024-02-20'
    },
    {
      id: 3,
      title: 'Backend Developer',
      location: 'Chittagong, Bangladesh',
      type: 'contract',
      status: 'paused',
      applications: 12,
      views: 67,
      created_at: '2024-01-10',
      expires_at: '2024-02-10'
    }
  ])

  const [recentApplicants] = useState<Applicant[]>([
    {
      id: 1,
      name: 'Ahmed Rahman',
      email: 'ahmed@email.com',
      position: 'Senior Frontend Developer',
      status: 'pending',
      applied_at: '2024-01-25',
      resume_url: '/resumes/ahmed-rahman.pdf'
    },
    {
      id: 2,
      name: 'Fatima Khan',
      email: 'fatima@email.com',
      position: 'UI/UX Designer',
      status: 'shortlisted',
      applied_at: '2024-01-24',
      resume_url: '/resumes/fatima-khan.pdf'
    },
    {
      id: 3,
      name: 'Rashid Ali',
      email: 'rashid@email.com',
      position: 'Backend Developer',
      status: 'interviewed',
      applied_at: '2024-01-23',
      resume_url: '/resumes/rashid-ali.pdf'
    }
  ])

  // Debug log and set mounted
  useEffect(() => {
    setMounted(true)
    console.log('CompanyDashboard Auth State:', { 
      isAuthenticated, 
      hasUser: !!user, 
      userType: user?.user_type,
      isApproved: user?.is_approved 
    })
  }, [isAuthenticated, user])

  // Fetch user profile if needed
  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  // Prevent hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Check authentication and user type
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-lg border-gray-700/50">
          <CardContent className="p-8 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">Please log in to access the company dashboard</p>
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold">
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is a company
  if (user.user_type !== 'company') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-lg border-gray-700/50">
          <CardContent className="p-8 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Company Access Only</h2>
            <p className="text-gray-400 mb-6">This dashboard is only available for company accounts</p>
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold">
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if company is approved
  if (!user.is_approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-lg border-gray-700/50">
          <CardContent className="p-8 text-center">
            <Clock className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Account Pending Approval</h2>
            <p className="text-gray-400 mb-6">Your company account is currently under review. You&apos;ll receive an email once approved.</p>
            <div className="space-y-3">
              <Link href="/profile">
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                  Update Company Profile
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold">
                  Go to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'closed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'shortlisted': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'interviewed': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'hired': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'full-time': return <Briefcase className="h-4 w-4" />
      case 'part-time': return <Clock className="h-4 w-4" />
      case 'contract': return <FileText className="h-4 w-4" />
      case 'internship': return <Users className="h-4 w-4" />
      default: return <Briefcase className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-orange-400/5 pointer-events-none"></div>
      
      <div className="relative container mx-auto px-4 py-6 sm:py-8">
        {/* Navigation Breadcrumb */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <Link 
              href="/" 
              className="flex items-center text-gray-400 hover:text-yellow-400 transition-colors duration-200 font-medium"
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <span className="text-yellow-400 font-medium">Company Dashboard</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Building2 className="h-8 w-8 text-gray-900" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {user.company_name || 'Company Dashboard'}
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Manage your jobs, applications, and company profile
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Link href="/jobs/create">
                  <Button 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post New Job
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-xl p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-400 text-gray-400 rounded-lg">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-400 text-gray-400 rounded-lg">
                <Briefcase className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="applicants" className="data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-400 text-gray-400 rounded-lg">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Applicants</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-400 text-gray-400 rounded-lg">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-400 text-gray-400 rounded-lg">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-400 text-gray-400 rounded-lg">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-400 text-gray-400 rounded-lg">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50 hover:border-yellow-400/30 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Active Jobs</p>
                        <p className="text-2xl font-bold text-white">{jobPostings.filter(j => j.status === 'active').length}</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50 hover:border-yellow-400/30 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Total Applications</p>
                        <p className="text-2xl font-bold text-white">{jobPostings.reduce((sum, job) => sum + job.applications, 0)}</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50 hover:border-yellow-400/30 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Total Views</p>
                        <p className="text-2xl font-bold text-white">{jobPostings.reduce((sum, job) => sum + job.views, 0)}</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Eye className="h-6 w-6 text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50 hover:border-yellow-400/30 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Hired This Month</p>
                        <p className="text-2xl font-bold text-white">{recentApplicants.filter(a => a.status === 'hired').length}</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-yellow-400" />
                      Recent Job Postings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {jobPostings.slice(0, 3).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
                            {getJobTypeIcon(job.type)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{job.title}</p>
                            <p className="text-sm text-gray-400">{job.location}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(job.status)} border`}>
                          {job.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-yellow-400" />
                      Recent Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentApplicants.slice(0, 3).map((applicant) => (
                      <div key={applicant.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={applicant.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 text-sm font-semibold">
                              {applicant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">{applicant.name}</p>
                            <p className="text-sm text-gray-400">{applicant.position}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(applicant.status)} border`}>
                          {applicant.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="mt-6">
              <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-white">Job Postings</CardTitle>
                      <CardDescription className="text-gray-400">
                        Manage your active job postings
                      </CardDescription>
                    </div>
                    <Link href="/jobs/create">
                      <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Job
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jobPostings.map((job) => (
                      <div key={job.id} className="p-6 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200 border border-gray-600/30 hover:border-yellow-400/30">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="h-12 w-12 rounded-lg bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                              {getJobTypeIcon(job.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-white text-lg">{job.title}</h3>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Posted {new Date(job.created_at).toLocaleDateString()}
                                </span>
                                <Badge className={`${getStatusColor(job.status)} border`}>
                                  {job.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-sm text-gray-400">
                                  <Users className="h-4 w-4 inline mr-1" />
                                  {job.applications} applications
                                </span>
                                <span className="text-sm text-gray-400">
                                  <Eye className="h-4 w-4 inline mr-1" />
                                  {job.views} views
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-900/20">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applicants Tab */}
            <TabsContent value="applicants" className="mt-6">
              <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Job Applications</CardTitle>
                  <CardDescription className="text-gray-400">
                    Review and manage candidate applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentApplicants.map((applicant) => (
                      <div key={applicant.id} className="p-6 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200 border border-gray-600/30 hover:border-yellow-400/30">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-4 flex-1">
                            <Avatar className="h-12 w-12 ring-2 ring-gray-600">
                              <AvatarImage src={applicant.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-semibold">
                                {applicant.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-white">{applicant.name}</h3>
                              <p className="text-gray-400">{applicant.email}</p>
                              <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                                <span>Applied for: {applicant.position}</span>
                                <span>•</span>
                                <span>{new Date(applicant.applied_at).toLocaleDateString()}</span>
                                <Badge className={`${getStatusColor(applicant.status)} border`}>
                                  {applicant.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {applicant.resume_url && (
                              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                <FileText className="h-4 w-4 mr-2" />
                                Resume
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Shortlist
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs will be implemented in subsequent updates */}
            <TabsContent value="analytics" className="mt-6">
              <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-400">Detailed hiring analytics and reports will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
              <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Messages Coming Soon</h3>
                  <p className="text-gray-400">Communicate with candidates directly from your dashboard.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="mt-6">
              <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Team Management Coming Soon</h3>
                  <p className="text-gray-400">Manage team members and recruiters with different access levels.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Company Settings</h3>
                  <p className="text-gray-400 mb-6">Configure your company dashboard preferences and settings.</p>
                  <Link href="/profile">
                    <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold">
                      Edit Company Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
