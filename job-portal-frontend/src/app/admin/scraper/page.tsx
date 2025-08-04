'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/store'
import { fetchUserProfile } from '@/store/slices/authSlice'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Loader2,
  Shield,
  Settings,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  TrendingUp,
  Activity,
  Database,
  Building2,
  BarChart3,
  Timer,
  Users,
  Zap,
  Wifi,
  WifiOff,
  Terminal,
  ScrollText
} from 'lucide-react'
import { io } from 'socket.io-client'

interface ScraperJob {
  id: string;
  parser_name?: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  triggered_by: string;
  jobs_found: number;
  error_message?: string;
  logs: string[];
}

interface Parser {
  name: string;
  company: string;
  url: string;
}

interface ScraperStats {
  overview: {
    total_runs: number;
    total_jobs_found: number;
    avg_jobs_per_run: number;
    avg_duration_seconds: number;
    last_run?: string;
  };
  parser_performance: Array<{
    parser_name: string;
    runs: number;
    jobs_found: number;
    avg_duration: number;
    last_run?: string;
  }>;
  daily_breakdown: Array<{
    date: string;
    runs: number;
    jobs_found: number;
  }>;
  current_status: {
    is_scraping_active: boolean;
    active_jobs: number;
    scheduled_jobs: number;
  };
}

interface ScheduleConfig {
  enabled: boolean;
  config: {
    daily_runs: number;
    run_times: string[];
    timezone: string;
  };
}

