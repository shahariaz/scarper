'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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

export default function CVEditor() {
  const params = useParams();
  const router = useRouter();
  const [cv, setCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'form' | 'canvas'>('canvas');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CV editor...</p>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">CV Not Found</h1>
          <p className="text-gray-600 mb-4">The requested CV could not be found.</p>
          <Link href="/cv-maker">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to CV Maker
            </Button>
          </Link>
        </div>
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
                <p className="text-sm text-gray-500">Template: {cv.template.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'form' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('form')}
              >
                Form Editor
              </Button>
              <Button
                variant={viewMode === 'canvas' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('canvas')}
              >
                Canvas Editor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      {viewMode === 'canvas' ? (
        <InteractiveCanvasEditor
          cvData={cv.cv_data}
          template={cv.template}
          onSave={handleSave}
          onPreview={handlePreview}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Form Editor</h2>
            <p className="text-gray-600">
              Form editor is coming soon. For now, use the Canvas Editor for an interactive design experience.
            </p>
            <Button 
              onClick={() => setViewMode('canvas')} 
              className="mt-4"
            >
              Switch to Canvas Editor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
