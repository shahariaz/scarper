'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Type, 
  Square, 
  Circle, 
  Download, 
  Save, 
  ZoomIn,
  ZoomOut,
  Grid,
  Eye,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CVData {
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
}

interface Template {
  template_data?: {
    color_scheme?: string;
  };
}

interface CanvasCVEditorProps {
  cvData: CVData;
  template: Template;
  onSave: (data: Record<string, unknown>) => void;
  onPreview: () => void;
}

const CanvasCVEditor: React.FC<CanvasCVEditorProps> = ({ 
  cvData, 
  template, 
  onSave, 
  onPreview 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  // Template colors and fonts
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008080'
  ];

  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Lucida Console'
  ];

const CanvasCVEditor: React.FC<CanvasCVEditorProps> = ({ 
  cvData, 
  template, 
  onSave, 
  onPreview 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  // Template colors and fonts
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008080'
  ];

  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Lucida Console'
  ];

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 595, // A4 width in pixels at 72 DPI
        height: 842, // A4 height in pixels at 72 DPI
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      });

      // Add grid
      if (showGrid) {
        addGrid(fabricCanvas);
      }

      // Load existing CV data
      loadCVData(fabricCanvas);

      // Event listeners
      fabricCanvas.on('selection:created', (e) => {
        setSelectedObject(e.selected[0]);
      });

      fabricCanvas.on('selection:updated', (e) => {
        setSelectedObject(e.selected[0]);
      });

      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
      });

      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [canvasRef, canvas, showGrid]);

  const addGrid = (fabricCanvas: fabric.Canvas) => {
    const gridSize = 20;
    const width = fabricCanvas.getWidth();
    const height = fabricCanvas.getHeight();

    // Vertical lines
    for (let i = 0; i <= width; i += gridSize) {
      const line = new fabric.Line([i, 0, i, height], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      fabricCanvas.add(line);
    }

    // Horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
      const line = new fabric.Line([0, i, width, i], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      fabricCanvas.add(line);
    }
  };

  const loadCVData = (fabricCanvas: fabric.Canvas) => {
    if (!cvData) return;

    // Add personal info as text objects
    if (cvData.personal_info) {
      const { full_name, email, phone, location, summary } = cvData.personal_info;
      
      // Name header
      if (full_name) {
        const nameText = new fabric.Text(full_name, {
          left: 50,
          top: 50,
          fontSize: 32,
          fontWeight: 'bold',
          fontFamily: 'Arial',
          fill: template?.template_data?.color_scheme === 'blue' ? '#2563eb' : '#000000',
        });
        fabricCanvas.add(nameText);
      }

      // Contact info
      let contactTop = 100;
      [email, phone, location].forEach((info, index) => {
        if (info) {
          const contactText = new fabric.Text(info, {
            left: 50,
            top: contactTop + (index * 25),
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#666666',
          });
          fabricCanvas.add(contactText);
        }
      });

      // Summary
      if (summary) {
        const summaryText = new fabric.Textbox(summary, {
          left: 50,
          top: 200,
          width: 500,
          fontSize: 12,
          fontFamily: 'Arial',
          fill: '#333333',
        });
        fabricCanvas.add(summaryText);
      }
    }

    // Add sections
    if (cvData.sections) {
      let sectionTop = 300;
      cvData.sections.forEach((section: any) => {
        // Section title
        const sectionTitle = new fabric.Text(section.title, {
          left: 50,
          top: sectionTop,
          fontSize: 18,
          fontWeight: 'bold',
          fontFamily: 'Arial',
          fill: template?.template_data?.color_scheme === 'blue' ? '#2563eb' : '#000000',
        });
        fabricCanvas.add(sectionTitle);

        sectionTop += 40;

        // Section items
        section.items.forEach((item: any, index: number) => {
          const itemText = new fabric.Textbox(
            typeof item === 'string' ? item : JSON.stringify(item),
            {
              left: 50,
              top: sectionTop + (index * 30),
              width: 500,
              fontSize: 12,
              fontFamily: 'Arial',
              fill: '#333333',
            }
          );
          fabricCanvas.add(itemText);
        });

        sectionTop += section.items.length * 30 + 30;
      });
    }

    fabricCanvas.renderAll();
  };

  const addTextBox = () => {
    if (!canvas) return;

    const textbox = new fabric.Textbox('Click to edit text', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000',
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
  };

  const addRectangle = () => {
    if (!canvas) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    if (!canvas) return;

    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: '#10b981',
      stroke: '#059669',
      strokeWidth: 2,
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const updateSelectedObjectProperty = (property: string, value: any) => {
    if (!canvas || !selectedObject) return;

    (selectedObject as any)[property] = value;
    canvas.renderAll();
  };

  const deleteSelectedObject = () => {
    if (!canvas || !selectedObject) return;

    canvas.remove(selectedObject);
    canvas.renderAll();
  };

  const handleZoom = (delta: number) => {
    if (!canvas) return;

    const newZoom = Math.min(Math.max(zoom + delta, 0.1), 3);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const toggleGrid = () => {
    if (!canvas) return;

    setShowGrid(!showGrid);
    
    // Remove existing grid
    const objects = canvas.getObjects();
    objects.forEach((obj) => {
      if ((obj as any).excludeFromExport) {
        canvas.remove(obj);
      }
    });

    // Add grid if enabled
    if (!showGrid) {
      addGrid(canvas);
    }

    canvas.renderAll();
  };

  const exportToPDF = () => {
    if (!canvas) return;

    // Hide grid for export
    const gridObjects = canvas.getObjects().filter((obj) => (obj as any).excludeFromExport);
    gridObjects.forEach((obj) => obj.set('visible', false));

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    // Restore grid
    gridObjects.forEach((obj) => obj.set('visible', true));
    canvas.renderAll();

    // Create download link
    const link = document.createElement('a');
    link.download = 'cv-design.png';
    link.href = dataURL;
    link.click();

    toast({
      title: "Success",
      description: "CV exported successfully!",
    });
  };

  const saveDesign = () => {
    if (!canvas) return;

    const canvasData = canvas.toJSON();
    onSave(canvasData);
    
    toast({
      title: "Success",
      description: "CV design saved successfully!",
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">CV Design Tools</h3>
          
          <Tabs defaultValue="elements" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={addTextBox} className="w-full justify-start">
                    <Type className="w-4 h-4 mr-2" />
                    Text Box
                  </Button>
                  <Button onClick={addRectangle} className="w-full justify-start" variant="outline">
                    <Square className="w-4 h-4 mr-2" />
                    Rectangle
                  </Button>
                  <Button onClick={addCircle} className="w-full justify-start" variant="outline">
                    <Circle className="w-4 h-4 mr-2" />
                    Circle
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              {selectedObject && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Object Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedObject.type === 'text' || selectedObject.type === 'textbox' ? (
                      <>
                        <div>
                          <Label>Font Size</Label>
                          <Slider
                            value={[(selectedObject as any).fontSize || 16]}
                            onValueChange={([value]) => updateSelectedObjectProperty('fontSize', value)}
                            max={72}
                            min={8}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Font Family</Label>
                          <select
                            value={(selectedObject as any).fontFamily || 'Arial'}
                            onChange={(e) => updateSelectedObjectProperty('fontFamily', e.target.value)}
                            className="w-full mt-1 p-2 border rounded"
                          >
                            {fonts.map((font) => (
                              <option key={font} value={font}>{font}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : null}
                    
                    <div>
                      <Label>Color</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded border-2 border-gray-300"
                            style={{ backgroundColor: color }}
                            onClick={() => updateSelectedObjectProperty('fill', color)}
                          />
                        ))}
                      </div>
                    </div>

                    <Button onClick={deleteSelectedObject} variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Object
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Canvas Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Grid</Label>
                    <Button
                      onClick={toggleGrid}
                      variant={showGrid ? "default" : "outline"}
                      size="sm"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div>
                    <Label>Zoom: {Math.round(zoom * 100)}%</Label>
                    <div className="flex gap-2 mt-2">
                      <Button onClick={() => handleZoom(-0.1)} variant="outline" size="sm">
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleZoom(0.1)} variant="outline" size="sm">
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={saveDesign} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button onClick={onPreview} variant="outline" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="bg-white shadow-lg">
            <canvas ref={canvasRef} className="border" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasCVEditor;
