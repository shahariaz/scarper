'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUserProfile, logoutUser } from '../store/slices/authSlice'
import { RootState, AppDispatch } from '../store/store'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { User, Settings, LogOut, Building2, Briefcase, Shield, Menu } from 'lucide-react'
import AuthModal from './AuthModal'

export default function Header() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, tokens } = useSelector((state: RootState) => state.auth)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Fetch user profile if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user])

  const handleLogout = () => {
    dispatch(logoutUser())
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

  const getUserInitials = (user: any) => {
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
      <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                BD Jobs Portal
              </h1>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium">
                  Jobs
                </a>
                <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium">
                  Companies
                </a>
                <a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium">
                  About
                </a>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-gray-400 hover:text-white"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-700/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url} alt={user.email} />
                        <AvatarFallback className="bg-yellow-500 text-gray-900 font-semibold">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none text-yellow-400">
                      {user.first_name || user.email}
                    </p>
                    <p className="text-xs leading-none text-gray-400">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      {getUserTypeIcon(user.user_type)}
                      <span className="capitalize">{user.user_type}</span>
                      {user.user_type === 'company' && !user.is_approved && (
                        <span className="text-orange-400">(Pending Approval)</span>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-6 py-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </Button>
            )}
          </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-700 bg-gray-800/95">
            <div className="px-4 py-2 space-y-1">
              <a href="#" className="block px-3 py-2 text-gray-300 hover:text-yellow-400 hover:bg-gray-700/50 rounded-md transition-colors duration-200">
                Jobs
              </a>
              <a href="#" className="block px-3 py-2 text-gray-300 hover:text-yellow-400 hover:bg-gray-700/50 rounded-md transition-colors duration-200">
                Companies
              </a>
              <a href="#" className="block px-3 py-2 text-gray-300 hover:text-yellow-400 hover:bg-gray-700/50 rounded-md transition-colors duration-200">
                About
              </a>
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
