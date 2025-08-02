'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit3, 
  Eye, 
  Trash2, 
  Download,
  Search,
  FileText,
  Calendar,
  Share2,
  User,
  Briefcase,
  GraduationCap,
  Star,
  Award
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CV {
  id: number;
  cv_name: string;
  created_at: string;
  updated_at: string;
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
  };
}

const CV_TEMPLATES = [
  {
    id: 'sb2nov',
    name: 'SB2Nov Professional',
    description: 'Clean, ATS-friendly design perfect for tech roles',
    preview: '/templates/sb2nov.png',
    color: 'blue'
  },
  {
    id: 'engineering',
    name: 'Engineering Resume',
    description: 'Technical-focused layout for engineering positions',
    preview: '/templates/engineering.png',
    color: 'green'
  },
  {
    id: 'classic',
    name: 'Classic Professional',
    description: 'Traditional format suitable for all industries',
    preview: '/templates/classic.png',
    color: 'gray'
  },
  {
    id: 'modern',
    name: 'Modern Creative',
    description: 'Contemporary design with visual elements',
    preview: '/templates/modern.png',
    color: 'purple'
  }
];

export default function CVMakerPage() {
  const router = useRouter();
  const [cvs, setCVs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCVName, setNewCVName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('sb2nov');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCVs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCVs = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to access CV Maker');
        router.push('/');
        return;
      }

      const response = await fetch('http://localhost:5000/api/cv/my-cvs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCVs(data.cvs || []);
      } else {
        toast.error('Failed to fetch CVs');
      }
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast.error('Failed to load CVs');
    } finally {
      setLoading(false);
    }
  };

  const createCV = async () => {
    if (!newCVName.trim()) {
      toast.error('Please enter a CV name');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to create a CV');
        return;
      }

      const response = await fetch('http://localhost:5000/api/cv/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cv_name: newCVName,
          template_id: 1,
          template_name: selectedTemplate,
          cv_data: {
            personal_info: {
              full_name: '',
              email: '',
              phone: '',
              location: '',
              linkedin: '',
              portfolio: '',
              summary: ''
            },
            experience: [],
            education: [],
            skills: [],
            problem_solving: [],
            projects: [],
            certifications: [],
            formatting: {
              font_family: 'Inter',
              font_size: 'medium',
              divider_color: '#e2e8f0',
              text_color: '#1e293b'
            }
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('CV created successfully!');
        setShowCreateForm(false);
        setNewCVName('');
        setSelectedTemplate('sb2nov');
        fetchCVs();
        router.push(`/cv-maker/editor/${data.cv.id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create CV');
      }
    } catch (error) {
      console.error('Error creating CV:', error);
      toast.error('Failed to create CV');
    } finally {
      setCreating(false);
    }
  };

  const deleteCV = async (id: number) => {
    if (!confirm('Are you sure you want to delete this CV?')) return;

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to delete CVs');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/cv/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('CV deleted successfully');
        fetchCVs();
      } else {
        toast.error('Failed to delete CV');
      }
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast.error('Failed to delete CV');
    }
  };

  const getTemplateIcon = (templateName: string) => {
    switch (templateName) {
      case 'sb2nov': return <User className="w-5 h-5" />;
      case 'engineering': return <Briefcase className="w-5 h-5" />;
      case 'classic': return <FileText className="w-5 h-5" />;
      case 'modern': return <Star className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTemplateColor = (templateName: string) => {
    const template = CV_TEMPLATES.find(t => t.id === templateName);
    return template?.color || 'gray';
  };

  const filteredCVs = cvs.filter(cv =>
    cv.cv_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cv.cv_data?.personal_info?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg">Loading your professional CVs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Professional CV Builder</h1>
              <p className="text-slate-600 text-lg">Create stunning, ATS-friendly resumes that get you hired</p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Create New CV</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Search */}
        <div className="mb-10">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search your CVs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Create CV Form */}
        {showCreateForm && (
          <Card className="mb-10 border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold">Create New Professional CV</CardTitle>
              <p className="text-blue-100">Choose a template and get started</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* CV Name Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">CV Name</label>
                  <Input
                    placeholder="e.g., Software Engineer Resume, Marketing Manager CV..."
                    value={newCVName}
                    onChange={(e) => setNewCVName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createCV()}
                    className="text-lg py-3 border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-4">Choose Template</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {CV_TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          selectedTemplate === template.id
                            ? `border-${template.color}-500 bg-${template.color}-50 shadow-md`
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center mb-3">
                          <div className={`p-2 rounded-lg bg-${template.color}-100 text-${template.color}-600 mr-3`}>
                            {getTemplateIcon(template.id)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{template.name}</h3>
                          </div>
                          {selectedTemplate === template.id && (
                            <div className={`w-5 h-5 rounded-full bg-${template.color}-500 flex items-center justify-center`}>
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{template.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4 pt-4">
                  <Button 
                    onClick={createCV} 
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Create CV
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewCVName('');
                      setSelectedTemplate('sb2nov');
                    }}
                    className="px-8 py-3 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CVs Grid */}
        {filteredCVs.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <FileText className="w-24 h-24 text-slate-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {cvs.length === 0 ? 'Ready to create your first CV?' : 'No CVs match your search'}
              </h3>
              <p className="text-slate-600 text-lg mb-8">
                {cvs.length === 0 
                  ? 'Build a professional, ATS-friendly resume that stands out to employers'
                  : 'Try adjusting your search terms or create a new CV'
                }
              </p>
              {cvs.length === 0 && (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First CV
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCVs.map((cv) => (
              <Card key={cv.id} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {cv.cv_name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 mb-3">
                        <User className="w-4 h-4" />
                        <span>{cv.cv_data?.personal_info?.full_name || 'Name not set'}</span>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`border-${getTemplateColor(cv.template?.name || '')}-200 text-${getTemplateColor(cv.template?.name || '')}-700 bg-${getTemplateColor(cv.template?.name || '')}-50`}
                    >
                      {cv.template?.name || 'Professional'}
                    </Badge>
                  </div>
                  
                  {/* Progress Indicators */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Completeness</span>
                      <span>75%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <Briefcase className="w-4 h-4 text-slate-400 mx-auto" />
                      <div className="text-sm font-semibold text-slate-900">{cv.cv_data?.experience?.length || 0}</div>
                      <div className="text-xs text-slate-500">Jobs</div>
                    </div>
                    <div className="space-y-1">
                      <GraduationCap className="w-4 h-4 text-slate-400 mx-auto" />
                      <div className="text-sm font-semibold text-slate-900">{cv.cv_data?.education?.length || 0}</div>
                      <div className="text-xs text-slate-500">Education</div>
                    </div>
                    <div className="space-y-1">
                      <Award className="w-4 h-4 text-slate-400 mx-auto" />
                      <div className="text-sm font-semibold text-slate-900">{cv.cv_data?.skills?.length || 0}</div>
                      <div className="text-xs text-slate-500">Skills</div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-slate-500 pt-2 border-t border-slate-100">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Updated {new Date(cv.updated_at).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-3 pt-4">
                    <div className="flex items-center space-x-2">
                      <Link href={`/cv-maker/editor/${cv.id}`} className="flex-1">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit CV
                        </Button>
                      </Link>
                      <Link href={`/cv-maker/preview/${cv.id}`}>
                        <Button variant="outline" size="sm" className="px-3">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-green-600">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteCV(cv.id)}
                        className="text-slate-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
