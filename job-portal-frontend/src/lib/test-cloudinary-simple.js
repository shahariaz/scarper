// Simple test script to verify Cloudinary upload
// You can run this in the browser console

async function testCloudinaryUpload() {
  console.log('🔍 Testing Cloudinary upload...');
  
  // Create a test image
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
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject('Could not create test image');
        return;
      }
      
      const file = new File([blob], 'test.png', { type: 'image/png' });
      console.log('📁 Created test file:', file.name, file.size, 'bytes');
      
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'blog_images');
      formData.append('folder', 'blog_posts');
      
      try {
        const response = await fetch('https://api.cloudinary.com/v1_1/dmmetnpgl/image/upload', {
          method: 'POST',
          body: formData
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Upload failed:', errorText);
          reject(errorText);
          return;
        }
        
        const data = await response.json();
        console.log('✅ Upload successful:', data.secure_url);
        resolve(data.secure_url);
        
      } catch (error) {
        console.error('❌ Network error:', error);
        reject(error);
      }
    }, 'image/png');
  });
}

// Run the test
testCloudinaryUpload()
  .then(url => console.log('🎉 Test completed successfully! Image URL:', url))
  .catch(error => console.error('💥 Test failed:', error));
