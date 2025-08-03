'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Eye, Share, Download, Copy, Trash2, Settings, Sparkles, Zap, Clock, Users, Star, ArrowRight, Palette, Layout, Target } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface CV {
  id: number;
  cv_name: string;
  cv_data: Record<string, any>;
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
  template_data: Record<string, any>;
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

  useEffect(() => {
    fetchCVs();
    fetchTemplates();
  }, []);

  const fetchCVs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cv/my-cvs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCvs(data.cvs || []);
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
      const response = await fetch('/api/cv/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const createCV = async () => {
    if (!selectedTemplate || !newCVName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cv/create', {
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

      if (response.ok) {
        toast.success('CV created successfully!');
        setShowNewCVDialog(false);
        setNewCVName('');
        setSelectedTemplate(null);
        fetchCVs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create CV');
      }
    } catch (error) {
      console.error('Error creating CV:', error);
      toast.error('Failed to create CV');
    }
  };

  const duplicateCV = async (cv: CV) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cv/duplicate/${cv.id}`, {
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
        fetchCVs();
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cv/${cvId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('CV deleted successfully!');
        fetchCVs();
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
              onClick={() => setShowNewCVDialog(true)}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-6 h-6 mr-3" />
              Create New CV
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Stats & Filter Section */}
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

        {/* CV Grid */}
        {filteredCVs.length === 0 ? (
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

        {/* New CV Dialog */}
        <Dialog open={showNewCVDialog} onOpenChange={setShowNewCVDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <DialogHeader className="border-b border-gray-100 pb-6">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Create Your Perfect CV
              </DialogTitle>
              <p className="text-gray-600 mt-2">Choose a template and give your CV a memorable name</p>
            </DialogHeader>
            
            <div className="space-y-8 py-6">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  CV Name
                </label>
                <Input
                  placeholder="e.g., Software Engineer Resume, Marketing Portfolio"
                  value={newCVName}
                  onChange={(e) => setNewCVName(e.target.value)}
                  className="text-lg p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-6">
                  Choose Your Template
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => {
                    const CategoryIcon = categoryIcons[template.category as keyof typeof categoryIcons] || Layout;
                    const gradientClass = categoryColors[template.category as keyof typeof categoryColors] || categoryColors.general;
                    
                    return (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-xl ${
                          selectedTemplate?.id === template.id 
                            ? 'ring-4 ring-indigo-500/50 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-500 scale-105' 
                            : 'hover:shadow-lg hover:scale-105 border-gray-200'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`w-16 h-20 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
                              <CategoryIcon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-bold text-gray-900 text-lg">
                                  {template.name}
                                </h3>
                                {template.is_premium && (
                                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 font-semibold">
                                    <Star className="w-3 h-3 mr-1" />
                                    Pro
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                                {template.description}
                              </p>
                              <Badge 
                                className={`bg-gradient-to-r ${gradientClass} text-white border-0 font-semibold`}
                              >
                                {template.category.replace('-', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          {selectedTemplate?.id === template.id && (
                            <div className="mt-4 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                              <div className="flex items-center text-white font-semibold">
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Selected Template
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewCVDialog(false)}
                  className="px-8 py-3 text-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createCV}
                  disabled={!selectedTemplate || !newCVName.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5 mr-2" />
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
