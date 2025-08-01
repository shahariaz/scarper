'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { fetchUserProfile } from '@/store/slices/authSlice'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Loader2,
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle,
  Building2,
  MapPin,
  Users,
  Calendar,
  Search,
  ExternalLink,
  TrendingUp,
  Building,
  Crown
} from 'lucide-react'

interface Company {
  id: number;
  user_id: number;
  company_name: string;
  company_description?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  logo_url?: string;
  created_at: string;
  email: string;
  user_created_at: string;
}

export default function AdminCompanies() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [processingCompanies, setProcessingCompanies] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user profile if we have tokens but no user data
  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  // Redirect non-admin users
  useEffect(() => {
    if (mounted && user && user.user_type !== 'admin') {
      window.location.href = '/dashboard'
    }
  }, [mounted, user])

  // Fetch pending companies
  const fetchPendingCompanies = useCallback(async () => {
    if (!tokens.access_token || user?.user_type !== 'admin') return
    
    setLoadingCompanies(true)
    try {
      const response = await fetch('/api/companies/pending', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
        setStatistics({
          total: data.companies?.length || 0,
          pending: data.companies?.length || 0,
          approved: 0,
          rejected: 0
        })
      } else {
        console.error('Failed to fetch pending companies')
      }
    } catch (error) {
      console.error('Error fetching pending companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }, [tokens.access_token, user])

  // Handle company approval/rejection
  const handleCompanyAction = async (companyId: number, action: 'approve' | 'reject') => {
    setProcessingCompanies(prev => new Set(prev).add(companyId))
    
    try {
      const response = await fetch(`/api/companies/${companyId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access_token}`
        }
      })
      
      if (response.ok) {
        // Remove the company from the list after successful action
        setCompanies(prev => prev.filter(company => company.id !== companyId))
        setStatistics(prev => ({
          ...prev,
          pending: prev.pending - 1,
          [action === 'approve' ? 'approved' : 'rejected']: prev[action === 'approve' ? 'approved' : 'rejected'] + 1
        }))
        if (selectedCompany?.id === companyId) {
          setSelectedCompany(null)
          setShowCompanyDetails(false)
        }
      } else {
        console.error(`Failed to ${action} company`)
      }
    } catch (error) {
      console.error(`Error ${action}ing company:`, error)
    } finally {
      setProcessingCompanies(prev => {
        const newSet = new Set(prev)
        newSet.delete(companyId)
        return newSet
      })
    }
  }

  // Load pending companies when component mounts
  useEffect(() => {
    if (mounted && tokens.access_token && user?.user_type === 'admin') {
      fetchPendingCompanies()
    }
  }, [mounted, tokens.access_token, user?.user_type, fetchPendingCompanies])

  // Filter companies based on search and industry
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.company_description && company.company_description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesIndustry = filterIndustry === 'all' || company.industry === filterIndustry
    
    return matchesSearch && matchesIndustry
  })

  // Get unique industries for filter
  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)))

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show auth error if not authenticated or not admin
  if (!isAuthenticated || !user || user.user_type !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Access Denied</h1>
            <p className="text-gray-300 mb-6">You need admin privileges to access this page.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              Company Approvals
            </h1>
            <p className="mt-2 text-gray-400">
              Review and approve company registrations to maintain platform quality.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={fetchPendingCompanies}
              disabled={loadingCompanies}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              {loadingCompanies ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin/jobs'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Manage Jobs
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-300">Total Companies</p>
                  <p className="text-2xl font-bold text-white">{statistics.total}</p>
                </div>
                <Building className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-300">Pending Review</p>
                  <p className="text-2xl font-bold text-white">{statistics.pending}</p>
                </div>
                <Crown className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-300">Approved</p>
                  <p className="text-2xl font-bold text-white">{statistics.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500/20 to-rose-600/20 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-300">Rejected</p>
                  <p className="text-2xl font-bold text-white">{statistics.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search companies by name, email, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="w-full lg:w-48">
                <select
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white"
                >
                  <option value="all">All Industries</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Pending Companies ({filteredCompanies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-300">Loading companies...</span>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {companies.length === 0 ? 'No Pending Companies' : 'No companies match your filters'}
                </h3>
                <p className="text-gray-400 mb-6">
                  {companies.length === 0 
                    ? 'All company registrations have been reviewed.' 
                    : 'Try adjusting your search criteria or filters.'
                  }
                </p>
                {companies.length === 0 && (
                  <Button 
                    onClick={fetchPendingCompanies}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh List
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCompanies.map((company) => (
                  <Card key={company.id} className="bg-gray-700/50 border-gray-600 hover:bg-gray-700 transition-all duration-200 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 ring-2 ring-gray-600">
                          <AvatarImage src={company.logo_url || undefined} alt={company.company_name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                            {company.company_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {company.company_name}
                            </h3>
                            <Badge variant="outline" className="border-yellow-500 text-yellow-400 bg-yellow-500/10">
                              Pending
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-400 mb-3">{company.email}</p>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {company.industry && (
                              <div className="flex items-center gap-2 text-gray-300">
                                <TrendingUp className="h-4 w-4 text-blue-400" />
                                <span>{company.industry}</span>
                              </div>
                            )}
                            {company.company_size && (
                              <div className="flex items-center gap-2 text-gray-300">
                                <Users className="h-4 w-4 text-green-400" />
                                <span>{company.company_size}</span>
                              </div>
                            )}
                            {company.location && (
                              <div className="flex items-center gap-2 text-gray-300">
                                <MapPin className="h-4 w-4 text-red-400" />
                                <span className="truncate">{company.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar className="h-4 w-4 text-purple-400" />
                              <span>{new Date(company.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {company.company_description && (
                            <p className="text-sm text-gray-400 mt-3 line-clamp-2">
                              {company.company_description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              {company.website && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(company.website, '_blank')}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Website
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedCompany(company)
                                  setShowCompanyDetails(true)
                                }}
                                className="text-gray-400 hover:text-gray-300 hover:bg-gray-600"
                              >
                                View Details
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleCompanyAction(company.id, 'approve')}
                                disabled={processingCompanies.has(company.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {processingCompanies.has(company.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompanyAction(company.id, 'reject')}
                                disabled={processingCompanies.has(company.id)}
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              >
                                {processingCompanies.has(company.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Details Modal */}
        {showCompanyDetails && selectedCompany && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-gray-600">
                    <AvatarImage src={selectedCompany.logo_url || undefined} alt={selectedCompany.company_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                      {selectedCompany.company_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-white">{selectedCompany.company_name}</CardTitle>
                    <p className="text-sm text-gray-400">{selectedCompany.email}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowCompanyDetails(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-300 font-medium">Industry</Label>
                    <p className="text-white mt-1">{selectedCompany.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300 font-medium">Company Size</Label>
                    <p className="text-white mt-1">{selectedCompany.company_size || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300 font-medium">Location</Label>
                    <p className="text-white mt-1">{selectedCompany.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300 font-medium">Registration Date</Label>
                    <p className="text-white mt-1">
                      {new Date(selectedCompany.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {selectedCompany.company_description && (
                  <div>
                    <Label className="text-gray-300 font-medium">Description</Label>
                    <div className="mt-2 p-4 bg-gray-700 rounded-lg">
                      <p className="text-white leading-relaxed">{selectedCompany.company_description}</p>
                    </div>
                  </div>
                )}

                {selectedCompany.website && (
                  <div>
                    <Label className="text-gray-300 font-medium">Website</Label>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedCompany.website, '_blank')}
                        className="bg-gray-700 border-gray-600 text-blue-400 hover:text-blue-300 hover:bg-gray-600"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {selectedCompany.website}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    Review this company&apos;s registration carefully before making a decision.
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        handleCompanyAction(selectedCompany.id, 'approve')
                        setShowCompanyDetails(false)
                      }}
                      disabled={processingCompanies.has(selectedCompany.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingCompanies.has(selectedCompany.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Company
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleCompanyAction(selectedCompany.id, 'reject')
                        setShowCompanyDetails(false)
                      }}
                      disabled={processingCompanies.has(selectedCompany.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      {processingCompanies.has(selectedCompany.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject Company
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
