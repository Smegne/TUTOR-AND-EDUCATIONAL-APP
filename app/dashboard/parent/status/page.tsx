// app/dashboard/parent/status/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  TrendingUp, 
  Clock, 
  Award, 
  Monitor, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Database, 
  RefreshCw,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Brain,
  Target,
  Zap,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  Eye,
  EyeOff,
  ChevronRight,
  BarChart,
  PieChart,
  LineChart,
  Activity,
  Users,
  Download,
  Filter,
  Search
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"

interface ChildStats {
  completionRate: number
  averageScore: number
  tasksCompleted: number
  tasksPending: number
  streak: number
  totalTasks: number
}

interface Session {
  id: string
  login_time: string
  logout_time?: string
  duration_minutes?: number
  device_info?: string
  ip_address?: string
}

interface ChildSessions {
  totalStudyTime: number
  weeklyStudyTime: number
  avgSessionTime: number
  totalSessions: number
  recentSessions: Session[]
}

interface Child {
  id: string
  name: string
  grade: number
  email?: string
  stats: ChildStats
  sessions: ChildSessions
}

interface OverallStats {
  avgCompletionRate: number
  avgScore: number
  totalStudyTime: number
  weeklyStudyTime: number
  totalTasks: number
  completedTasks: number
  totalChildren: number
}

