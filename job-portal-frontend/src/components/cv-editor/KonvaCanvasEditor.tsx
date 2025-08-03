'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Circle, Transformer, Line } from 'react-konva';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Type, 
  Square, 
  Circle as CircleIcon, 
  Download, 
  Save, 
  ZoomIn,
  ZoomOut,
  Grid,
  Eye,
  Trash2,
  Move
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

interface CVElement {
  id: string;
  type: 'text' | 'rect' | 'circle';
  x: number;
  y: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  width?: number;
  height?: number;
  radius?: number;
  draggable?: boolean;
}

interface InteractiveCanvasEditorProps {
  cvData: CVData;
  template: Template;
  onSave: (data: Record<string, unknown>) => void;
  onPreview: () => void;
}

const InteractiveCanvasEditor: React.FC<InteractiveCanvasEditorProps> = ({ 
  cvData, 
  template, 
  onSave, 
  onPreview 
}) => {
  const [elements, setElements] = useState<CVElement[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const { toast } = useToast();

  // Canvas dimensions (A4 size)
  const CANVAS_WIDTH = 595;
  const CANVAS_HEIGHT = 842;

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

  // Load CV data into canvas elements
  useEffect(() => {
    if (!cvData) return;

    const newElements: CVElement[] = [];
    let currentY = 50;

    // Add name
    if (cvData.personal_info?.full_name) {
      newElements.push({
        id: `name-${Date.now()}`,
        type: 'text',
        x: 50,
        y: currentY,
        text: cvData.personal_info.full_name,
        fontSize: 32,
        fontFamily: 'Arial',
        fill: template?.template_data?.color_scheme === 'blue' ? '#2563eb' : '#000000',
        draggable: true,
      });
      currentY += 50;
    }

    // Add contact info
    [cvData.personal_info?.email, cvData.personal_info?.phone, cvData.personal_info?.location]
      .filter(Boolean)
      .forEach((info, index) => {
        if (info) {
          newElements.push({
            id: `contact-${index}-${Date.now()}`,
            type: 'text',
            x: 50,
            y: currentY + (index * 25),
            text: info,
            fontSize: 14,
            fontFamily: 'Arial',
            fill: '#666666',
            draggable: true,
          });
        }
      });
    currentY += 100;

    // Add summary
    if (cvData.personal_info?.summary) {
      newElements.push({
        id: `summary-${Date.now()}`,
        type: 'text',
        x: 50,
        y: currentY,
        text: cvData.personal_info.summary,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333333',
        width: 500,
        draggable: true,
      });
      currentY += 100;
    }

    // Add sections
    cvData.sections?.forEach((section, sectionIndex) => {
      // Section title
      newElements.push({
        id: `section-title-${sectionIndex}-${Date.now()}`,
        type: 'text',
        x: 50,
        y: currentY,
        text: section.title,
        fontSize: 18,
        fontFamily: 'Arial',
        fill: template?.template_data?.color_scheme === 'blue' ? '#2563eb' : '#000000',
        draggable: true,
      });
      currentY += 40;

      // Section items
      section.items.forEach((item, itemIndex) => {
        newElements.push({
          id: `section-item-${sectionIndex}-${itemIndex}-${Date.now()}`,
          type: 'text',
          x: 50,
          y: currentY,
          text: item,
          fontSize: 12,
          fontFamily: 'Arial',
          fill: '#333333',
          width: 500,
          draggable: true,
        });
        currentY += 30;
      });
      currentY += 20;
    });

    setElements(newElements);
  }, [cvData, template]);

  // Handle element selection
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedId('');
    }
  };

  const handleElementClick = (id: string) => {
    setSelectedId(id);
  };

  const addTextElement = () => {
    const newElement: CVElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: 100,
      y: 100,
      text: 'Click to edit text',
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000',
      draggable: true,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const addRectElement = () => {
    const newElement: CVElement = {
      id: `rect-${Date.now()}`,
      type: 'rect',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      fill: '#3b82f6',
      draggable: true,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const addCircleElement = () => {
    const newElement: CVElement = {
      id: `circle-${Date.now()}`,
      type: 'circle',
      x: 150,
      y: 150,
      radius: 50,
      fill: '#10b981',
      draggable: true,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateSelectedElement = (property: string, value: unknown) => {
    if (!selectedId) return;

    setElements(elements.map(el => 
      el.id === selectedId 
        ? { ...el, [property]: value }
        : el
    ));
  };

  const deleteSelectedElement = () => {
    if (!selectedId) return;

    setElements(elements.filter(el => el.id !== selectedId));
    setSelectedId('');
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.min(Math.max(zoom + delta, 0.1), 3);
    setZoom(newZoom);
  };

  const exportCanvas = () => {
    if (!stageRef.current) return;

    const dataURL = stageRef.current.toDataURL({
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 2,
    });

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
    const designData = {
      elements,
      canvas: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        zoom,
      }
    };
    
    onSave(designData);
    
    toast({
      title: "Success",
      description: "CV design saved successfully!",
    });
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  const renderGridLines = () => {
    if (!showGrid) return null;

    const lines = [];
    const gridSize = 20;

    // Vertical lines
    for (let i = 0; i <= CANVAS_WIDTH; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, CANVAS_HEIGHT]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= CANVAS_HEIGHT; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, CANVAS_WIDTH, i]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }

    return lines;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Interactive CV Designer</h3>
          
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
                  <Button onClick={addTextElement} className="w-full justify-start">
                    <Type className="w-4 h-4 mr-2" />
                    Text Box
                  </Button>
                  <Button onClick={addRectElement} className="w-full justify-start" variant="outline">
                    <Square className="w-4 h-4 mr-2" />
                    Rectangle
                  </Button>
                  <Button onClick={addCircleElement} className="w-full justify-start" variant="outline">
                    <CircleIcon className="w-4 h-4 mr-2" />
                    Circle
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              {selectedElement && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Element Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedElement.type === 'text' && (
                      <>
                        <div>
                          <Label>Text Content</Label>
                          <textarea
                            value={selectedElement.text || ''}
                            onChange={(e) => updateSelectedElement('text', e.target.value)}
                            className="w-full mt-1 p-2 border rounded resize-none"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Font Size: {selectedElement.fontSize}px</Label>
                          <Slider
                            value={[selectedElement.fontSize || 16]}
                            onValueChange={([value]: number[]) => updateSelectedElement('fontSize', value)}
                            max={72}
                            min={8}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Font Family</Label>
                          <select
                            value={selectedElement.fontFamily || 'Arial'}
                            onChange={(e) => updateSelectedElement('fontFamily', e.target.value)}
                            className="w-full mt-1 p-2 border rounded"
                          >
                            {fonts.map((font) => (
                              <option key={font} value={font}>{font}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label>Color</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                            style={{ backgroundColor: color }}
                            onClick={() => updateSelectedElement('fill', color)}
                          />
                        ))}
                      </div>
                    </div>

                    <Button onClick={deleteSelectedElement} variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Element
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
                      onClick={() => setShowGrid(!showGrid)}
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

                  <div>
                    <Label>Elements: {elements.length}</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Click and drag elements to reposition them
                    </p>
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
              Save Design
            </Button>
            <Button onClick={onPreview} variant="outline" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button onClick={exportCanvas} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export PNG
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Move className="w-4 h-4" />
            Click and drag to move elements
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-auto">
          <div className="bg-white shadow-lg" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
            <Stage
              ref={stageRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <Layer>
                {/* Grid */}
                {showGrid && renderGridLines()}
                
                {/* Elements */}
                {elements.map((element) => {
                  if (element.type === 'text') {
                    return (
                      <Text
                        key={element.id}
                        id={element.id}
                        x={element.x}
                        y={element.y}
                        text={element.text}
                        fontSize={element.fontSize}
                        fontFamily={element.fontFamily}
                        fill={element.fill}
                        width={element.width}
                        draggable={element.draggable}
                        onClick={() => handleElementClick(element.id)}
                        onTap={() => handleElementClick(element.id)}
                        onDragEnd={(e) => {
                          updateSelectedElement('x', e.target.x());
                          updateSelectedElement('y', e.target.y());
                        }}
                      />
                    );
                  } else if (element.type === 'rect') {
                    return (
                      <Rect
                        key={element.id}
                        id={element.id}
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        fill={element.fill}
                        draggable={element.draggable}
                        onClick={() => handleElementClick(element.id)}
                        onTap={() => handleElementClick(element.id)}
                        onDragEnd={(e) => {
                          updateSelectedElement('x', e.target.x());
                          updateSelectedElement('y', e.target.y());
                        }}
                      />
                    );
                  } else if (element.type === 'circle') {
                    return (
                      <Circle
                        key={element.id}
                        id={element.id}
                        x={element.x}
                        y={element.y}
                        radius={element.radius}
                        fill={element.fill}
                        draggable={element.draggable}
                        onClick={() => handleElementClick(element.id)}
                        onTap={() => handleElementClick(element.id)}
                        onDragEnd={(e) => {
                          updateSelectedElement('x', e.target.x());
                          updateSelectedElement('y', e.target.y());
                        }}
                      />
                    );
                  }
                  return null;
                })}

                {/* Transformer for selected element */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCanvasEditor;
