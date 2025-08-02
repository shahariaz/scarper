'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, 
  Eye, 
  ArrowLeft,
  Plus,
  Trash2,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  FileText,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Calendar
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

export default function CVEditor() {
  const params = useParams();
  const router = useRouter();
  const [cv, setCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  useEffect(() => {
    if (params.id) {
      fetchCV();
    }
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCV = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to edit CVs');
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

  const saveCV = async () => {
    if (!cv) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to save changes');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/cv/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cv_name: cv.cv_name,
          cv_data: cv.cv_data
        }),
      });

      if (response.ok) {
        toast.success('CV saved successfully!');
      } else {
        toast.error('Failed to save CV');
      }
    } catch (error) {
      console.error('Error saving CV:', error);
      toast.error('Failed to save CV');
    } finally {
      setSaving(false);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
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

  const addExperience = () => {
    if (!cv) return;
    const newExperience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: ''
    };
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        experience: [...(cv.cv_data.experience || []), newExperience]
      }
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    if (!cv) return;
    const updatedExperience = [...(cv.cv_data.experience || [])];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        experience: updatedExperience
      }
    });
  };

  const removeExperience = (index: number) => {
    if (!cv) return;
    const updatedExperience = [...(cv.cv_data.experience || [])];
    updatedExperience.splice(index, 1);
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        experience: updatedExperience
      }
    });
  };

  const addEducation = () => {
    if (!cv) return;
    const newEducation = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      start_date: '',
      end_date: '',
      current: false,
      gpa: ''
    };
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        education: [...(cv.cv_data.education || []), newEducation]
      }
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    if (!cv) return;
    const updatedEducation = [...(cv.cv_data.education || [])];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        education: updatedEducation
      }
    });
  };

  const removeEducation = (index: number) => {
    if (!cv) return;
    const updatedEducation = [...(cv.cv_data.education || [])];
    updatedEducation.splice(index, 1);
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        education: updatedEducation
      }
    });
  };

  const addSkillCategory = () => {
    if (!cv) return;
    const newSkillCategory = {
      id: Date.now().toString(),
      category: '',
      items: []
    };
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        skills: [...(cv.cv_data.skills || []), newSkillCategory]
      }
    });
  };

  const updateSkillCategory = (index: number, field: string, value: any) => {
    if (!cv) return;
    const updatedSkills = [...(cv.cv_data.skills || [])];
    if (field === 'items') {
      updatedSkills[index] = { ...updatedSkills[index], items: value.split(',').map((item: string) => item.trim()).filter((item: string) => item) };
    } else {
      updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    }
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        skills: updatedSkills
      }
    });
  };

  const removeSkillCategory = (index: number) => {
    if (!cv) return;
    const updatedSkills = [...(cv.cv_data.skills || [])];
    updatedSkills.splice(index, 1);
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        skills: updatedSkills
      }
    });
  };

  const sections = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'experience', name: 'Experience', icon: Briefcase },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'skills', name: 'Skills', icon: Code },
    { id: 'projects', name: 'Projects', icon: FileText },
    { id: 'certifications', name: 'Certifications', icon: Award },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg">Loading CV Editor...</p>
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
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/cv-maker">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{cv.cv_name}</h1>
                <p className="text-slate-600">Professional CV Editor</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href={`/cv-maker/preview/${params.id}`}>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </Button>
              </Link>
              <Button 
                onClick={saveCV}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">CV Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{section.name}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Personal Information */}
            {activeSection === 'personal' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <p className="text-slate-600">Add your contact details and professional summary</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={cv.cv_data.personal_info?.full_name || ''}
                        onChange={(e) => updatePersonalInfo('full_name', e.target.value)}
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          value={cv.cv_data.personal_info?.email || ''}
                          onChange={(e) => updatePersonalInfo('email', e.target.value)}
                          placeholder="john@example.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          id="phone"
                          value={cv.cv_data.personal_info?.phone || ''}
                          onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          id="location"
                          value={cv.cv_data.personal_info?.location || ''}
                          onChange={(e) => updatePersonalInfo('location', e.target.value)}
                          placeholder="New York, NY"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn Profile</Label>
                      <div className="relative mt-1">
                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          id="linkedin"
                          value={cv.cv_data.personal_info?.linkedin || ''}
                          onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                          placeholder="linkedin.com/in/johndoe"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="portfolio">Portfolio/Website</Label>
                      <div className="relative mt-1">
                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          id="portfolio"
                          value={cv.cv_data.personal_info?.portfolio || ''}
                          onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                          placeholder="johndoe.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={cv.cv_data.personal_info?.summary || ''}
                      onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                      placeholder="Write a compelling 2-3 sentence summary highlighting your experience, skills, and career goals..."
                      rows={4}
                      className="mt-1"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Tip: Keep it concise and focus on your most relevant qualifications
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experience Section */}
            {activeSection === 'experience' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5" />
                        <span>Work Experience</span>
                      </CardTitle>
                      <p className="text-slate-600">Add your professional work history</p>
                    </div>
                    <Button onClick={addExperience} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {cv.cv_data.experience?.map((exp, index) => (
                    <div key={exp.id || index} className="border border-slate-200 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Experience {index + 1}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeExperience(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Job Title *</Label>
                          <Input
                            value={exp.position}
                            onChange={(e) => updateExperience(index, 'position', e.target.value)}
                            placeholder="Software Engineer"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Company *</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateExperience(index, 'company', e.target.value)}
                            placeholder="Google Inc."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input
                            value={exp.location}
                            onChange={(e) => updateExperience(index, 'location', e.target.value)}
                            placeholder="San Francisco, CA"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`current-${index}`}
                            checked={exp.current}
                            onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor={`current-${index}`}>Currently working here</Label>
                        </div>
                        <div>
                          <Label>Start Date *</Label>
                          <Input
                            type="month"
                            value={exp.start_date}
                            onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="month"
                            value={exp.end_date}
                            onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                            disabled={exp.current}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Job Description *</Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(index, 'description', e.target.value)}
                          placeholder="• Developed and maintained web applications using React and Node.js&#10;• Collaborated with cross-functional teams to deliver high-quality software&#10;• Improved application performance by 30% through code optimization"
                          rows={4}
                          className="mt-1"
                        />
                        <p className="text-sm text-slate-500 mt-1">
                          Use bullet points to highlight your key achievements and responsibilities
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!cv.cv_data.experience || cv.cv_data.experience.length === 0) && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                      <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No work experience added</h3>
                      <p className="text-slate-600 mb-4">Add your professional work history to strengthen your CV</p>
                      <Button onClick={addExperience} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Experience
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Education Section */}
            {activeSection === 'education' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <GraduationCap className="w-5 h-5" />
                        <span>Education</span>
                      </CardTitle>
                      <p className="text-slate-600">Add your educational background</p>
                    </div>
                    <Button onClick={addEducation} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {cv.cv_data.education?.map((edu, index) => (
                    <div key={edu.id || index} className="border border-slate-200 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Education {index + 1}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeEducation(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Institution *</Label>
                          <Input
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            placeholder="Stanford University"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Degree *</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            placeholder="Bachelor of Science"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Field of Study *</Label>
                          <Input
                            value={edu.field}
                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                            placeholder="Computer Science"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>GPA (Optional)</Label>
                          <Input
                            value={edu.gpa || ''}
                            onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                            placeholder="3.8/4.0"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edu-current-${index}`}
                            checked={edu.current}
                            onChange={(e) => updateEducation(index, 'current', e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor={`edu-current-${index}`}>Currently studying here</Label>
                        </div>
                        <div></div>
                        <div>
                          <Label>Start Date *</Label>
                          <Input
                            type="month"
                            value={edu.start_date}
                            onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="month"
                            value={edu.end_date}
                            onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                            disabled={edu.current}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!cv.cv_data.education || cv.cv_data.education.length === 0) && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                      <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No education added</h3>
                      <p className="text-slate-600 mb-4">Add your educational background and qualifications</p>
                      <Button onClick={addEducation} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Education
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Skills Section */}
            {activeSection === 'skills' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Code className="w-5 h-5" />
                        <span>Skills</span>
                      </CardTitle>
                      <p className="text-slate-600">Organize your skills by category</p>
                    </div>
                    <Button onClick={addSkillCategory} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Skill Category
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {cv.cv_data.skills?.map((skillCategory, index) => (
                    <div key={skillCategory.id || index} className="border border-slate-200 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Skill Category {index + 1}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSkillCategory(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Category Name *</Label>
                          <Input
                            value={skillCategory.category}
                            onChange={(e) => updateSkillCategory(index, 'category', e.target.value)}
                            placeholder="e.g., Programming Languages, Tools, Frameworks"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Skills *</Label>
                          <Input
                            value={skillCategory.items.join(', ')}
                            onChange={(e) => updateSkillCategory(index, 'items', e.target.value)}
                            placeholder="e.g., JavaScript, Python, React, Node.js"
                            className="mt-1"
                          />
                          <p className="text-sm text-slate-500 mt-1">
                            Separate skills with commas. List your strongest skills first.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!cv.cv_data.skills || cv.cv_data.skills.length === 0) && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                      <Code className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No skills added</h3>
                      <p className="text-slate-600 mb-4">Showcase your technical and professional skills</p>
                      <Button onClick={addSkillCategory} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Skill Category
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Projects and Certifications sections would follow similar patterns */}
            {activeSection === 'projects' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Projects</span>
                  </CardTitle>
                  <p className="text-slate-600">Projects section coming soon...</p>
                </CardHeader>
              </Card>
            )}

            {activeSection === 'certifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Certifications</span>
                  </CardTitle>
                  <p className="text-slate-600">Certifications section coming soon...</p>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
