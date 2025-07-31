'use client'

import { useDispatch } from 'react-redux'
import { setSelectedJob } from '@/store/slices/jobsSlice'
import { Job } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Calendar, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import JobDetailModal from './JobDetailModal'

interface JobListProps {
  jobs: Job[]
}

export default function JobList({ jobs }: JobListProps) {
  const dispatch = useDispatch()

  const handleJobClick = (job: Job) => {
    dispatch(setSelectedJob(job))
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
        <p className="text-gray-500">Try adjusting your search filters</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleJobClick(job)}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2 mb-2">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4" />
                    {job.company}
                  </CardDescription>
                </div>
                <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Posted {formatDate(job.posted_date)}
                </div>

                <Badge variant="outline" className="text-xs">
                  {job.job_type}
                </Badge>

                {job.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJobClick(job)
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(job.apply_link, '_blank')
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <JobDetailModal />
    </>
  )
}
