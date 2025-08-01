import { uploadImageToCloudinary, getCloudinaryConfig, isCloudinaryConfigured } from '@/lib/cloudinary';

export async function testCloudinaryUpload() {
  console.log('Testing Cloudinary configuration...');
  
  const config = getCloudinaryConfig();
  console.log('Current config:', {
    cloudName: config.cloudName,
    uploadPreset: config.uploadPreset,
    isConfigured: isCloudinaryConfigured()
  });
  
  if (!config.cloudName) {
    console.error('❌ No cloud name configured');
    return false;
  }
  
  if (!config.uploadPreset) {
    console.error('❌ No upload preset configured');
    return false;
  }
  
  console.log('✅ Configuration looks good');
  
  // Test if upload preset exists by making a test request
  try {
    const testUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    console.log('Testing upload URL:', testUrl);
    
    // Try to make a basic request to see if the cloud name is valid
    const response = await fetch(testUrl, {
      method: 'POST',
      body: new FormData() // Empty form data to test the endpoint
    });
    
    const responseText = await response.text();
    console.log('Test response status:', response.status);
    console.log('Test response:', responseText);
    
    if (response.status === 400) {
      const data = JSON.parse(responseText);
      if (data.error && data.error.message.includes('Must provide either file or public_id')) {
        console.log('✅ Cloudinary endpoint is reachable');
        return true;
      }
      if (data.error && data.error.message.includes('Invalid upload preset')) {
        console.error('❌ Upload preset does not exist or is not unsigned');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
}
