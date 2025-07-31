'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchUserProfile, getUserSettings, updateUserSettings, changePassword } from '../store/slices/authSlice'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Shield, 
  Bell, 
  Lock, 
  Globe,
  Save,
  X,
  ArrowLeft,
  Home,
  ChevronRight,
  User
} from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch<AppDispatch>()
  const [mounted, setMounted] = useState(false)
  
  const [settings, setSettings] = useState({
    // Privacy settings
    profileVisible: true,
    emailVisible: true,
    phoneVisible: false,
    showOnlineStatus: true,
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    jobAlerts: true,
    messageNotifications: true,
    weeklyDigest: false,
    
    // Account settings
    twoFactorEnabled: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Language and region
    language: 'en',
    timezone: 'UTC+6',
    currency: 'BDT',
  })

  // Debug log
  useEffect(() => {
    setMounted(true)
    console.log('SettingsPage Auth State:', { 
      isAuthenticated, 
      hasUser: !!user, 
      isLoading,
      hasToken: !!tokens.access_token
    })
  }, [isAuthenticated, user, isLoading, tokens.access_token])

  // Fetch user profile and settings if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      console.log('Fetching user profile from SettingsPage...')
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  // Load user settings
  useEffect(() => {
    if (tokens.access_token && user) {
      dispatch(getUserSettings())
    }
  }, [dispatch, tokens.access_token, user])

  const handleSave = async () => {
    try {
      await dispatch(updateUserSettings(settings)).unwrap()
      console.log('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handlePasswordChange = async () => {
    if (!settings.currentPassword || !settings.newPassword) {
      console.error('Please fill in all password fields')
      return
    }

    if (settings.newPassword !== settings.confirmPassword) {
      console.error('New passwords do not match')
      return
    }

    try {
      await dispatch(changePassword({
        current_password: settings.currentPassword,
        new_password: settings.newPassword
      })).unwrap()
      
      // Clear password fields on success
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      
      console.log('Password changed successfully')
    } catch (error) {
      console.error('Failed to change password:', error)
    }
  }

  const handleReset = () => {
    // Reset settings to default values
    setSettings({
      // Privacy settings
      profileVisible: true,
      emailVisible: true,
      phoneVisible: false,
      showOnlineStatus: true,
      
      // Notification settings  
      emailNotifications: true,
      pushNotifications: true,
      jobAlerts: true,
      messageNotifications: true,
      weeklyDigest: false,
      
      // Account settings
      twoFactorEnabled: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      
      // Language and region
      language: 'en',
      timezone: 'UTC+6',
      currency: 'BDT',
    })
  }

  // Prevent hydration mismatch by showing loading until component is mounted
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  // Show access denied only if not authenticated and component is mounted
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">Please log in to access settings.</p>
        </div>
      </div>
    )
  }

  // Show loading if user is still being fetched
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation Breadcrumb */}
      <div className="relative border-b border-gray-700/30 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Link 
                href="/" 
                className="flex items-center text-gray-400 hover:text-yellow-400 transition-colors duration-200 font-medium"
              >
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-500" />
              <span className="text-yellow-400 font-medium">Settings</span>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/" 
                className="flex items-center text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              
              <Link 
                href="/profile" 
                className="flex items-center text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Header Section */}
      <div className="relative border-b border-gray-700/50 backdrop-blur-lg bg-gray-900/90">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-orange-500/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Account Settings
              </h1>
              <p className="text-gray-400 text-lg">
                Manage your account preferences and security settings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleReset} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="privacy" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="privacy" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900">
              <Globe className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Control who can see your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-center text-gray-400 py-8">Privacy settings would go here...</p>
                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-center text-gray-400 py-8">Notification settings would go here...</p>
                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-center text-gray-400 py-8">Security settings would go here...</p>
                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Preferences
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-gray-300">Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => setSettings({...settings, language: value})}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="bn">বাংলা</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => setSettings({...settings, timezone: value})}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="UTC+6">UTC+6 (Dhaka)</SelectItem>
                        <SelectItem value="UTC+0">UTC+0 (GMT)</SelectItem>
                        <SelectItem value="UTC-5">UTC-5 (EST)</SelectItem>
                        <SelectItem value="UTC-8">UTC-8 (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-gray-300">Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => setSettings({...settings, currency: value})}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white w-full md:w-1/2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