export default function AdminScraperManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated, isLoading, tokens } = useSelector((state: RootState) => state.auth)
  const [mounted, setMounted] = useState(false)
  
  // State management
  const [stats, setStats] = useState<ScraperStats | null>(null)
  const [jobs, setJobs] = useState<ScraperJob[]>([])
  const [parsers, setParsers] = useState<Parser[]>([])
  const [schedule, setSchedule] = useState<ScheduleConfig | null>(null)
  const [triggeringJob, setTriggeringJob] = useState(false)
  const [selectedParser, setSelectedParser] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // Real-time WebSocket state
  const [wsConnected, setWsConnected] = useState(false)
  const [realTimeLogs, setRealTimeLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of logs
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [realTimeLogs])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!mounted || !tokens.access_token || user?.user_type !== 'admin') return

    console.log('🔌 Connecting to WebSocket...')
    const newSocket = io('http://localhost:5001', {
      transports: ['websocket'],
      query: {
        auth_token: tokens.access_token
      }
    })

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected')
      setWsConnected(true)
      newSocket.emit('join', 'scraper_updates')
    })

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      setWsConnected(false)
    })

    newSocket.on('stats_update', (data) => {
      console.log('📊 Stats update received:', data)
      if (data && data.data) {
        setStats(data.data)
        setLastRefresh(new Date())
      }
    })

    newSocket.on('scraper_update', (data) => {
      console.log('🔧 Scraper update received:', data)
      if (data && data.message) {
        setRealTimeLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`])
      }
    })

    newSocket.on('log_update', (data) => {
      console.log('📝 Log update received:', data)
      if (data && data.message) {
        setRealTimeLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`])
      }
    })

    return () => {
      console.log('🔌 Cleaning up WebSocket connection')
      newSocket.disconnect()
    }
  }, [mounted, tokens.access_token, user?.user_type])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user profile if needed
  useEffect(() => {
    if (tokens.access_token && !user && !isLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, tokens.access_token, user, isLoading])

  // Redirect non-admin users
  useEffect(() => {
    if (mounted && user && user.user_type !== 'admin') {
      window.location.href = '/dashboard'
    }
  }, [mounted, user])

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!tokens.access_token || user?.user_type !== 'admin') return
    
    try {
      // Fetch all data in parallel
      const [statsRes, jobsRes, parsersRes, scheduleRes] = await Promise.all([
        fetch('http://localhost:5001/api/admin/scraper/status', {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        }),
        fetch('http://localhost:5001/api/admin/scraper/jobs', {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        }),
        fetch('http://localhost:5001/api/admin/scraper/parsers', {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        }),
        fetch('http://localhost:5001/api/admin/scraper/schedule', {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        })
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.data)
      }

      if (jobsRes.ok) {
        const data = await jobsRes.json()
        setJobs(data.jobs || [])
      }

      if (parsersRes.ok) {
        const data = await parsersRes.json()
        setParsers(data.parsers || [])
      }

      if (scheduleRes.ok) {
        const data = await scheduleRes.json()
        setSchedule(data.schedule || {})
      }

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching scraper data:', error)
    }
  }, [tokens.access_token, user?.user_type])

  // Auto-refresh data
  useEffect(() => {
    if (mounted && tokens.access_token && user?.user_type === 'admin') {
      fetchData()
    }
  }, [mounted, tokens.access_token, user, fetchData])

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchData()
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  // Trigger scraping
  const triggerScraping = async () => {
    if (!tokens.access_token) return

    setTriggeringJob(true)
    try {
      const response = await fetch('http://localhost:5001/api/admin/scraper/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parsers: selectedParser === 'all' ? [] : [selectedParser]
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`Scraping started successfully! Job ID: ${data.job_id}`)
        // Refresh data to show new job
        fetchData()
      } else {
        alert(`Failed to start scraping: ${data.message}`)
      }
    } catch (error) {
      console.error('Error triggering scraping:', error)
      alert('Error starting scraping. Please try again.')
    } finally {
      setTriggeringJob(false)
    }
  }

  // Update schedule
  const updateSchedule = async (enabled: boolean, config?: object) => {
    if (!tokens.access_token) return

    try {
      const response = await fetch('/api/admin/scraper/schedule', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled,
          config
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSchedule(data.data)
        alert('Schedule updated successfully!')
      } else {
        alert(`Failed to update schedule: ${data.message}`)
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
      alert('Error updating schedule. Please try again.')
    }
  }

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show auth error if not authenticated or not admin
  if (!isAuthenticated || !user || user.user_type !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Access Denied</h1>
            <p className="text-gray-300 mb-6">You need admin privileges to access this page.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'idle': { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: Pause },
      'running': { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Activity },
      'scheduled': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Clock },
      'completed': { color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
      'error': { color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle
    const IconComponent = config.icon
    
    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getTriggeredByBadge = (triggeredBy: string) => {
    const colors = {
      admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      system: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      schedule: 'bg-green-500/20 text-green-300 border-green-500/30'
    }
    return <Badge className={colors[triggeredBy as keyof typeof colors] || colors.system}>{triggeredBy}</Badge>
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <Settings className="h-8 w-8 text-white" />
              </div>
              Scraper Management
            </h1>
            <p className="mt-2 text-gray-400">
              Control and monitor job scraping operations across all company parsers.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              Last updated: {mounted ? lastRefresh.toLocaleTimeString() : '...'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {wsConnected ? (
                <div className="flex items-center gap-1 text-green-400">
                  <Wifi className="h-4 w-4" />
                  <span>Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400">
                  <WifiOff className="h-4 w-4" />
                  <span>Offline</span>
                </div>
              )}
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
              className={`${showLogs ? 'bg-blue-600/20 border-blue-600 text-blue-400' : 'bg-gray-800 border-gray-700'}`}
            >
              <Terminal className="h-4 w-4 mr-1" />
              {showLogs ? 'Hide' : 'Show'} Logs
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`${autoRefresh ? 'bg-green-600/20 border-green-600 text-green-400' : 'bg-gray-800 border-gray-700'}`}
            >
              {autoRefresh ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              Auto-refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchData}
              disabled={triggeringJob}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              {triggeringJob ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Status Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-300">System Status</p>
                    <p className="text-2xl font-bold text-white">
                      {stats?.current_status?.is_scraping_active ? 'Running' : 'Idle'}
                    </p>
                  </div>
                  {stats?.current_status?.is_scraping_active ? (
                    <Activity className="h-8 w-8 text-blue-400 animate-pulse" />
                  ) : (
                    <Pause className="h-8 w-8 text-blue-400" />
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-300">Total Jobs Found</p>
                    <p className="text-2xl font-bold text-white">{stats?.overview?.total_jobs_found?.toLocaleString() || '0'}</p>
                  </div>
                  <Database className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-300">Total Runs</p>
                    <p className="text-2xl font-bold text-white">{stats?.overview?.total_runs || '0'}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-300">Avg Per Run</p>
                    <p className="text-2xl font-bold text-white">{stats?.overview?.avg_jobs_per_run?.toFixed(1) || '0.0'}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Real-time Logs Panel */}
        {showLogs && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-cyan-400" />
                Real-time Scraping Logs
                {wsConnected ? (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 ml-2">
                    <Wifi className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 ml-2">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                {realTimeLogs.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    <Terminal className="h-8 w-8 mx-auto mb-2" />
                    <p>No logs yet. Start scraping to see real-time updates...</p>
                  </div>
                ) : (
                  <div>
                    {realTimeLogs.map((log, index) => (
                      <div key={index} className="text-gray-300 py-1 border-b border-gray-700/50">
                        {log}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
                <span>{realTimeLogs.length} log entries</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRealTimeLogs([])}
                  className="text-xs bg-gray-800 border-gray-600 hover:bg-gray-700"
                >
                  Clear Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Scraping Control */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Manual Scraping Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-gray-300 text-sm font-medium">Select Parser</Label>
                <select
                  value={selectedParser}
                  onChange={(e) => setSelectedParser(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                  disabled={triggeringJob || stats?.current_status?.is_scraping_active}
                >
                  <option value="all">All Parsers ({parsers.length} total)</option>
                  {parsers.map((parser) => (
                    <option key={parser.name} value={parser.name}>
                      {parser.company} ({parser.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={triggerScraping}
                  disabled={triggeringJob || stats?.current_status?.is_scraping_active}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 min-w-[140px]"
                >
                  {triggeringJob ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Starting...
                    </>
                  ) : stats?.current_status?.is_scraping_active ? (
                    <>
                      <Activity className="h-4 w-4 mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Scraping
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {stats?.current_status?.is_scraping_active && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>
                    Scraping is currently active. {stats?.current_status?.active_jobs || 0} job(s) running, 
                    {stats?.current_status?.scheduled_jobs || 0} scheduled.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Configuration */}
        {schedule && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Automatic Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Scheduled Scraping</p>
                  <p className="text-sm text-gray-400">
                    Runs {schedule.config.daily_runs} times daily at {schedule.config.run_times.join(', ')}
                  </p>
                </div>
                <Button
                  variant={schedule.enabled ? "default" : "outline"}
                  onClick={() => updateSchedule(!schedule.enabled)}
                  className={schedule.enabled 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }
                >
                  {schedule.enabled ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Enable
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400">Daily Runs</p>
                  <p className="text-white font-medium">{schedule.config.daily_runs}</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400">Schedule Times</p>
                  <p className="text-white font-medium">{schedule.config.run_times.join(', ')}</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400">Timezone</p>
                  <p className="text-white font-medium">{schedule.config.timezone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Jobs */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Timer className="h-5 w-5 text-purple-400" />
              Recent Scraping Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!jobs || jobs.length === 0 ? (
              <div className="text-center py-8">
                <Timer className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No scraping jobs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 10).map((job, index) => (
                  <div key={`${job.id}-${index}`} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-white font-medium">
                          {job.parser_name || 'All Parsers'}
                        </h4>
                        {getStatusBadge(job.status)}
                        {getTriggeredByBadge(job.triggered_by)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {mounted && job.created_at ? new Date(job.created_at).toLocaleString() : '...'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Jobs Found</p>
                        <p className="text-white font-medium">{job.jobs_found}</p>
                      </div>
                      {job.started_at && job.completed_at && mounted && (
                        <div>
                          <p className="text-gray-400">Duration</p>
                          <p className="text-white font-medium">
                            {formatDuration(
                              (new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000
                            )}
                          </p>
                        </div>
                      )}
                      {job.status === 'error' && job.error_message && (
                        <div className="col-span-2">
                          <p className="text-gray-400">Error</p>
                          <p className="text-red-400 text-xs">{job.error_message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parser Performance */}
        {stats && stats.parser_performance && Array.isArray(stats.parser_performance) && stats.parser_performance.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-green-400" />
                Parser Performance (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.parser_performance.map((parser) => (
                  <div key={parser.parser_name} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{parser.parser_name}</h4>
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Runs:</span>
                        <span className="text-white">{parser.runs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Jobs Found:</span>
                        <span className="text-white">{parser.jobs_found}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Duration:</span>
                        <span className="text-white">{formatDuration(parser.avg_duration)}</span>
                      </div>
                      {parser.last_run && mounted && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Run:</span>
                          <span className="text-white">{new Date(parser.last_run).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
