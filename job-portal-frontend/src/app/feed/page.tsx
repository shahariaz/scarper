'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useDebounce } from 'use-debounce'
import { RootState } from '../../store/store'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { 
  MapPin, 
  Clock, 
  Eye, 
  ExternalLink, 
  Search,
  Filter,
  Briefcase,
  Star,
  TrendingUp,
  Users,
  Target
} from 'lucide-react'

interface Job {
  id: number
  title: string
  company: string
  location: string
  job_type: string
  work_mode: string
  description: string
  salary_min?: number
  salary_max?: number
  salary_currency: string
  experience_level: string
  skills: string[]
  category: string
  industry: string
  posted_date: string
  deadline?: string
  view_count: number
  is_featured: boolean
  created_by_type: string
  status: string
  company_logo_url?: string
  created_at: string
  apply_link?: string
  apply_email?: string
  application_count: number
  skill_match_percentage: number
  is_personalized: boolean
}

interface JobFeedResponse {
  success: boolean
  jobs: Job[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  personalization: {
    is_personalized: boolean
    user_skills: string[]
    skill_count: number
  }
  feed_stats: {
    total_jobs: number
    source_breakdown: Record<string, number>
    skill_matched_jobs?: number
    match_percentage?: number
  }
}

interface FeedStats {
  total_jobs: number
  source_breakdown: Record<string, number>
  skill_matched_jobs?: number
  match_percentage?: number
}

interface PersonalizationInfo {
  is_personalized: boolean
  user_skills: string[]
  skill_count: number
}

export default function JobFeedPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  
  // State management
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Feed metadata
  const [feedStats, setFeedStats] = useState<FeedStats>({
    total_jobs: 0,
    source_breakdown: {}
  })
  const [personalization, setPersonalization] = useState<PersonalizationInfo>({
    is_personalized: false,
    user_skills: [],
    skill_count: 0
  })
  
  // Debounced search
  const [debouncedQuery] = useDebounce(query, 500)
  
  // Infinite scroll
  const observer = useRef<IntersectionObserver | null>(null)
  
  const fetchJobs = useCallback(async (pageNum: number, resetJobs = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        per_page: '20'
      })
      
      if (debouncedQuery) params.append('query', debouncedQuery)
      if (location) params.append('location', location)
      if (jobType) params.append('job_type', jobType)
      if (experienceLevel) params.append('experience_level', experienceLevel)
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (isAuthenticated) {
        const token = localStorage.getItem('token')
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
      }
      
      const response = await fetch(`http://127.0.0.1:5001/api/jobs/feed?${params}`, { 
        headers: {
          ...headers,
          'Access-Control-Allow-Origin': '*'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      
      const data: JobFeedResponse = await response.json()
      
      if (data.success) {
        if (resetJobs) {
          setJobs(data.jobs)
        } else {
          setJobs(prev => [...prev, ...data.jobs])
        }
        
        setHasMore(data.pagination.has_next)
        setFeedStats(data.feed_stats)
        setPersonalization(data.personalization)
      } else {
        throw new Error('Failed to load jobs')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [debouncedQuery, location, jobType, experienceLevel, isAuthenticated])
  
  const loadMoreJobs = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchJobs(nextPage)
    }
  }, [loading, hasMore, page, fetchJobs])
  
