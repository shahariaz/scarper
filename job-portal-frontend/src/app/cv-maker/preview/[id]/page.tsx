'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CV {
  id: number;
  cv_name: string;
  cv_data: {
    personal_info?: {
      full_name?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      portfolio?: string;
      github?: string;
      summary?: string;
      text_alignment?: string;
    };
    experience?: Array<{
      company: string;
      position: string;
      location: string;
      start_date: string;
      end_date: string;
      description: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      start_date: string;
      end_date: string;
      gpa?: string;
    }>;
    skills?: Array<{
      category: string;
      items: string[];
    }>;
    problem_solving?: Array<{
      id?: string;
      title: string;
      difficulty: string;
      platform?: string;
      solution_approach?: string;
      description: string;
    }>;
    projects?: Array<{
      name: string;
      description: string;
      technologies: string[];
      url?: string;
    }>;
    certifications?: Array<{
      name: string;
      issuer: string;
      date: string;
      url?: string;
    }>;
    formatting?: {
      font_family?: string;
      font_size?: string;
      divider_color?: string;
      text_color?: string;
    };
  };
}

export default function CVPreviewPage() {
  const params = useParams();
  const [cv, setCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCV();
  }, [params.id]);

  const fetchCV = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view CV');
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
        toast.error('Failed to fetch CV');
      }
    } catch (error) {
      console.error('Error fetching CV:', error);
      toast.error('Failed to load CV');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CV...</p>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">CV not found</p>
          <Link href="/cv-maker">
            <Button className="mt-4">Back to CVs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const personalInfo = cv.cv_data.personal_info || {};
  const formatting = cv.cv_data.formatting || {};
  const textAlignment = personalInfo.text_alignment || 'center';
  const fontFamily = formatting.font_family || 'Inter';
  const fontSize = formatting.font_size || 'medium';
  const dividerColor = formatting.divider_color || '#e2e8f0';
  const textColor = formatting.text_color || '#1e293b';

  // Font size mapping
  const fontSizeMap = {
    small: { base: '14px', name: '24px', section: '16px' },
    medium: { base: '16px', name: '28px', section: '18px' },
    large: { base: '18px', name: '32px', section: '20px' }
  };

  const currentFontSize = fontSizeMap[fontSize as keyof typeof fontSizeMap] || fontSizeMap.medium;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/cv-maker/editor/${params.id}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Editor
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">{cv.cv_name} - Preview</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CV Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div 
          className="bg-white shadow-lg print:shadow-none min-h-[297mm] p-8"
          style={{ 
            fontFamily: fontFamily,
            fontSize: currentFontSize.base,
            color: textColor
          }}
        >
          {/* Personal Information Header */}
          <div className={`mb-8 ${textAlignment === 'left' ? 'text-left' : textAlignment === 'right' ? 'text-right' : 'text-center'}`}>
            {personalInfo.full_name && (
              <h1 
                className="font-bold mb-3"
                style={{ fontSize: currentFontSize.name }}
              >
                {personalInfo.full_name}
              </h1>
            )}
            
            {/* Contact Information */}
            <div className={`flex flex-wrap gap-x-6 gap-y-2 text-sm ${textAlignment === 'center' ? 'justify-center' : textAlignment === 'right' ? 'justify-end' : 'justify-start'}`}>
              {personalInfo.email && (
                <span>{personalInfo.email}</span>
              )}
              {personalInfo.phone && (
                <span>{personalInfo.phone}</span>
              )}
              {personalInfo.location && (
                <span>{personalInfo.location}</span>
              )}
            </div>
            
            {/* Professional Links */}
            {(personalInfo.linkedin || personalInfo.portfolio || personalInfo.github) && (
              <div className={`flex flex-wrap gap-x-6 gap-y-2 text-sm mt-2 ${textAlignment === 'center' ? 'justify-center' : textAlignment === 'right' ? 'justify-end' : 'justify-start'}`}>
                {personalInfo.linkedin && (
                  <a href={personalInfo.linkedin} className="text-blue-600 hover:underline">
                    LinkedIn: {personalInfo.linkedin.replace('https://linkedin.com/in/', '')}
                  </a>
                )}
                {personalInfo.github && (
                  <a href={personalInfo.github} className="text-blue-600 hover:underline">
                    GitHub: {personalInfo.github.replace('https://github.com/', '')}
                  </a>
                )}
                {personalInfo.portfolio && (
                  <a href={personalInfo.portfolio} className="text-blue-600 hover:underline">
                    Portfolio: {personalInfo.portfolio}
                  </a>
                )}
              </div>
            )}
          </div>

          {personalInfo.full_name && (
            <hr className="mb-8" style={{ borderColor: dividerColor, borderWidth: '1px' }} />
          )}

          {/* Professional Summary */}
          {personalInfo.summary && (
            <div className="mb-8">
              <h2 
                className="font-semibold mb-3"
                style={{ fontSize: currentFontSize.section }}
              >
                Professional Summary
              </h2>
              <hr className="mb-4" style={{ borderColor: dividerColor, borderWidth: '0.5px' }} />
              <p className="leading-relaxed">{personalInfo.summary}</p>
            </div>
          )}

          {/* Experience */}
          {cv.cv_data.experience && cv.cv_data.experience.length > 0 && (
            <div className="mb-8">
              <h2 
                className="font-semibold mb-3"
                style={{ fontSize: currentFontSize.section }}
              >
                Professional Experience
              </h2>
              <hr className="mb-4" style={{ borderColor: dividerColor, borderWidth: '0.5px' }} />
              <div className="space-y-6">
                {cv.cv_data.experience.map((exp, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{exp.position}</h3>
                        <p className="font-medium">{exp.company} • {exp.location}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {exp.start_date} - {exp.end_date}
                      </div>
                    </div>
                    {exp.description && (
                      <div className="text-sm leading-relaxed mt-2">
                        {exp.description.split('\n').map((line, i) => (
                          <p key={i} className="mb-1">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {cv.cv_data.education && cv.cv_data.education.length > 0 && (
            <div className="mb-8">
              <h2 
                className="font-semibold mb-3"
                style={{ fontSize: currentFontSize.section }}
              >
                Education
              </h2>
              <hr className="mb-4" style={{ borderColor: dividerColor, borderWidth: '0.5px' }} />
              <div className="space-y-4">
                {cv.cv_data.education.map((edu, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{edu.degree} in {edu.field}</h3>
                        <p className="font-medium">{edu.institution}</p>
                        {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {edu.start_date} - {edu.end_date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {cv.cv_data.skills && cv.cv_data.skills.length > 0 && (
            <div className="mb-8">
              <h2 
                className="font-semibold mb-3"
                style={{ fontSize: currentFontSize.section }}
              >
                Technical Skills
              </h2>
              <hr className="mb-4" style={{ borderColor: dividerColor, borderWidth: '0.5px' }} />
              <div className="space-y-3">
                {cv.cv_data.skills.map((skill, index) => (
                  <div key={index}>
                    <span className="font-semibold">{skill.category}:</span>{' '}
                    <span>{skill.items.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Problem Solving */}
          {cv.cv_data.problem_solving && cv.cv_data.problem_solving.length > 0 && (
            <div className="mb-8">
              <h2 
                className="font-semibold mb-3"
                style={{ fontSize: currentFontSize.section }}
              >
                Problem Solving & Algorithms
              </h2>
              <hr className="mb-4" style={{ borderColor: dividerColor, borderWidth: '0.5px' }} />
              <div className="space-y-4">
                {cv.cv_data.problem_solving.map((problem, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{problem.title}</h3>
                        {problem.platform && (
                          <p className="text-sm font-medium">{problem.platform}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    {problem.solution_approach && (
                      <p className="text-sm mb-2"><strong>Approach:</strong> {problem.solution_approach}</p>
                    )}
                    {problem.description && (
                      <p className="text-sm leading-relaxed">{problem.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {cv.cv_data.projects && cv.cv_data.projects.length > 0 && (
            <div className="mb-8">
              <h2 
                className="font-semibold mb-3"
                style={{ fontSize: currentFontSize.section }}
              >
                Projects
              </h2>
              <hr className="mb-4" style={{ borderColor: dividerColor, borderWidth: '0.5px' }} />
              <div className="space-y-4">
                {cv.cv_data.projects.map((project, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.url && (
                        <a href={project.url} className="text-blue-600 text-sm hover:underline">
                          View Project
                        </a>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-2">{project.description}</p>
                    <p className="text-sm">
                      <strong>Technologies:</strong> {project.technologies.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {cv.cv_data.certifications && cv.cv_data.certifications.length > 0 && (
            <div className="mb-8">
              <h2 
                className="font-semibold mb-3"
                style={{ fontSize: currentFontSize.section }}
              >
                Certifications
              </h2>
              <hr className="mb-4" style={{ borderColor: dividerColor, borderWidth: '0.5px' }} />
              <div className="space-y-3">
                {cv.cv_data.certifications.map((cert, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{cert.name}</h3>
                      <p className="font-medium">{cert.issuer}</p>
                      {cert.url && (
                        <a href={cert.url} className="text-blue-600 text-sm hover:underline">
                          View Certificate
                        </a>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {cert.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
