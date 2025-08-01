'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadImageToCloudinary, getCloudinaryConfig, isCloudinaryConfigured } from '@/lib/cloudinary';
import { Upload, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CloudinaryDebug() {
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testUpload = async () => {
    setTesting(true);
    setLogs([]);
    
    try {
      addLog('🔍 Starting upload test...');
      
      // Check configuration
      const config = getCloudinaryConfig();
      addLog(`📋 Config: cloudName="${config.cloudName}", uploadPreset="${config.uploadPreset}"`);
      addLog(`✅ Is configured: ${isCloudinaryConfigured()}`);
      
      if (!config.cloudName) {
        addLog('❌ ERROR: No cloud name configured');
        toast.error('No cloud name configured');
        return;
      }
      
      // Test connection first
      addLog('🌐 Testing connection...');
      const testUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
      
      const formData = new FormData();
      formData.append('upload_preset', config.uploadPreset || 'blog_images');
      
      const response = await fetch(testUrl, {
        method: 'POST',
        body: formData
      });
      
      const responseText = await response.text();
      addLog(`📡 Response status: ${response.status}`);
      addLog(`📄 Response body: ${responseText}`);
      
      if (response.status === 400) {
        const data = JSON.parse(responseText);
        if (data.error?.message?.includes('Must provide either file or public_id')) {
          addLog('✅ Connection successful - endpoint is reachable');
        } else if (data.error?.message?.includes('Missing required parameter - file')) {
          addLog('✅ Connection successful - upload preset is valid');
        } else if (data.error?.message?.includes('Invalid upload preset')) {
          addLog(`❌ ERROR: Upload preset "${config.uploadPreset}" does not exist or is not unsigned`);
          toast.error(`Upload preset "${config.uploadPreset}" does not exist or is not unsigned`);
          return;
        } else {
          addLog(`❌ ERROR: ${data.error?.message}`);
          toast.error(data.error?.message || 'Unknown error');
          return;
        }
      }
      
      // Test with a small dummy file
      addLog('📁 Creating test image...');
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('TEST', 25, 55);
      }
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          addLog('❌ ERROR: Could not create test image');
          return;
        }
        
        const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
        addLog(`📁 Test file created: ${testFile.name} (${testFile.size} bytes)`);
        
        try {
          addLog('⬆️ Uploading test image...');
          const imageUrl = await uploadImageToCloudinary(testFile);
          addLog(`✅ SUCCESS: Image uploaded to ${imageUrl}`);
          toast.success('Image upload test successful!');
        } catch (error) {
          addLog(`❌ UPLOAD ERROR: ${error}`);
          toast.error(`Upload failed: ${error}`);
        }
      }, 'image/png');
      
    } catch (error) {
      addLog(`❌ GENERAL ERROR: ${error}`);
      toast.error(`Test failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <span>Cloudinary Debug</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Run upload test</span>
          <Button
            onClick={testUpload}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Test Upload
              </>
            )}
          </Button>
        </div>
        
        {logs.length > 0 && (
          <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 max-h-64 overflow-y-auto">
            <div className="text-xs font-mono space-y-1">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`${
                    log.includes('ERROR') || log.includes('❌') 
                      ? 'text-red-400' 
                      : log.includes('SUCCESS') || log.includes('✅')
                      ? 'text-green-400'
                      : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
