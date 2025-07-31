'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchUserProfile, updateUserProfile } from '../store/slices/authSlice'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { 
  User, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Briefcase, 
  GraduationCap,
  Award,
  Users,
  Globe,
  Camera,
  Edit,
  Save,
  X,
  Settings,
  ArrowLeft,
  Home,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch<AppDispatch>()
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    // Jobseeker specific
    skills: [] as string[],
    experience_years: '',
    education: '',
    resume_url: '',
    portfolio_url: '',
    // Company specific
    company_name: '',
    company_size: '',
    industry: '',
    website: '',
    description: '',
    founded_year: '',
  })

  // Debug log
  useEffect(() => {
    setMounted(true)
    console.log('ProfilePage Auth State:', { 
      isAuthenticated, 
      hasUser: !!user, 
      isLoading,
      hasToken: !!tokens.access_token
    })
  }, [isAuthenticated, user, isLoading, tokens.access_token])

  // Fetch user profile if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      console.log('Fetching user profile from ProfilePage...')
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  useEffect(() => {
    if (user) {
      // Parse skills from JSON string if it's a string, otherwise use as array
      let parsedSkills: string[] = []
      if (typeof user.skills === 'string') {
        try {
          parsedSkills = JSON.parse(user.skills)
        } catch {
          parsedSkills = user.skills ? [user.skills] : []
        }
      } else if (Array.isArray(user.skills)) {
        parsedSkills = user.skills
      }

      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        skills: parsedSkills,
        experience_years: user.experience_level || '',
        education: '',
        resume_url: user.resume_url || '',
        portfolio_url: '',
        company_name: user.company_name || '',
        company_size: user.company_size || '',
        industry: user.industry || '',
        website: user.website || '',
        description: user.company_description || '',
        founded_year: '',
      })
    }
  }, [user])

  const handleSave = async () => {
    try {
      // Convert skills array to JSON string for the API
      const profileData = {
        ...formData,
        skills: JSON.stringify(formData.skills)
      }
      
      await dispatch(updateUserProfile(profileData)).unwrap()
      setIsEditing(false)
      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      // The error will be handled by the Redux state
    }
  }

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      // Parse skills from JSON string if it's a string, otherwise use as array
      let parsedSkills: string[] = []
      if (typeof user.skills === 'string') {
        try {
          parsedSkills = JSON.parse(user.skills)
        } catch {
          parsedSkills = user.skills ? [user.skills] : []
        }
      } else if (Array.isArray(user.skills)) {
        parsedSkills = user.skills
      }

      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        skills: parsedSkills,
        experience_years: user.experience_level || '',
        education: '',
        resume_url: user.resume_url || '',
        portfolio_url: '',
        company_name: user.company_name || '',
        company_size: user.company_size || '',
        industry: user.industry || '',
        website: user.website || '',
        description: user.company_description || '',
        founded_year: '',
      })
    }
    setIsEditing(false)
  }

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      })
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    })
  }

  // Prevent hydration mismatch by showing loading until component is mounted
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Loading...</h2>
            <p className="text-gray-300">Please wait while we load your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show access denied only if not authenticated and component is mounted
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
            <p className="text-gray-300">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading if user is still being fetched
  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Loading Profile...</h2>
            <p className="text-gray-300">Please wait while we load your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-orange-400/5 pointer-events-none"></div>
      
      <div className="relative container mx-auto px-4 py-6 sm:py-8">
        {/* Navigation Breadcrumb */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <Link 
              href="/" 
              className="flex items-center text-gray-400 hover:text-yellow-400 transition-colors duration-200 font-medium"
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <span className="text-yellow-400 font-medium">Profile</span>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-4">
            <Link 
              href="/" 
              className="flex items-center text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-200 font-medium bg-gray-800/30"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            
            <Link 
              href="/settings" 
              className="flex items-center text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-200 font-medium"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          {/* Enhanced Profile Header */}
          <Card className="bg-gray-800/90 backdrop-blur-lg border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden">
            {/* Header Background */}
            <div className="h-32 sm:h-40 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-yellow-400/20 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-800/90"></div>
            </div>
            
            <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8 -mt-16 sm:-mt-20 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                <div className="relative group">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-gray-800 shadow-2xl">
                    <AvatarImage src={user.avatar_url} alt={user.email} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 text-2xl sm:text-4xl font-bold">
                      {user.first_name?.[0] || user.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 bg-gray-700 border-gray-600 hover:bg-gray-600 shadow-lg"
                  >
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white truncate">
                          {user.user_type === 'company' 
                            ? (user.company_name || 'Company Profile')
                            : `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
                          }
                        </h1>
                        <Badge 
                          variant="outline" 
                          className="capitalize bg-yellow-500/10 border-yellow-500/30 text-yellow-400 px-3 py-1 text-sm font-semibold"
                        >
                          {user.user_type}
                        </Badge>
                        {user.user_type === 'company' && !user.is_approved && (
                          <Badge 
                            variant="outline" 
                            className="bg-orange-500/10 border-orange-500/30 text-orange-400 px-3 py-1 text-sm font-semibold"
                          >
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-base sm:text-lg mb-2">{user.email}</p>
                      {user.location && (
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm sm:text-base">{user.location}</span>
                        </div>
                      )}
                      {user.bio && (
                        <p className="text-gray-300 text-sm sm:text-base line-clamp-2">{user.bio}</p>
                      )}
                    </div>

                    <div className="flex gap-2 sm:gap-3">
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`${
                          isEditing 
                            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900'
                        } font-semibold px-4 sm:px-6 py-2 shadow-lg transition-all duration-200 rounded-lg`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>
                  </div>

                  {/* Stats Row for mobile */}
                  <div className="grid grid-cols-3 gap-4 sm:hidden pt-4 border-t border-gray-700/50">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">0</div>
                      <div className="text-xs text-gray-400">Applications</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">0</div>
                      <div className="text-xs text-gray-400">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">0</div>
                      <div className="text-xs text-gray-400">Connections</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          {user.user_type === 'jobseeker' ? (
            <JobseekerProfile 
              user={user}
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              onSave={handleSave}
              onCancel={handleCancel}
              addSkill={addSkill}
              removeSkill={removeSkill}
            />
          ) : user.user_type === 'company' ? (
            <CompanyProfile 
              user={user}
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <AdminProfile 
              user={user}
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Jobseeker Profile Component
function JobseekerProfile({ user, formData, setFormData, isEditing, onSave, onCancel, addSkill, removeSkill }: any) {
  const [newSkill, setNewSkill] = useState('')

  return (
    <Tabs defaultValue="personal" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-gray-800/90 backdrop-blur-lg border-gray-700/50 rounded-xl p-1">
        <TabsTrigger value="personal" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-gray-900 text-sm font-medium rounded-lg transition-all duration-200">
          <User className="h-4 w-4 mr-2 sm:mr-1 lg:mr-2" />
          <span className="hidden sm:inline">Personal</span>
          <span className="sm:hidden">Info</span>
        </TabsTrigger>
        <TabsTrigger value="professional" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-gray-900 text-sm font-medium rounded-lg transition-all duration-200">
          <Briefcase className="h-4 w-4 mr-2 sm:mr-1 lg:mr-2" />
          <span className="hidden sm:inline">Professional</span>
          <span className="sm:hidden">Work</span>
        </TabsTrigger>
        <TabsTrigger value="skills" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-gray-900 text-sm font-medium rounded-lg transition-all duration-200">
          <Award className="h-4 w-4 mr-2 sm:mr-1 lg:mr-2" />
          Skills
        </TabsTrigger>
        <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-gray-900 text-sm font-medium rounded-lg transition-all duration-200">
          <GraduationCap className="h-4 w-4 mr-2 sm:mr-1 lg:mr-2" />
          <span className="hidden sm:inline">Documents</span>
          <span className="sm:hidden">Docs</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="space-y-6">
        <Card className="bg-gray-800/90 backdrop-blur-lg border-gray-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-lg">
                <User className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-yellow-400 text-xl">Personal Information</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Update your personal details and contact information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-gray-300 font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  disabled={!isEditing}
                  className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12"
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-gray-300 font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  disabled={!isEditing}
                  className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-900/30 border-gray-600 text-white opacity-50 rounded-lg h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300 font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-300 font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                disabled={!isEditing}
                className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12"
                placeholder="City, Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-gray-300 font-medium">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                disabled={!isEditing}
                className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg min-h-[120px] resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700/50">
                <Button onClick={onSave} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={onCancel} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3 rounded-lg transition-all duration-200">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="skills" className="space-y-6">
        <Card className="bg-gray-800/90 backdrop-blur-lg border-gray-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-lg">
                <Award className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-yellow-400 text-xl">Skills & Technologies</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Add your technical skills and expertise
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill (e.g., React, Python, Node.js)"
                  className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12 flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addSkill(newSkill)
                      setNewSkill('')
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    addSkill(newSkill)
                    setNewSkill('')
                  }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
                >
                  Add Skill
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {formData.skills.map((skill: string, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border-yellow-400/30 text-yellow-400 px-3 py-2 text-sm font-medium rounded-lg hover:from-yellow-400/20 hover:to-orange-500/20 transition-all duration-200"
                >
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {formData.skills.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No skills added yet</p>
                  <p className="text-sm">Add your first skill to get started</p>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700/50">
                <Button onClick={onSave} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={onCancel} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3 rounded-lg transition-all duration-200">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Add other tab contents with similar enhancements... */}
    </Tabs>
  )
}

// Company Profile Component
function CompanyProfile({ formData, setFormData, isEditing, onSave, onCancel }: any) {
  return (
    <Tabs defaultValue="company" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 bg-gray-800/90 backdrop-blur-lg border-gray-700/50 rounded-xl p-1">
        <TabsTrigger value="company" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-gray-900 text-sm font-medium rounded-lg transition-all duration-200">
          <Building2 className="h-4 w-4 mr-2 sm:mr-1 lg:mr-2" />
          <span className="hidden sm:inline">Company</span>
          <span className="sm:hidden">Info</span>
        </TabsTrigger>
        <TabsTrigger value="details" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-gray-900 text-sm font-medium rounded-lg transition-all duration-200">
          <Settings className="h-4 w-4 mr-2 sm:mr-1 lg:mr-2" />
          Details
        </TabsTrigger>
        <TabsTrigger value="contact" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-gray-900 text-sm font-medium rounded-lg transition-all duration-200">
          <Phone className="h-4 w-4 mr-2 sm:mr-1 lg:mr-2" />
          Contact
        </TabsTrigger>
      </TabsList>

      <TabsContent value="company" className="space-y-6">
        <Card className="bg-gray-800/90 backdrop-blur-lg border-gray-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-lg">
                <Building2 className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-yellow-400 text-xl">Company Information</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Basic information about your company
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-gray-300 font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Name
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                disabled={!isEditing}
                className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12"
                placeholder="Enter company name"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-gray-300 font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Industry
                </Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({...formData, industry: value})}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_size" className="text-gray-300 font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Company Size
                </Label>
                <Select
                  value={formData.company_size}
                  onValueChange={(value) => setFormData({...formData, company_size: value})}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300 font-medium">Company Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                disabled={!isEditing}
                className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg min-h-[120px] resize-none"
                placeholder="Describe your company, mission, and values..."
              />
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700/50">
                <Button onClick={onSave} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={onCancel} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3 rounded-lg transition-all duration-200">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="details" className="space-y-6">
        <Card className="bg-gray-800/90 backdrop-blur-lg border-gray-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-lg">
                <Settings className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-yellow-400 text-xl">Company Details</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Additional information about your company
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="founded_year" className="text-gray-300 font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Founded Year
                </Label>
                <Input
                  id="founded_year"
                  type="number"
                  value={formData.founded_year}
                  onChange={(e) => setFormData({...formData, founded_year: e.target.value})}
                  disabled={!isEditing}
                  className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12"
                  placeholder="e.g., 2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-gray-300 font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  disabled={!isEditing}
                  className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12"
                  placeholder="https://www.yourcompany.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-300 font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                disabled={!isEditing}
                className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12"
                placeholder="City, Country"
              />
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700/50">
                <Button onClick={onSave} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={onCancel} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3 rounded-lg transition-all duration-200">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contact" className="space-y-6">
        <Card className="bg-gray-800/90 backdrop-blur-lg border-gray-700/50 shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-lg">
                <Phone className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-yellow-400 text-xl">Contact Information</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  How people can reach your company
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-900/30 border-gray-600 text-white opacity-50 rounded-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300 font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!isEditing}
                className="bg-gray-900/50 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 rounded-lg h-12"
                placeholder="Company phone number"
              />
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700/50">
                <Button onClick={onSave} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={onCancel} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3 rounded-lg transition-all duration-200">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

// Admin Profile Component
function AdminProfile({ user, formData, setFormData, isEditing, onSave, onCancel }: any) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-yellow-400">Admin Profile</CardTitle>
        <CardDescription className="text-gray-400">
          Administrative account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-gray-300">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              disabled={!isEditing}
              className="bg-gray-900 border-gray-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-gray-300">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              disabled={!isEditing}
              className="bg-gray-900 border-gray-600 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            disabled
            className="bg-gray-900 border-gray-600 text-white opacity-50"
          />
        </div>

        {isEditing && (
          <div className="flex gap-4 pt-4">
            <Button onClick={onSave} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={onCancel} variant="outline" className="border-gray-600 text-gray-300">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
