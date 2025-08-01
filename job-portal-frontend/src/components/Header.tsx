'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUserProfile, logoutUser } from '../store/slices/authSlice'
import { RootState, AppDispatch } from '../store/store'
import { apiService } from '../services/api'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { User, Settings, LogOut, Building2, Briefcase, Shield, Menu, Home } from 'lucide-react'
import AuthModal from './AuthModal'

export default function Header() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { user, isAuthenticated, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Debug: Log the current auth state and set mounted
  useEffect(() => {
    setMounted(true)
    console.log('Auth State:', { 
      isAuthenticated, 
      hasUser: !!user, 
      hasToken: !!tokens.access_token 
    })
  }, [isAuthenticated, user, tokens.access_token])

  // Fetch user profile if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user) {
      // Sync token with apiService for dashboard compatibility
      apiService.setToken(tokens.access_token)
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user])

  const handleLogout = () => {
    dispatch(logoutUser())
    // Clear apiService token for dashboard compatibility
    apiService.clearAuth()
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'company':
        return <Building2 className="h-4 w-4" />
      case 'jobseeker':
        return <Briefcase className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-700/50 bg-gray-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-gray-900/60 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4 lg:space-x-8">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-sm">BJ</span>
                </div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent">
                  BD Jobs Portal
                </h1>
              </div>
              
              {/* Navigation Links - Enhanced for mobile */}
              <nav className="hidden lg:flex items-center space-x-1">
                <Link href="/" className="px-3 py-2 rounded-lg text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 transition-all duration-200 font-medium text-sm">
                  Home
                </Link>
                <Link href="/jobs" className="px-3 py-2 rounded-lg text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 transition-all duration-200 font-medium text-sm">
                  Jobs
                </Link>
                <Link href="/companies" className="px-3 py-2 rounded-lg text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 transition-all duration-200 font-medium text-sm">
                  Companies
                </Link>
                <Link href="/blogs" className="px-3 py-2 rounded-lg text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 transition-all duration-200 font-medium text-sm">
                  Blog
                </Link>
                <Link href="/about" className="px-3 py-2 rounded-lg text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 transition-all duration-200 font-medium text-sm">
                  About
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile menu button - Always visible for navigation */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800/50 h-10 w-10 rounded-lg transition-all duration-200"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Search Button for mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden text-gray-400 hover:text-white hover:bg-gray-800/50 h-10 w-10 rounded-lg transition-all duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>
              
              {/* Show loading placeholder until mounted to prevent hydration issues */}
              {!mounted ? (
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-gray-800/50 rounded-full animate-pulse"></div>
                </div>
              ) : isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-800/50 transition-all duration-200 ring-2 ring-transparent hover:ring-yellow-400/20">
                      <Avatar className="h-10 w-10 ring-2 ring-gray-700 hover:ring-yellow-400/50 transition-all duration-200">
                        <AvatarImage src={user.avatar_url} alt={user.email} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-semibold text-sm">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online status indicator */}
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-gray-900 rounded-full"></div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-gray-800/95 backdrop-blur-lg border-gray-700/50 shadow-xl rounded-xl p-2" align="end" forceMount>
                    <div className="flex flex-col space-y-2 p-3 border-b border-gray-700/50">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 ring-2 ring-yellow-400/30">
                          <AvatarImage src={user.avatar_url} alt={user.email} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-semibold">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-none text-white truncate">
                            {user.user_type === 'company' 
                              ? (user.company_name || 'Company Account')
                              : `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
                            }
                          </p>
                          <p className="text-xs leading-none text-gray-400 mt-1 truncate">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                              {getUserTypeIcon(user.user_type)}
                              <span className="capitalize text-yellow-400 font-medium">{user.user_type}</span>
                            </div>
                            {user.user_type === 'company' && !user.is_approved && (
                              <div className="px-2 py-1 rounded-full bg-orange-400/10 border border-orange-400/20">
                                <span className="text-orange-400 text-xs font-medium">Pending</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg mx-1 transition-all duration-200 cursor-pointer" onClick={() => router.push('/profile')}>
                        <User className="mr-3 h-4 w-4" />
                        <span className="font-medium">Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg mx-1 transition-all duration-200 cursor-pointer" onClick={() => router.push('/settings')}>
                        <Settings className="mr-3 h-4 w-4" />
                        <span className="font-medium">Settings</span>
                      </DropdownMenuItem>
                      
                      {user.user_type === 'company' && (
                        <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg mx-1 transition-all duration-200 cursor-pointer" onClick={() => router.push('/company-dashboard')}>
                          <Building2 className="mr-3 h-4 w-4" />
                          <span className="font-medium">Company Dashboard</span>
                        </DropdownMenuItem>
                      )}
                      
                      {user.user_type === 'admin' && (
                        <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg mx-1 transition-all duration-200 cursor-pointer">
                          <Shield className="mr-3 h-4 w-4" />
                          <span className="font-medium">Admin Panel</span>
                        </DropdownMenuItem>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t border-gray-700/50">
                      <DropdownMenuItem 
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg mx-1 transition-all duration-200 cursor-pointer"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span className="font-medium">Sign out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAuthModal(true)}
                    className="hidden sm:inline-flex text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 font-medium"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold px-4 sm:px-6 py-2 transition-all duration-200 shadow-lg hover:shadow-xl rounded-lg text-sm sm:text-base"
                  >
                    <span className="sm:hidden">Sign Up</span>
                    <span className="hidden sm:inline">Get Started</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-700/50 bg-gray-900/98 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              {/* Quick Home Navigation */}
              <div className="pb-2 mb-2 border-b border-gray-700/30">
                <Link 
                  href="/" 
                  className="flex items-center px-4 py-3 text-yellow-400 hover:text-yellow-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-semibold bg-yellow-400/5"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Home className="h-5 w-5 mr-3" />
                  Back to Home
                </Link>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Link href="/jobs" className="flex items-center px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium">
                  <Briefcase className="h-5 w-5 mr-3" />
                  Jobs
                  <span className="ml-auto text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">New</span>
                </Link>
                <Link href="/companies" className="flex items-center px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium">
                  <Building2 className="h-5 w-5 mr-3" />
                  Companies
                </Link>
                <Link href="/blogs" className="flex items-center px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium">
                  <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Blog
                </Link>
                <Link href="/about" className="flex items-center px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium">
                  <User className="h-5 w-5 mr-3" />
                  About
                </Link>
              </div>
              
              {/* Show loading placeholder or authenticated/unauthenticated content */}
              {!mounted ? (
                <div className="pt-4 border-t border-gray-700/50 mt-4">
                  <div className="w-full h-12 bg-gray-800/50 rounded-lg animate-pulse"></div>
                </div>
              ) : !isAuthenticated ? (
                <div className="pt-4 border-t border-gray-700/50 mt-4">
                  <Button
                    onClick={() => {
                      setShowAuthModal(true)
                      setShowMobileMenu(false)
                    }}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold py-3 transition-all duration-200 shadow-lg rounded-lg"
                  >
                    Get Started
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-700/50 mt-4 space-y-2">
                  <Link 
                    href="/profile" 
                    className="flex items-center px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Profile
                  </Link>
                  <Link 
                    href="/settings" 
                    className="flex items-center px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </Link>
                  {user?.user_type === 'company' && (
                    <Link 
                      href="/company-dashboard" 
                      className="flex items-center px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Building2 className="h-5 w-5 mr-3" />
                      Company Dashboard
                    </Link>
                  )}
                  {user?.user_type === 'admin' && (
                    <Link 
                      href="/admin" 
                      className="flex items-center px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Shield className="h-5 w-5 mr-3" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowMobileMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200 font-medium"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  )
}
