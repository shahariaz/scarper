'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  ExternalLink
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

interface CompanyFilters {
  search: string;
  industry: string;
  company_size: string;
  location: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function PublicCompaniesPage() {
  const [mounted, setMounted] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [companiesPerPage] = useState(12)
  
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

  // Fetch companies data
  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      // Use mock data for now since API endpoint doesn't exist yet
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
        },
        {
          id: 4,
          company_name: 'Healthcare Plus',
          email: 'hr@healthcareplus.com',
          industry: 'Healthcare',
          company_size: '100-200',
          location: 'Dhaka, Bangladesh',
          bio: 'Modern healthcare facility with state-of-the-art medical equipment and experienced professionals.',
          is_approved: true,
          created_at: '2024-04-05T10:00:00Z',
          job_count: 6,
          rating: 4.3
        },
        {
          id: 5,
          company_name: 'EduTech Innovations',
          email: 'info@edutech.com',
          industry: 'Education',
          company_size: '20-50',
          location: 'Rajshahi, Bangladesh',
          website: 'https://edutech.com',
          bio: 'Educational technology company creating innovative learning solutions for students and institutions.',
          is_approved: true,
          created_at: '2024-05-12T10:00:00Z',
          job_count: 4,
          rating: 4.1
        },
        {
          id: 6,
          company_name: 'Green Energy Corp',
          email: 'careers@greenenergy.com',
          industry: 'Renewable Energy',
          company_size: '50-100',
          location: 'Khulna, Bangladesh',
          website: 'https://greenenergy.com',
          bio: 'Sustainable energy solutions company focused on solar and wind power projects.',
          is_approved: true,
          created_at: '2024-06-18T10:00:00Z',
          job_count: 7,
          rating: 4.6
        }
      ]
      
      setCompanies(mockCompanies)
      
      const industries = [...new Set(mockCompanies.map(c => c.industry).filter(Boolean))] as string[]
      const locations = [...new Set(mockCompanies.map(c => c.location).filter(Boolean))] as string[]
      
      setStatistics({
        total: mockCompanies.length,
        verified: mockCompanies.length,
        industries,
        locations
      })
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchCompanies()
    }
  }, [mounted, fetchCompanies])

  // Filter companies
  useEffect(() => {
    let filtered = [...companies]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(company => 
        company.company_name.toLowerCase().includes(searchLower) ||
        company.industry?.toLowerCase().includes(searchLower) ||
        company.location?.toLowerCase().includes(searchLower) ||
        company.bio?.toLowerCase().includes(searchLower)
      )
    }

    // Apply industry filter
    if (filters.industry !== 'all') {
      filtered = filtered.filter(company => company.industry === filters.industry)
    }

    // Apply company size filter
    if (filters.company_size !== 'all') {
      filtered = filtered.filter(company => company.company_size === filters.company_size)
    }

    // Apply location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(company => company.location === filters.location)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Company] as string
      const bValue = b[filters.sortBy as keyof Company] as string

      if (filters.sortBy === 'created_at') {
        return filters.sortOrder === 'asc' 
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime()
      }

      const comparison = aValue?.toLowerCase().localeCompare(bValue?.toLowerCase() || '')
      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredCompanies(filtered)
    setCurrentPage(1)
  }, [companies, filters])

  const getCurrentPageCompanies = () => {
    const startIndex = (currentPage - 1) * companiesPerPage
    const endIndex = startIndex + companiesPerPage
    return filteredCompanies.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage)
  const currentPageCompanies = getCurrentPageCompanies()

  const getCompanyInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
  }

  const getCompanySizeBadge = (size?: string) => {
    if (!size) return null
    
    const colorMap: { [key: string]: string } = {
      '1-10': 'bg-green-500/20 text-green-300 border-green-500/30',
      '10-50': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      '50-200': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      '200-500': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      '500+': 'bg-red-500/20 text-red-300 border-red-500/30'
    }

    return (
      <Badge className={colorMap[size] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}>
        <Users className="h-3 w-3 mr-1" />
        {size} employees
      </Badge>
    )
  }

  const handleViewCompanyJobs = (company: Company) => {
    // Navigate to jobs page with company filter
    window.location.href = `/?company=${encodeURIComponent(company.company_name)}`
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
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center animate-slide-up animate-once">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent mb-4 animate-float">
              Browse Companies
            </h1>
            <p className="text-xl text-muted-foreground animate-slide-in-left animate-once">
              Discover amazing companies and explore career opportunities
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto mt-4 rounded-full animate-glow"></div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-up">
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30 gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-300">Total Companies</p>
                    <p className="text-2xl font-bold text-white">{statistics.total}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30 gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-300">Verified Companies</p>
                    <p className="text-2xl font-bold text-white">{statistics.verified}</p>
                  </div>
                  <Star className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-300">Industries</p>
                    <p className="text-2xl font-bold text-white">{statistics.industries.length}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30 gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-300">Locations</p>
                    <p className="text-2xl font-bold text-white">{statistics.locations.length}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <Card className="bg-gray-800/50 border-gray-700 gradient-card animate-slide-in-right">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search companies by name, industry, or location..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filters.industry}
                    onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                    className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                  >
                    <option value="all">All Industries</option>
                    {statistics.industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  <select
                    value={filters.company_size}
                    onChange={(e) => setFilters(prev => ({ ...prev, company_size: e.target.value }))}
                    className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                  >
                    <option value="all">All Sizes</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="10-50">10-50 employees</option>
                    <option value="50-200">50-200 employees</option>
                    <option value="200-500">200-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Results Count */}
          <div className="mb-6 content-transition">
            <h2 className="text-3xl font-semibold text-foreground mb-2 flex items-center gap-3">
              <span className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full animate-pulse"></span>
              Companies 
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-lg font-bold animate-glow content-transition">
                {filteredCompanies.length}
              </span>
            </h2>
          </div>

          {/* Companies Grid */}
          <div className="space-y-6 content-transition">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-300">Loading companies...</span>
              </div>
            ) : filteredCompanies.length === 0 ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPageCompanies.map((company) => (
                    <Card key={company.id} className="gradient-card border-gray-700 hover:border-yellow-400/50 transition-all duration-200 hover:shadow-lg group">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar className="h-16 w-16 ring-2 ring-gray-600 group-hover:ring-yellow-400/50 transition-all">
                            <AvatarImage src={company.avatar_url} alt={company.company_name} />
                            <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-bold text-lg">
                              {getCompanyInitials(company.company_name)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate mb-1">
                              {company.company_name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              {company.industry && (
                                <Badge className="text-xs bg-blue-600/20 text-blue-300 border-blue-600/30">
                                  {company.industry}
                                </Badge>
                              )}
                              {company.is_approved && (
                                <Badge className="text-xs bg-green-600/20 text-green-300 border-green-600/30">
                                  <Star className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          {company.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <MapPin className="h-4 w-4 text-red-400" />
                              <span>{company.location}</span>
                            </div>
                          )}
                          
                          {company.company_size && (
                            <div className="flex items-center gap-2">
                              {getCompanySizeBadge(company.company_size)}
                            </div>
                          )}
                          
                          {company.job_count !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Briefcase className="h-4 w-4 text-green-400" />
                              <span>{company.job_count} active jobs</span>
                            </div>
                          )}
                          
                          {company.rating && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span>{company.rating}/5.0 rating</span>
                            </div>
                          )}
                        </div>
                        
                        {company.bio && (
                          <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                            {company.bio}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold"
                            onClick={() => handleViewCompanyJobs(company)}
                          >
                            <Briefcase className="h-4 w-4 mr-1" />
                            View Jobs
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCompany(company)
                              setShowCompanyDetails(true)
                            }}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {company.website && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(company.website, '_blank')}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      Showing {((currentPage - 1) * companiesPerPage) + 1} to {Math.min(currentPage * companiesPerPage, filteredCompanies.length)} of {filteredCompanies.length} companies
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
                          if (pageNum > totalPages) return null
                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={currentPage === pageNum ? "default" : "outline"}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 p-0 ${currentPage === pageNum 
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold' 
                                : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
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
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Company Details Modal */}
          {showCompanyDetails && selectedCompany && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto gradient-card">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-gray-600">
                      <AvatarImage src={selectedCompany.avatar_url} alt={selectedCompany.company_name} />
                      <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 font-bold text-lg">
                        {getCompanyInitials(selectedCompany.company_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-white">{selectedCompany.company_name}</CardTitle>
                      <p className="text-sm text-gray-400">{selectedCompany.industry}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowCompanyDetails(false)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    ×
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {selectedCompany.industry && (
                      <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                        {selectedCompany.industry}
                      </Badge>
                    )}
                    {selectedCompany.is_approved && (
                      <Badge className="bg-green-600/20 text-green-300 border-green-600/30">
                        <Star className="h-3 w-3 mr-1" />
                        Verified Company
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedCompany.location && (
                      <div>
                        <h4 className="font-medium text-gray-300 mb-2">Location</h4>
                        <p className="text-white">{selectedCompany.location}</p>
                      </div>
                    )}
                    {selectedCompany.company_size && (
                      <div>
                        <h4 className="font-medium text-gray-300 mb-2">Company Size</h4>
                        <p className="text-white">{selectedCompany.company_size} employees</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">Founded</h4>
                      <p className="text-white">
                        {new Date(selectedCompany.created_at).getFullYear()}
                      </p>
                    </div>
                    {selectedCompany.job_count !== undefined && (
                      <div>
                        <h4 className="font-medium text-gray-300 mb-2">Active Jobs</h4>
                        <p className="text-white">{selectedCompany.job_count} positions</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedCompany.bio && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">About Company</h4>
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-white leading-relaxed">{selectedCompany.bio}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCompany.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-white">{selectedCompany.email}</span>
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a 
                          href={selectedCompany.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-yellow-400 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                    <Button
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold"
                      onClick={() => handleViewCompanyJobs(selectedCompany)}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      View All Jobs
                    </Button>
                    {selectedCompany.website && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedCompany.website, '_blank')}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Website
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
