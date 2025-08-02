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
  GripVertical,
  ArrowUp,
  ArrowDown,
  Layout,
  SplitSquareHorizontal,
  Edit3,
  Monitor
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    problem_solving?: Array<{
      id?: string;
      title: string;
      description: string;
      technologies: string[];
      difficulty: 'Easy' | 'Medium' | 'Hard';
      platform?: string;
      url?: string;
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
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('edit');
  const [sectionOrder, setSectionOrder] = useState([
    'personal',
    'experience',
    'education',
    'skills',
    'problem_solving',
    'projects',
    'certifications'
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
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

  const updateExperience = (index: number, field: string, value: string | boolean) => {
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

  const updateEducation = (index: number, field: string, value: string | boolean) => {
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

  const updateSkillCategory = (index: number, field: string, value: string) => {
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

  // Problem Solving Functions
  const addProblemSolving = () => {
    if (!cv) return;
    const newProblem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      technologies: [],
      difficulty: 'Medium' as const,
      platform: '',
      url: ''
    };
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        problem_solving: [...(cv.cv_data.problem_solving || []), newProblem]
      }
    });
  };

  const updateProblemSolving = (index: number, field: string, value: string | string[]) => {
    if (!cv) return;
    const updatedProblems = [...(cv.cv_data.problem_solving || [])];
    if (field === 'technologies') {
      updatedProblems[index] = { 
        ...updatedProblems[index], 
        technologies: typeof value === 'string' ? value.split(',').map((item: string) => item.trim()).filter((item: string) => item) : value
      };
    } else {
      updatedProblems[index] = { ...updatedProblems[index], [field]: value };
    }
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        problem_solving: updatedProblems
      }
    });
  };

  const removeProblemSolving = (index: number) => {
    if (!cv) return;
    const updatedProblems = [...(cv.cv_data.problem_solving || [])];
    updatedProblems.splice(index, 1);
    setCV({
      ...cv,
      cv_data: {
        ...cv.cv_data,
        problem_solving: updatedProblems
      }
    });
  };

  const sections = [
    { id: 'personal', name: 'Personal Info', icon: User, required: true },
    { id: 'experience', name: 'Experience', icon: Briefcase, required: false },
    { id: 'education', name: 'Education', icon: GraduationCap, required: false },
    { id: 'skills', name: 'Skills', icon: Code, required: false },
    { id: 'problem_solving', name: 'Problem Solving', icon: Code, required: false },
    { id: 'projects', name: 'Projects', icon: FileText, required: false },
    { id: 'certifications', name: 'Certifications', icon: Award, required: false },
  ];

  // Sortable Section Item Component
  function SortableItem({ section, isActive }: { section: any, isActive: boolean }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: section.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const IconComponent = section.icon;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'hover:bg-slate-100 text-slate-700'
        }`}
      >
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        <button
          onClick={() => setActiveSection(section.id)}
          className="flex items-center space-x-3 flex-1 text-left"
        >
          <IconComponent className="w-5 h-5" />
          <span className="font-medium">{section.name}</span>
          {section.required && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Required</span>
          )}
        </button>
      </div>
    );
  }

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

  // Render section content based on section ID
  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'personal':
        return (
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
                    value={cv?.cv_data.personal_info?.full_name || ''}
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
                      value={cv?.cv_data.personal_info?.email || ''}
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
                      value={cv?.cv_data.personal_info?.phone || ''}
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
                      value={cv?.cv_data.personal_info?.location || ''}
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
                      value={cv?.cv_data.personal_info?.linkedin || ''}
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
                      value={cv?.cv_data.personal_info?.portfolio || ''}
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
                  value={cv?.cv_data.personal_info?.summary || ''}
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
        );

      case 'experience':
        return (
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
              {cv?.cv_data.experience?.map((exp, index) => (
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
              {(!cv?.cv_data.experience || cv.cv_data.experience.length === 0) && (
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
        );

      case 'education':
        return (
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
              {cv?.cv_data.education?.map((edu, index) => (
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
              {(!cv?.cv_data.education || cv.cv_data.education.length === 0) && (
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
        );

      case 'skills':
        return (
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
              {cv?.cv_data.skills?.map((skillCategory, index) => (
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
              {(!cv?.cv_data.skills || cv.cv_data.skills.length === 0) && (
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
        );

      case 'problem_solving':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="w-5 h-5" />
                    <span>Problem Solving</span>
                  </CardTitle>
                  <p className="text-slate-600">Showcase your coding challenges and algorithmic problem-solving skills</p>
                </div>
                <Button onClick={addProblemSolving} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Problem
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {cv?.cv_data.problem_solving?.map((problem, index) => (
                <div key={problem.id || index} className="border border-slate-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Problem {index + 1}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeProblemSolving(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Problem Title *</Label>
                      <Input
                        value={problem.title}
                        onChange={(e) => updateProblemSolving(index, 'title', e.target.value)}
                        placeholder="Two Sum, Binary Tree Traversal, etc."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Difficulty</Label>
                      <select
                        value={problem.difficulty}
                        onChange={(e) => updateProblemSolving(index, 'difficulty', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <Label>Platform (Optional)</Label>
                      <Input
                        value={problem.platform || ''}
                        onChange={(e) => updateProblemSolving(index, 'platform', e.target.value)}
                        placeholder="LeetCode, HackerRank, CodeSignal, etc."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Solution URL (Optional)</Label>
                      <Input
                        value={problem.url || ''}
                        onChange={(e) => updateProblemSolving(index, 'url', e.target.value)}
                        placeholder="https://github.com/yourname/solution"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Technologies Used *</Label>
                    <Input
                      value={problem.technologies.join(', ')}
                      onChange={(e) => updateProblemSolving(index, 'technologies', e.target.value)}
                      placeholder="e.g., JavaScript, Python, Dynamic Programming, Hash Tables"
                      className="mt-1"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      List programming languages, algorithms, and data structures used
                    </p>
                  </div>
                  <div>
                    <Label>Solution Description *</Label>
                    <Textarea
                      value={problem.description}
                      onChange={(e) => updateProblemSolving(index, 'description', e.target.value)}
                      placeholder="Explain your approach, time/space complexity, and key insights...&#10;• Used HashMap for O(1) lookup&#10;• Implemented sliding window technique&#10;• Time: O(n), Space: O(n)"
                      rows={4}
                      className="mt-1"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Describe your solution approach and complexity analysis
                    </p>
                  </div>
                </div>
              ))}
              {(!cv?.cv_data.problem_solving || cv.cv_data.problem_solving.length === 0) && (
                <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                  <Code className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No problem-solving experience added</h3>
                  <p className="text-slate-600 mb-4">Showcase your algorithmic thinking and coding challenge solutions</p>
                  <Button onClick={addProblemSolving} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Problem
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'projects':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Projects</span>
              </CardTitle>
              <p className="text-slate-600">Showcase your key projects and achievements</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Projects section coming soon</h3>
                <p className="text-slate-600">We&apos;re working on adding project management features</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'certifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Certifications</span>
              </CardTitle>
              <p className="text-slate-600">Add your professional certifications and licenses</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Certifications section coming soon</h3>
                <p className="text-slate-600">We&apos;re working on adding certification management features</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // Live Preview Component
  const LivePreview = () => (
    <div className="bg-white rounded-lg shadow-lg border h-full overflow-y-auto">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Personal Info */}
        {cv?.cv_data.personal_info && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {cv.cv_data.personal_info.full_name || 'Your Name'}
            </h1>
            <div className="flex flex-wrap gap-4 text-slate-600 mb-4">
              {cv.cv_data.personal_info.email && (
                <span>{cv.cv_data.personal_info.email}</span>
              )}
              {cv.cv_data.personal_info.phone && (
                <span>{cv.cv_data.personal_info.phone}</span>
              )}
              {cv.cv_data.personal_info.location && (
                <span>{cv.cv_data.personal_info.location}</span>
              )}
            </div>
            {cv.cv_data.personal_info.summary && (
              <p className="text-slate-700 leading-relaxed">{cv.cv_data.personal_info.summary}</p>
            )}
          </div>
        )}

        {/* Render sections in order */}
        {sectionOrder.map((sectionId) => {
          switch (sectionId) {
            case 'personal':
              return null; // Already rendered above
            
            case 'experience':
              if (!cv?.cv_data.experience?.length) return null;
              return (
                <div key={sectionId} className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 border-b-2 border-blue-600 pb-2">
                    Work Experience
                  </h2>
                  {cv.cv_data.experience.map((exp, index) => (
                    <div key={index} className="mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{exp.position}</h3>
                          <h4 className="text-blue-600 font-medium">{exp.company}</h4>
                        </div>
                        <span className="text-slate-600 text-sm">
                          {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                        </span>
                      </div>
                      {exp.location && (
                        <p className="text-slate-600 text-sm mb-2">{exp.location}</p>
                      )}
                      <div className="text-slate-700 whitespace-pre-line">{exp.description}</div>
                    </div>
                  ))}
                </div>
              );

            case 'education':
              if (!cv?.cv_data.education?.length) return null;
              return (
                <div key={sectionId} className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 border-b-2 border-blue-600 pb-2">
                    Education
                  </h2>
                  {cv.cv_data.education.map((edu, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{edu.degree}</h3>
                          <h4 className="text-blue-600 font-medium">{edu.institution}</h4>
                          <p className="text-slate-600">{edu.field}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-600 text-sm">
                            {edu.start_date} - {edu.current ? 'Present' : edu.end_date}
                          </span>
                          {edu.gpa && (
                            <p className="text-slate-600 text-sm">GPA: {edu.gpa}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );

            case 'skills':
              if (!cv?.cv_data.skills?.length) return null;
              return (
                <div key={sectionId} className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 border-b-2 border-blue-600 pb-2">
                    Skills
                  </h2>
                  {cv.cv_data.skills.map((skillCategory, index) => (
                    <div key={index} className="mb-3">
                      <h3 className="font-semibold text-slate-900 mb-1">{skillCategory.category}</h3>
                      <p className="text-slate-700">{skillCategory.items.join(', ')}</p>
                    </div>
                  ))}
                </div>
              );

            case 'problem_solving':
              if (!cv?.cv_data.problem_solving?.length) return null;
              return (
                <div key={sectionId} className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 border-b-2 border-blue-600 pb-2">
                    Problem Solving
                  </h2>
                  {cv.cv_data.problem_solving.map((problem, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{problem.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            problem.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {problem.difficulty}
                          </span>
                          {problem.platform && (
                            <span className="text-blue-600 text-sm">{problem.platform}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">
                        Technologies: {problem.technologies.join(', ')}
                      </p>
                      <div className="text-slate-700 whitespace-pre-line">{problem.description}</div>
                    </div>
                  ))}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );

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
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'edit' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('edit')}
                  className="px-3 py-1.5"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant={viewMode === 'split' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('split')}
                  className="px-3 py-1.5"
                >
                  <SplitSquareHorizontal className="w-4 h-4 mr-1" />
                  Split
                </Button>
                <Button
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                  className="px-3 py-1.5"
                >
                  <Monitor className="w-4 h-4 mr-1" />
                  Preview
                </Button>
              </div>
              
              <Button 
                onClick={() => window.open(`/cv-maker/preview/${params.id}`, '_blank')}
                variant="outline" 
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Open Preview</span>
              </Button>
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
        {viewMode === 'edit' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">CV Sections</CardTitle>
                  <p className="text-sm text-slate-600">Drag to reorder sections</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSectionOrder([
                        'personal',
                        'experience',
                        'education',
                        'skills',
                        'problem_solving',
                        'projects',
                        'certifications'
                      ])}
                      className="text-xs"
                    >
                      Reset Order
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                      {sectionOrder.map((sectionId) => {
                        const section = sections.find(s => s.id === sectionId);
                        if (!section) return null;
                        
                        return (
                          <SortableItem
                            key={section.id}
                            section={section}
                            isActive={activeSection === section.id}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Section Ordering Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">✨ Customize Your CV Layout</h3>
                <p className="text-sm text-blue-700 mb-2">
                  Drag sections in the sidebar to reorder them in your CV. Different people prefer different layouts:
                </p>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Put <strong>Skills</strong> first if you&apos;re a recent graduate</li>
                  <li>• Lead with <strong>Experience</strong> for seasoned professionals</li>
                  <li>• Highlight <strong>Education</strong> for academic positions</li>
                  <li>• Add <strong>Problem Solving</strong> to showcase coding challenges</li>
                </ul>
              </div>

              {/* Render sections in custom order */}
              {sectionOrder.map((sectionId) => {
                if (activeSection !== sectionId) return null;
                
                return (
                  <div key={sectionId}>
                    {renderSectionContent(sectionId)}
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Editor Side */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold mb-4">Editing: {sections.find(s => s.id === activeSection)?.name}</h2>
                {renderSectionContent(activeSection)}
              </div>
              
              {/* Quick Section Navigator */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold mb-3">Quick Navigate</h3>
                <div className="flex flex-wrap gap-2">
                  {sectionOrder.map((sectionId) => {
                    const section = sections.find(s => s.id === sectionId);
                    if (!section) return null;
                    const IconComponent = section.icon;
                    return (
                      <Button
                        key={sectionId}
                        variant={activeSection === sectionId ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveSection(sectionId)}
                        className="flex items-center space-x-2"
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{section.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Preview Side */}
            <div className="h-screen sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Live Preview</h2>
                <div className="text-sm text-slate-600">Updates in real-time</div>
              </div>
              <LivePreview />
            </div>
          </div>
        ) : (
          /* Full Preview Mode */
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">CV Preview</h2>
              <Button
                onClick={() => setViewMode('edit')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Back to Edit</span>
              </Button>
            </div>
            <LivePreview />
          </div>
        )}
      </div>
    </div>
  );
}
