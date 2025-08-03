'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ChevronLeft, Briefcase, GraduationCap, Code, Award, Globe, Plus, User, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

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
          title: "Error",
          description: "Failed to load CV. Please try again.",
          variant: "destructive",
        });
        router.push('/cv-maker');
      }
    } catch (error) {
      console.error('Error fetching CV:', error);
      toast({
        title: "Error",
        description: "Failed to load CV. Please try again.",
        variant: "destructive",
      });
      router.push('/cv-maker');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
          title: "Success",
          description: "CV saved successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save CV. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving CV:', error);
      toast({
        title: "Error",
        description: "Failed to save CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (cv) {
      window.open(`/cv-maker/preview/${cv.id}`, '_blank');
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

  const addSection = (type: CVSection['type']) => {
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

  const deleteSection = (sectionId: string) => {
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

    const template = sectionTemplates[section.type];
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

    const updatedItems = section.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    updateSection(sectionId, { items: updatedItems });
  };

  const deleteSectionItem = (sectionId: string, itemId: string) => {
    if (!cv) return;

    const section = cv.cv_data.sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedItems = section.items.filter(item => item.id !== itemId);
    updateSection(sectionId, { items: updatedItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CV...</p>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">CV not found</p>
          <Button onClick={() => router.push('/cv-maker')} className="mt-4">
            Back to CV Maker
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/cv-maker')}
                className="mr-4"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Edit CV: {cv.cv_name}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={saving}
              >
                <Download className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="sections">Other Sections</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={cv.cv_data.personal_info?.full_name || ''}
                      onChange={(e) => updatePersonalInfo('full_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={cv.cv_data.personal_info?.email || ''}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={cv.cv_data.personal_info?.phone || ''}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={cv.cv_data.personal_info?.location || ''}
                      onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      placeholder="Enter your location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={cv.cv_data.personal_info?.website || ''}
                      onChange={(e) => updatePersonalInfo('website', e.target.value)}
                      placeholder="Enter your website URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={cv.cv_data.personal_info?.linkedin || ''}
                      onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                      placeholder="Enter your LinkedIn profile"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    value={cv.cv_data.personal_info?.summary || ''}
                    onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                    placeholder="Write a brief professional summary"
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would go here with similar structure */}
          <TabsContent value="experience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Experience section coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Education section coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Skills section coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Other Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Additional sections coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
