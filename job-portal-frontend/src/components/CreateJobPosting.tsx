'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { RootState, AppDispatch } from '../store/store'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { 
  ArrowLeft,
  Home,
  ChevronRight,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Clock,
  FileText,
  Tag,
  Plus,
  X,
  Save,
  Eye
} from 'lucide-react'

interface JobFormData {
  title: string
  description: string
  requirements: string
  location: string
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience_level: 'entry' | 'mid' | 'senior' | 'lead'
  salary_min: string
  salary_max: string
  salary_currency: string
  skills: string[]
  benefits: string[]
  remote_allowed: boolean
  visa_sponsorship: boolean
  expires_at: string
  department: string
  application_deadline: string
}

export default function CreateJobPosting() {
  const { user, isAuthenticated, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSkill, setCurrentSkill] = useState('')
  const [currentBenefit, setCurrentBenefit] = useState('')
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    employment_type: 'full-time',
    experience_level: 'mid',
    salary_min: '',
    salary_max: '',
    salary_currency: 'BDT',
    skills: [],
    benefits: [],
    remote_allowed: false,
    visa_sponsorship: false,
    expires_at: '',
    department: '',
    application_deadline: ''
  })

  useEffect(() => {
    setMounted(true)
    
    // Set default expiry date to 30 days from now
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    setFormData(prev => ({
      ...prev,
      expires_at: thirtyDaysFromNow.toISOString().split('T')[0],
      application_deadline: thirtyDaysFromNow.toISOString().split('T')[0]
    }))
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.user_type !== 'company') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-lg border-gray-700/50">
          <CardContent className="p-8 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">Only company accounts can create job postings</p>
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

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }))
      setCurrentSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const addBenefit = () => {
    if (currentBenefit.trim() && !formData.benefits.includes(currentBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, currentBenefit.trim()]
      }))
      setCurrentBenefit('')
    }
  }

  const removeBenefit = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Here you would make the API call to create the job
      console.log('Creating job:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to dashboard on success
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error creating job:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreview = () => {
    // Open preview modal or navigate to preview page
    console.log('Preview job:', formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-orange-400/5 pointer-events-none"></div>
      
      <div className="relative container mx-auto px-4 py-6 sm:py-8">
        {/* Navigation Breadcrumb */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <Link 
              href="/" 
              className="flex items-center text-gray-400 hover:text-yellow-400 transition-colors duration-200 font-medium"
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <Link 
              href="/dashboard" 
              className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 font-medium"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <span className="text-yellow-400 font-medium">Create Job</span>
          </div>
          
          {/* Back Button */}
          <div className="mt-4">
            <Link 
              href="/dashboard" 
              className="flex items-center text-gray-300 hover:text-yellow-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-200 font-medium bg-gray-800/30 w-fit"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create Job Posting</h1>
            <p className="text-gray-400">Fill in the details to post a new job opportunity</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-yellow-400" />
                  Basic Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Essential details about the position
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g. Senior Frontend Developer"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-gray-300">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="e.g. Engineering, Marketing"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-gray-300">Requirements *</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="List the required qualifications, experience, and skills..."
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 min-h-[120px]"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-yellow-400" />
                  Job Details
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Specify the type and level of the position
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="employment_type" className="text-gray-300">Employment Type *</Label>
                    <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-yellow-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience_level" className="text-gray-300">Experience Level *</Label>
                    <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-yellow-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="lead">Lead/Principal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-300">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g. Dhaka, Bangladesh or Remote"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400"
                    required
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remote_allowed"
                      checked={formData.remote_allowed}
                      onCheckedChange={(checked) => handleInputChange('remote_allowed', checked)}
                    />
                    <Label htmlFor="remote_allowed" className="text-gray-300">Remote Work Allowed</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="visa_sponsorship"
                      checked={formData.visa_sponsorship}
                      onCheckedChange={(checked) => handleInputChange('visa_sponsorship', checked)}
                    />
                    <Label htmlFor="visa_sponsorship" className="text-gray-300">Visa Sponsorship Available</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-400" />
                  Compensation
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Salary range and benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary_min" className="text-gray-300">Minimum Salary</Label>
                    <Input
                      id="salary_min"
                      type="number"
                      value={formData.salary_min}
                      onChange={(e) => handleInputChange('salary_min', e.target.value)}
                      placeholder="50000"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salary_max" className="text-gray-300">Maximum Salary</Label>
                    <Input
                      id="salary_max"
                      type="number"
                      value={formData.salary_max}
                      onChange={(e) => handleInputChange('salary_max', e.target.value)}
                      placeholder="80000"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salary_currency" className="text-gray-300">Currency</Label>
                    <Select value={formData.salary_currency} onValueChange={(value) => handleInputChange('salary_currency', value)}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-yellow-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="BDT">BDT</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-4">
                  <Label className="text-gray-300">Benefits & Perks</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.benefits.map((benefit, index) => (
                      <Badge key={index} className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/30">
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeBenefit(benefit)}
                          className="ml-2 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={currentBenefit}
                      onChange={(e) => setCurrentBenefit(e.target.value)}
                      placeholder="e.g. Health Insurance, Flexible Hours"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                    />
                    <Button type="button" onClick={addBenefit} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Requirements */}
            <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Tag className="h-5 w-5 text-yellow-400" />
                  Required Skills
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Add relevant skills and technologies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} className="bg-blue-400/20 text-blue-400 border-blue-400/30 hover:bg-blue-400/30">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    placeholder="e.g. React, Node.js, Python"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-yellow-400" />
                  Timeline
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Set application and expiry dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="application_deadline" className="text-gray-300">Application Deadline</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white focus:border-yellow-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expires_at" className="text-gray-300">Job Posting Expires</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => handleInputChange('expires_at', e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white focus:border-yellow-400"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePreview}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Job Posting
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
