'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JobsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main page where job listings are displayed
    router.replace('/')
  }, [router])

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Redirecting to job listings...</p>
      </div>
    </div>
  )
}
