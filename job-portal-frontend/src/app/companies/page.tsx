'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { setCompanyFilter, clearFilters } from '@/store/slices/jobsSlice'
import { 
  Loader2,
  Building2,
  MapPin,
  Users,
  Briefcase,
  Search,
  Globe,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Mail,
  ExternalLink,
  Filter,
  TrendingUp,
  Award,
  Calendar,
  Heart,
  Share2,
  Sparkles,
  X
} from 'lucide-react'

interface Company {
  id: number;
  company_name: string;
  email: string;
  industry?: string;
  company_size?: string;
  location?: string;
  website?: string;
  bio?: string;
  avatar_url?: string;
  is_approved: boolean;
  created_at: string;
  job_count?: number;
  rating?: number;
}

interface BackendCompany {
  id: number;
  company_name?: string;
  name?: string;
  email: string;
  industry?: string;
  company_size?: string;
  location?: string;
  website?: string;
  bio?: string;
  description?: string;
  avatar_url?: string;
  is_approved?: boolean;
  created_at?: string;
  job_count?: number;
  rating?: number;
}

interface CompanyFilters {
  search: string;
  industry: string;
  company_size: string;
  location: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface PaginationInfo {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function PublicCompaniesPage() {
  const [mounted, setMounted] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [companiesPerPage] = useState(12)
  const router = useRouter()
  const dispatch = useDispatch()
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    per_page: 12,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  
  const [filters, setFilters] = useState<CompanyFilters>({
    search: '',
    industry: 'all',
    company_size: 'all',
    location: 'all',
    sortBy: 'company_name',
    sortOrder: 'asc'
  })

  const [statistics, setStatistics] = useState({
    total: 0,
    verified: 0,
    industries: [] as string[],
    locations: [] as string[]
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCompanyDetails) {
        setShowCompanyDetails(false)
      }
    }

    if (showCompanyDetails) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showCompanyDetails])

