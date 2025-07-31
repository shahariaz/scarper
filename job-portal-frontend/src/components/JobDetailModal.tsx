'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setSelectedJob } from '@/store/slices/jobsSlice'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, ExternalLink, Award } from 'lucide-react'
import { format } from 'date-fns'

export default function JobDetailModal() {
  const dispatch = useDispatch()
  const { selectedJob } = useSelector((state: RootState) => state.jobs)

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not specified'
    
    try {
      // Handle different date formats
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString // Return original if can't parse
      }
      return format(date, 'MMMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim()
  }

  if (!selectedJob) return null

  return (
    <Dialog open={!!selectedJob} onOpenChange={() => dispatch(setSelectedJob(null))}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 shadow-2xl">
        <DialogHeader className="space-y-4 pb-6 border-b border-gray-700">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl md:text-3xl font-bold mb-3 text-yellow-400 leading-tight">
                {selectedJob.title}
              </DialogTitle>
              <div className="flex items-center gap-3 text-base md:text-lg">
                <div className="p-2 bg-yellow-400 rounded-lg flex-shrink-0">
                  <Building2 className="h-4 w-4 md:h-5 md:w-5 text-black" />
                </div>
                <span className="text-gray-300 font-medium truncate">{selectedJob.company}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge 
                variant={selectedJob.status === 'active' ? 'default' : 'secondary'} 
                className={selectedJob.status === 'active' 
                  ? 'px-3 py-1 bg-green-500 text-white' 
                  : 'px-3 py-1 bg-gray-600 text-gray-300'
                }
              >
                {selectedJob.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-4 mt-6">
          {/* Job Info Sidebar */}
          <div className="space-y-4 lg:order-2">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
                  <Award className="h-4 w-4 text-yellow-400" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-yellow-400 font-medium text-sm">Location:</span>
                    <div className="text-gray-300 mt-1 text-sm break-words">
                      {selectedJob.location || 'Not specified'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-yellow-400 font-medium text-sm">Date:</span>
                    <div className="text-gray-300 mt-1 text-sm">
                      {formatDate(selectedJob.posted_date)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-yellow-400 font-medium text-sm">Position:</span>
                    <div className="text-gray-300 mt-1 text-sm break-words">
                      {selectedJob.title}
                    </div>
                  </div>
                  
                  {selectedJob.salary && (
                    <div>
                      <span className="text-yellow-400 font-medium text-sm">Salary:</span>
                      <div className="text-gray-300 mt-1 text-sm break-words">
                        {selectedJob.salary}
                      </div>
                    </div>
                  )}
                  
                  {selectedJob.experience_level && (
                    <div>
                      <span className="text-yellow-400 font-medium text-sm">Experience:</span>
                      <div className="text-gray-300 mt-1 text-sm break-words">
                        {selectedJob.experience_level}
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 mt-6"
                  onClick={() => window.open(selectedJob.apply_link, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Job Details Content */}
          <div className="lg:col-span-3 lg:order-1 space-y-6">
            {selectedJob.description && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                    <div className="w-1 h-5 bg-yellow-400 rounded-full"></div>
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300 leading-relaxed space-y-3">
                    {stripHtml(selectedJob.description).split('\n').filter(line => line.trim()).map((paragraph, index) => (
                      <p key={index} className="break-words text-sm">
                        {paragraph.trim()}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedJob.responsibilities && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-400 rounded-full"></div>
                    Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300 leading-relaxed space-y-2">
                    {stripHtml(selectedJob.responsibilities).split('\n').filter(line => line.trim()).map((item, index) => {
                      const cleanItem = item.trim();
                      if (!cleanItem) return null;
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1 text-xs">•</span>
                          <p className="text-sm break-words flex-1">{cleanItem.replace(/^[-•*]\s|^\d+\.\s/, '')}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedJob.requirements && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                    <div className="w-1 h-5 bg-orange-400 rounded-full"></div>
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300 leading-relaxed space-y-2">
                    {stripHtml(selectedJob.requirements).split('\n').filter(line => line.trim()).map((item, index) => {
                      const cleanItem = item.trim();
                      if (!cleanItem) return null;
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1 text-xs">•</span>
                          <p className="text-sm break-words flex-1">{cleanItem.replace(/^[-•*]\s|^\d+\.\s/, '')}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedJob.benefits && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                    <div className="w-1 h-5 bg-green-400 rounded-full"></div>
                    What We Offer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300 leading-relaxed space-y-2">
                    {stripHtml(selectedJob.benefits).split('\n').filter(line => line.trim()).map((item, index) => {
                      const cleanItem = item.trim();
                      if (!cleanItem) return null;
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1 text-xs">•</span>
                          <p className="text-sm break-words flex-1">{cleanItem.replace(/^[-•*]\s|^\d+\.\s/, '')}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show skills if available */}
            {selectedJob.skills && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                    <div className="w-1 h-5 bg-purple-400 rounded-full"></div>
                    Skills & Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300 leading-relaxed space-y-2">
                    {stripHtml(selectedJob.skills).split('\n').filter(line => line.trim()).map((item, index) => {
                      const cleanItem = item.trim();
                      if (!cleanItem) return null;
                      return (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1 text-xs">•</span>
                          <p className="text-sm break-words flex-1">{cleanItem.replace(/^[-•*]\s|^\d+\.\s/, '')}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-700 mt-8">
          <Button 
            variant="outline" 
            onClick={() => dispatch(setSelectedJob(null))}
            className="border-gray-600 hover:bg-gray-700 text-gray-300"
          >
            Close
          </Button>
          <Button 
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
            onClick={() => window.open(selectedJob.apply_link, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Apply Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
