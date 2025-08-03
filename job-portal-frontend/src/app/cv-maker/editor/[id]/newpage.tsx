'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Download, 
  Eye, 
  ArrowLeft, 
  Plus, 
  Trash2,
  Move,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  RotateCcw,
  RotateCw,
  Copy,
  Layers,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { fabric } from 'fabric';
import { ChromePicker } from 'react-color';

interface CVData {
  id: number;
  cv_name: string;
  template: {
    id: number;
    name: string;
    category: string;
    template_data: {
      layout: string;
      color_scheme: string;
      sections: string[];
      fonts: { primary: string; secondary: string };
      spacing: string;
    };
  };
  cv_data: {
    personal_info: {
      full_name: string;
      email: string;
      phone: string;
      location: string;
      summary: string;
    };
    sections: Array<{
      id: string;
      type: string;
      title: string;
      items: any[];
      order: number;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export default function InteractiveCVEditor() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  const [cv, setCV] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchCV();
    }
  }, [params.id]);

  useEffect(() => {
    initializeFabricCanvas();
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, []);

  const initializeFabricCanvas = () => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 595, // A4 width in pixels at 72 DPI
        height: 842, // A4 height in pixels at 72 DPI
        backgroundColor: '#ffffff',
      });

      // Add selection events
      canvas.on('selection:created', (e) => {
        setActiveObject(e.selected?.[0] || null);
      });

      canvas.on('selection:updated', (e) => {
        setActiveObject(e.selected?.[0] || null);
      });

      canvas.on('selection:cleared', () => {
        setActiveObject(null);
      });

      // Add grid
      addGrid(canvas);
      
      fabricCanvasRef.current = canvas;
    }
  };

  const addGrid = (canvas: fabric.Canvas) => {
    const gridSize = 20;
    const width = canvas.getWidth();
    const height = canvas.getHeight();

    // Vertical lines
    for (let i = 0; i <= width; i += gridSize) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: '#e5e5e5',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
      canvas.sendToBack(line);
    }

    // Horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: '#e5e5e5',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
      canvas.sendToBack(line);
    }
  };

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
        loadCVToCanvas(data.cv);
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
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCVToCanvas = (cvData: CVData) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.clear();
    addGrid(canvas);

    let yPosition = 50;
    const margin = 50;
    const maxWidth = canvas.getWidth() - (margin * 2);

    // Add header with name
    if (cvData.cv_data.personal_info.full_name) {
      const nameText = new fabric.Text(cvData.cv_data.personal_info.full_name, {
        left: margin,
        top: yPosition,
        fontFamily: 'Arial',
        fontSize: 32,
        fontWeight: 'bold',
        fill: cvData.template.template_data.color_scheme === 'blue' ? '#2563eb' : '#1f2937',
        selectable: true,
        editable: true,
      });
      canvas.add(nameText);
      yPosition += 60;
    }

    // Add contact info
    const contactInfo = [];
    if (cvData.cv_data.personal_info.email) contactInfo.push(cvData.cv_data.personal_info.email);
    if (cvData.cv_data.personal_info.phone) contactInfo.push(cvData.cv_data.personal_info.phone);
    if (cvData.cv_data.personal_info.location) contactInfo.push(cvData.cv_data.personal_info.location);

    if (contactInfo.length > 0) {
      const contactText = new fabric.Text(contactInfo.join(' | '), {
        left: margin,
        top: yPosition,
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#6b7280',
        selectable: true,
        editable: true,
      });
      canvas.add(contactText);
      yPosition += 40;
    }

    // Add summary
    if (cvData.cv_data.personal_info.summary) {
      const summaryTitle = new fabric.Text('SUMMARY', {
        left: margin,
        top: yPosition,
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#1f2937',
        selectable: true,
        editable: true,
      });
      canvas.add(summaryTitle);
      yPosition += 30;

      const summaryText = new fabric.Textbox(cvData.cv_data.personal_info.summary, {
        left: margin,
        top: yPosition,
        width: maxWidth,
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#374151',
        selectable: true,
        editable: true,
      });
      canvas.add(summaryText);
      yPosition += summaryText.height! + 30;
    }

    // Add sections
    cvData.cv_data.sections.forEach((section) => {
      if (section.items && section.items.length > 0) {
        // Section title
        const sectionTitle = new fabric.Text(section.title.toUpperCase(), {
          left: margin,
          top: yPosition,
          fontFamily: 'Arial',
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#1f2937',
          selectable: true,
          editable: true,
        });
        canvas.add(sectionTitle);
        yPosition += 35;

        // Section items
        section.items.forEach((item) => {
          let itemText = '';
          if (section.type === 'experience') {
            itemText = `${item.position || ''} at ${item.company || ''}\n${item.description || ''}`;
          } else if (section.type === 'education') {
            itemText = `${item.degree || ''} - ${item.institution || ''}\n${item.description || ''}`;
          } else if (section.type === 'skills') {
            itemText = `${item.category || ''}: ${item.skills || ''}`;
          } else {
            itemText = JSON.stringify(item);
          }

          if (itemText.trim()) {
            const itemTextbox = new fabric.Textbox(itemText, {
              left: margin,
              top: yPosition,
              width: maxWidth,
              fontFamily: 'Arial',
              fontSize: 12,
              fill: '#374151',
              selectable: true,
              editable: true,
            });
            canvas.add(itemTextbox);
            yPosition += itemTextbox.height! + 20;
          }
        });

        yPosition += 10;
      }
    });

    canvas.renderAll();
  };

  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.Text('Click to edit text', {
      left: 100,
      top: 100,
      fontFamily: fontFamily,
      fontSize: fontSize,
      fill: currentColor,
      selectable: true,
      editable: true,
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    setActiveObject(text);
  };

  const addShape = (shapeType: string) => {
    if (!fabricCanvasRef.current) return;

    let shape: fabric.Object;

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 150,
          height: 100,
          fill: currentColor,
          selectable: true,
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: currentColor,
          selectable: true,
        });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 200, 50], {
          left: 100,
          top: 100,
          stroke: currentColor,
          strokeWidth: 2,
          selectable: true,
        });
        break;
      default:
        return;
    }

    fabricCanvasRef.current.add(shape);
    fabricCanvasRef.current.setActiveObject(shape);
    setActiveObject(shape);
  };

  const deleteSelected = () => {
    if (!fabricCanvasRef.current || !activeObject) return;

    fabricCanvasRef.current.remove(activeObject);
    setActiveObject(null);
  };

  const duplicateSelected = () => {
    if (!fabricCanvasRef.current || !activeObject) return;

    activeObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      fabricCanvasRef.current!.add(cloned);
      fabricCanvasRef.current!.setActiveObject(cloned);
      setActiveObject(cloned);
    });
  };

  const updateActiveObjectProperty = (property: string, value: any) => {
    if (!activeObject) return;

    activeObject.set(property, value);
    fabricCanvasRef.current?.renderAll();
  };

  const saveCV = async () => {
    if (!cv || !fabricCanvasRef.current) return;

    setSaving(true);
    try {
      const canvasData = fabricCanvasRef.current.toJSON();
      
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/cv/${cv.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...cv.cv_data,
          canvas_data: canvasData, // Save the canvas state
        }),
      });

      if (response.ok) {
        toast({
          title: "CV Saved Successfully!",
          description: "Your changes have been saved.",
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
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = () => {
    if (!fabricCanvasRef.current) return;

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'image/png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.download = `${cv?.cv_name || 'cv'}.png`;
    link.href = dataURL;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CV Editor...</p>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/cv-maker')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {cv.cv_name}
                </h1>
                <p className="text-sm text-gray-500">
                  Template: {cv.template.name}
                </p>
              </div>
              <Badge variant="outline">{cv.template.category}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={exportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={saveCV} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Toolbar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            {/* Tools */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedTool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTool('select')}
                >
                  <Move className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedTool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedTool('text');
                    addText();
                  }}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addShape('rectangle')}
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addShape('circle')}
                >
                  <Circle className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addShape('line')}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <Palette className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Color Picker */}
            {showColorPicker && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Color</h3>
                <ChromePicker
                  color={currentColor}
                  onChange={(color) => setCurrentColor(color.hex)}
                  disableAlpha
                />
              </div>
            )}

            {/* Text Properties */}
            {activeObject && activeObject.type === 'text' && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Text Properties</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Font Size</Label>
                    <Input
                      type="number"
                      value={fontSize}
                      onChange={(e) => {
                        const size = parseInt(e.target.value);
                        setFontSize(size);
                        updateActiveObjectProperty('fontSize', size);
                      }}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Font Family</Label>
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        setFontFamily(e.target.value);
                        updateActiveObjectProperty('fontFamily', e.target.value);
                      }}
                      className="w-full text-xs p-2 border rounded"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateActiveObjectProperty('fontWeight', 'bold')}
                    >
                      <Bold className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateActiveObjectProperty('fontStyle', 'italic')}
                    >
                      <Italic className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateActiveObjectProperty('underline', true)}
                    >
                      <Underline className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {activeObject && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={duplicateSelected}
                    className="w-full justify-start"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteSelected}
                    className="w-full justify-start text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-200 p-8 overflow-auto">
          <div className="flex justify-center">
            <div className="bg-white shadow-lg">
              <canvas
                ref={canvasRef}
                className="border border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Right Panel - CV Data */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">CV Information</h3>
            
            {/* Personal Info */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    value={cv.cv_data.personal_info.full_name}
                    onChange={(e) => {
                      const updatedCV = {
                        ...cv,
                        cv_data: {
                          ...cv.cv_data,
                          personal_info: {
                            ...cv.cv_data.personal_info,
                            full_name: e.target.value
                          }
                        }
                      };
                      setCV(updatedCV);
                    }}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={cv.cv_data.personal_info.email}
                    onChange={(e) => {
                      const updatedCV = {
                        ...cv,
                        cv_data: {
                          ...cv.cv_data,
                          personal_info: {
                            ...cv.cv_data.personal_info,
                            email: e.target.value
                          }
                        }
                      };
                      setCV(updatedCV);
                    }}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={cv.cv_data.personal_info.phone}
                    onChange={(e) => {
                      const updatedCV = {
                        ...cv,
                        cv_data: {
                          ...cv.cv_data,
                          personal_info: {
                            ...cv.cv_data.personal_info,
                            phone: e.target.value
                          }
                        }
                      };
                      setCV(updatedCV);
                    }}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <Input
                    value={cv.cv_data.personal_info.location}
                    onChange={(e) => {
                      const updatedCV = {
                        ...cv,
                        cv_data: {
                          ...cv.cv_data,
                          personal_info: {
                            ...cv.cv_data.personal_info,
                            location: e.target.value
                          }
                        }
                      };
                      setCV(updatedCV);
                    }}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Summary</Label>
                  <Textarea
                    value={cv.cv_data.personal_info.summary}
                    onChange={(e) => {
                      const updatedCV = {
                        ...cv,
                        cv_data: {
                          ...cv.cv_data,
                          personal_info: {
                            ...cv.cv_data.personal_info,
                            summary: e.target.value
                          }
                        }
                      };
                      setCV(updatedCV);
                    }}
                    className="text-xs"
                    rows={3}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => loadCVToCanvas(cv)}
                  className="w-full"
                >
                  Update Canvas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