export default function ParentStatusPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [overallStats, setOverallStats] = useState<OverallStats>({
    avgCompletionRate: 0,
    avgScore: 0,
    totalStudyTime: 0,
    weeklyStudyTime: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalChildren: 0
  })
  const [refreshing, setRefreshing] = useState(false)
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')

  // Get the parent ID using the same logic as tasks page
  const getParentId = useCallback(() => {
    if ((user as any)?.lookupId) return (user as any).lookupId
    if ((user as any)?.userId) return (user as any).userId
    if ((user as any)?.parentId) return (user as any).parentId
    if (user?.id) return user.id
    
    // For ageru@gmail.com
    if (user?.email === 'ageru@gmail.com') {
      return 'p_mm86u06x_974nf'
    }
    
    return 'p_mm86u06x_974nf'
  }, [user])

  const PARENT_ID = getParentId()

  const fetchParentStatus = useCallback(async (showToast = true) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🎯 [PARENT STATUS] Fetching for parent:", PARENT_ID)
      
      // Use the same direct pattern as tasks page
      const response = await fetch(`/api/parent-direct/${PARENT_ID}/status`)
      
      console.log("📊 [PARENT STATUS] Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("✅ [PARENT STATUS] API Response:", {
          success: data.success,
          childrenCount: data.children?.length,
          overallStats: data.overallStats
        })
        
        if (data.success) {
          setChildren(data.children || [])
          setOverallStats(data.overallStats || {
            avgCompletionRate: 0,
            avgScore: 0,
            totalStudyTime: 0,
            weeklyStudyTime: 0,
            totalTasks: 0,
            completedTasks: 0,
            totalChildren: 0
          })
          setUsingMockData(false)
          
          if (showToast && data.children?.length > 0) {
            toast.success(`Loaded status for ${data.children.length} children`)
          } else if (showToast && data.children?.length === 0) {
            toast.info("No children linked yet")
          }
        } else {
          throw new Error(data.error || 'Failed to fetch status data')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ [PARENT STATUS] Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load status data')
      setUsingMockData(true)
      
      // Load mock data
      const mockData = getMockData()
      setChildren(mockData.children)
      setOverallStats(mockData.overallStats)
      
      if (showToast) {
        toast.error("Failed to load real data. Using demo data.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [PARENT_ID])

  useEffect(() => {
    fetchParentStatus(false)
  }, [fetchParentStatus])

  const getMockData = () => {
    const mockChildren: Child[] = [
      {
        id: "student_001",
        name: "Abel Tesfaye",
        grade: 8,
        email: "abel@example.com",
        stats: {
          completionRate: 80,
          averageScore: 85,
          tasksCompleted: 12,
          tasksPending: 3,
          streak: 7,
          totalTasks: 15
        },
        sessions: {
          totalStudyTime: 540,
          weeklyStudyTime: 320,
          avgSessionTime: 45,
          totalSessions: 12,
          recentSessions: [
            {
              id: "session_1",
              login_time: new Date(Date.now() - 3600000).toISOString(),
              logout_time: new Date(Date.now() - 3300000).toISOString(),
              duration_minutes: 30,
              device_info: "Chrome on Windows",
              ip_address: "192.168.1.1"
            },
            {
              id: "session_2",
              login_time: new Date(Date.now() - 86400000).toISOString(),
              logout_time: new Date(Date.now() - 86100000).toISOString(),
              duration_minutes: 45,
              device_info: "Safari on iPad",
              ip_address: "192.168.1.2"
            },
            {
              id: "session_3",
              login_time: new Date(Date.now() - 172800000).toISOString(),
              logout_time: new Date(Date.now() - 172500000).toISOString(),
              duration_minutes: 60,
              device_info: "Firefox on Mac",
              ip_address: "192.168.1.3"
            }
          ]
        }
      },
      {
        id: "student_002",
        name: "Emma Wilson",
        grade: 7,
        email: "emma@example.com",
        stats: {
          completionRate: 92,
          averageScore: 94,
          tasksCompleted: 11,
          tasksPending: 1,
          streak: 14,
          totalTasks: 12
        },
        sessions: {
          totalStudyTime: 420,
          weeklyStudyTime: 280,
          avgSessionTime: 35,
          totalSessions: 12,
          recentSessions: [
            {
              id: "session_4",
              login_time: new Date(Date.now() - 7200000).toISOString(),
              logout_time: new Date(Date.now() - 7140000).toISOString(),
              duration_minutes: 25,
              device_info: "Chrome on Android",
              ip_address: "192.168.1.4"
            }
          ]
        }
      }
    ]

    const overall = {
      avgCompletionRate: Math.round(mockChildren.reduce((sum, c) => sum + c.stats.completionRate, 0) / mockChildren.length),
      avgScore: Math.round(mockChildren.reduce((sum, c) => sum + c.stats.averageScore, 0) / mockChildren.length),
      totalStudyTime: mockChildren.reduce((sum, c) => sum + c.sessions.totalStudyTime, 0),
      weeklyStudyTime: mockChildren.reduce((sum, c) => sum + c.sessions.weeklyStudyTime, 0),
      totalTasks: mockChildren.reduce((sum, c) => sum + c.stats.totalTasks, 0),
      completedTasks: mockChildren.reduce((sum, c) => sum + c.stats.tasksCompleted, 0),
      totalChildren: mockChildren.length
    }

    return { children: mockChildren, overallStats: overall }
  }

  const refreshData = () => {
    toast.info("Refreshing status data...")
    setRefreshing(true)
    fetchParentStatus()
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return "Invalid date"
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a')
    } catch {
      return "Invalid time"
    }
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Unknown"
    }
  }

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return { text: "Outstanding!", color: "text-green-600", icon: Award }
    if (score >= 80) return { text: "Excellent!", color: "text-blue-600", icon: TrendingUp }
    if (score >= 70) return { text: "Good work!", color: "text-yellow-600", icon: Target }
    if (score >= 60) return { text: "Keep improving!", color: "text-orange-600", icon: Activity }
    return { text: "Needs attention", color: "text-red-600", icon: AlertTriangle }
  }

  const getStreakMessage = (streak: number) => {
    if (streak >= 14) return { text: "🔥 Amazing streak!", color: "text-orange-600" }
    if (streak >= 7) return { text: "Great consistency!", color: "text-green-600" }
    if (streak >= 3) return { text: "Keep going!", color: "text-blue-600" }
    return { text: "Build your streak!", color: "text-muted-foreground" }
  }

  const getDeviceIcon = (deviceInfo: string = "") => {
    const info = deviceInfo.toLowerCase()
    if (info.includes('iphone') || info.includes('android')) return Smartphone
    if (info.includes('ipad') || info.includes('tablet')) return Tablet
    if (info.includes('mac') || info.includes('windows') || info.includes('linux')) return Laptop
    return Monitor
  }

  const filteredChildren = selectedChild === 'all' 
    ? children 
    : children.filter(c => c.id === selectedChild)

  if (loading && children.length === 0) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading learning status...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Parent ID: {PARENT_ID}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

 

  return (
    <DashboardLayout role="parent">
      

      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Learning Status</h1>
            <p className="text-muted-foreground">
              Monitor your children's academic progress and study habits
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Parent ID: {PARENT_ID} • {children.length} child{children.length !== 1 ? 'ren' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
            >
              <option value="all">All Children</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>

            <select 
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              className="gap-2"
              disabled={refreshing}
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Overall Stats Cards */}
        {children.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Completion</p>
                    <p className="text-2xl font-bold">{overallStats.avgCompletionRate}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Score</p>
                    <p className="text-2xl font-bold text-green-600">{overallStats.avgScore}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Study Time</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatDuration(timeRange === 'week' ? overallStats.weeklyStudyTime : overallStats.totalStudyTime)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tasks</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {overallStats.completedTasks}/{overallStats.totalTasks}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {filteredChildren.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No children found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {selectedChild !== 'all' 
                  ? "No data available for the selected child."
                  : "Your children will appear here once they are registered and enrolled in courses."}
              </p>
              {selectedChild !== 'all' && (
                <Button variant="outline" onClick={() => setSelectedChild('all')}>
                  View All Children
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredChildren.map((child) => {
            const performance = getPerformanceMessage(child.stats.averageScore)
            const streak = getStreakMessage(child.stats.streak)
            const PerformanceIcon = performance.icon

            return (
              <div key={child.id} className="space-y-6">
                {/* Child Header */}
                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{child.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Grade {child.grade}</span>
                        {child.email && (
                          <>
                            <span>•</span>
                            <span>{child.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-primary/5">
                    {child.stats.completedTasks}/{child.stats.totalTasks} tasks
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Completion Rate</CardDescription>
                      <CardTitle className="text-3xl">{child.stats.completionRate}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={child.stats.completionRate} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2">
                        {child.stats.completedTasks} of {child.stats.totalTasks} tasks
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Average Score</CardDescription>
                      <CardTitle className="text-3xl">{child.stats.averageScore}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`flex items-center gap-1 text-sm ${performance.color}`}>
                        <PerformanceIcon className="h-4 w-4" />
                        <span>{performance.text}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Learning Streak</CardDescription>
                      <CardTitle className="text-3xl">{child.stats.streak} days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`flex items-center gap-1 text-sm ${streak.color}`}>
                        <Zap className="h-4 w-4" />
                        <span>{streak.text}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Study Time ({timeRange})</CardDescription>
                      <CardTitle className="text-3xl">
                        {formatDuration(timeRange === 'week' ? child.sessions.weeklyStudyTime : child.sessions.totalStudyTime)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{child.sessions.totalSessions} sessions</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Session Details */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Session Analytics
                      </CardTitle>
                      <CardDescription>Detailed study session statistics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Avg Session</p>
                          <p className="text-2xl font-bold">{formatDuration(child.sessions.avgSessionTime)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
                          <p className="text-2xl font-bold">{child.sessions.totalSessions}</p>
                        </div>
                      </div>

                      {child.sessions.recentSessions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Most Used Device</p>
                          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            {(() => {
                              const DeviceIcon = getDeviceIcon(child.sessions.recentSessions[0]?.device_info)
                              return <DeviceIcon className="h-4 w-4" />
                            })()}
                            <span className="text-sm">
                              {child.sessions.recentSessions[0]?.device_info || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Sessions
                      </CardTitle>
                      <CardDescription>Last 10 login activities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                      {child.sessions.recentSessions.map((session) => {
                        const DeviceIcon = getDeviceIcon(session.device_info)
                        return (
                          <div key={session.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                  {formatDate(session.login_time)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatTime(session.login_time)}</span>
                                {session.logout_time && (
                                  <>
                                    <span>→</span>
                                    <span>{formatTime(session.logout_time)}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{formatRelativeTime(session.login_time)}</span>
                              </div>
                              {session.device_info && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📱 {session.device_info}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="ml-2">
                              {session.duration_minutes ? formatDuration(session.duration_minutes) : "Active"}
                            </Badge>
                          </div>
                        )
                      })}
                      {child.sessions.recentSessions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No session history available</p>
                          <p className="text-sm mt-1">Your child will appear here when they start studying</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Insights */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Learning Insights
                    </CardTitle>
                    <CardDescription>AI-powered analysis of your child's learning patterns</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Streak Insight */}
                    {child.stats.streak >= 3 && (
                      <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                        <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <Zap className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Consistent Learning Habit</p>
                          <p className="text-sm text-muted-foreground">
                            Your child has maintained a {child.stats.streak}-day learning streak. 
                            {child.stats.streak >= 7 
                              ? " This excellent consistency is key to academic success!" 
                              : " Keep encouraging daily practice to build momentum."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Score Insight */}
                    {child.stats.averageScore >= 80 ? (
                      <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                        <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Award className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Strong Academic Performance</p>
                          <p className="text-sm text-muted-foreground">
                            With an average score of {child.stats.averageScore}%, your child is demonstrating 
                            excellent understanding of the material. They're in the top tier of their class!
                          </p>
                        </div>
                      </div>
                    ) : child.stats.averageScore <= 60 ? (
                      <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                        <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <Target className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Room for Improvement</p>
                          <p className="text-sm text-muted-foreground">
                            Your child's average score is {child.stats.averageScore}%. Consider reviewing 
                            challenging topics together or requesting additional help from tutors.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Task Completion Insight */}
                    {child.stats.completionRate >= 80 ? (
                      <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Great Task Completion</p>
                          <p className="text-sm text-muted-foreground">
                            Your child has completed {child.stats.completionRate}% of their assigned tasks. 
                            This shows excellent responsibility and time management!
                          </p>
                        </div>
                      </div>
                    ) : child.stats.completionRate <= 50 ? (
                      <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                        <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Pending Tasks Need Attention</p>
                          <p className="text-sm text-muted-foreground">
                            Your child has {child.stats.tasksPending} pending tasks. Consider setting up 
                            a regular study schedule to help them catch up.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Study Time Insight */}
                    {child.sessions.weeklyStudyTime >= 300 ? (
                      <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                        <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Dedicated Study Time</p>
                          <p className="text-sm text-muted-foreground">
                            Your child has studied for {formatDuration(child.sessions.weeklyStudyTime)} this week. 
                            This dedication is commendable and will surely lead to success!
                          </p>
                        </div>
                      </div>
                    ) : child.sessions.weeklyStudyTime <= 120 ? (
                      <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                        <div className="h-8 w-8 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium mb-1">Limited Study Time</p>
                          <p className="text-sm text-muted-foreground">
                            Your child has studied for {formatDuration(child.sessions.weeklyStudyTime)} this week. 
                            Try to encourage more consistent daily study sessions.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            )
          })
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
            <div className="font-bold mb-1">Parent Status Debug:</div>
            <div className="space-y-1">
              <div>Parent ID: {PARENT_ID}</div>
              <div>Children: {children.length}</div>
              <div>From DB: {usingMockData ? 'No (demo)' : 'Yes'}</div>
              <div className="pt-1 border-t border-white/20">
                <button 
                  onClick={() => {
                    console.log("Children Data:", children)
                    console.log("Overall Stats:", overallStats)
                    console.log("User:", user)
                  }}
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  Log Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}