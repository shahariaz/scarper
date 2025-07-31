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
import { Building2, MapPin, Calendar, ExternalLink, Briefcase, DollarSign, Star, Award } from 'lucide-react'
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
        <p key={index} className="mb-2 text-muted-foreground leading-relaxed">{line.trim()}</p>
      ))
  }

  if (!selectedJob) return null

  return (
    <Dialog open={!!selectedJob} onOpenChange={() => dispatch(setSelectedJob(null))}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto gradient-card border-primary/20 animate-slide-up">
        <DialogHeader className="space-y-4 pb-6 border-b border-primary/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold mb-3 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent animate-float">
                {selectedJob.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg animate-glow">
                  <Building2 className="h-5 w-5 text-black" />
                </div>
                <span className="text-foreground font-medium">{selectedJob.company}</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={selectedJob.status === 'active' ? 'default' : 'secondary'} 
                className={selectedJob.status === 'active' 
                  ? 'text-lg px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black animate-pulse' 
                  : 'text-lg px-4 py-2'
                }
              >
                {selectedJob.status}
              </Badge>
              <Star className="h-6 w-6 text-yellow-400 animate-pulse" />
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-8 md:grid-cols-3 mt-6">
          {/* Job Info Sidebar */}
          <div className="space-y-6 animate-slide-in-left">
            <Card className="gradient-card border-primary/20 hover-lift">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <MapPin className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium">{selectedJob.location}</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <Briefcase className="h-5 w-5 text-yellow-400" />
                  <Badge variant="outline" className="border-yellow-400/30 text-yellow-400 bg-yellow-400/10">
                    {selectedJob.job_type}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm">Posted {formatDate(selectedJob.posted_date)}</span>
                </div>

                {selectedJob.salary && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-semibold">{selectedJob.salary}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              size="lg" 
              className="w-full gradient-button text-lg py-6 shadow-2xl animate-glow"
              onClick={() => window.open(selectedJob.apply_link, '_blank')}
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Apply Now
            </Button>
          </div>

          {/* Job Details */}
          <div className="md:col-span-2 space-y-6 animate-slide-in-right">
            {selectedJob.description && (
              <Card className="gradient-card border-primary/20 hover-lift">
                <CardHeader>
                  <CardTitle className="text-xl text-yellow-400 flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full"></div>
                    Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-4">
                    {formatContent(stripHtml(selectedJob.description))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedJob.requirements && (
              <Card className="gradient-card border-primary/20 hover-lift">
                <CardHeader>
                  <CardTitle className="text-xl text-yellow-400 flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-orange-400 to-yellow-500 rounded-full"></div>
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-4">
                    {formatContent(stripHtml(selectedJob.requirements))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedJob.benefits && (
              <Card className="gradient-card border-primary/20 hover-lift">
                <CardHeader>
                  <CardTitle className="text-xl text-yellow-400 flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                    Benefits & Perks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-4">
                    {formatContent(stripHtml(selectedJob.benefits))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-primary/20 mt-8">
          <Button 
            variant="outline" 
            onClick={() => dispatch(setSelectedJob(null))}
            className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300"
          >
            Close
          </Button>
          <Button 
            className="gradient-button flex items-center gap-2 shadow-lg"
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
