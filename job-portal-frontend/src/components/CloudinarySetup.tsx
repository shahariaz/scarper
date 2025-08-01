'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setCloudinaryConfig, getCloudinaryConfig, isCloudinaryConfigured } from '@/lib/cloudinary';
import { Settings, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CloudinarySetupProps {
  onConfigured?: () => void;
}

export default function CloudinarySetup({ onConfigured }: CloudinarySetupProps) {
  const [config, setConfig] = useState(() => {
    const current = getCloudinaryConfig();
    return {
      cloudName: current.cloudName,
      apiKey: current.apiKey,
      uploadPreset: current.uploadPreset || 'blog_images',
    };
  });
  const [isConfigured, setIsConfigured] = useState(() => isCloudinaryConfigured());

  const handleSave = () => {
    if (!config.cloudName.trim()) {
      toast.error('Cloud Name is required');
      return;
    }

    setCloudinaryConfig({
      cloudName: config.cloudName.trim(),
      apiKey: config.apiKey.trim(),
      uploadPreset: config.uploadPreset.trim() || 'blog_images',
    });

    setIsConfigured(true);
    toast.success('Cloudinary configuration saved!');
    onConfigured?.();
  };

  const handleTestConnection = async () => {
    if (!config.cloudName.trim()) {
      toast.error('Please provide Cloud Name first');
      return;
    }

    const testToast = toast.loading('Testing Cloudinary connection...');

    try {
      // Test the upload endpoint with the current configuration
      const testUrl = `https://api.cloudinary.com/v1_1/${config.cloudName.trim()}/image/upload`;
      
      const formData = new FormData();
      formData.append('upload_preset', config.uploadPreset || 'blog_images');
      
      const response = await fetch(testUrl, {
        method: 'POST',
        body: formData
      });
      
      const responseText = await response.text();
      console.log('Cloudinary test response:', { status: response.status, body: responseText });
      
      if (response.status === 400) {
        const data = JSON.parse(responseText);
        if (data.error?.message?.includes('Must provide either file or public_id')) {
          toast.success('✅ Cloudinary connection successful!', { id: testToast });
        } else if (data.error?.message?.includes('Invalid upload preset')) {
          toast.error(`❌ Upload preset "${config.uploadPreset}" does not exist or is not unsigned. Please create it in your Cloudinary dashboard.`, { 
            id: testToast,
            duration: 6000 
          });
        } else {
          toast.error(`❌ Error: ${data.error?.message || 'Unknown error'}`, { id: testToast });
        }
      } else if (response.status === 401) {
        toast.error('❌ Unauthorized. Check your cloud name.', { id: testToast });
      } else {
        toast.error(`❌ Unexpected response: ${response.status}`, { id: testToast });
      }
    } catch (error) {
      console.error('Cloudinary test error:', error);
      toast.error('❌ Network error. Please check your internet connection.', { id: testToast });
    }
  };

  if (isConfigured) {
    return (
      <Card className="bg-slate-800 border-slate-700 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-medium">Cloudinary is configured</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Image uploads are ready to use in the blog editor
          </p>
          <div className="flex items-center space-x-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigured(false)}
              className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Reconfigure
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://console.cloudinary.com', '_blank')}
              className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          <CardTitle className="text-lg text-white">Configure Cloudinary</CardTitle>
        </div>
        <p className="text-sm text-gray-400">
          Set up Cloudinary to enable image uploads in your blog posts
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cloudName" className="text-white">
            Cloud Name *
          </Label>
          <Input
            id="cloudName"
            placeholder="your-cloud-name"
            value={config.cloudName}
            onChange={(e) => setConfig(prev => ({ ...prev, cloudName: e.target.value }))}
            className="border-slate-600 bg-slate-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Find this in your Cloudinary Dashboard
          </p>
        </div>

        <div>
          <Label htmlFor="uploadPreset" className="text-white">
            Upload Preset
          </Label>
          <Input
            id="uploadPreset"
            placeholder="blog_images"
            value={config.uploadPreset}
            onChange={(e) => setConfig(prev => ({ ...prev, uploadPreset: e.target.value }))}
            className="border-slate-600 bg-slate-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Create an unsigned upload preset in Cloudinary
          </p>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Configuration
          </Button>
          <Button 
            onClick={handleTestConnection}
            variant="outline"
            className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
          >
            Test
          </Button>
        </div>

        <div className="text-xs text-gray-400 bg-slate-900 p-3 rounded-lg border border-slate-700">
          <p className="font-medium mb-2 text-white">Quick Setup Guide:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Sign up at <span className="text-blue-400">cloudinary.com</span></li>
            <li>Go to Settings → Upload → Add upload preset</li>
            <li>Set signing mode to <span className="text-green-400">&quot;Unsigned&quot;</span></li>
            <li>Copy your cloud name and upload preset name here</li>
          </ol>
          <p className="mt-2 text-xs text-gray-500">
            💡 Your credentials are already configured via environment variables
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