  // Fetch companies data with backend pagination
  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      // Build query parameters for backend filtering and pagination
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: companiesPerPage.toString(),
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      })

      if (filters.search) params.append('search', filters.search)
      if (filters.industry !== 'all') params.append('industry', filters.industry)
      if (filters.company_size !== 'all') params.append('company_size', filters.company_size)
      if (filters.location !== 'all') params.append('location', filters.location)

      // Fetch from backend API with pagination
      const response = await fetch(`/api/companies/public?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Transform backend data to match our interface
        const transformedCompanies: Company[] = data.companies.map((company: BackendCompany) => ({
          id: company.id,
          company_name: company.company_name || company.name || '',
          email: company.email,
          industry: company.industry,
          company_size: company.company_size,
          location: company.location,
          website: company.website,
          bio: company.bio || company.description,
          avatar_url: company.avatar_url,
          is_approved: company.is_approved !== false,
          created_at: company.created_at || new Date().toISOString(),
          job_count: company.job_count || 0,
          rating: company.rating || 0
        }))
        
        setCompanies(transformedCompanies)
        setPagination(data.pagination)
        
        // Get all industries and locations for filters (separate API call)
        const filtersResponse = await fetch('/api/companies/public?per_page=1000')
        if (filtersResponse.ok) {
          const filtersData = await filtersResponse.json()
          if (filtersData.success) {
            const allCompanies = filtersData.companies
            const industries = [...new Set(allCompanies.map((c: BackendCompany) => c.industry).filter(Boolean))] as string[]
            const locations = [...new Set(allCompanies.map((c: BackendCompany) => c.location).filter(Boolean))] as string[]
            
            setStatistics({
              total: data.pagination.total,
              verified: data.pagination.total,
              industries,
              locations
            })
          }
        }
      } else {
        throw new Error(data.message || 'Failed to fetch companies')
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      
      // Fallback to mock data if API fails
      const mockCompanies: Company[] = [
        {
          id: 1,
          company_name: 'TechCorp Solutions',
          email: 'hr@techcorp.com',
          industry: 'Technology',
          company_size: '50-200',
          location: 'Dhaka, Bangladesh',
          website: 'https://techcorp.com',
          bio: 'Leading technology solutions provider in Bangladesh with focus on web development, mobile apps, and cloud services.',
          is_approved: true,
          created_at: '2024-01-15T10:00:00Z',
          job_count: 8,
          rating: 4.5
        },
        {
          id: 2,
          company_name: 'Digital Marketing Hub',
          email: 'contact@dmhub.com',
          industry: 'Marketing',
          company_size: '10-50',
          location: 'Chittagong, Bangladesh',
          website: 'https://dmhub.com',
          bio: 'Full-service digital marketing agency helping businesses grow their online presence.',
          is_approved: true,
          created_at: '2024-02-20T10:00:00Z',
          job_count: 5,
          rating: 4.2
        },
        {
          id: 3,
          company_name: 'FinanceFlow Ltd',
          email: 'careers@financeflow.com',
          industry: 'Finance',
          company_size: '200-500',
          location: 'Sylhet, Bangladesh',
          website: 'https://financeflow.com',
          bio: 'Innovative fintech company providing digital banking and payment solutions.',
          is_approved: true,
          created_at: '2024-03-10T10:00:00Z',
          job_count: 12,
          rating: 4.7
        }
      ]
      
      setCompanies(mockCompanies)
      setPagination({
        page: 1,
        per_page: 12,
        total: mockCompanies.length,
        total_pages: 1,
        has_next: false,
        has_prev: false
      })
      
      const industries = [...new Set(mockCompanies.map(c => c.industry).filter(Boolean))] as string[]
      const locations = [...new Set(mockCompanies.map(c => c.location).filter(Boolean))] as string[]
      
      setStatistics({
        total: mockCompanies.length,
        verified: mockCompanies.length,
        industries,
        locations
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, companiesPerPage, filters])

  useEffect(() => {
    if (mounted) {
      fetchCompanies()
    }
  }, [mounted, fetchCompanies])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (mounted) {
      setCurrentPage(1)
    }
  }, [filters, mounted])

  const getCompanyInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
  }

  const handleViewCompanyJobs = (company: Company) => {
    // Clear existing filters and set company filter
    dispatch(clearFilters())
    dispatch(setCompanyFilter(company.company_name))
    // Navigate to jobs page
    router.push('/')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Modern Grid Background */}
      <div className="absolute inset-0">
        {/* Base grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-grid-dots opacity-20"></div>
        
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-900/10 to-transparent"></div>
        
        {/* Animated lines */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-grid-line-horizontal"></div>
          <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-purple-400/30 to-transparent animate-grid-line-vertical"></div>
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400/20 to-transparent animate-grid-line-horizontal animation-delay-2000"></div>
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-pink-400/20 to-transparent animate-grid-line-vertical animation-delay-4000"></div>
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-grid-line-horizontal animation-delay-6000"></div>
          <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-blue-400/20 to-transparent animate-grid-line-vertical animation-delay-8000"></div>
        </div>
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-4 h-4 bg-purple-400/20 rotate-45 animate-float"></div>
          <div className="absolute top-40 right-32 w-6 h-6 bg-pink-400/20 rounded-full animate-float animation-delay-2000"></div>
          <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-blue-400/20 animate-float animation-delay-4000"></div>
          <div className="absolute bottom-60 right-1/4 w-5 h-5 bg-purple-400/20 rotate-45 animate-float animation-delay-6000"></div>
          <div className="absolute top-1/2 left-10 w-4 h-4 bg-pink-400/20 rounded-full animate-float animation-delay-8000"></div>
          <div className="absolute top-1/3 right-10 w-3 h-3 bg-blue-400/20 animate-float animation-delay-10000"></div>
        </div>
        
        {/* Animated background blobs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Modern Header */}
          <div className="text-center space-y-6">
            <div className="inline-block">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mb-6 mx-auto shadow-lg">
                <Building2 className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
                Discover
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold text-white/90 -mt-2">
                Amazing Companies
              </h2>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed">
                Explore innovative companies, discover career opportunities, and find your perfect workplace match
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-purple-200 font-medium">Over {statistics.total} verified companies</span>
              <Sparkles className="h-5 w-5 text-yellow-400" />
            </div>
          </div>

          {/* Modern Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="absolute inset-0 bg-grid-dots opacity-5 rounded-2xl group-hover:opacity-15 transition-opacity duration-500"></div>
              <Card className="relative bg-slate-800/90 backdrop-blur-sm border-slate-700 rounded-2xl overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-bl-2xl"></div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-purple-300 uppercase tracking-wider">Total Companies</p>
                      <p className="text-4xl font-black text-white">{statistics.total}</p>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400 font-medium">+12% this month</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500 rounded-full blur-lg opacity-30"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="absolute inset-0 bg-grid-dots opacity-5 rounded-2xl group-hover:opacity-15 transition-opacity duration-500"></div>
              <Card className="relative bg-slate-800/90 backdrop-blur-sm border-slate-700 rounded-2xl overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-emerald-400/10 to-transparent rounded-bl-2xl"></div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-emerald-300 uppercase tracking-wider">Verified Companies</p>
                      <p className="text-4xl font-black text-white">{statistics.verified}</p>
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-medium">100% verified</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full blur-lg opacity-30"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <Star className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="absolute inset-0 bg-grid-dots opacity-5 rounded-2xl group-hover:opacity-15 transition-opacity duration-500"></div>
              <Card className="relative bg-slate-800/90 backdrop-blur-sm border-slate-700 rounded-2xl overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-bl-2xl"></div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-300 uppercase tracking-wider">Industries</p>
                      <p className="text-4xl font-black text-white">{statistics.industries.length}</p>
                      <div className="flex items-center space-x-1">
                        <Briefcase className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-blue-400 font-medium">Diverse sectors</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-30"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Briefcase className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="absolute inset-0 bg-grid-dots opacity-5 rounded-2xl group-hover:opacity-15 transition-opacity duration-500"></div>
              <Card className="relative bg-slate-800/90 backdrop-blur-sm border-slate-700 rounded-2xl overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-orange-400/10 to-transparent rounded-bl-2xl"></div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-orange-300 uppercase tracking-wider">Locations</p>
                      <p className="text-4xl font-black text-white">{statistics.locations.length}</p>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-orange-400 font-medium">Global reach</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-500 rounded-full blur-lg opacity-30"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Modern Search and Filter Section */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-5 rounded-3xl group-hover:opacity-10 transition-opacity duration-300"></div>
            <Card className="relative bg-slate-800/60 backdrop-blur-xl border-slate-700/50 rounded-3xl overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-transparent rounded-br-3xl"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-pink-400/10 to-transparent rounded-tl-3xl"></div>
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative flex items-center">
                      <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-purple-400 h-6 w-6 z-10" />
                      <Input
                        placeholder="Search companies by name, industry, or location..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-16 pr-6 py-6 text-lg bg-slate-900/80 backdrop-blur-sm border-slate-600/50 text-white placeholder-slate-400 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-300"
                      />
                    </div>
                  </div>
                  
                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-4">
                    <div className="relative group">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                      <select
                        value={filters.industry}
                        onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                        className="pl-10 pr-6 py-3 bg-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-xl text-white text-sm font-medium hover:border-purple-400/50 transition-all duration-300 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="all">All Industries</option>
                        {statistics.industries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="relative group">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                      <select
                        value={filters.company_size}
                        onChange={(e) => setFilters(prev => ({ ...prev, company_size: e.target.value }))}
                        className="pl-10 pr-6 py-3 bg-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-xl text-white text-sm font-medium hover:border-purple-400/50 transition-all duration-300 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="all">All Sizes</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="10-50">10-50 employees</option>
                        <option value="50-200">50-200 employees</option>
                        <option value="200-500">200-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>
                    
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                      <select
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                        className="pl-10 pr-6 py-3 bg-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-xl text-white text-sm font-medium hover:border-purple-400/50 transition-all duration-300 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="all">All Locations</option>
                        {statistics.locations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modern Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-8 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full shadow-lg"></div>
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  Companies Directory
                </h2>
                <p className="text-slate-400 mt-1">
                  Found <span className="text-purple-400 font-semibold">{pagination.total}</span> companies matching your criteria
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 text-lg font-bold shadow-lg">
                {pagination.total}
              </Badge>
            </div>
          </div>

          {/* Companies Grid */}
          <div className="space-y-6 content-transition">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-300">Loading companies...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">No Companies Found</h3>
                <p className="text-gray-400 mb-6">
                  {companies.length === 0 
                    ? 'No companies are currently available.' 
                    : 'Try adjusting your search criteria or filters.'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {companies.map((company) => (
                    <div key={company.id} className="group relative">
                      {/* Animated background glow with grid integration */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
                      
                      {/* Grid overlay for cards */}
                      <div className="absolute inset-0 bg-grid-pattern opacity-5 rounded-3xl group-hover:opacity-10 transition-opacity duration-300"></div>
                      
                      <Card className="relative bg-slate-800/90 backdrop-blur-sm border-slate-700/50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.02] hover:border-purple-400/30 h-[520px] flex flex-col">
                        <CardContent className="p-6 relative flex flex-col h-full">
                          {/* Subtle grid accent */}
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-400/5 to-transparent rounded-bl-3xl"></div>
                          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-400/5 to-transparent rounded-tr-3xl"></div>
                          
                          {/* Company Header - Fixed height */}
                          <div className="flex items-start gap-4 mb-4 min-h-[90px]">
                            <div className="relative flex-shrink-0">
                              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                              <Avatar className="relative h-14 w-14 ring-2 ring-slate-600/50 group-hover:ring-purple-400/50 transition-all duration-300">
                                <AvatarImage src={company.avatar_url} alt={company.company_name} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                                  {getCompanyInitials(company.company_name)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white truncate mb-2 group-hover:text-purple-300 transition-colors leading-tight">
                                {company.company_name}
                              </h3>
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {company.industry && (
                                  <Badge className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 transition-all">
                                    {company.industry}
                                  </Badge>
                                )}
                                {company.is_approved && (
                                  <Badge className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Favorite and Share Icons */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                                <Heart className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10">
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Company Details - Fixed height container */}
                          <div className="space-y-2 mb-4 min-h-[140px]">
                            {/* Always show these 4 rows, with placeholder if missing */}
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                              <div className="w-7 h-7 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-3 w-3 text-red-400" />
                              </div>
                              <span className="truncate text-xs">{company.location || 'Location not specified'}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                              <div className="w-7 h-7 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users className="h-3 w-3 text-purple-400" />
                              </div>
                              <span className="truncate text-xs">{company.company_size ? `${company.company_size} employees` : 'Team size not specified'}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                              <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Briefcase className="h-3 w-3 text-emerald-400" />
                              </div>
                              <span className="truncate text-xs">{company.job_count || 0} active jobs</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                              <div className="w-7 h-7 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              </div>
                              <span className="truncate text-xs">{company.rating ? `${company.rating}/5.0 rating` : '4.0/5.0 rating'}</span>
                            </div>
                          </div>
                          
                          {/* Company Bio - Fixed height with consistent line clamp */}
                          <div className="mb-4 min-h-[80px] flex items-start flex-grow">
                            <p className="text-slate-400 text-xs leading-relaxed line-clamp-4 flex-1">
                              {company.bio || 'A growing company focused on innovation and excellence. Join our team to be part of an exciting journey in building the future.'}
                            </p>
                          </div>
                          
                          {/* Action Buttons - Fixed at bottom */}
                          <div className="flex items-center gap-2 mt-auto pt-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-xs py-2"
                              onClick={() => handleViewCompanyJobs(company)}
                            >
                              <Briefcase className="h-3 w-3 mr-1" />
                              View Jobs
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCompany(company)
                                setShowCompanyDetails(true)
                              }}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-purple-400 transition-all duration-300 flex-shrink-0 px-2 py-2"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {company.website && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(company.website, '_blank')}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-blue-400 transition-all duration-300 flex-shrink-0 px-2 py-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* Modern Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex items-center justify-between pt-8 border-t border-slate-700/50">
                    <div className="text-sm text-slate-400 bg-slate-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
                      Showing <span className="text-purple-400 font-semibold">{((currentPage - 1) * companiesPerPage) + 1}</span> to <span className="text-purple-400 font-semibold">{Math.min(currentPage * companiesPerPage, pagination.total)}</span> of <span className="text-purple-400 font-semibold">{pagination.total}</span> companies
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={!pagination.has_prev}
                        className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 hover:border-purple-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(currentPage - 2 + i, pagination.total_pages - 4 + i))
                          if (pageNum > pagination.total_pages) return null
                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={currentPage === pageNum ? "default" : "outline"}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 p-0 transition-all duration-300 ${currentPage === pageNum 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg border-0' 
                                : 'bg-slate-800/50 border-slate-600 hover:bg-slate-700 hover:border-purple-400 text-slate-300 hover:text-white'
                              }`}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
                        disabled={!pagination.has_next}
                        className="bg-slate-800/50 border-slate-600 hover:bg-slate-700 hover:border-purple-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modern Company Details Modal */}
          {showCompanyDetails && selectedCompany && (
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={() => setShowCompanyDetails(false)}
            >
              <div 
                className="relative group"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-30"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-5 rounded-3xl"></div>
                <Card className="relative bg-slate-800/95 backdrop-blur-xl border-slate-700/50 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
                  {/* Subtle grid accents */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-bl-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/10 to-transparent rounded-tr-3xl"></div>
                  {/* Modal Header */}
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-t-3xl">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-40"></div>
                        <Avatar className="relative h-20 w-20 ring-2 ring-slate-600/50">
                          <AvatarImage src={selectedCompany.avatar_url} alt={selectedCompany.company_name} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-2xl">
                            {getCompanyInitials(selectedCompany.company_name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold text-white">{selectedCompany.company_name}</CardTitle>
                        <p className="text-lg text-purple-300 font-medium">{selectedCompany.industry}</p>
                        <div className="flex items-center gap-2">
                          {selectedCompany.is_approved && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Verified Company
                            </Badge>
                          )}
                          {selectedCompany.rating && (
                            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              {selectedCompany.rating}/5.0
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowCompanyDetails(false)}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 w-10 h-10 rounded-full transition-all duration-200 hover:scale-110"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="space-y-8 p-8">
                    {/* Company Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {selectedCompany.location && (
                        <div className="text-center p-4 bg-slate-700/30 rounded-2xl">
                          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MapPin className="h-6 w-6 text-red-400" />
                          </div>
                          <h4 className="font-semibold text-slate-300 mb-1">Location</h4>
                          <p className="text-white text-sm">{selectedCompany.location}</p>
                        </div>
                      )}
                      {selectedCompany.company_size && (
                        <div className="text-center p-4 bg-slate-700/30 rounded-2xl">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="h-6 w-6 text-purple-400" />
                          </div>
                          <h4 className="font-semibold text-slate-300 mb-1">Team Size</h4>
                          <p className="text-white text-sm">{selectedCompany.company_size}</p>
                        </div>
                      )}
                      <div className="text-center p-4 bg-slate-700/30 rounded-2xl">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Calendar className="h-6 w-6 text-blue-400" />
                        </div>
                        <h4 className="font-semibold text-slate-300 mb-1">Founded</h4>
                        <p className="text-white text-sm">
                          {new Date(selectedCompany.created_at).getFullYear()}
                        </p>
                      </div>
                      {selectedCompany.job_count !== undefined && (
                        <div className="text-center p-4 bg-slate-700/30 rounded-2xl">
                          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Briefcase className="h-6 w-6 text-emerald-400" />
                          </div>
                          <h4 className="font-semibold text-slate-300 mb-1">Open Roles</h4>
                          <p className="text-white text-sm">{selectedCompany.job_count}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Company Description */}
                    {selectedCompany.bio && (
                      <div>
                        <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-purple-400" />
                          About {selectedCompany.company_name}
                        </h4>
                        <div className="p-6 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-2xl border border-slate-600/30">
                          <p className="text-slate-300 leading-relaxed text-lg">{selectedCompany.bio}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedCompany.email && (
                        <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-2xl">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Email</p>
                            <p className="text-white font-medium">{selectedCompany.email}</p>
                          </div>
                        </div>
                      )}
                      {selectedCompany.website && (
                        <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-2xl">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <Globe className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Website</p>
                            <a 
                              href={selectedCompany.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors"
                            >
                              Visit Website
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 pt-6 border-t border-slate-700/50">
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                        onClick={() => handleViewCompanyJobs(selectedCompany)}
                      >
                        <Briefcase className="h-5 w-5 mr-2" />
                        View All Jobs ({selectedCompany.job_count || 0})
                      </Button>
                      {selectedCompany.website && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(selectedCompany.website, '_blank')}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-emerald-400 transition-all duration-300 py-3"
                        >
                          <ExternalLink className="h-5 w-5 mr-2" />
                          Visit Website
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        @keyframes grid-line-horizontal {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes grid-line-vertical {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-grid-line-horizontal {
          animation: grid-line-horizontal 8s linear infinite;
        }
        
        .animate-grid-line-vertical {
          animation: grid-line-vertical 8s linear infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        .animation-delay-8000 {
          animation-delay: 8s;
        }
        .animation-delay-10000 {
          animation-delay: 10s;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Grid Pattern Backgrounds */
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }
        
        .bg-grid-dots {
          background-image: 
            radial-gradient(circle at 25px 25px, rgba(168, 85, 247, 0.2) 2px, transparent 2px);
          background-size: 50px 50px;
          animation: grid-dots-move 25s linear infinite reverse;
        }
        
        @keyframes grid-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
        
        @keyframes grid-dots-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(-50px, -50px);
          }
        }
        
        /* Enhanced card hover effects */
        .group:hover .bg-grid-pattern {
          animation-play-state: paused;
        }
        
        /* Glowing grid effect on scroll */
        @keyframes grid-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(168, 85, 247, 0.1);
          }
          50% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
          }
        }
        
        /* Subtle parallax effect for background elements */
        @media (prefers-reduced-motion: no-preference) {
          .bg-grid-pattern,
          .bg-grid-dots {
            transform-style: preserve-3d;
          }
        }
      `}</style>
    </div>
  )
}
