'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye, Download, X } from 'lucide-react'
import Image from 'next/image'

interface ImageViewerProps {
  src?: string
  alt: string
  trigger?: React.ReactNode
  title?: string
  className?: string
  showDownload?: boolean
}

export default function ImageViewer({ 
  src, 
  alt, 
  trigger, 
  title,
  className = "",
  showDownload = true 
}: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!src) return null

  const handleDownload = () => {
    if (src) {
      const link = document.createElement('a')
      link.href = src
      link.download = alt || 'image'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className={`absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 ${className}`}
    >
      <Eye className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent 
        className="max-w-4xl w-full max-h-[90vh] bg-gray-900 border-gray-700 p-0 overflow-hidden"
        showCloseButton={false}
      >
        <div className="relative w-full h-full">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div>
                {title && <h3 className="text-lg font-semibold">{title}</h3>}
                <p className="text-sm text-gray-300">{alt}</p>
              </div>
              <div className="flex items-center gap-2">
                {showDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative w-full h-[600px] flex items-center justify-center bg-black">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 90vw"
              priority
            />
          </div>

          {/* Bottom gradient for better visibility */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
