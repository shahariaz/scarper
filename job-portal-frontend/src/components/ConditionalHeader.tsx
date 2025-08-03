'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Don't show Header on dashboard routes since DashboardLayout provides its own navigation
  const isDashboardRoute = 
    pathname === '/dashboard' ||
    pathname === '/company-dashboard' ||
    pathname === '/profile' ||
    pathname === '/settings' ||
    pathname === '/messages' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/post-job') ||
    pathname.startsWith('/applications') ||
    pathname.startsWith('/saved-jobs') ||
    pathname.startsWith('/my-applications')
  
  // Only show Header on non-dashboard routes
  if (isDashboardRoute) {
    return null
  }
  
  return <Header />
}
