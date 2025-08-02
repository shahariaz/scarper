// Optimized profile image upload utilities with compression and resizing

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  folder?: string;
}

export interface ProfileImageUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// Compress and resize image before upload
const compressImage = async (
  file: File, 
  maxWidth: number = 800, 
  maxHeight: number = 800, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

// Upload profile picture (square, optimized for avatar display)
export const uploadProfilePicture = async (file: File): Promise<ProfileImageUploadResult> => {
  console.log('🖼️ Starting profile picture upload:', { 
    fileName: file.name, 
    originalSize: `${(file.size / 1024).toFixed(2)} KB` 
  });

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file');
  }

  // Validate file size (max 5MB for profile pics)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Profile picture must be less than 5MB');
  }

  // Compress image for profile picture (square aspect ratio preferred)
  const compressedFile = await compressImage(file, 400, 400, 0.85);
  console.log('📐 Image compressed:', { 
    newSize: `${(compressedFile.size / 1024).toFixed(2)} KB`,
    compression: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`
  });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error('Cloudinary configuration missing. Please check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env.local file.');
  }

  // Try multiple upload presets in order of preference
  const uploadPresets = [
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET, // User's preferred preset
    'job_portal_uploads', // Our recommended preset
    'ml_default',        // Cloudinary's default preset
    'unsigned_preset'    // Another common name
  ].filter((preset): preset is string => Boolean(preset)); // Remove undefined values and type guard

  let lastError: Error | null = null;

  for (const preset of uploadPresets) {
    try {
      console.log(`🔄 Trying upload preset: ${preset}`);
      
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', preset);
      formData.append('folder', 'profile-images');

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile picture uploaded successfully with preset:', preset);
        console.log('🔗 Image URL:', data.secure_url);
        
        return {
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes
        };
      } else {
        const errorText = await response.text();
        console.warn(`❌ Upload failed with preset "${preset}":`, errorText);
        lastError = new Error(`Upload failed with preset "${preset}": ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`❌ Error with preset "${preset}":`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  // If all presets failed, throw helpful error
  console.error('❌ All upload presets failed. Please check CLOUDINARY_SETUP.md');
  console.error('Last error:', lastError);
  throw new Error(`Upload failed with all presets. Please create an unsigned upload preset in your Cloudinary account. See CLOUDINARY_SETUP.md for instructions.`);
};

// Upload cover photo (landscape, optimized for banner display)
export const uploadCoverPhoto = async (file: File): Promise<ProfileImageUploadResult> => {
  console.log('🌅 Starting cover photo upload:', { 
    fileName: file.name, 
    originalSize: `${(file.size / 1024).toFixed(2)} KB` 
  });

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file');
  }

  // Validate file size (max 8MB for cover photos)
  const maxSize = 8 * 1024 * 1024; // 8MB
  if (file.size > maxSize) {
    throw new Error('Cover photo must be less than 8MB');
  }

  // Compress image for cover photo (wide aspect ratio)
  const compressedFile = await compressImage(file, 1200, 400, 0.8);
  console.log('📐 Cover photo compressed:', { 
    newSize: `${(compressedFile.size / 1024).toFixed(2)} KB`,
    compression: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`
  });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error('Cloudinary configuration missing. Please check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env.local file.');
  }

  // Try multiple upload presets in order of preference
  const uploadPresets = [
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET, // User's preferred preset
    'job_portal_uploads', // Our recommended preset
    'ml_default',        // Cloudinary's default preset
    'unsigned_preset'    // Another common name
  ].filter((preset): preset is string => Boolean(preset)); // Remove undefined values and type guard

  let lastError: Error | null = null;

  for (const preset of uploadPresets) {
    try {
      console.log(`🔄 Trying cover photo upload preset: ${preset}`);
      
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', preset);
      formData.append('folder', 'cover-photos');

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Cover photo uploaded successfully with preset:', preset);
        console.log('🔗 Image URL:', data.secure_url);
        
        return {
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes
        };
      } else {
        const errorText = await response.text();
        console.warn(`❌ Cover photo upload failed with preset "${preset}":`, errorText);
        lastError = new Error(`Upload failed with preset "${preset}": ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`❌ Error with preset "${preset}":`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  // If all presets failed, throw helpful error
  console.error('❌ All cover photo upload presets failed. Please check CLOUDINARY_SETUP.md');
  console.error('Last error:', lastError);
  throw new Error(`Cover photo upload failed with all presets. Please create an unsigned upload preset in your Cloudinary account. See CLOUDINARY_SETUP.md for instructions.`);
};

// Generate optimized image URLs for different use cases
export const getOptimizedImageUrl = (
  originalUrl: string, 
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale';
    quality?: 'auto:low' | 'auto:good' | 'auto:best';
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
) => {
  if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
    return originalUrl;
  }

  const { width, height, crop = 'fill', quality = 'auto:good', format = 'auto' } = options;
  
  // Extract the base URL and image path
  const urlParts = originalUrl.split('/upload/');
  if (urlParts.length !== 2) return originalUrl;
  
  const [baseUrl, imagePath] = urlParts;
  
  // Build transformation string
  const transformations = [];
  
  if (width || height) {
    let transform = `c_${crop}`;
    if (width) transform += `,w_${width}`;
    if (height) transform += `,h_${height}`;
    transformations.push(transform);
  }
  
  transformations.push(`f_${format}`);
  transformations.push(`q_${quality}`);
  
  const transformString = transformations.join(',');
  
  return `${baseUrl}/upload/${transformString}/${imagePath}`;
};
