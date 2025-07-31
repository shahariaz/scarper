'use client'

import { useDispatch } from 'react-redux'
import { setSelectedJob } from '@/store/slices/jobsSlice'
import { Job } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Calendar, ExternalLink, Briefcase, Star } from 'lucide-react'
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
      <div className="text-center py-16 animate-slide-up">
        <div className="mb-6">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-float" />
        </div>
        <h3 className="text-2xl font-medium text-foreground mb-2">No jobs found</h3>
        <p className="text-muted-foreground">Try adjusting your search filters to discover more opportunities</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job, index) => (
          <Card 
            key={job.id} 
            className="gradient-card hover-lift cursor-pointer group border-primary/10 hover:border-primary/30 transition-all duration-500 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleJobClick(job)}
          >
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2 mb-2 text-foreground group-hover:text-primary transition-colors">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {job.company}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge 
                    variant={job.status === 'active' ? 'default' : 'secondary'}
                    className={job.status === 'active' 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black animate-pulse' 
                      : 'bg-secondary text-secondary-foreground'
                    }
                  >
                    {job.status}
                  </Badge>
                  <Star className="h-4 w-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-yellow-400" />
                  {job.location}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-yellow-400" />
                  Posted {formatDate(job.posted_date)}
                </div>

                <Badge 
                  variant="outline" 
                  className="text-xs border-yellow-400/30 text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors"
                >
                  {job.job_type}
                </Badge>

                {job.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 group-hover:text-foreground transition-colors">
                    {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300 group-hover:animate-glow"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJobClick(job)
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="gradient-button flex items-center gap-2 shadow-lg"
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
