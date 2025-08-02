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
        toast.error('CV not found');
        router.push('/cv-maker');
      }
    } catch (error) {
      console.error('Error fetching CV:', error);
      toast.error('Failed to load CV');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // For now, we'll use browser print functionality
    // Later can be enhanced with proper PDF generation
    window.print();
  };

  const printCV = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + '-01'); // Add day since we store YYYY-MM
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
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
                <p className="text-slate-600">CV Preview</p>
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
            {/* A4 sized CV */}
            <div className="cv-container bg-white" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
              {/* Header Section */}
              <div className="bg-blue-600 text-white p-8">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-2">
                    {cv.cv_data.personal_info?.full_name || 'Your Name'}
                  </h1>
                  <div className="flex items-center justify-center space-x-6 text-blue-100 text-sm">
                    {cv.cv_data.personal_info?.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{cv.cv_data.personal_info.email}</span>
                      </div>
                    )}
                    {cv.cv_data.personal_info?.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{cv.cv_data.personal_info.phone}</span>
                      </div>
                    )}
                    {cv.cv_data.personal_info?.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{cv.cv_data.personal_info.location}</span>
                      </div>
                    )}
                  </div>
                  {(cv.cv_data.personal_info?.linkedin || cv.cv_data.personal_info?.portfolio) && (
                    <div className="flex items-center justify-center space-x-6 text-blue-100 text-sm mt-2">
                      {cv.cv_data.personal_info?.linkedin && (
                        <div className="flex items-center space-x-1">
                          <LinkIcon className="w-4 h-4" />
                          <span>{cv.cv_data.personal_info.linkedin}</span>
                        </div>
                      )}
                      {cv.cv_data.personal_info?.portfolio && (
                        <div className="flex items-center space-x-1">
                          <ExternalLink className="w-4 h-4" />
                          <span>{cv.cv_data.personal_info.portfolio}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content Sections */}
              <div className="p-8 space-y-8">
                {/* Professional Summary */}
                {cv.cv_data.personal_info?.summary && (
                  <div>
                    <h2 className="text-xl font-bold text-blue-600 mb-3 pb-1 border-b-2 border-blue-600">
                      PROFESSIONAL SUMMARY
                    </h2>
                    <p className="text-slate-700 leading-relaxed">
                      {cv.cv_data.personal_info.summary}
                    </p>
                  </div>
                )}

                {/* Work Experience */}
                {cv.cv_data.experience && cv.cv_data.experience.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-blue-600 mb-4 pb-1 border-b-2 border-blue-600">
                      WORK EXPERIENCE
                    </h2>
                    <div className="space-y-6">
                      {cv.cv_data.experience.map((exp, index) => (
                        <div key={exp.id || index}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">{exp.position}</h3>
                              <p className="text-blue-600 font-semibold">{exp.company}</p>
                              {exp.location && (
                                <p className="text-slate-600 text-sm">{exp.location}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-slate-600 text-sm">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>
                                  {formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                            {exp.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {cv.cv_data.education && cv.cv_data.education.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-blue-600 mb-4 pb-1 border-b-2 border-blue-600">
                      EDUCATION
                    </h2>
                    <div className="space-y-4">
                      {cv.cv_data.education.map((edu, index) => (
                        <div key={edu.id || index}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">{edu.degree} in {edu.field}</h3>
                              <p className="text-blue-600 font-semibold">{edu.institution}</p>
                              {edu.gpa && (
                                <p className="text-slate-600 text-sm">GPA: {edu.gpa}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-slate-600 text-sm">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>
                                  {formatDate(edu.start_date)} - {edu.current ? 'Present' : formatDate(edu.end_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {cv.cv_data.skills && cv.cv_data.skills.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-blue-600 mb-4 pb-1 border-b-2 border-blue-600">
                      SKILLS
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cv.cv_data.skills.map((skillCategory, index) => (
                        <div key={skillCategory.id || index}>
                          <h3 className="font-bold text-slate-900 mb-2">{skillCategory.category}</h3>
                          <div className="flex flex-wrap gap-2">
                            {skillCategory.items.map((skill, skillIndex) => (
                              <span 
                                key={skillIndex}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {cv.cv_data.projects && cv.cv_data.projects.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-blue-600 mb-4 pb-1 border-b-2 border-blue-600">
                      PROJECTS
                    </h2>
                    <div className="space-y-4">
                      {cv.cv_data.projects.map((project, index) => (
                        <div key={project.id || index}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                              {project.url && (
                                <a href={project.url} className="text-blue-600 text-sm hover:underline">
                                  {project.url}
                                </a>
                              )}
                            </div>
                            {(project.start_date || project.end_date) && (
                              <div className="text-right">
                                <div className="flex items-center text-slate-600 text-sm">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  <span>
                                    {project.start_date && formatDate(project.start_date)}
                                    {project.start_date && project.end_date && ' - '}
                                    {project.end_date && formatDate(project.end_date)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-slate-700 text-sm mb-2">{project.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech, techIndex) => (
                              <span 
                                key={techIndex}
                                className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {cv.cv_data.certifications && cv.cv_data.certifications.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-blue-600 mb-4 pb-1 border-b-2 border-blue-600">
                      CERTIFICATIONS
                    </h2>
                    <div className="space-y-3">
                      {cv.cv_data.certifications.map((cert, index) => (
                        <div key={cert.id || index} className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900">{cert.name}</h3>
                            <p className="text-blue-600 font-semibold">{cert.issuer}</p>
                            {cert.url && (
                              <a href={cert.url} className="text-blue-600 text-sm hover:underline">
                                View Certificate
                              </a>
                            )}
                          </div>
                          <div className="text-slate-600 text-sm">
                            {formatDate(cert.date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Actions */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-4">
            <Link href={`/cv-maker/editor/${cv.id}`}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Edit3 className="w-5 h-5 mr-2" />
                Continue Editing
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline"
              onClick={exportToPDF}
            >
              <Download className="w-5 h-5 mr-2" />
              Download CV
            </Button>
          </div>
        </div>
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