  const lastJobElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreJobs()
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore, loadMoreJobs])
  
  const resetSearch = useCallback(() => {
    setJobs([])
    setPage(1)
    setHasMore(true)
    fetchJobs(1, true)
  }, [fetchJobs])
  
  // API calls
  // Track job views
  const trackJobView = async (jobId: number) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (isAuthenticated) {
        const token = localStorage.getItem('token')
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
      }
      
      await fetch(`/api/jobs/${jobId}/view`, {
        method: 'POST',
        headers
      })
    } catch (error) {
      console.warn('Failed to track job view:', error)
    }
  }
  
  // Effects
  useEffect(() => {
    resetSearch()
  }, [debouncedQuery, location, jobType, experienceLevel, resetSearch])
  
  useEffect(() => {
    fetchJobs(1, true)
  }, [fetchJobs])
  
  const getSalaryDisplay = (job: Job) => {
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min}-${job.salary_max} ${job.salary_currency}`
    }
    return 'Negotiable'
  }
  
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }
  
  if (initialLoading) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <Skeleton className="h-12 w-64 mb-4 mx-auto animate-shimmer" />
            <Skeleton className="h-6 w-96 mx-auto animate-shimmer" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 gradient-card animate-pulse">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-8 w-24" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center animate-slide-up">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent mb-4 animate-float">
            Job Feed
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {personalization.is_personalized 
              ? `Personalized recommendations based on your ${personalization.skill_count} skills`
              : 'Discover the latest job opportunities'
            }
          </p>
          
          {/* Feed Stats */}
          {feedStats.total_jobs && (
            <div className="flex justify-center gap-4 mb-6">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
                <Briefcase className="h-4 w-4 mr-1" />
                {feedStats.total_jobs} Total Jobs
              </Badge>
              
              {personalization.is_personalized && feedStats.skill_matched_jobs && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                  <Target className="h-4 w-4 mr-1" />
                  {feedStats.skill_matched_jobs} Matched ({feedStats.match_percentage}%)
                </Badge>
              )}
              
              {feedStats.source_breakdown && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-3 py-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Mixed Sources
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Search and Filters */}
        <Card className="mb-8 gradient-card border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs, companies, skills..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              
              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="self-start border-gray-600 text-gray-300 hover:text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              
              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-600">
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      <SelectItem value="dhaka">Dhaka</SelectItem>
                      <SelectItem value="chittagong">Chittagong</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue placeholder="Experience Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Error State */}
        {error && (
          <Card className="mb-8 p-6 gradient-card border-red-500/20">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Jobs</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <Button onClick={resetSearch} variant="outline">
                Try Again
              </Button>
            </div>
          </Card>
        )}
        
        {/* Jobs Grid */}
        {jobs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, index) => (
              <Card
                key={job.id}
                ref={index === jobs.length - 1 ? lastJobElementRef : null}
                className="gradient-card border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg cursor-pointer group"
                onClick={() => {
                  trackJobView(job.id)
                  if (job.apply_link) {
                    window.open(job.apply_link, '_blank')
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors mb-2">
                        {job.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <span className="font-medium">{job.company}</span>
                        {job.is_featured && (
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        )}
                      </div>
                    </div>
                    
                    {/* Personalization Indicator */}
                    {job.is_personalized && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        {job.skill_match_percentage}% match
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeAgo(job.posted_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {job.view_count}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {job.description}
                  </p>
                  
                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 3).map((skill, idx) => (
                          <Badge
                            key={idx}
                            className={`text-xs ${
                              personalization.user_skills?.includes(skill.toLowerCase())
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : 'bg-gray-600/50 text-gray-300 border-gray-500/30'
                            }`}
                          >
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 3 && (
                          <Badge className="bg-gray-600/50 text-gray-300 border-gray-500/30 text-xs">
                            +{job.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {job.job_type}
                      </Badge>
                      <div className="text-gray-400 mt-1">
                        {getSalaryDisplay(job)}
                      </div>
                    </div>
                    
                    {job.apply_link && (
                      <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Apply
                      </Button>
                    )}
                  </div>
                  
                  {/* Application Count */}
                  {job.application_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <Users className="h-3 w-3" />
                      {job.application_count} applications
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !loading && !error ? (
          <Card className="p-8 text-center gradient-card border-gray-700">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Jobs Found</h3>
            <p className="text-gray-400">Try adjusting your search criteria or filters.</p>
          </Card>
        ) : null}
        
        {/* Loading indicator for infinite scroll */}
        {loading && jobs.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-6 gradient-card animate-pulse">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-8 w-24" />
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* End of feed indicator */}
        {!hasMore && jobs.length > 0 && (
          <div className="text-center mt-8 py-8">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <div className="w-12 h-px bg-gray-600"></div>
              <span className="text-sm">You&apos;ve reached the end</span>
              <div className="w-12 h-px bg-gray-600"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
