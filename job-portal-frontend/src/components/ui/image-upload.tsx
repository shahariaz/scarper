'use client'

import React, { useState, useRef } from 'react'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { uploadProfilePicture, uploadCoverPhoto } from '@/lib/profile-image-upload'

interface ImageUploadProps {
  type: 'profile' | 'cover'
  currentImage?: string
  onImageUpdate: (imageUrl: string) => void
  disabled?: boolean
  className?: string
  updateBackend?: boolean
}

export default function ImageUpload({ 
  type, 
  onImageUpdate, 
  disabled = false,
  className = '' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isProfile = type === 'profile'

  const handleFileSelect = async (file: File) => {
    if (disabled || uploading) return

    try {
      setUploading(true)
      toast.loading(`Uploading ${type} image...`, { id: 'image-upload' })

      let result
      if (isProfile) {
        result = await uploadProfilePicture(file)
      } else {
        result = await uploadCoverPhoto(file)
      }

      onImageUpdate(result.url)
      
      toast.success(
        `${isProfile ? 'Profile picture' : 'Cover photo'} updated successfully!`,
        { id: 'image-upload' }
      )
    } catch (error) {
      console.error('Image upload error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload image',
        { id: 'image-upload' }
      )
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    event.target.value = ''
  }

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setDragOver(false)
    
    const file = event.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    } else {
      toast.error('Please drop a valid image file')
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setDragOver(false)
  }

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Elegant upload button */}
      <Button
        onClick={openFileDialog}
        disabled={disabled || uploading}
        size="sm"
        variant="ghost"
        className={`
          relative overflow-hidden transition-all duration-200 group
          ${isProfile 
            ? 'w-8 h-8 rounded-full p-0 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/30' 
            : 'px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/30 text-white'
          }
          ${uploading ? 'cursor-wait' : 'cursor-pointer'}
          ${dragOver ? 'scale-105 bg-blue-600/80 border-blue-400' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <Loader2 className={`animate-spin text-white ${isProfile ? 'h-3 w-3' : 'h-3 w-3'}`} />
        ) : (
          <>
            <Camera className={`text-white ${isProfile ? 'h-3 w-3' : 'h-3 w-3'}`} />
            {!isProfile && <span className="ml-1.5 text-xs font-medium">Edit</span>}
          </>
        )}
        
        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 bg-blue-500/30 border border-blue-400 border-dashed rounded flex items-center justify-center">
            <Upload className="h-3 w-3 text-blue-200" />
          </div>
        )}
      </Button>

      {/* Subtle upload indicator */}
      {uploading && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10">
          <div className="bg-black/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            Uploading...
          </div>
        </div>
      )}
    </div>
  )
}
