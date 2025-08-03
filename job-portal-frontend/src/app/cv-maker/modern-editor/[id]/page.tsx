'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, Palette, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import InteractiveCanvasEditor from '@/components/cv-editor/KonvaCanvasEditor';

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
      title: string;
      items: string[];
    }>;
  };
  template: {
    name: string;
    template_data?: {
      color_scheme?: string;
    };
  };
}

export default function ModernCVEditor() {
  const params = useParams();
  const router = useRouter();
  const [cv, setCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'canvas' | 'form'>('canvas');
  const { toast } = useToast();

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

  useEffect(() => {
    fetchCV();
  }, []);

  const handleSave = async (designData: Record<string, unknown>) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/cv/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cv_data: {
            ...cv?.cv_data,
            canvas_design: designData
          }
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "CV saved successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save CV",
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
    }
  };

  const handlePreview = () => {
    router.push(`/cv-maker/preview/${params.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading CV editor...</p>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">CV Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">The requested CV could not be found.</p>
            <Link href="/cv-maker">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to CV Maker
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === 'canvas') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/cv-maker">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{cv.cv_name}</h1>
                  <p className="text-sm text-gray-500">Interactive Canvas Editor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('form')}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Form Editor
                </Button>
                <Button
                  variant="default"
                  size="sm"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Canvas Editor
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Editor */}
        <InteractiveCanvasEditor
          cvData={cv.cv_data}
          template={cv.template}
          onSave={handleSave}
          onPreview={handlePreview}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/cv-maker">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{cv.cv_name}</h1>
                <p className="text-sm text-gray-500">Form Editor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
              >
                <Type className="w-4 h-4 mr-2" />
                Form Editor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('canvas')}
              >
                <Palette className="w-4 h-4 mr-2" />
                Canvas Editor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Editor Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Traditional Form Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-8 bg-blue-50 rounded-lg">
              <Palette className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Try Our New Interactive Canvas Editor!
              </h3>
              <p className="text-gray-600 mb-4">
                Create stunning CVs with drag-and-drop functionality, real-time editing, and visual design tools.
              </p>
              <Button onClick={() => setViewMode('canvas')} size="lg">
                Switch to Canvas Editor
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Canvas Editor Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Drag and drop elements
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Real-time visual editing
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Advanced typography controls
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Shape and color tools
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Grid and alignment helpers
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Form Editor Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Structured form fields
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Section-based editing
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Template-based layout
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Coming soon...
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
