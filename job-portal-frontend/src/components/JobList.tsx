'use client'

import { useDispatch } from 'react-redux'
import { setSelectedJob } from '@/store/slices/jobsSlice'
import { Job, jobsApi } from '@/lib/api'
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

  const handleJobClick = async (job: Job) => {
    try {
      // Fetch full job details from API
      const fullJobDetails = await jobsApi.getJobById(job.id)
      dispatch(setSelectedJob(fullJobDetails))
    } catch (error) {
      console.error('Failed to fetch job details:', error)
      // Fallback to showing available data
      dispatch(setSelectedJob(job))
    }
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
      <div className="text-center py-16">
        <div className="mb-6">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        </div>
        <h3 className="text-2xl font-medium text-foreground mb-2">No jobs found</h3>
        <p className="text-muted-foreground">Try adjusting your search filters to discover more opportunities</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" key={`joblist-${jobs.length}`}>
        {jobs.map((job) => (
          <Card 
            key={`job-${job.id}`} 
            className="gradient-card hover-lift cursor-pointer group border-primary/10 hover:border-primary/30 transition-all duration-300"
            onClick={() => handleJobClick(job)}
          >
            <CardHeader className="relative pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg line-clamp-2 mb-2 text-foreground group-hover:text-primary transition-colors leading-tight">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{job.company}</span>
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge 
                    variant={job.status === 'active' ? 'default' : 'secondary'}
                    className={job.status === 'active' 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black animate-pulse text-xs px-2 py-1' 
                      : 'bg-secondary text-secondary-foreground text-xs px-2 py-1'
                    }
                  >
                    {job.status}
                  </Badge>
                  <Star className="h-4 w-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse flex-shrink-0" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span className="truncate">{job.location || 'Location not specified'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <span className="truncate">Posted {formatDate(job.posted_date)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs border-yellow-400/30 text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors flex-shrink-0"
                  >
                    {job.job_type || 'Full-time'}
                  </Badge>
                  
                  {job.experience_level && (
                    <Badge 
                      variant="outline"
                      className="text-xs border-blue-400/30 text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 transition-colors flex-shrink-0"
                    >
                      {job.experience_level}
                    </Badge>
                  )}
                  
                  {job.salary && (
                    <span className="text-xs text-green-400 font-medium truncate">
                      {job.salary}
                    </span>
                  )}
                </div>

                {/* Fixed height container for description to ensure consistent card heights */}
                <div className="h-[72px] flex items-start">
                  {job.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-3 group-hover:text-foreground transition-colors leading-relaxed">
                      {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">
                      No description available. Click to view more details.
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-border/30">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-200 group-hover:animate-glow text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJobClick(job)
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="gradient-button flex items-center gap-1 shadow-lg transition-all duration-200 text-xs h-8 px-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(job.apply_link, '_blank')
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
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
