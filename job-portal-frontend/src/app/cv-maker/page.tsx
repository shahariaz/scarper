'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Eye, Share, Copy, Trash2, Settings, Sparkles, Zap, Clock, Users, Star, ArrowRight, Palette, Layout, Target } from 'lucide-react';
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
      summary?: string;
    };
    sections?: Array<{
      type: string;
      title: string;
      content: unknown;
    }>;
  };
  is_public: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  template_name: string;
  template_category: string;
}

interface CVTemplate {
  id: number;
  name: string;
  description: string;
  template_data: {
    layout?: string;
    color_scheme?: string;
    sections?: string[];
    fonts?: {
      primary?: string;
      secondary?: string;
    };
    spacing?: string;
  };
  preview_image_url?: string;
  category: string;
  is_premium: boolean;
}

export default function CVMakerPage() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCVDialog, setShowNewCVDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate | null>(null);
  const [newCVName, setNewCVName] = useState('');
  const [filter, setFilter] = useState('all');

  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    const accessToken = localStorage.getItem('access_token');
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    console.log('🔍 Authentication Debug:', { 
      accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
      token: token ? `${token.substring(0, 20)}...` : null,
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null
    });
    
    return !!(accessToken || token);
  };

  useEffect(() => {
    // Always load templates first (no auth required)
    fetchTemplates();
    
    // Check authentication status for user-specific features
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    console.log('Auth check - Token:', token ? `Present (${token.substring(0, 20)}...)` : 'Missing');
    
    if (!token) {
      console.log('No authentication token found - showing public interface');
      setLoading(false);
      return;
    }

    // Test token validity with auth profile endpoint
    fetch('http://localhost:5000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    .then(response => {
      console.log('Auth test response status:', response.status);
      if (response.status === 401) {
        console.error('Token is invalid or expired - showing public interface');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }
      return response.json();
    })
    .then(data => {
      if (data && data.success) {
        console.log('Auth test successful, user:', data.user?.email || 'Unknown');
        console.log('Loading user CVs...');
        fetchCVs();
      }
      setLoading(false);
    })
    .catch(error => {
      console.error('Auth test failed:', error);
      console.log('Showing public interface');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');
      setLoading(false);
    });
  }, []);

  const fetchCVs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Token for CVs:', token ? 'Present' : 'Missing');
      
      const response = await fetch('http://localhost:5000/api/cv/my-cvs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('CV fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('CV data received:', data);
        setCvs(data.cvs || []);
      } else {
        const error = await response.json();
        console.error('CV fetch error:', error);
        toast.error(error.message || 'Failed to load your CVs');
      }
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast.error('Failed to load your CVs');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      console.log('Fetching templates...');
      const response = await fetch('http://localhost:5000/api/cv/templates');
      console.log('Templates response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Templates data received:', data);
        setTemplates(data.templates || []);
      } else {
        console.error('Templates fetch failed:', response.status);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const createCV = async () => {
    if (!selectedTemplate || !newCVName.trim()) {
      toast.error('Please select a template and enter a CV name');
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in to create a CV');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      console.log('Creating CV:', newCVName.trim(), 'with template:', selectedTemplate.name);
      
      const response = await fetch('http://localhost:5000/api/cv/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          cv_name: newCVName.trim(),
          cv_data: {
            personal_info: {
              full_name: '',
              email: '',
              phone: '',
              location: '',
              summary: ''
            },
            sections: []
          }
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Your session has expired. Please log in again.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/';
          return;
        }
        
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast.error(errorData.message || 'Failed to create CV');
        return;
      }

      const data = await response.json();
      console.log('CV created successfully:', data);
      toast.success('CV created successfully!');
      
      // Close dialog and reset state first
      setShowNewCVDialog(false);
      setNewCVName('');
      setSelectedTemplate(null);
      
      // Add a small delay to ensure the dialog closes properly
      setTimeout(() => {
        fetchCVs();
      }, 100);
    } catch (error) {
      console.error('Error creating CV:', error);
      toast.error('Failed to create CV. Please try again.');
    }
  };

  const duplicateCV = async (cv: CV) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5000/api/cv/duplicate/${cv.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cv_name: `Copy of ${cv.cv_name}`
        }),
      });

      if (response.ok) {
        toast.success('CV duplicated successfully!');
        setTimeout(() => {
          fetchCVs();
        }, 100);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to duplicate CV');
      }
    } catch (error) {
      console.error('Error duplicating CV:', error);
      toast.error('Failed to duplicate CV');
    }
  };

  const deleteCV = async (cvId: number) => {
    if (!confirm('Are you sure you want to delete this CV? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5000/api/cv/${cvId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('CV deleted successfully!');
        setTimeout(() => {
          fetchCVs();
        }, 100);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete CV');
      }
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast.error('Failed to delete CV');
    }
  };

  const filteredCVs = cvs.filter(cv => {
    if (filter === 'all') return true;
    if (filter === 'default') return cv.is_default;
    if (filter === 'public') return cv.is_public;
    return true;
  });

  const categoryColors = {
    professional: 'from-blue-500 to-blue-600',
    creative: 'from-purple-500 to-pink-500',
    executive: 'from-gray-700 to-gray-800',
    'entry-level': 'from-green-500 to-emerald-500',
    general: 'from-orange-500 to-amber-500',
  };

  const categoryIcons = {
    professional: Target,
    creative: Palette,
    executive: Star,
    'entry-level': Zap,
    general: Layout,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-12 bg-white/60 rounded-2xl w-1/3 mb-8 shadow-sm"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-white/60 rounded-3xl shadow-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                CV Maker Studio
              </h1>
              <p className="text-xl text-blue-100 mb-6 max-w-2xl">
                Create stunning, professional resumes that get you noticed. Choose from expert-designed templates and build your perfect CV in minutes.
              </p>
              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Instant Export</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Professional Templates</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => {
                if (!isAuthenticated()) {
                  toast.error('Please log in to create a CV');
                  return;
                }
                setShowNewCVDialog(true);
              }}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-6 h-6 mr-3" />
              {isAuthenticated() ? 'Create New CV' : 'Login to Create CV'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Stats & Filter Section - Only show for authenticated users */}
        {isAuthenticated() && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total CVs</p>
                      <p className="text-3xl font-bold">{cvs.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Public CVs</p>
                    <p className="text-3xl font-bold">{cvs.filter(cv => cv.is_public).length}</p>
                  </div>
                  <Share className="w-8 h-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Templates</p>
                    <p className="text-3xl font-bold">{templates.length}</p>
                  </div>
                  <Layout className="w-8 h-8 text-amber-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg w-fit">
            {[
              { key: 'all', label: 'All CVs', count: cvs.length },
              { key: 'default', label: 'Default', count: cvs.filter(cv => cv.is_default).length },
              { key: 'public', label: 'Public', count: cvs.filter(cv => cv.is_public).length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  filter === key
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
        )}

        {/* CV Grid - Show for authenticated users only */}
        {isAuthenticated() && filteredCVs.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <FileText className="w-16 h-16 text-indigo-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {filter === 'all' ? 'Start Your Journey' : `No ${filter} CVs yet`}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {filter === 'all' 
                  ? 'Create your first professional CV and take the next step in your career'
                  : `You don't have any ${filter} CVs yet. Create one to get started!`
                }
              </p>
              {filter === 'all' && (
                <Button 
                  onClick={() => setShowNewCVDialog(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Create Your First CV
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCVs.map((cv) => {
              const CategoryIcon = categoryIcons[cv.template_category as keyof typeof categoryIcons] || Layout;
              const gradientClass = categoryColors[cv.template_category as keyof typeof categoryColors] || categoryColors.general;
              
              return (
                <Card key={cv.id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm hover:scale-105 overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${gradientClass}`}></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${gradientClass} flex items-center justify-center`}>
                            <CategoryIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {cv.cv_name}
                            </CardTitle>
                            <p className="text-sm text-gray-500 font-medium">{cv.template_name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          {cv.is_default && (
                            <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-0 font-semibold">
                              <Star className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          {cv.is_public && (
                            <Badge className="bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-0 font-semibold">
                              <Share className="w-3 h-3 mr-1" />
                              Public
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-2" />
                          Updated {new Date(cv.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Link href={`/cv-maker/editor/${cv.id}`}>
                          <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300">
                            <Settings className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/cv-maker/preview/${cv.id}`}>
                          <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        </Link>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateCV(cv)}
                          className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300"
                          title="Duplicate CV"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCV(cv.id)}
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                          title="Delete CV"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Template Gallery - Always visible */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Template
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse our collection of professionally designed CV templates. Each template is crafted to help you stand out and get noticed by employers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {templates.map((template) => {
              const CategoryIcon = categoryIcons[template.category as keyof typeof categoryIcons] || Layout;
              const gradientClass = categoryColors[template.category as keyof typeof categoryColors] || categoryColors.general;
              
              return (
                <Card key={template.id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm hover:scale-105 overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${gradientClass}`}></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${gradientClass} flex items-center justify-center`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {template.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500 font-medium capitalize">{template.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => {
                          if (!isAuthenticated()) {
                            toast.error('Please log in to use this template');
                            return;
                          }
                          setSelectedTemplate(template);
                          setShowNewCVDialog(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {isAuthenticated() ? 'Use Template' : 'Login to Use'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300"
                        title="Preview Template"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* New CV Dialog */}
        <Dialog open={showNewCVDialog} onOpenChange={setShowNewCVDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-0 shadow-xl bg-white">
            <DialogHeader className="p-6 border-b border-gray-200">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Create Your Perfect CV
              </DialogTitle>
              <p className="text-gray-600 mt-1">Choose a template and give your CV a memorable name</p>
            </DialogHeader>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* CV Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    CV Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Software Engineer Resume"
                    value={newCVName}
                    onChange={(e) => {
                      console.log('CV name changed:', e.target.value);
                      setNewCVName(e.target.value);
                    }}
                    className="w-full p-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Current value: &quot;{newCVName}&quot;
                  </div>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-4">
                    Choose Your Template
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map((template) => {
                      const CategoryIcon = categoryIcons[template.category as keyof typeof categoryIcons] || Layout;
                      const gradientClass = categoryColors[template.category as keyof typeof categoryColors] || categoryColors.general;
                      const isSelected = selectedTemplate?.id === template.id;
                      
                      return (
                        <div
                          key={template.id}
                          className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                          
                          <div className="flex items-start space-x-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-10 h-12 rounded bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                              <CategoryIcon className="w-5 h-5 text-white" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate pr-2">
                                  {template.name}
                                </h3>
                                {template.is_premium && (
                                  <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0.5 flex-shrink-0">
                                    Pro
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-gray-600 text-xs mb-2 leading-relaxed" style={{ 
                                display: '-webkit-box', 
                                WebkitLineClamp: 2, 
                                WebkitBoxOrient: 'vertical' as const,
                                overflow: 'hidden'
                              }}>
                                {template.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <Badge className={`bg-gradient-to-r ${gradientClass} text-white text-xs px-2 py-0.5`}>
                                  {template.category.replace('-', ' ').toUpperCase()}
                                </Badge>
                                
                                {isSelected && (
                                  <div className="flex items-center text-indigo-600 text-xs font-medium">
                                    <ArrowRight className="w-3 h-3 mr-1" />
                                    Selected
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewCVDialog(false)}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createCV}
                  disabled={!selectedTemplate || !newCVName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create CV
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
