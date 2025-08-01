'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Mail, Clock, Ban, Calendar } from 'lucide-react'
import { logoutUser } from '@/store/slices/authSlice'

interface AccountStatusCheckerProps {
  children: React.ReactNode
}

interface AccountStatus {
  banned?: boolean
  suspended?: boolean
  reason?: string
  suspended_until?: string
  contact_email?: string
}

export default function AccountStatusChecker({ children }: AccountStatusCheckerProps) {
  const { isAuthenticated, tokens } = useSelector((state: RootState) => state.auth)
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const dispatch = useDispatch<AppDispatch>()

  const checkAccountStatus = useCallback(async () => {
    if (!tokens.access_token) return

    try {
      // Make a test request to check if account is banned/suspended
      const response = await fetch('http://127.0.0.1:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 403) {
        const data = await response.json()
        if (data.banned || data.suspended) {
          setAccountStatus(data)
          return
        }
      }

      // If no issues, clear any previous status
      setAccountStatus(null)

    } catch (error) {
      console.error('Error checking account status:', error)
    }
  }, [tokens.access_token])

  useEffect(() => {
    if (isAuthenticated && tokens.access_token) {
      checkAccountStatus()
    }
  }, [isAuthenticated, tokens.access_token, checkAccountStatus])

  const handleLogout = () => {
    dispatch(logoutUser())
    setAccountStatus(null)
  }

  const formatSuspensionDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const calculateDaysRemaining = (dateString: string) => {
    try {
      const suspendEnd = new Date(dateString)
      const now = new Date()
      const diffTime = suspendEnd.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
    } catch {
      return 0
    }
  }

  // If account is banned, show ban message
  if (accountStatus?.banned) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-red-900 flex items-center justify-center p-4">
        <div className="relative group max-w-2xl w-full">
          {/* Animated background */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
          
          <Card className="relative bg-slate-900/95 backdrop-blur-xl border-red-800/50 rounded-3xl overflow-hidden">
            <CardHeader className="text-center space-y-4 p-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Ban className="h-10 w-10 text-red-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 mb-4">
                  Account Banned
                </Badge>
                <CardTitle className="text-3xl font-bold text-white">
                  Account Access Restricted
                </CardTitle>
                <p className="text-red-200 text-lg">
                  Your account has been permanently banned from accessing our platform.
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 p-8 pt-0">
              {/* Reason */}
              <div className="bg-red-950/30 rounded-2xl p-6 border border-red-800/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Reason for Ban</h3>
                    <p className="text-red-200 leading-relaxed">
                      {accountStatus.reason || 'No specific reason provided. Please contact support for more details.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <Mail className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
                    <p className="text-slate-300 mb-4">
                      If you believe this ban was issued in error or would like to appeal, please contact our support team.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => window.open(`mailto:${accountStatus.contact_email || 'support@jobportal.com'}?subject=Account%20Ban%20Appeal&body=Please%20review%20my%20account%20ban.%20User%20ID:%20[Your%20ID]`, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Contact Support
                      </Button>
                      <Button 
                        onClick={handleLogout}
                        variant="outline" 
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // If account is suspended, show suspension message
  if (accountStatus?.suspended) {
    const daysRemaining = accountStatus.suspended_until ? calculateDaysRemaining(accountStatus.suspended_until) : 0
    const suspensionEndDate = accountStatus.suspended_until ? formatSuspensionDate(accountStatus.suspended_until) : ''

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-slate-900 to-yellow-900 flex items-center justify-center p-4">
        <div className="relative group max-w-2xl w-full">
          {/* Animated background */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
          
          <Card className="relative bg-slate-900/95 backdrop-blur-xl border-yellow-800/50 rounded-3xl overflow-hidden">
            <CardHeader className="text-center space-y-4 p-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Clock className="h-10 w-10 text-yellow-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 mb-4">
                  Account Suspended
                </Badge>
                <CardTitle className="text-3xl font-bold text-white">
                  Temporary Account Suspension
                </CardTitle>
                <p className="text-yellow-200 text-lg">
                  Your account access has been temporarily restricted.
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 p-8 pt-0">
              {/* Suspension Details */}
              <div className="bg-yellow-950/30 rounded-2xl p-6 border border-yellow-800/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Days Remaining</h3>
                      <p className="text-2xl font-bold text-yellow-400">
                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Access Restored</h3>
                      <p className="text-sm text-yellow-200">
                        {suspensionEndDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-yellow-950/30 rounded-2xl p-6 border border-yellow-800/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Reason for Suspension</h3>
                    <p className="text-yellow-200 leading-relaxed">
                      {accountStatus.reason || 'No specific reason provided. Please contact support for more details.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <Mail className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Questions?</h3>
                    <p className="text-slate-300 mb-4">
                      If you have questions about this suspension or need assistance, feel free to contact our support team.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => window.open(`mailto:${accountStatus.contact_email || 'support@jobportal.com'}?subject=Account%20Suspension%20Inquiry&body=I%20have%20questions%20about%20my%20account%20suspension.`, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Contact Support
                      </Button>
                      <Button 
                        onClick={handleLogout}
                        variant="outline" 
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // If account is fine or loading, show children
  return <>{children}</>
}
