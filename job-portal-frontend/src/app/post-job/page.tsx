'use client'

import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { fetchUserProfile } from '@/store/slices/authSlice'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Settings,
  Eye,
  Save,
  Send,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  FileText,
  Globe
} from 'lucide-react'

interface JobFormData {
  title: string
  company: string
  location: string
  job_type: string
  work_mode: string
  description: string
  requirements: string
  responsibilities: string
  benefits: string
  salary_min: string
  salary_max: string
  salary_currency: string
  experience_level: string
  skills: string[]
  education_requirements: string
  apply_email: string
  apply_link: string
  deadline: string
  category: string
  industry: string
  company_size: string
  contact_person: string
  contact_phone: string
  company_website: string
  tags: string[]
  status: string
}

const initialFormData: JobFormData = {
  title: '',
  company: '',
  location: '',
  job_type: 'Full-time',
  work_mode: 'On-site',
  description: '',
  requirements: '',
  responsibilities: '',
  benefits: '',
  salary_min: '',
  salary_max: '',
  salary_currency: 'BDT',
  experience_level: '',
  skills: [],
  education_requirements: '',
  apply_email: '',
  apply_link: '',
  deadline: '',
  category: '',
  industry: '',
  company_size: '',
  contact_person: '',
  contact_phone: '',
  company_website: '',
  tags: [],
  status: 'active'
}

