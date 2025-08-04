'use client'

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, registerUser, clearError, fetchUserProfile } from '../store/slices/authSlice'
import { RootState, AppDispatch } from '../store/store'
import { apiService } from '../services/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)
  
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    user_type: '' as 'admin' | 'jobseeker' | 'company',
    profile: {
      first_name: '',
      last_name: '',
      phone: '',
      bio: '',
      // Company fields
      company_name: '',
      company_description: '',
      website: '',
      industry: '',
      company_size: '',
      location: '',
      // Job seeker fields
      experience_level: '',
      current_position: '',
      expected_salary: '',
      skills: ''
    }
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) return

    const result = await dispatch(loginUser({
      email: loginForm.email,
      password: loginForm.password
    }))

    if (loginUser.fulfilled.match(result)) {
      // Sync token with apiService for dashboard compatibility
      const token = result.payload?.tokens?.access_token
      if (token) {
        apiService.setToken(token)
      }
      
      // Fetch user profile after successful login
      await dispatch(fetchUserProfile())
      onClose()
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registerForm.email || !registerForm.password || !registerForm.user_type) {
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      // Handle password mismatch
      return
    }

    if (registerForm.user_type === 'company' && !registerForm.profile.company_name) {
      return
    }

    const result = await dispatch(registerUser({
      email: registerForm.email,
      password: registerForm.password,
      user_type: registerForm.user_type,
      profile: registerForm.profile
    }))

    if (registerUser.fulfilled.match(result)) {
      // Sync token with apiService for dashboard compatibility
      const token = result.payload?.tokens?.access_token
      if (token) {
        apiService.setToken(token)
      }
      
      // Fetch user profile after successful registration
      await dispatch(fetchUserProfile())
      onClose()
    }
  }

  const handleClearError = () => {
    dispatch(clearError())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-yellow-400">Welcome</DialogTitle>
          <DialogDescription className="text-gray-300">
            Sign in to your account or create a new one
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearError}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ×
              </Button>
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900">
              <TabsTrigger value="login" className="text-gray-300 data-[state=active]:text-yellow-400">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="text-gray-300 data-[state=active]:text-yellow-400">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="bg-gray-900 border-gray-600 text-white placeholder-gray-400 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-gray-300">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-user-type" className="text-gray-300">Account Type</Label>
                  <Select
                    value={registerForm.user_type}
                    onValueChange={(value: 'admin' | 'jobseeker' | 'company') => 
                      setRegisterForm({ ...registerForm, user_type: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                      <SelectItem value="jobseeker" className="text-white">Job Seeker</SelectItem>
                      <SelectItem value="company" className="text-white">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {registerForm.user_type === 'company' && (
                  <div className="space-y-2">
                    <Label htmlFor="company-name" className="text-gray-300">Company Name</Label>
                    <Input
                      id="company-name"
                      placeholder="Enter company name"
                      value={registerForm.profile.company_name}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        profile: { ...registerForm.profile, company_name: e.target.value }
                      })}
                      className="bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="text-gray-300">First Name</Label>
                    <Input
                      id="first-name"
                      placeholder="First name"
                      value={registerForm.profile.first_name}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        profile: { ...registerForm.profile, first_name: e.target.value }
                      })}
                      className="bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="text-gray-300">Last Name</Label>
                    <Input
                      id="last-name"
                      placeholder="Last name"
                      value={registerForm.profile.last_name}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        profile: { ...registerForm.profile, last_name: e.target.value }
                      })}
                      className="bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-gray-300">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-300">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                  disabled={isLoading || !registerForm.user_type}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
