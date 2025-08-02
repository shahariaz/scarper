import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  ExternalLink
} from 'lucide-react';

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

interface CVData {
  personal_info: PersonalInfo;
  sections: CVSection[];
}

interface CVPreviewProps {
  cvData: CVData;
  templateData?: any;
  className?: string;
}

const CVPreview: React.FC<CVPreviewProps> = ({ cvData, templateData, className = '' }) => {
  const colorScheme = templateData?.color_scheme || 'blue';
  
  const colorClasses = {
    blue: {
      header: 'border-blue-600',
      accent: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    purple: {
      header: 'border-purple-600',
      accent: 'text-purple-600', 
      badge: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    green: {
      header: 'border-green-600',
      accent: 'text-green-600',
      badge: 'bg-green-50 text-green-700 border-green-200'
    },
    black: {
      header: 'border-gray-900',
      accent: 'text-gray-900',
      badge: 'bg-gray-50 text-gray-700 border-gray-200'
    }
  };

  const colors = colorClasses[colorScheme as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <Card className={`bg-white shadow-lg ${className}`}>
      <CardContent className="p-0">
        <div className="p-8">
          {/* Header Section */}
          <div className={`text-center mb-6 pb-4 border-b-2 ${colors.header}`}>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {cvData.personal_info.full_name || 'Your Name'}
            </h1>
            
            <div className="flex flex-wrap justify-center items-center gap-3 text-sm text-gray-600">
              {cvData.personal_info.email && (
                <div className="flex items-center space-x-1">
                  <Mail className={`w-3 h-3 ${colors.accent}`} />
                  <span>{cvData.personal_info.email}</span>
                </div>
              )}
              {cvData.personal_info.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className={`w-3 h-3 ${colors.accent}`} />
                  <span>{cvData.personal_info.phone}</span>
                </div>
              )}
              {cvData.personal_info.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className={`w-3 h-3 ${colors.accent}`} />
                  <span>{cvData.personal_info.location}</span>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center items-center gap-3 mt-2">
              {cvData.personal_info.website && (
                <div className={`flex items-center space-x-1 ${colors.accent}`}>
                  <Globe className="w-3 h-3" />
                  <span className="text-xs">{cvData.personal_info.website}</span>
                </div>
              )}
              {cvData.personal_info.linkedin && (
                <div className={`flex items-center space-x-1 ${colors.accent}`}>
                  <Linkedin className="w-3 h-3" />
                  <span className="text-xs">{cvData.personal_info.linkedin}</span>
                </div>
              )}
              {cvData.personal_info.github && (
                <div className={`flex items-center space-x-1 ${colors.accent}`}>
                  <Github className="w-3 h-3" />
                  <span className="text-xs">{cvData.personal_info.github}</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional Summary */}
          {cvData.personal_info.summary && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2 pb-1 border-b border-gray-300">
                Professional Summary
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                {cvData.personal_info.summary}
              </p>
            </div>
          )}

          {/* Sections */}
          {cvData.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
            <div key={section.id} className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-1 border-b border-gray-300">
                {section.title}
              </h2>
              
              <div className="space-y-3">
                {section.items.map((item, index) => (
                  <div key={item.id || index} className="text-sm">
                    {/* Experience Section */}
                    {section.type === 'experience' && (
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {item.position || 'Position Title'}
                            </h3>
                            <p className="text-gray-700 font-medium">
                              {item.company || 'Company Name'}
                              {item.location && (
                                <span className="text-gray-600"> • {item.location}</span>
                              )}
                            </p>
                          </div>
                          <span className="text-gray-600 text-xs whitespace-nowrap">
                            {item.start_date && (
                              <>
                                {item.start_date} - {item.current ? 'Present' : item.end_date || 'Present'}
                              </>
                            )}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-gray-700 text-xs leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Education Section */}
                    {section.type === 'education' && (
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {item.degree || 'Degree'}
                            </h3>
                            <p className="text-gray-700 font-medium">
                              {item.institution || 'Institution'}
                              {item.location && (
                                <span className="text-gray-600"> • {item.location}</span>
                              )}
                            </p>
                            {item.gpa && (
                              <p className="text-gray-600 text-xs">GPA: {item.gpa}</p>
                            )}
                          </div>
                          <span className="text-gray-600 text-xs whitespace-nowrap">
                            {item.start_date && (
                              <>
                                {item.start_date} - {item.end_date || 'Present'}
                              </>
                            )}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-gray-700 text-xs leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Skills Section */}
                    {section.type === 'skills' && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.category || 'Skill Category'}
                        </h3>
                        <p className="text-gray-700 text-xs">
                          {item.skills || 'Skills list'}
                          {item.proficiency && (
                            <span className="text-gray-600"> ({item.proficiency})</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Projects Section */}
                    {section.type === 'projects' && (
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-semibold text-gray-900 flex items-center space-x-1">
                              <span>{item.name || 'Project Name'}</span>
                              {item.link && (
                                <ExternalLink className={`w-3 h-3 ${colors.accent}`} />
                              )}
                            </h3>
                            {item.technologies && (
                              <p className="text-gray-600 font-medium text-xs">
                                Technologies: {item.technologies}
                              </p>
                            )}
                          </div>
                          <span className="text-gray-600 text-xs whitespace-nowrap">
                            {item.start_date && (
                              <>
                                {item.start_date} - {item.end_date || 'Present'}
                              </>
                            )}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-gray-700 text-xs leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Certifications Section */}
                    {section.type === 'certifications' && (
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {item.name || 'Certification Name'}
                            </h3>
                            <p className="text-gray-700 font-medium text-xs">
                              {item.issuer || 'Issuing Organization'}
                            </p>
                            {item.credential_id && (
                              <p className="text-gray-600 text-xs">
                                Credential ID: {item.credential_id}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-gray-600 text-xs">
                            {item.date && <p>Issued: {item.date}</p>}
                            {item.expiry_date && <p>Expires: {item.expiry_date}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Languages Section */}
                    {section.type === 'languages' && (
                      <div>
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-900">
                            {item.language || 'Language'}
                          </h3>
                          <Badge variant="outline" className={`text-xs ${colors.badge}`}>
                            {item.proficiency || 'Proficiency Level'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {section.items.length === 0 && (
                  <p className="text-gray-400 text-xs italic">
                    No items added to this section yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CVPreview;