export default function PostJob() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<JobFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [newSkill, setNewSkill] = useState('')
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user profile if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  // Pre-fill company information
  useEffect(() => {
    if (user && user.user_type === 'company') {
      setFormData(prev => ({
        ...prev,
        company: user.company_name || '',
        company_website: user.website || '',
        industry: user.industry || '',
        company_size: user.company_size || '',
        location: user.location || '',
        contact_person: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        apply_email: user.email || ''
      }))
    }
  }, [user])

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300">Loading job posting form...</span>
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
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Authentication Required</h1>
            <p className="text-gray-300 mb-6">Please log in to post a job.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Check if user is company or admin
  if (user.user_type !== 'company' && user.user_type !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Access Denied</h1>
            <p className="text-gray-300 mb-6">Only companies and administrators can post jobs.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleInputChange = (field: keyof JobFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      // Validate required fields
      const requiredFields: (keyof JobFormData)[] = ['title', 'company', 'description']
      const missingFields = requiredFields.filter(field => {
        const value = formData[field]
        return typeof value === 'string' ? !value.trim() : !value
      })

      if (missingFields.length > 0 && !isDraft) {
        setSubmitMessage({
          type: 'error',
          message: `Please fill in required fields: ${missingFields.join(', ')}`
        })
        setIsSubmitting(false)
        return
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        status: isDraft ? 'draft' : formData.status,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max === 'Negotiable' ? 'Negotiable' : formData.salary_max ? parseInt(formData.salary_max) : null,
        skills: JSON.stringify(formData.skills),
        tags: JSON.stringify(formData.tags),
        deadline: formData.deadline || null
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access_token}`
        },
        body: JSON.stringify(submissionData)
      })

      const result = await response.json()

      if (result.success) {
        setSubmitMessage({
          type: 'success',
          message: isDraft 
            ? 'Job draft saved successfully!' 
            : user.user_type === 'admin' 
              ? 'Job posted successfully!' 
              : 'Job submitted for approval successfully!'
        })
        
        // Reset form after successful submission (but not for drafts)
        if (!isDraft) {
          setFormData(initialFormData)
          // Redirect to company dashboard after a delay
          setTimeout(() => {
            window.location.href = '/company-dashboard'
          }, 2000)
        }
      } else {
        setSubmitMessage({
          type: 'error',
          message: result.message || 'Failed to submit job posting'
        })
      }
    } catch (error) {
      console.error('Error submitting job:', error)
      setSubmitMessage({
        type: 'error',
        message: 'Network error. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Post a New Job</h1>
            <p className="mt-2 text-gray-400">
              {user.user_type === 'admin' 
                ? 'Create a job posting that will be immediately visible to job seekers.' 
                : user.is_approved 
                  ? 'Create a job posting for your company. Posts are subject to admin approval.'
                  : 'Complete your company profile to start posting jobs.'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {user.user_type === 'admin' ? 'Post Job' : 'Submit for Approval'}
            </Button>
          </div>
        </div>

        {/* Account Status Warning */}
        {user.user_type === 'company' && !user.is_approved && (
          <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              <div>
                <h3 className="text-orange-300 font-semibold">Account Pending Approval</h3>
                <p className="text-orange-400 text-sm">Your company account is not yet approved. Job posts will be saved but won&apos;t be visible until your account is approved.</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Message */}
        {submitMessage && (
          <div className={`p-4 rounded-lg border ${
            submitMessage.type === 'success' 
              ? 'bg-green-600/10 border-green-600/20' 
              : 'bg-red-600/10 border-red-600/20'
          }`}>
            <div className="flex items-center gap-3">
              {submitMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <p className={`${
                submitMessage.type === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {submitMessage.message}
              </p>
            </div>
          </div>
        )}

        {/* Job Posting Form */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="basic" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Briefcase className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <FileText className="h-4 w-4 mr-2" />
              Job Details
            </TabsTrigger>
            <TabsTrigger value="requirements" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <GraduationCap className="h-4 w-4 mr-2" />
              Requirements
            </TabsTrigger>
            <TabsTrigger value="application" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <Settings className="h-4 w-4 mr-2" />
              Application
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Job Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-300">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g. Senior Full Stack Developer"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company" className="text-gray-300">Company Name *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Company name"
                      className="bg-gray-700 border-gray-600 text-white"
                      disabled={user.user_type === 'company'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-gray-300">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g. Dhaka, Bangladesh"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_type" className="text-gray-300">Job Type</Label>
                      <Select value={formData.job_type} onValueChange={(value) => handleInputChange('job_type', value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="work_mode" className="text-gray-300">Work Mode</Label>
                      <Select value={formData.work_mode} onValueChange={(value) => handleInputChange('work_mode', value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="On-site">On-site</SelectItem>
                          <SelectItem value="Remote">Remote</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="industry" className="text-gray-300">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      placeholder="e.g. Technology, Healthcare"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_size" className="text-gray-300">Company Size</Label>
                    <Select value={formData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="company_website" className="text-gray-300">Company Website</Label>
                    <Input
                      id="company_website"
                      value={formData.company_website}
                      onChange={(e) => handleInputChange('company_website', e.target.value)}
                      placeholder="https://company.com"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-gray-300">Job Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      placeholder="e.g. Software Development, Marketing"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Job Details Tab */}
          <TabsContent value="details" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Job Description *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the job role, what the candidate will be doing, and why they should join your company..."
                    rows={6}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.responsibilities}
                    onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                    placeholder="• List key responsibilities
• What will the candidate be expected to do
• Daily tasks and duties"
                    rows={5}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    placeholder="• Competitive salary
• Health insurance
• Flexible working hours
• Learning opportunities"
                    rows={5}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Salary Information */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Salary Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Salary Type Selection */}
                  <div>
                    <Label className="text-gray-300">Salary Type</Label>
                    <Select 
                      value={formData.salary_max === 'Negotiable' ? 'negotiable' : 'range'} 
                      onValueChange={(value) => {
                        if (value === 'negotiable') {
                          handleInputChange('salary_min', '')
                          handleInputChange('salary_max', 'Negotiable')
                        } else {
                          handleInputChange('salary_max', '')
                        }
                      }}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="range">Salary Range</SelectItem>
                        <SelectItem value="negotiable">Negotiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Salary Range Fields - Only show if not negotiable */}
                  {formData.salary_max !== 'Negotiable' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="salary_min" className="text-gray-300">Minimum Salary</Label>
                        <Input
                          id="salary_min"
                          type="number"
                          value={formData.salary_min}
                          onChange={(e) => handleInputChange('salary_min', e.target.value)}
                          placeholder="50000"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="salary_max" className="text-gray-300">Maximum Salary</Label>
                        <Input
                          id="salary_max"
                          type="number"
                          value={formData.salary_max === 'Negotiable' ? '' : formData.salary_max}
                          onChange={(e) => handleInputChange('salary_max', e.target.value)}
                          placeholder="80000"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="salary_currency" className="text-gray-300">Currency</Label>
                        <Select value={formData.salary_currency} onValueChange={(value) => handleInputChange('salary_currency', value)}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="BDT">BDT</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Negotiable Display */}
                  {formData.salary_max === 'Negotiable' && (
                    <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-400" />
                        <span className="text-blue-300 font-medium">Salary: Negotiable</span>
                      </div>
                      <p className="text-blue-400 text-sm mt-1">
                        Salary will be discussed during the interview process based on candidate experience and qualifications.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Requirements & Qualifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="requirements" className="text-gray-300">Job Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="• Bachelor's degree in Computer Science
• 3+ years of experience
• Strong problem-solving skills"
                      rows={5}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience_level" className="text-gray-300">Experience Level</Label>
                    <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="Entry Level">Entry Level (0-1 years)</SelectItem>
                        <SelectItem value="Junior">Junior (1-3 years)</SelectItem>
                        <SelectItem value="Mid Level">Mid Level (3-5 years)</SelectItem>
                        <SelectItem value="Senior">Senior (5-8 years)</SelectItem>
                        <SelectItem value="Lead">Lead (8+ years)</SelectItem>
                        <SelectItem value="Executive">Executive Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="education_requirements" className="text-gray-300">Education Requirements</Label>
                    <Textarea
                      id="education_requirements"
                      value={formData.education_requirements}
                      onChange={(e) => handleInputChange('education_requirements', e.target.value)}
                      placeholder="Bachelor's degree in relevant field or equivalent experience"
                      rows={3}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Skills & Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Required Skills</Label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        className="bg-gray-700 border-gray-600 text-white"
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <Button 
                        type="button" 
                        onClick={addSkill}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <Badge key={index} className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                          {skill}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="ml-1 p-0 h-auto"
                            onClick={() => removeSkill(skill)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Tags</Label>
                    <div className="flex space-x-2 mb-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className="bg-gray-700 border-gray-600 text-white"
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button 
                        type="button" 
                        onClick={addTag}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} className="bg-green-600/20 text-green-300 border-green-600/30">
                          {tag}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="ml-1 p-0 h-auto"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Application Tab */}
          <TabsContent value="application" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Application Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apply_email" className="text-gray-300">Application Email</Label>
                    <Input
                      id="apply_email"
                      type="email"
                      value={formData.apply_email}
                      onChange={(e) => handleInputChange('apply_email', e.target.value)}
                      placeholder="jobs@company.com"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="apply_link" className="text-gray-300">Application Link (Optional)</Label>
                    <Input
                      id="apply_link"
                      value={formData.apply_link}
                      onChange={(e) => handleInputChange('apply_link', e.target.value)}
                      placeholder="https://company.com/apply"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deadline" className="text-gray-300">Application Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contact_person" className="text-gray-300">Contact Person</Label>
                    <Input
                      id="contact_person"  
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      placeholder="HR Manager Name"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_phone" className="text-gray-300">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="+8801XXXXXXXXX"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  {user.user_type === 'admin' && (
                    <div>
                      <Label htmlFor="status" className="text-gray-300">Job Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending_approval">Pending Approval</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview Card */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Job Posting Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">{formData.title || 'Job Title'}</h3>
                      <p className="text-gray-300">{formData.company || 'Company Name'}</p>
                    </div>
                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                      {user.user_type === 'admin' ? 'admin' : 'company'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {formData.location && (
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {formData.location}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formData.job_type}
                    </span>
                    <span className="flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      {formData.work_mode}
                    </span>
                    {(formData.salary_min || formData.salary_max) && (
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formData.salary_max === 'Negotiable' 
                          ? 'Negotiable' 
                          : formData.salary_min && formData.salary_max 
                            ? `${formData.salary_min}-${formData.salary_max} ${formData.salary_currency}`
                            : formData.salary_min 
                              ? `${formData.salary_min}+ ${formData.salary_currency}`
                              : `Up to ${formData.salary_max} ${formData.salary_currency}`
                        }
                      </span>
                    )}
                  </div>

                  {formData.description && (
                    <p className="text-gray-300 text-sm line-clamp-3">
                      {formData.description}
                    </p>
                  )}

                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {formData.skills.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{formData.skills.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
