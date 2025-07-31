'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setSelectedJob } from '@/store/slices/jobsSlice'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, Calendar, ExternalLink, Briefcase, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

export default function JobDetailModal() {
  const dispatch = useDispatch()
  const { selectedJob } = useSelector((state: RootState) => state.jobs)

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim()
  }

  const formatContent = (content: string) => {
    // Simple formatting for better readability
    return content
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => (
        <p key={index} className="mb-2">{line.trim()}</p>
      ))
  }

  if (!selectedJob) return null

  return (
    <Dialog open={!!selectedJob} onOpenChange={() => dispatch(setSelectedJob(null))}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-2">
                {selectedJob.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                {selectedJob.company}
              </DialogDescription>
            </div>
            <Badge variant={selectedJob.status === 'active' ? 'default' : 'secondary'} className="text-sm">
              {selectedJob.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Job Info Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedJob.location}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <Badge variant="outline" className="text-xs">
                    {selectedJob.job_type}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Posted {formatDate(selectedJob.posted_date)}</span>
                </div>

                {selectedJob.salary && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedJob.salary}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              size="lg" 
              className="w-full flex items-center gap-2"
              onClick={() => window.open(selectedJob.apply_link, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Apply Now
            </Button>
          </div>

          {/* Job Details */}
          <div className="md:col-span-2 space-y-6">
            {selectedJob.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {formatContent(stripHtml(selectedJob.description))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedJob.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {formatContent(stripHtml(selectedJob.requirements))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedJob.benefits && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {formatContent(stripHtml(selectedJob.benefits))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => dispatch(setSelectedJob(null))}>
            Close
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => window.open(selectedJob.apply_link, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Apply Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
