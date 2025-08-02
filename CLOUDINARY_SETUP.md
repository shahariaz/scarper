# 🌤️ Cloudinary Setup Guide

## The Problem
You're getting this error: **"Upload preset must be whitelisted for unsigned uploads"**

This happens because Cloudinary requires an **upload preset** that's specifically configured to allow unsigned uploads from your frontend.

## Quick Fix - Create Upload Preset

### Step 1: Go to Cloudinary Console
1. Visit [Cloudinary Console](https://cloudinary.com/console)
2. Login to your account

### Step 2: Create Upload Preset
1. Go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**

### Step 3: Configure the Preset
- **Preset name**: `job_portal_uploads` (or any name you prefer)
- **Signing Mode**: **Unsigned** ⚠️ (This is crucial!)
- **Folder**: `profile-images` (optional, for organization)
- **Format**: Leave as Auto
- **Quality**: Auto
- **Max file size**: 10MB
- **Max image width**: 2000px
- **Max image height**: 2000px

### Step 4: Save and Enable
1. Click **Save**
2. Make sure the preset shows as **Unsigned** in the list

### Step 5: Update Environment Variable
In your `.env.local` file, update:
```bash
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=job_portal_uploads
```

## Alternative Solution - Use Built-in Preset

Some Cloudinary accounts have a default preset called `ml_default` that might work. Try updating your `.env.local`:

```bash
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```

## Environment Variables Needed

Make sure you have all these in your `.env.local`:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=job_portal_uploads
```

## Test After Setup

1. Restart your Next.js development server
2. Try uploading a profile picture
3. Check the browser console for success messages

## Troubleshooting

### Still getting 400 errors?
- Double-check the preset name matches exactly
- Ensure the preset is set to "Unsigned"
- Try creating a new preset with a different name

### Upload preset not found?
- The preset name might be case-sensitive
- Try `ml_default` as a fallback

### Need help?
Check the Cloudinary documentation: https://cloudinary.com/documentation/upload_presets
