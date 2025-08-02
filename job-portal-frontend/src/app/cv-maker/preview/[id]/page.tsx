'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Share, 
  Edit,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface PersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary: string;
}

interface CVSection {
  id: string;
  type: 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'custom';
  title: string;
  items: any[];
  order: number;
}

interface CV {
  id: number;
  cv_name: string;
  cv_data: {
    personal_info: PersonalInfo;
    sections: CVSection[];
  };
  template: {
    name: string;
    template_data: any;
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
  }, [params.id]);

  const fetchCV = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        alert('Please log in to view your CV');
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
        router.push('/cv-maker');
      }
    } catch (error) {
      console.error('Error fetching CV:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">CV Not Found</h1>
          <Link href="/cv-maker">
            <Button>Back to CV Maker</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden in print */}
      <div className="bg-white border-b print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/cv-maker">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to CV Maker</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{cv.cv_name}</h1>
                <p className="text-sm text-gray-600">Preview Mode</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href={`/cv-maker/editor/${cv.id}`}>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </Button>
              <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                <Share className="w-4 h-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CV Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0">
        <Card className="shadow-lg print:shadow-none print:border-none">
          <CardContent className="p-0">
            <div className="bg-white min-h-[297mm] print:min-h-0">
              {/* Modern Professional Template */}
              <div className="p-12 print:p-8">
                {/* Header Section */}
                <div className="text-center mb-8 pb-6 border-b-2 border-blue-600">
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    {cv.cv_data.personal_info.full_name || 'Your Name'}
                  </h1>
                  
                  <div className="flex flex-wrap justify-center items-center gap-4 text-gray-600">
                    {cv.cv_data.personal_info.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>{cv.cv_data.personal_info.email}</span>
                      </div>
                    )}
                    {cv.cv_data.personal_info.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span>{cv.cv_data.personal_info.phone}</span>
                      </div>
                    )}
                    {cv.cv_data.personal_info.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>{cv.cv_data.personal_info.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  <div className="flex flex-wrap justify-center items-center gap-4 mt-3">
                    {cv.cv_data.personal_info.website && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">{cv.cv_data.personal_info.website}</span>
                      </div>
                    )}
                    {cv.cv_data.personal_info.linkedin && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Linkedin className="w-4 h-4" />
                        <span className="text-sm">{cv.cv_data.personal_info.linkedin}</span>
                      </div>
                    )}
                    {cv.cv_data.personal_info.github && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Github className="w-4 h-4" />
                        <span className="text-sm">{cv.cv_data.personal_info.github}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                {cv.cv_data.personal_info.summary && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                      Professional Summary
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {cv.cv_data.personal_info.summary}
                    </p>
                  </div>
                )}

                {/* Sections */}
                {cv.cv_data.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                  <div key={section.id} className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                      {section.title}
                    </h2>
                    
                    <div className="space-y-4">
                      {section.items.map((item, index) => (
                        <div key={item.id || index}>
                          {/* Experience Section */}
                          {section.type === 'experience' && (
                            <div className="mb-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {item.position || 'Position Title'}
                                  </h3>
                                  <p className="text-gray-700 font-medium">
                                    {item.company || 'Company Name'}
                                    {item.location && (
                                      <span className="text-gray-600"> • {item.location}</span>
                                    )}
                                  </p>
                                </div>
                                <span className="text-gray-600 text-sm whitespace-nowrap">
                                  {item.start_date && (
                                    <>
                                      {item.start_date} - {item.current ? 'Present' : item.end_date || 'Present'}
                                    </>
                                  )}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-gray-700 leading-relaxed pl-0">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Education Section */}
                          {section.type === 'education' && (
                            <div className="mb-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {item.degree || 'Degree'}
                                  </h3>
                                  <p className="text-gray-700 font-medium">
                                    {item.institution || 'Institution'}
                                    {item.location && (
                                      <span className="text-gray-600"> • {item.location}</span>
                                    )}
                                  </p>
                                  {item.gpa && (
                                    <p className="text-gray-600">GPA: {item.gpa}</p>
                                  )}
                                </div>
                                <span className="text-gray-600 text-sm whitespace-nowrap">
                                  {item.start_date && (
                                    <>
                                      {item.start_date} - {item.end_date || 'Present'}
                                    </>
                                  )}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-gray-700 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Skills Section */}
                          {section.type === 'skills' && (
                            <div className="mb-3">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {item.category || 'Skill Category'}
                              </h3>
                              <p className="text-gray-700">
                                {item.skills || 'Skills list'}
                                {item.proficiency && (
                                  <span className="text-gray-600"> ({item.proficiency})</span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Projects Section */}
                          {section.type === 'projects' && (
                            <div className="mb-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                                    <span>{item.name || 'Project Name'}</span>
                                    {item.link && (
                                      <ExternalLink className="w-4 h-4 text-blue-600" />
                                    )}
                                  </h3>
                                  {item.technologies && (
                                    <p className="text-gray-600 font-medium">
                                      Technologies: {item.technologies}
                                    </p>
                                  )}
                                </div>
                                <span className="text-gray-600 text-sm whitespace-nowrap">
                                  {item.start_date && (
                                    <>
                                      {item.start_date} - {item.end_date || 'Present'}
                                    </>
                                  )}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-gray-700 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Certifications Section */}
                          {section.type === 'certifications' && (
                            <div className="mb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {item.name || 'Certification Name'}
                                  </h3>
                                  <p className="text-gray-700 font-medium">
                                    {item.issuer || 'Issuing Organization'}
                                  </p>
                                  {item.credential_id && (
                                    <p className="text-gray-600 text-sm">
                                      Credential ID: {item.credential_id}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-gray-600 text-sm">
                                  {item.date && <p>Issued: {item.date}</p>}
                                  {item.expiry_date && <p>Expires: {item.expiry_date}</p>}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Languages Section */}
                          {section.type === 'languages' && (
                            <div className="mb-3">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {item.language || 'Language'}
                                </h3>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {item.proficiency || 'Proficiency Level'}
                                </Badge>
                              </div>
                            </div>
                          )}

                          {/* Custom Section */}
                          {section.type === 'custom' && (
                            <div className="mb-4">
                              <div className="text-gray-700">
                                <p>{JSON.stringify(item, null, 2)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {section.items.length === 0 && (
                        <p className="text-gray-400 italic">
                          No items added to this section yet.
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm print:hidden">
                  <p>Created with CV Maker • {cv.template.name} Template</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:px-0 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:p-8 {
            padding: 2rem !important;
          }
          .print\\:min-h-0 {
            min-height: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
