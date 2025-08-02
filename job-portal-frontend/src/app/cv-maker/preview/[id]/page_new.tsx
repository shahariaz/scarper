'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft,
  Download,
  Share2,
  Edit3,
  Printer,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Calendar,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CV {
  id: number;
  cv_name: string;
  template?: {
    name: string;
  };
  cv_data: {
    personal_info?: {
      full_name?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      portfolio?: string;
      summary?: string;
    };
    experience?: Array<{
      id?: string;
      company: string;
      position: string;
      location: string;
      start_date: string;
      end_date: string;
      current: boolean;
      description: string;
    }>;
    education?: Array<{
      id?: string;
      institution: string;
      degree: string;
      field: string;
      start_date: string;
      end_date: string;
      gpa?: string;
      current: boolean;
    }>;
    skills?: Array<{
      id?: string;
      category: string;
      items: string[];
    }>;
    problem_solving?: Array<{
      id?: string;
      title: string;
      description: string;
      technologies: string[];
      difficulty: 'Easy' | 'Medium' | 'Hard';
      platform?: string;
      url?: string;
    }>;
    projects?: Array<{
      id?: string;
      name: string;
      description: string;
      technologies: string[];
      url?: string;
      start_date?: string;
      end_date?: string;
    }>;
    certifications?: Array<{
      id?: string;
      name: string;
      issuer: string;
      date: string;
      url?: string;
    }>;
  };
}

export default function CVPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [cv, setCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCV();
    }
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCV = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view your CV');
        router.push('/');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/cv/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCV(data.cv);
      } else {
        toast.error('Failed to load CV');
        router.push('/cv-maker');
      }
    } catch (error) {
      console.error('Error fetching CV:', error);
      toast.error('Failed to load CV');
      router.push('/cv-maker');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const printCV = () => {
    window.print();
  };

  const exportToPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg">Loading CV Preview...</p>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">CV Not Found</h1>
          <Link href="/cv-maker">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to CV Maker
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/cv-maker">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to CV Maker
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{cv.cv_name}</h1>
                <p className="text-slate-600">ATS-Friendly CV Preview</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href={`/cv-maker/editor/${cv.id}`}>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
              </Link>
              <Button 
                variant="outline"
                onClick={printCV}
                className="flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </Button>
              <Button 
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </Button>
              <Button 
                onClick={exportToPDF}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CV Preview Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 no-print">
        <Card className="shadow-2xl print:shadow-none print:border-0">
          <CardContent className="p-0">
            {/* A4 sized CV - ATS Friendly Format */}
            <div className="cv-container bg-white p-12" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '11pt', lineHeight: '1.4' }}>
              
              {/* Header Section - Centered */}
              <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
                <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-wide uppercase">
                  {cv.cv_data.personal_info?.full_name || 'Your Name'}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-slate-700 text-sm">
                  {cv.cv_data.personal_info?.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>{cv.cv_data.personal_info.email}</span>
                    </div>
                  )}
                  {cv.cv_data.personal_info?.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{cv.cv_data.personal_info.phone}</span>
                    </div>
                  )}
                  {cv.cv_data.personal_info?.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{cv.cv_data.personal_info.location}</span>
                    </div>
                  )}
                  {cv.cv_data.personal_info?.linkedin && (
                    <div className="flex items-center space-x-1">
                      <LinkIcon className="w-3 h-3" />
                      <span>LinkedIn: {cv.cv_data.personal_info.linkedin}</span>
                    </div>
                  )}
                  {cv.cv_data.personal_info?.portfolio && (
                    <div className="flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>Portfolio: {cv.cv_data.personal_info.portfolio}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Summary */}
              {cv.cv_data.personal_info?.summary && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide border-b border-slate-300 pb-1">
                    Professional Summary
                  </h2>
                  <p className="text-slate-700 text-justify leading-relaxed">
                    {cv.cv_data.personal_info.summary}
                  </p>
                </div>
              )}

              {/* Experience Section */}
              {cv.cv_data.experience && cv.cv_data.experience.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-b border-slate-300 pb-1">
                    Professional Experience
                  </h2>
                  <div className="space-y-4">
                    {cv.cv_data.experience.map((exp, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-bold text-slate-900">{exp.position}</h3>
                            <p className="text-slate-700 font-medium">{exp.company}{exp.location && `, ${exp.location}`}</p>
                          </div>
                          <div className="text-right text-slate-600 text-sm">
                            <p>{formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}</p>
                          </div>
                        </div>
                        <div className="text-slate-700 text-sm leading-relaxed ml-0">
                          {exp.description.split('\n').map((line, i) => (
                            <p key={i} className="mb-1">{line.trim().startsWith('•') ? line : `• ${line}`}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Section */}
              {cv.cv_data.education && cv.cv_data.education.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-b border-slate-300 pb-1">
                    Education
                  </h2>
                  <div className="space-y-3">
                    {cv.cv_data.education.map((edu, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900">{edu.degree} in {edu.field}</h3>
                            <p className="text-slate-700">{edu.institution}</p>
                            {edu.gpa && <p className="text-slate-600 text-sm">GPA: {edu.gpa}</p>}
                          </div>
                          <div className="text-right text-slate-600 text-sm">
                            <p>{formatDate(edu.start_date)} - {edu.current ? 'Present' : formatDate(edu.end_date)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {cv.cv_data.skills && cv.cv_data.skills.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-b border-slate-300 pb-1">
                    Technical Skills
                  </h2>
                  <div className="space-y-2">
                    {cv.cv_data.skills.map((skillCategory, index) => (
                      <div key={index} className="mb-2">
                        <p className="text-slate-700">
                          <span className="font-semibold">{skillCategory.category}:</span> {skillCategory.items.join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Problem Solving Section */}
              {cv.cv_data.problem_solving && cv.cv_data.problem_solving.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-b border-slate-300 pb-1">
                    Problem Solving & Competitive Programming
                  </h2>
                  <div className="space-y-3">
                    {cv.cv_data.problem_solving.map((problem, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-bold text-slate-900">{problem.title}</h3>
                            {problem.platform && (
                              <p className="text-slate-600 text-sm">Platform: {problem.platform}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                              problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {problem.difficulty}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-700 text-sm mb-1">{problem.description}</p>
                        {problem.technologies.length > 0 && (
                          <p className="text-slate-600 text-sm">
                            <span className="font-medium">Technologies:</span> {problem.technologies.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {cv.cv_data.projects && cv.cv_data.projects.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-b border-slate-300 pb-1">
                    Projects
                  </h2>
                  <div className="space-y-3">
                    {cv.cv_data.projects.map((project, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-slate-900">{project.name}</h3>
                          {project.url && (
                            <div className="flex items-center space-x-1 text-slate-600 text-sm">
                              <ExternalLink className="w-3 h-3" />
                              <span>{project.url}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-700 text-sm mb-1">{project.description}</p>
                        {project.technologies.length > 0 && (
                          <p className="text-slate-600 text-sm">
                            <span className="font-medium">Technologies:</span> {project.technologies.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications Section */}
              {cv.cv_data.certifications && cv.cv_data.certifications.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-b border-slate-300 pb-1">
                    Certifications
                  </h2>
                  <div className="space-y-2">
                    {cv.cv_data.certifications.map((cert, index) => (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900">{cert.name}</h3>
                            <p className="text-slate-700">{cert.issuer}</p>
                          </div>
                          <div className="text-right text-slate-600 text-sm">
                            <p>{new Date(cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .cv-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            padding: 2rem !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
