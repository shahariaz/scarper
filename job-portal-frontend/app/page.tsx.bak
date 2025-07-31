'use client'

import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useMemo, memo } from 'react'
import { useDebounce } from 'use-debounce'
import { RootState } from '../src/store/store'
import { setJobsData, setLoading, setError } from '../src/store/slices/jobsSlice'
import { jobsApi } from '../src/lib/api'
import JobList from '../src/components/JobList'
import SearchFilters from '../src/components/SearchFilters'
import Pagination from '../src/components/Pagination'
import { Card } from '../src/components/ui/card'
import { Skeleton } from '../src/components/ui/skeleton'

// Memoize SearchFilters to prevent unnecessary re-renders
const MemoizedSearchFilters = memo(SearchFilters)

export default function HomePage() {
  const dispatch = useDispatch()
  const { jobs, filters, pagination, error } = useSelector((state: RootState) => state.jobs)

  // Debounce the search query to avoid too many API calls
  const [debouncedQuery] = useDebounce(filters.query, 500)

  // Memoize search filters to prevent unnecessary re-renders
  const searchFilters = useMemo(() => ({
    query: debouncedQuery,
    company: filters.company,
    location: filters.location,
    type: filters.type,
    experience: filters.experience,
    page: pagination.page,
    per_page: pagination.per_page,
  }), [debouncedQuery, filters.company, filters.location, filters.type, filters.experience, pagination.page, pagination.per_page])

  // Use search API for both search and filtering
  const { data: searchResult, isLoading, error: queryError } = useQuery({
    queryKey: ['jobs', searchFilters],
    queryFn: () => jobsApi.searchJobs(searchFilters),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  useEffect(() => {
    if (searchResult) {
      dispatch(setJobsData({
        jobs: searchResult.jobs,
        pagination: {
          total: searchResult.total,
          page: searchResult.page,
          per_page: searchResult.per_page,
          pages: searchResult.pages,
        }
      }))
    }
    dispatch(setLoading(isLoading))
    if (queryError) {
      dispatch(setError(queryError.message))
    }
  }, [searchResult, isLoading, queryError, dispatch])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-slide-up">
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-4 animate-shimmer" />
          <Skeleton className="h-6 w-96 animate-shimmer" />
        </div>
        <div className="mb-8">
          <Skeleton className="h-10 w-full mb-4 animate-shimmer" />
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
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 animate-slide-up">
        <Card className="p-8 text-center gradient-card border-red-500/20">
          <h2 className="text-2xl font-bold text-red-400 mb-4 animate-float">Error Loading Jobs</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center animate-slide-up animate-once">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent mb-4 animate-float">
            BD Jobs Portal
          </h1>
          <p className="text-xl text-muted-foreground animate-slide-in-left animate-once">
            Discover the latest job opportunities from top Bangladeshi software companies
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto mt-4 rounded-full animate-glow"></div>
        </div>

        <div className="animate-slide-in-right animate-once">
          <MemoizedSearchFilters />
        </div>
        
        <div className="mb-6 content-transition">
          <h2 className="text-3xl font-semibold text-foreground mb-2 flex items-center gap-3">
            <span className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full animate-pulse"></span>
            Available Jobs 
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-lg font-bold animate-glow content-transition">
              {pagination.total}
            </span>
          </h2>
        </div>

        <div className="content-transition">
          <JobList jobs={jobs} />
        </div>

        <Pagination />
      </div>
    </div>
  )
}
