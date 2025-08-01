'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { fetchUserProfile, logoutUser } from '@/store/slices/authSlice'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import {
  Home,
  Briefcase,
  Users,
  Settings,
  User,
  LogOut,
  Menu,
  Search,
  Bell,
  Shield,
  BarChart3,
  FileText,
  Heart,
  HelpCircle,
  Moon,
} from 'lucide-react'
import AuthModal from '@/components/AuthModal'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCounts, setPendingCounts] = useState({
    jobs: 0,
    companies: 0,
    applications: 0
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user profile if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user])

  // Fetch pending counts for admin users
  const fetchPendingCounts = useCallback(async () => {
    if (!tokens.access_token || user?.user_type !== 'admin') return
    
    try {
      // Fetch pending jobs count
      const jobsResponse = await fetch('/api/jobs/search?show_unapproved=true&limit=1000', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })
      
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        const pendingJobs = jobsData.jobs?.filter((job: { status: string; approved_by_admin: boolean }) => 
          !job.approved_by_admin && job.status !== 'inactive'
        ).length || 0
        
        // Fetch pending companies count
        const companiesResponse = await fetch('/api/companies/pending', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })
        
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json()
          const pendingCompanies = companiesData.companies?.length || 0
          
          setPendingCounts(prev => ({
            ...prev,
            jobs: pendingJobs,
            companies: pendingCompanies
          }))
        } else {
          console.error('Failed to fetch companies:', companiesResponse.status)
        }
      }
    } catch (error) {
      console.error('Error fetching pending counts:', error)
    }
  }, [tokens.access_token, user?.user_type])

  useEffect(() => {
    if (mounted && tokens.access_token && user?.user_type === 'admin') {
      fetchPendingCounts()
      
      // Set up interval to refresh counts every 30 seconds
      const interval = setInterval(fetchPendingCounts, 30000)
      
      // Listen for custom events to refresh counts immediately
      const handleRefreshCounts = () => {
        fetchPendingCounts()
      }
      window.addEventListener('refreshAdminCounts', handleRefreshCounts)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('refreshAdminCounts', handleRefreshCounts)
      }
    }
  }, [mounted, tokens.access_token, user, fetchPendingCounts])

  const handleLogout = () => {
    dispatch(logoutUser())
    router.push('/')
  }

  const getUserInitials = (user: { first_name?: string; last_name?: string; email?: string }) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const navigationItems = [
    {
      title: 'Home',
      href: '/',
      icon: Home,
      description: 'Back to job listings',
      public: true
    },
    {
      title: 'Dashboard',
      href: user?.user_type === 'company' ? '/company-dashboard' : '/dashboard',
      icon: BarChart3,
      description: 'Overview and statistics',
      badge: user?.user_type === 'company' && !user?.is_approved ? 'Pending' : null,
      protected: true
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Manage your profile',
      protected: true
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Account preferences',
      protected: true
    },
    // Company specific
    ...(user?.user_type === 'company' ? [
      {
        title: 'Post Job',
        href: '/post-job',
        icon: FileText,
        description: 'Create new job posting',
        protected: true
      },
      {
        title: 'Applications',
        href: '/applications',
        icon: Users,
        description: 'Manage applications',
        badge: '0',
        protected: true
      }
    ] : []),
    // Job seeker specific
    ...(user?.user_type === 'jobseeker' ? [
      {
        title: 'Saved Jobs',
        href: '/saved-jobs',
        icon: Heart,
        description: 'Your saved positions',
        badge: '0',
        protected: true
      },
      {
        title: 'Applications',
        href: '/my-applications',
        icon: Briefcase,
        description: 'Track your applications',
        badge: '0',
        protected: true
      }
    ] : []),
    // Admin specific
    ...(user?.user_type === 'admin' ? [
      {
        title: 'Admin Panel',
        href: '/admin',
        icon: Shield,
        description: 'System administration',
        protected: true
      },
      {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
        description: 'Manage users',
        protected: true
      },
      {
        title: 'Job Approvals',
        href: '/admin/jobs',
        icon: FileText,
        description: 'Review job postings',
        badge: pendingCounts.jobs > 0 ? pendingCounts.jobs.toString() : null,
        protected: true
      },
      {
        title: 'Company Approvals',
        href: '/admin/companies',
        icon: Briefcase,
        description: 'Review company profiles',
        badge: pendingCounts.companies > 0 ? pendingCounts.companies.toString() : null,
        protected: true
      }
    ] : [])
  ]

  // Get dynamic page title based on current route and user
  const getPageTitle = () => {
    if (!mounted || !user) return 'BD Jobs'
    
    switch (pathname) {
      case '/profile':
        if (user.user_type === 'company') {
          return user.company_name || 'Company Profile'
        }
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'My Profile'
      case '/settings':
        if (user.user_type === 'company') {
          return `${user.company_name || 'Company'} Settings`
        }
        return 'Account Settings'
      case '/company-dashboard':
        return user.company_name || 'Company Dashboard'
      case '/dashboard':
        if (user.user_type === 'admin') {
          return 'Admin Dashboard'
        }
        return 'Dashboard'
      default:
        return 'BD Jobs'
    }
  }

  // Get dynamic page subtitle
  const getPageSubtitle = () => {
    if (!mounted || !user) return null
    
    switch (pathname) {
      case '/profile':
        return 'Manage your profile information'
      case '/settings':
        return 'Account preferences and settings'
      case '/company-dashboard':
        return user.is_approved ? 'Company overview' : 'Awaiting approval'
      case '/dashboard':
        if (user.user_type === 'admin') {
          return 'System administration'
        }
        return 'Your job search overview'
      default:
        return null
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Company/User Header */}
      <div className="flex h-16 items-center border-b border-gray-800 px-6">
        <Link href="/" className="flex items-center space-x-3 flex-1 overflow-hidden">
          <Avatar className="h-8 w-8 ring-2 ring-yellow-400/30 flex-shrink-0">
            <AvatarImage src={user?.avatar_url} alt={user?.email} />
            <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-semibold text-xs">
              {mounted && user ? getUserInitials(user) : 'BJ'}
            </AvatarFallback>
          </Avatar>
          {mounted && isAuthenticated && user ? (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {user.user_type === 'company' 
                  ? (user.company_name || 'Company Account')
                  : `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
                }
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className="text-xs border-yellow-400/30 text-yellow-400 bg-yellow-400/10"
                >
                  {user.user_type}
                </Badge>
                {user.user_type === 'company' && !user.is_approved && (
                  <Badge 
                    variant="outline" 
                    className="text-xs border-orange-400/30 text-orange-400 bg-orange-400/10"
                  >
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                BD Jobs
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigationItems.map((item) => {
          if (item.protected && (!mounted || !isAuthenticated)) return null
          if (!item.public && !item.protected && (!mounted || !isAuthenticated)) return null

          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-gray-800 ${
                isActive 
                  ? 'bg-yellow-400/10 text-yellow-400 border-r-2 border-yellow-400' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-yellow-400' : 'text-gray-400 group-hover:text-gray-300'}`} />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge 
                  variant="secondary" 
                  className="ml-auto h-5 w-auto px-1.5 text-xs bg-gray-700 text-gray-300"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <div className="space-y-2">
          <Link
            href="/help"
            className="flex items-center rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <HelpCircle className="mr-3 h-4 w-4" />
            Help & Support
          </Link>
          {mounted && isAuthenticated && (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-gray-900 border-gray-800">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-gray-900 border-r border-gray-800">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Dynamic page title and breadcrumb */}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              {mounted && user && (
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-white truncate">
                    {getPageTitle()}
                  </h1>
                  {getPageSubtitle() && (
                    <>
                      <span className="text-gray-500">/</span>
                      <span className="text-sm text-gray-400 truncate">
                        {getPageSubtitle()}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Search */}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Search className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white relative">
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></div>
              </Button>

              {/* Theme toggle */}
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Moon className="h-5 w-5" />
              </Button>

              {/* User menu */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} alt={user.email} />
                        <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 text-xs font-semibold">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-white">{user.email}</p>
                        <p className="text-xs text-gray-400 capitalize">{user.user_type}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem className="text-gray-300 hover:text-white" asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-300 hover:text-white" asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem 
                      className="text-red-400 hover:text-red-300"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-medium"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-xs">BJ</span>
                </div>
                <span className="text-sm text-gray-400">
                  © 2025 BD Jobs Portal. All rights reserved.
                </span>
              </div>
              <div className="flex space-x-4 mt-4 sm:mt-0">
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">
                  Privacy
                </Link>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white">
                  Terms
                </Link>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  )
}
