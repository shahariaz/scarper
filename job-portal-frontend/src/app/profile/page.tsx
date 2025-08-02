'use client'

import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { fetchUserProfile, updateUserProfile, updateUserField } from '@/store/slices/authSlice'
import { fetchWithAuth } from '@/lib/auth-utils'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import ImageUpload from '@/components/ui/image-upload'
import ImageViewer from '@/components/ui/image-viewer'
import toast from 'react-hot-toast'
import { 
  Loader2, 
  User, 
  Building2, 
  Shield, 
  Settings, 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar, 
  Edit3,
  Activity,
  TrendingUp,
  FileText,
  Briefcase,
  Users,
  Eye,
  MessageSquare,
  Heart,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Globe2
} from 'lucide-react'

interface ProfileFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  bio: string
  location: string
  company_name: string
  website: string
  skills: string
  experience_level: string
  linkedin: string
  github: string
  portfolio: string
  twitter: string
  instagram: string
  facebook: string
  youtube: string
  dribbble: string
  behance: string
}

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [profileVisibility, setProfileVisibility] = useState(true)
  
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    company_name: '',
    website: '',
    skills: '',
    experience_level: '',
    linkedin: '',
    github: '',
    portfolio: '',
    twitter: '',
    instagram: '',
    facebook: '',
    youtube: '',
    dribbble: '',
    behance: ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/auth'
      return
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        company_name: user.company_name || '',
        website: user.website || '',
        skills: user.skills || '',
        experience_level: user.experience_level || '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        portfolio: user.portfolio || '',
        twitter: user.twitter || '',
        instagram: user.instagram || '',
        facebook: user.facebook || '',
        youtube: user.website_personal || '',
        dribbble: user.dribbble || '',
        behance: user.behance || ''
      })
    }
  }, [user])

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Profile not found</h2>
            <p className="text-gray-300">Unable to load your profile information.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin': return <Shield className="h-5 w-5 text-red-500" />
      case 'company': return <Building2 className="h-5 w-5 text-blue-500" />
      default: return <User className="h-5 w-5 text-green-500" />
    }
  }

  const getProfileCompletionScore = () => {
    const fields = [
      user.first_name, user.last_name, user.email, user.phone, user.bio, 
      user.location, user.skills, user.experience_level
    ]
    const filledFields = fields.filter(field => field && field.trim() !== '').length
    return Math.round((filledFields / fields.length) * 100)
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header Section */}
        <div className="relative mb-8">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg relative overflow-hidden group cursor-pointer"
               style={user.cover_url ? { 
                 backgroundImage: `url(${user.cover_url})`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               } : {}}>
            <div className="absolute inset-0 bg-black/20"></div>
            
            {/* Cover Image Viewer - only show if cover image exists */}
            {user.cover_url && (
              <ImageViewer
                src={user.cover_url}
                alt="Cover Photo"
                title="Cover Photo"
                trigger={
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 hover:bg-white/30 transition-colors">
                      <div className="flex items-center gap-2 text-white">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">View Cover Photo</span>
                      </div>
                    </div>
                  </div>
                }
              />
            )}
            
            {/* Cover Image Upload */}
            <div className="absolute top-4 right-4">
              <ImageUpload
                type="cover"
                currentImage={user.cover_url}
                onImageUpdate={async (imageUrl: string) => {
                  try {
                    console.log('🌅 Starting cover photo update with URL:', imageUrl)
                    
                    // Update backend with token refresh capability
                    const response = await fetchWithAuth(
                      'http://localhost:5000/api/auth/profile/cover',
                      {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ cover_url: imageUrl }),
                      },
                      tokens.access_token!,
                      tokens.refresh_token!,
                      (newTokens) => {
                        // Update Redux store with new tokens
                        dispatch({ type: 'auth/setTokens', payload: newTokens })
                      }
                    )

                    console.log('🌅 Backend response status:', response.status)
                    const data = await response.json()
                    console.log('🌅 Backend response data:', data)
                    
                    if (data.success) {
                      console.log('🌅 Backend update successful, updating Redux state...')
                      // Immediately update Redux state with the new cover_url
                      dispatch(updateUserField({ field: 'cover_url', value: imageUrl }))
                      toast.success('Cover photo updated successfully!')
                    } else {
                      throw new Error(data.message || 'Failed to update cover photo')
                    }
                  } catch (error: unknown) {
                    console.error('❌ Error updating cover:', error)
                    const errorMessage = error instanceof Error ? error.message : 'Failed to update cover photo'
                    toast.error(errorMessage)
                  }
                }}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="relative -mt-16 px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Profile Avatar with Upload */}
              <div className="relative group">
                <Avatar className="h-32 w-32 ring-4 ring-gray-800 shadow-lg cursor-pointer">
                  <AvatarImage src={user.avatar_url} alt="Profile" />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {user.user_type === 'company' 
                      ? user.company_name?.charAt(0).toUpperCase() 
                      : `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase() || 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                
                {/* Profile Image Viewer - only show if avatar exists */}
                {user.avatar_url && (
                  <ImageViewer
                    src={user.avatar_url}
                    alt="Profile Picture"
                    title="Profile Picture"
                    trigger={
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
                        <div className="bg-white/90 text-gray-800 rounded-lg px-3 py-1.5 hover:bg-white transition-colors shadow-lg">
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-3 w-3" />
                            <span className="text-xs font-medium">View</span>
                          </div>
                        </div>
                      </div>
                    }
                  />
                )}
                
                {/* Avatar Upload Button */}
                <div className="absolute -bottom-2 -right-2">
                  <ImageUpload
                    type="profile"
                    currentImage={user.avatar_url}
                    onImageUpdate={async (imageUrl: string) => {
                      try {
                        // Update backend with token refresh capability
                        const response = await fetchWithAuth(
                          'http://localhost:5000/api/auth/profile/avatar',
                          {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ avatar_url: imageUrl }),
                          },
                          tokens.access_token!,
                          tokens.refresh_token!,
                          (newTokens) => {
                            // Update Redux store with new tokens
                            dispatch({ type: 'auth/setTokens', payload: newTokens })
                          }
                        )

                        const data = await response.json()
                        
                        if (data.success) {
                          // Immediately update Redux state with the new avatar_url
                          dispatch(updateUserField({ field: 'avatar_url', value: imageUrl }))
                          toast.success('Profile picture updated successfully!')
                        } else {
                          throw new Error(data.message || 'Failed to update profile picture')
                        }
                      } catch (error: unknown) {
                        console.error('Error updating avatar:', error)
                        const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture'
                        toast.error(errorMessage)
                      }
                    }}
                    className="bg-white shadow-lg hover:shadow-xl border-2 border-blue-200 hover:border-blue-300"
                  />
                </div>
              </div>

              <div className="flex-1 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {user.user_type === 'company' 
                        ? (user.company_name || 'Company Profile')
                        : `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User Profile'
                      }
                    </h1>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        {getUserTypeIcon(user.user_type)}
                        <span className="capitalize font-medium text-white">{user.user_type}</span>
                      </div>
                      {user.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-300">{user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">Joined {user.created_at ? new Date(user.created_at).getFullYear() : 'recently'}</span>
                      </div>
                    </div>

                    <p className="text-gray-300 max-w-2xl mt-2">
                      {user.bio || 'No bio available.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="flex items-center gap-2 border-gray-700 text-white hover:bg-gray-800">
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Profile Visibility</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Switch 
                      checked={profileVisibility}
                      onCheckedChange={setProfileVisibility}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <span className="text-white">{profileVisibility ? 'Public Profile' : 'Private Profile'}</span>
                  </div>
                </div>
                <Eye className="h-5 w-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Profile Completion</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-white">{getProfileCompletionScore()}%</span>
                    </div>
                    <Progress value={getProfileCompletionScore()} className="h-2" />
                  </div>
                </div>
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Account Status</p>
                  <Badge 
                    variant={user.is_verified ? 'default' : 'secondary'} 
                    className={`mt-2 ${user.is_verified ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}
                  >
                    {user.is_verified ? 'Verified' : 'Pending Verification'}
                  </Badge>
                </div>
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Member Since</p>
                  <p className="font-semibold text-white mt-1">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    }) : 'Recently'}
                  </p>
                </div>
                <Calendar className="h-5 w-5 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-300">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-300">
              <FileText className="h-4 w-4" />
              Profile Details
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-300">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-300">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* About Section */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <User className="h-5 w-5" />
                      About {user.user_type === 'company' ? 'Company' : 'Me'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Bio</h4>
                      <p className="text-gray-300 leading-relaxed bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                        {user.bio || 'No bio provided yet. Click edit to add your bio.'}
                      </p>
                    </div>

                    {user.user_type === 'jobseeker' && (
                      <>
                        {user.skills && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {user.skills.split(',').map((skill, index) => (
                                <Badge key={index} variant="outline" className="bg-blue-600 text-white border-blue-500">
                                  {skill.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {user.experience_level && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">Experience Level</h4>
                            <Badge className="bg-green-600 text-white">
                              {user.experience_level}
                            </Badge>
                          </div>
                        )}
                      </>
                    )}

                    {user.user_type === 'company' && (
                      <>
                        {user.industry && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">Industry</h4>
                            <Badge className="bg-blue-600 text-white">
                              {user.industry}
                            </Badge>
                          </div>
                        )}

                        {user.company_size && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">Company Size</h4>
                            <p className="text-gray-300">{user.company_size}</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                {/* Activity Stats */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="h-5 w-5" />
                      Activity Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-400" />
                        <span className="text-white font-medium">Profile Views</span>
                      </div>
                      <span className="font-bold text-white">156</span>
                    </div>

                    {user.user_type === 'company' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-green-400" />
                            <span className="text-white font-medium">Active Jobs</span>
                          </div>
                          <span className="font-bold text-white">3</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-400" />
                            <span className="text-white font-medium">Applications</span>
                          </div>
                          <span className="font-bold text-white">47</span>
                        </div>
                      </>
                    )}

                    {user.user_type === 'jobseeker' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-green-400" />
                            <span className="text-white font-medium">Applications Sent</span>
                          </div>
                          <span className="font-bold text-white">12</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-400" />
                            <span className="text-white font-medium">Interview Invites</span>
                          </div>
                          <span className="font-bold text-white">3</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Mail className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-white">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-white">{user.phone}</span>
                      </div>
                    )}
                    {user.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {user.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-white">First Name</Label>
                      <Input 
                        value={formData.first_name} 
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        disabled={!isEditing}
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white">Last Name</Label>
                      <Input 
                        value={formData.last_name} 
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        disabled={!isEditing}
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white">Email</Label>
                    <Input 
                      value={formData.email} 
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white">Phone</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white">Location</Label>
                    <Input 
                      value={formData.location} 
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white">Bio</Label>
                    <Textarea 
                      value={formData.bio} 
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 bg-gray-700 border-gray-600 text-white"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Social & Professional Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-xs text-white">LinkedIn</Label>
                      <Input 
                        value={formData.linkedin} 
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://linkedin.com/in/username"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white">GitHub</Label>
                      <Input 
                        value={formData.github} 
                        onChange={(e) => handleInputChange('github', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://github.com/username"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white">Portfolio/Website</Label>
                      <Input 
                        value={formData.portfolio} 
                        onChange={(e) => handleInputChange('portfolio', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://yourwebsite.com"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white">Twitter</Label>
                      <Input 
                        value={formData.twitter} 
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://twitter.com/username"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white">Instagram</Label>
                      <Input 
                        value={formData.instagram} 
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://instagram.com/username"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white">Dribbble</Label>
                      <Input 
                        value={formData.dribbble} 
                        onChange={(e) => handleInputChange('dribbble', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://dribbble.com/username"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white">Behance</Label>
                      <Input 
                        value={formData.behance} 
                        onChange={(e) => handleInputChange('behance', e.target.value)}
                        disabled={!isEditing}
                        placeholder="https://behance.net/username"
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  {/* Display Social Links */}
                  {(user.linkedin || user.github || user.portfolio || user.twitter || user.instagram || user.dribbble || user.behance) && (
                    <div className="pt-4 border-t border-gray-700">
                      <h4 className="font-medium text-white mb-3">Your Links</h4>
                      <div className="space-y-2">
                        {user.linkedin && (
                          <a
                            href={user.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:text-blue-400 hover:bg-gray-700 p-2 rounded-lg transition-all"
                          >
                            <Linkedin className="h-4 w-4" />
                            LinkedIn Profile
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        )}
                        {user.github && (
                          <a
                            href={user.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:text-blue-400 hover:bg-gray-700 p-2 rounded-lg transition-all"
                          >
                            <Github className="h-4 w-4" />
                            GitHub Profile
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        )}
                        {user.portfolio && (
                          <a
                            href={user.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:text-blue-400 hover:bg-gray-700 p-2 rounded-lg transition-all"
                          >
                            <Globe2 className="h-4 w-4" />
                            Portfolio/Website
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        )}
                        {user.twitter && (
                          <a
                            href={user.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:text-blue-400 hover:bg-gray-700 p-2 rounded-lg transition-all"
                          >
                            <Twitter className="h-4 w-4" />
                            Twitter Profile
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        )}
                        {user.instagram && (
                          <a
                            href={user.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:text-blue-400 hover:bg-gray-700 p-2 rounded-lg transition-all"
                          >
                            <Instagram className="h-4 w-4" />
                            Instagram Profile
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        )}
                        {user.dribbble && (
                          <a
                            href={user.dribbble}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:text-blue-400 hover:bg-gray-700 p-2 rounded-lg transition-all"
                          >
                            <Globe2 className="h-4 w-4" />
                            Dribbble Profile
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        )}
                        {user.behance && (
                          <a
                            href={user.behance}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white hover:text-blue-400 hover:bg-gray-700 p-2 rounded-lg transition-all"
                          >
                            <Globe2 className="h-4 w-4" />
                            Behance Profile
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="text-white font-medium">Profile updated</p>
                      <p className="text-white/80 text-sm">You updated your bio and skills</p>
                      <p className="text-white/60 text-xs">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="text-white font-medium">Account verified</p>
                      <p className="text-white/80 text-sm">Your email address has been verified</p>
                      <p className="text-white/60 text-xs">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                    <div>
                      <p className="text-white font-medium">Account created</p>
                      <p className="text-white/80 text-sm">Welcome to the platform!</p>
                      <p className="text-white/60 text-xs">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Public Profile</Label>
                      <p className="text-white/80 text-sm">Make your profile visible to others</p>
                    </div>
                    <Switch checked={profileVisibility} onCheckedChange={setProfileVisibility} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Show Contact Info</Label>
                      <p className="text-white/80 text-sm">Display your contact information publicly</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Email Notifications</Label>
                      <p className="text-white/80 text-sm">Receive updates via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Account Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Update Email
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Data
                  </Button>
                  
                  <Separator />
                  
                  <Button variant="destructive" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}



