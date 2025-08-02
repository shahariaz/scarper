'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Eye, 
  Download, 
  Share, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Phone,
  Mail,
  MapPin,
  Globe,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const sectionIcons = {
  experience: Briefcase,
  education: GraduationCap,
  skills: Code,
  projects: Award,
  certifications: Award,
  languages: Globe,
  custom: Plus
};

const sectionTemplates = {
  experience: {
    title: 'Work Experience',
    fields: ['position', 'company', 'location', 'start_date', 'end_date', 'current', 'description']
  },
  education: {
    title: 'Education',
    fields: ['degree', 'institution', 'location', 'start_date', 'end_date', 'gpa', 'description']
  },
  skills: {
    title: 'Skills',
    fields: ['category', 'skills', 'proficiency']
  },
  projects: {
    title: 'Projects',
    fields: ['name', 'description', 'technologies', 'link', 'start_date', 'end_date']
  },
  certifications: {
    title: 'Certifications',
    fields: ['name', 'issuer', 'date', 'expiry_date', 'credential_id', 'link']
  },
  languages: {
    title: 'Languages',
    fields: ['language', 'proficiency']
  }
};

export default function CVEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [cv, setCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (params.id) {
      fetchCV();
    }
  }, [params.id]);

  const fetchCV = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to edit your CV",
          variant: "destructive",
        });
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
        toast({
          title: 'Error',
          description: 'CV not found',
          variant: 'destructive',
        });
        router.push('/cv-maker');
      }
    } catch (error) {
      console.error('Error fetching CV:', error);
      toast({
        title: 'Error',
        description: 'Failed to load CV',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCV = async () => {
    if (!cv) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save your CV",
          variant: "destructive",
        });
        router.push('/');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/cv/${cv.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cv_data: cv.cv_data
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'CV saved successfully!',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to save CV',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving CV:', error);
      toast({
        title: 'Error',
        description: 'Failed to save CV',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    if (!cv) return;
    
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        personal_info: {
          ...cv.cv_data.personal_info,
          [field]: value
        }
      }
    });
  };

  const addSection = (type: keyof typeof sectionTemplates) => {
    if (!cv) return;

    const template = sectionTemplates[type];
    const newSection: CVSection = {
      id: `section_${Date.now()}`,
      type,
      title: template.title,
      items: [],
      order: cv.cv_data.sections.length
    };

    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        sections: [...cv.cv_data.sections, newSection]
      }
    });
  };

  const updateSection = (sectionId: string, updates: Partial<CVSection>) => {
    if (!cv) return;

    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        sections: cv.cv_data.sections.map(section =>
          section.id === sectionId ? { ...section, ...updates } : section
        )
      }
    });
  };

  const removeSection = (sectionId: string) => {
    if (!cv) return;

    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        sections: cv.cv_data.sections.filter(section => section.id !== sectionId)
      }
    });
  };

  const addSectionItem = (sectionId: string) => {
    if (!cv) return;

    const section = cv.cv_data.sections.find(s => s.id === sectionId);
    if (!section) return;

    const template = sectionTemplates[section.type as keyof typeof sectionTemplates];
    const newItem: any = {};
    
    template.fields.forEach(field => {
      newItem[field] = '';
    });
    newItem.id = `item_${Date.now()}`;

    updateSection(sectionId, {
      items: [...section.items, newItem]
    });
  };

  const updateSectionItem = (sectionId: string, itemId: string, updates: any) => {
    if (!cv) return;

    const section = cv.cv_data.sections.find(s => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      items: section.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    });
  };

  const removeSectionItem = (sectionId: string, itemId: string) => {
    if (!cv) return;

    const section = cv.cv_data.sections.find(s => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      items: section.items.filter(item => item.id !== itemId)
    });
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!cv) return;

    const sections = [...cv.cv_data.sections];
    const index = sections.findIndex(s => s.id === sectionId);
    
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < sections.length - 1)) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
      
      // Update order values
      sections.forEach((section, i) => {
        section.order = i;
      });

      setCV({
        ...cv,
        cv_data: {
          ...cv.cv_data,
          sections
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="col-span-4">
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">CV Not Found</h1>
        <Link href="/cv-maker">
          <Button>Back to CV Maker</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/cv-maker">
                <Button variant="ghost" size="sm">
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{cv.cv_name}</h1>
                <p className="text-sm text-gray-600">Template: {cv.template.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={saveCV} 
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </Button>
              <Link href={`/cv-maker/preview/${cv.id}`}>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </Button>
              </Link>
              <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Editor Panel */}
          <div className="col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Personal Info</span>
                </TabsTrigger>
                <TabsTrigger value="sections" className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Sections</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={cv.cv_data.personal_info.full_name}
                          onChange={(e) => updatePersonalInfo('full_name', e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={cv.cv_data.personal_info.email}
                          onChange={(e) => updatePersonalInfo('email', e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={cv.cv_data.personal_info.phone}
                          onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={cv.cv_data.personal_info.location}
                          onChange={(e) => updatePersonalInfo('location', e.target.value)}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={cv.cv_data.personal_info.website || ''}
                          onChange={(e) => updatePersonalInfo('website', e.target.value)}
                          placeholder="https://johndoe.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={cv.cv_data.personal_info.linkedin || ''}
                          onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                          placeholder="linkedin.com/in/johndoe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          value={cv.cv_data.personal_info.github || ''}
                          onChange={(e) => updatePersonalInfo('github', e.target.value)}
                          placeholder="github.com/johndoe"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea
                        id="summary"
                        value={cv.cv_data.personal_info.summary}
                        onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                        placeholder="Write a brief summary about yourself..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sections Tab */}
              <TabsContent value="sections" className="space-y-6">
                {/* Add Section Buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Section</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(sectionTemplates).map(([type, template]) => {
                        const Icon = sectionIcons[type as keyof typeof sectionIcons];
                        return (
                          <Button
                            key={type}
                            variant="outline"
                            onClick={() => addSection(type as keyof typeof sectionTemplates)}
                            className="flex items-center space-x-2 h-auto py-3"
                          >
                            <Icon className="w-4 h-4" />
                            <span>{template.title}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Sections */}
                {cv.cv_data.sections.map((section, index) => {
                  const Icon = sectionIcons[section.type];
                  const template = sectionTemplates[section.type as keyof typeof sectionTemplates];
                  
                  return (
                    <Card key={section.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="flex items-center space-x-2">
                            <Icon className="w-5 h-5" />
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              className="border-none p-0 font-semibold text-lg"
                            />
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'down')}
                              disabled={index === cv.cv_data.sections.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSection(section.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {section.items.map((item) => (
                            <div key={item.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                  {template.fields.slice(0, 4).map((field) => (
                                    <div key={field}>
                                      <Label className="text-xs font-medium text-gray-600 capitalize">
                                        {field.replace('_', ' ')}
                                      </Label>
                                      {field === 'description' ? (
                                        <Textarea
                                          value={item[field] || ''}
                                          onChange={(e) => updateSectionItem(section.id, item.id, { [field]: e.target.value })}
                                          placeholder={`Enter ${field.replace('_', ' ')}`}
                                          className="mt-1"
                                          rows={2}
                                        />
                                      ) : (
                                        <Input
                                          value={item[field] || ''}
                                          onChange={(e) => updateSectionItem(section.id, item.id, { [field]: e.target.value })}
                                          placeholder={`Enter ${field.replace('_', ' ')}`}
                                          className="mt-1"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSectionItem(section.id, item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            onClick={() => addSectionItem(section.id)}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add {section.title} Item
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CV Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>CV Name</Label>
                      <Input value={cv.cv_name} disabled className="bg-gray-50" />
                      <p className="text-sm text-gray-600 mt-1">
                        To change the CV name, go back to the CV list
                      </p>
                    </div>
                    <div>
                      <Label>Template</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{cv.template.name}</Badge>
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          Change Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview Panel */}
          <div className="col-span-4">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border rounded-lg p-6 shadow-lg min-h-[600px] text-xs">
                    {/* Simple CV Preview */}
                    <div className="space-y-4">
                      <div className="text-center border-b pb-4">
                        <h1 className="text-lg font-bold text-gray-900">
                          {cv.cv_data.personal_info.full_name || 'Your Name'}
                        </h1>
                        <div className="text-gray-600 space-y-1 mt-2">
                          {cv.cv_data.personal_info.email && (
                            <div className="flex items-center justify-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{cv.cv_data.personal_info.email}</span>
                            </div>
                          )}
                          {cv.cv_data.personal_info.phone && (
                            <div className="flex items-center justify-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{cv.cv_data.personal_info.phone}</span>
                            </div>
                          )}
                          {cv.cv_data.personal_info.location && (
                            <div className="flex items-center justify-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{cv.cv_data.personal_info.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {cv.cv_data.personal_info.summary && (
                        <div>
                          <h2 className="font-semibold text-gray-900 mb-2">Summary</h2>
                          <p className="text-gray-700 text-xs leading-relaxed">
                            {cv.cv_data.personal_info.summary}
                          </p>
                        </div>
                      )}

                      {cv.cv_data.sections.map((section) => (
                        <div key={section.id}>
                          <h2 className="font-semibold text-gray-900 mb-2 pb-1 border-b">
                            {section.title}
                          </h2>
                          <div className="space-y-3">
                            {section.items.map((item) => (
                              <div key={item.id} className="text-xs">
                                {section.type === 'experience' && (
                                  <div>
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h3 className="font-medium text-gray-900">
                                          {item.position || 'Position'}
                                        </h3>
                                        <p className="text-gray-700">
                                          {item.company || 'Company'}
                                        </p>
                                      </div>
                                      <span className="text-gray-600">
                                        {item.start_date} - {item.current ? 'Present' : item.end_date}
                                      </span>
                                    </div>
                                    {item.description && (
                                      <p className="text-gray-600 mt-1 text-xs">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {section.type === 'education' && (
                                  <div>
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h3 className="font-medium text-gray-900">
                                          {item.degree || 'Degree'}
                                        </h3>
                                        <p className="text-gray-700">
                                          {item.institution || 'Institution'}
                                        </p>
                                      </div>
                                      <span className="text-gray-600">
                                        {item.start_date} - {item.end_date}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {section.type === 'skills' && (
                                  <div>
                                    <h3 className="font-medium text-gray-900">
                                      {item.category || 'Category'}
                                    </h3>
                                    <p className="text-gray-700">
                                      {item.skills || 'Skills'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                            {section.items.length === 0 && (
                              <p className="text-gray-400 text-xs italic">
                                No items added yet
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
