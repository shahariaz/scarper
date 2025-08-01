// Cloudinary configuration and upload utilities

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
}

// Default config - will be overridden by environment variables or user input
let cloudinaryConfig: CloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'blog_images',
};

export const setCloudinaryConfig = (config: Partial<CloudinaryConfig>) => {
  cloudinaryConfig = { ...cloudinaryConfig, ...config };
  console.log('Cloudinary config updated:', { 
    cloudName: cloudinaryConfig.cloudName, 
    uploadPreset: cloudinaryConfig.uploadPreset 
  });
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  console.log('Starting Cloudinary upload:', { 
    fileName: file.name, 
    fileSize: file.size,
    cloudName: cloudinaryConfig.cloudName,
    uploadPreset: cloudinaryConfig.uploadPreset 
  });

  if (!cloudinaryConfig.cloudName) {
    const error = 'Cloudinary is not configured. Please provide your Cloudinary credentials in the setup panel.';
    console.error(error);
    throw new Error(error);
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    const error = 'Please select a valid image file';
    console.error(error);
    throw new Error(error);
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    const error = 'Image file size must be less than 10MB';
    console.error(error);
    throw new Error(error);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset || 'blog_images');
  
  // Add additional parameters for better handling
  formData.append('folder', 'blog_posts');
  formData.append('resource_type', 'image');

  try {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
    console.log('Uploading to:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with response:', errorText);
      
      let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          if (errorData.error.message.includes('Invalid upload preset')) {
            errorMessage = `Upload preset "${cloudinaryConfig.uploadPreset}" does not exist or is not set to unsigned mode. Please create an unsigned upload preset in your Cloudinary dashboard.`;
          } else {
            errorMessage = errorData.error.message;
          }
        }
      } catch {
        // Keep the default error message if we can't parse the response
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Upload response data:', data);
    
    if (data.error) {
      console.error('Cloudinary error:', data.error);
      throw new Error(data.error.message || 'Unknown Cloudinary error');
    }

    if (!data.secure_url) {
      console.error('No secure_url in response:', data);
      throw new Error('Invalid response from Cloudinary - no URL returned');
    }

    console.log('Upload successful:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export const getCloudinaryConfig = () => cloudinaryConfig;

export const isCloudinaryConfigured = () => {
  return !!(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);
};
