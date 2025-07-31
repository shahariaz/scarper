'use client'

import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { RootState } from '@/store/store'
import { setJobs, setLoading, setError } from '@/store/slices/jobsSlice'
import { jobsApi } from '@/lib/api'
import JobList from '@/components/JobList'
import SearchFilters from '@/components/SearchFilters'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomePage() {
  const dispatch = useDispatch()
  const { filteredJobs, loading, error } = useSelector((state: RootState) => state.jobs)

  const { data: jobs, isLoading, error: queryError } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.getJobs,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  useEffect(() => {
    if (jobs) {
      dispatch(setJobs(jobs))
    }
    dispatch(setLoading(isLoading))
    if (queryError) {
      dispatch(setError(queryError.message))
    }
  }, [jobs, isLoading, queryError, dispatch])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="mb-8">
          <Skeleton className="h-10 w-full mb-4" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
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
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Jobs</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          BD Jobs Portal
        </h1>
        <p className="text-lg text-gray-600">
          Discover the latest job opportunities from top Bangladeshi software companies
        </p>
      </div>

      <SearchFilters />
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Available Jobs ({filteredJobs.length})
        </h2>
      </div>

      <JobList jobs={filteredJobs} />
    </div>
  )
}
