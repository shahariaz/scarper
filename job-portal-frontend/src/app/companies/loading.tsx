import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-300">Loading companies...</span>
        </div>
      </div>
    </div>
  )
}
