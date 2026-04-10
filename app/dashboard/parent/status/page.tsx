"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, 
  TrendingUp, 
  Clock, 
  Award, 
  Monitor, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Brain,
  Target,
  Zap,
  Smartphone,
  Laptop,
  Tablet,
  Eye,
  Heart,
  Sparkles,
  Star,
  Flame,
  Activity,
  Users,
  BarChart3,
  LineChart,
  PieChart,
  ChevronRight,
  Filter
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

// Brand colors configuration
const brandColors = {
  primary: "#10B981",
  primaryDark: "#059669",
  primaryLight: "#D1FAE5",
  primaryBg: "#ECFDF5",
  white: "#FFFFFF",
  gray: "#6B7280",
  grayLight: "#F9FAFB",
  grayBorder: "#E5E7EB",
}

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

  const getParentId = useCallback(() => {
    if ((user as any)?.lookupId) return (user as any).lookupId
    if ((user as any)?.userId) return (user as any).userId
    if ((user as any)?.parentId) return (user as any).parentId
    if (user?.id) return user.id
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
      
      const response = await fetch(`/api/parent-direct/${PARENT_ID}/status`)
      
      if (response.ok) {
        const data = await response.json()
        
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
    if (score >= 90) return { text: "Outstanding!", color: "text-emerald-600", icon: Award, bg: "bg-emerald-50" }
    if (score >= 80) return { text: "Excellent!", color: "text-blue-600", icon: TrendingUp, bg: "bg-blue-50" }
    if (score >= 70) return { text: "Good work!", color: "text-amber-600", icon: Target, bg: "bg-amber-50" }
    if (score >= 60) return { text: "Keep improving!", color: "text-orange-600", icon: Activity, bg: "bg-orange-50" }
    return { text: "Needs attention", color: "text-rose-600", icon: AlertTriangle, bg: "bg-rose-50" }
  }

  const getStreakMessage = (streak: number) => {
    if (streak >= 14) return { text: "🔥 Amazing streak!", color: "text-orange-600", icon: Flame }
    if (streak >= 7) return { text: "Great consistency!", color: "text-emerald-600", icon: Zap }
    if (streak >= 3) return { text: "Keep going!", color: "text-blue-600", icon: Target }
    return { text: "Build your streak!", color: "text-gray-500", icon: Calendar }
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: brandColors.primary }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-white/20 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Loading learning status...</p>
              <p className="text-sm text-gray-500 mt-2">Analyzing your children's progress</p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="parent">
      <div className="min-h-screen" style={{ background: brandColors.grayLight }}>
        {/* Top Gradient Bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.primaryLight})` }} />
        
        <div className="p-6 md:p-8 space-y-8">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ background: brandColors.primaryBg }}>
                  <Heart className="h-6 w-6" style={{ color: brandColors.primary }} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Learning Status</h1>
                {usingMockData && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Demo Mode
                  </Badge>
                )}
              </div>
              <p className="text-gray-500">
                Monitor your children's academic progress and study habits
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {children.length} child{children.length !== 1 ? 'ren' : ''} • Tracking learning journey
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select 
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm pr-8 cursor-pointer hover:border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="all">All Children</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>
                      {child.name} (Grade {child.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <select 
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm pr-8 cursor-pointer hover:border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  className="gap-2 border-gray-200 hover:border-green-200 hover:bg-green-50 transition-all"
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Overall Stats Cards */}
          {/* {children.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { 
                  label: "Avg Completion", 
                  value: `${overallStats.avgCompletionRate}%`, 
                  icon: Target, 
                  gradient: "from-blue-500 to-blue-600",
                  bgGradient: "from-blue-50 to-blue-100"
                },
                { 
                  label: "Avg Score", 
                  value: `${overallStats.avgScore}%`, 
                  icon: Award, 
                  gradient: "from-emerald-500 to-emerald-600",
                  bgGradient: "from-emerald-50 to-emerald-100"
                },
                { 
                  label: "Study Time", 
                  value: formatDuration(timeRange === 'week' ? overallStats.weeklyStudyTime : overallStats.totalStudyTime), 
                  icon: Clock, 
                  gradient: "from-purple-500 to-purple-600",
                  bgGradient: "from-purple-50 to-purple-100"
                },
                { 
                  label: "Tasks", 
                  value: `${overallStats.completedTasks}/${overallStats.totalTasks}`, 
                  icon: BookOpen, 
                  gradient: "from-amber-500 to-amber-600",
                  bgGradient: "from-amber-50 to-amber-100"
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className={`bg-gradient-to-br ${stat.bgGradient} p-4`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">{stat.label}</div>
                          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        </div>
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                          <stat.icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )} */}

          <AnimatePresence mode="wait">
            {filteredChildren.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-none shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="bg-green-50 rounded-full p-4 mb-4">
                      <Users className="h-12 w-12" style={{ color: brandColors.primary }} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No children found</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {selectedChild !== 'all' 
                        ? "No data available for the selected child."
                        : "Your children will appear here once they are registered and enrolled in courses."}
                    </p>
                    {selectedChild !== 'all' && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedChild('all')}
                        className="mt-4 border-green-200 text-green-600 hover:bg-green-50"
                      >
                        View All Children
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="children"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {filteredChildren.map((child, childIndex) => {
                  const performance = getPerformanceMessage(child.stats.averageScore)
                  const streak = getStreakMessage(child.stats.streak)
                  const PerformanceIcon = performance.icon
                  const StreakIcon = streak.icon

                  return (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: childIndex * 0.1 }}
                      className="space-y-6"
                    >
                      {/* Child Header */}
                      <div 
                        className="flex items-center justify-between p-4 rounded-xl shadow-sm"
                        style={{ background: brandColors.white }}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="h-14 w-14 rounded-full flex items-center justify-center shadow-md"
                            style={{ background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.primaryDark})` }}
                          >
                            <User className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">{child.name}</h2>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
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
                        <Badge 
                          className="px-3 py-1 text-sm"
                          style={{ background: brandColors.primaryBg, color: brandColors.primaryDark }}
                        >
                          {child.stats.completedTasks}/{child.stats.totalTasks} tasks
                        </Badge>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {/* Completion Rate Card */}
                        <motion.div whileHover={{ y: -2 }}>
                          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                            <CardHeader className="pb-2">
                              <CardDescription className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Completion Rate
                              </CardDescription>
                              <CardTitle className="text-3xl" style={{ color: brandColors.primary }}>
                                {child.stats.completionRate}%
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Progress value={child.stats.completionRate} className="h-2" style={{ background: brandColors.primaryBg }} />
                              <p className="text-sm text-gray-500 mt-2">
                                {child.stats.completedTasks} of {child.stats.totalTasks} tasks
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>

                        {/* Average Score Card */}
                        <motion.div whileHover={{ y: -2 }}>
                          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                            <CardHeader className="pb-2">
                              <CardDescription className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Average Score
                              </CardDescription>
                              <CardTitle className="text-3xl text-emerald-600">
                                {child.stats.averageScore}%
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`flex items-center gap-2 text-sm ${performance.color} ${performance.bg} p-2 rounded-lg`}>
                                <PerformanceIcon className="h-4 w-4" />
                                <span>{performance.text}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        {/* Learning Streak Card */}
                        <motion.div whileHover={{ y: -2 }}>
                          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                            <CardHeader className="pb-2">
                              <CardDescription className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                Learning Streak
                              </CardDescription>
                              <CardTitle className="text-3xl text-orange-600">
                                {child.stats.streak} days
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`flex items-center gap-2 text-sm ${streak.color}`}>
                                <StreakIcon className="h-4 w-4" />
                                <span>{streak.text}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        {/* Study Time Card */}
                        <motion.div whileHover={{ y: -2 }}>
                          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                            <CardHeader className="pb-2">
                              <CardDescription className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Study Time ({timeRange === 'week' ? 'Week' : timeRange === 'month' ? 'Month' : 'Total'})
                              </CardDescription>
                              <CardTitle className="text-3xl text-purple-600">
                                {formatDuration(timeRange === 'week' ? child.sessions.weeklyStudyTime : child.sessions.totalStudyTime)}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Activity className="h-3 w-3" />
                                <span>{child.sessions.totalSessions} sessions total</span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>

                      {/* Session Analytics & Recent Sessions */}
                      <div className="grid gap-6 lg:grid-cols-2">
                        {/* Session Analytics Card */}
                        <motion.div whileHover={{ y: -2 }}>
                          <Card className="border-none shadow-lg overflow-hidden h-full">
                            <CardHeader className="border-b border-gray-100">
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5" style={{ color: brandColors.primary }} />
                                Session Analytics
                              </CardTitle>
                              <CardDescription>Detailed study session statistics</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl p-4" style={{ background: brandColors.primaryBg }}>
                                  <p className="text-sm text-gray-500 mb-1">Avg Session</p>
                                  <p className="text-2xl font-bold text-gray-900">{formatDuration(child.sessions.avgSessionTime)}</p>
                                </div>
                                <div className="rounded-xl p-4" style={{ background: brandColors.primaryBg }}>
                                  <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
                                  <p className="text-2xl font-bold text-gray-900">{child.sessions.totalSessions}</p>
                                </div>
                              </div>

                              {child.sessions.recentSessions.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">Most Used Device</p>
                                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: brandColors.grayLight }}>
                                    {(() => {
                                      const DeviceIcon = getDeviceIcon(child.sessions.recentSessions[0]?.device_info)
                                      return <DeviceIcon className="h-5 w-5" style={{ color: brandColors.primary }} />
                                    })()}
                                    <span className="text-sm text-gray-600">
                                      {child.sessions.recentSessions[0]?.device_info || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>

                        {/* Recent Sessions Card */}
                        <motion.div whileHover={{ y: -2 }}>
                          <Card className="border-none shadow-lg overflow-hidden h-full">
                            <CardHeader className="border-b border-gray-100">
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Activity className="h-5 w-5" style={{ color: brandColors.primary }} />
                                Recent Sessions
                              </CardTitle>
                              <CardDescription>Last login activities</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3 max-h-[320px] overflow-y-auto">
                              {child.sessions.recentSessions.length === 0 ? (
                                <div className="text-center py-8">
                                  <Monitor className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                  <p className="text-gray-500">No session history available</p>
                                  <p className="text-sm text-gray-400 mt-1">Sessions will appear when your child starts studying</p>
                                </div>
                              ) : (
                                child.sessions.recentSessions.map((session, idx) => {
                                  const DeviceIcon = getDeviceIcon(session.device_info)
                                  return (
                                    <motion.div
                                      key={session.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="flex items-start justify-between p-3 rounded-xl transition-all hover:shadow-md"
                                      style={{ background: brandColors.grayLight }}
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <DeviceIcon className="h-4 w-4" style={{ color: brandColors.primary }} />
                                          <p className="text-sm font-medium text-gray-900">
                                            {formatDate(session.login_time)}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
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
                                          <p className="text-xs text-gray-400 mt-1">
                                            {session.device_info}
                                          </p>
                                        )}
                                      </div>
                                      <Badge 
                                        className="ml-2"
                                        style={{ background: brandColors.primaryBg, color: brandColors.primaryDark }}
                                      >
                                        {session.duration_minutes ? formatDuration(session.duration_minutes) : "Active"}
                                      </Badge>
                                    </motion.div>
                                  )
                                })
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>

                      {/* Learning Insights Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Card className="border-none shadow-lg overflow-hidden" style={{ background: `linear-gradient(135deg, ${brandColors.white}, ${brandColors.primaryBg})` }}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Brain className="h-5 w-5" style={{ color: brandColors.primary }} />
                              Learning Insights
                            </CardTitle>
                            <CardDescription>AI-powered analysis of learning patterns</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Streak Insight */}
                            {child.stats.streak >= 3 && (
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100">
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                  <Flame className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Consistent Learning Habit</p>
                                  <p className="text-sm text-gray-600">
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
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <Award className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Strong Academic Performance</p>
                                  <p className="text-sm text-gray-600">
                                    With an average score of {child.stats.averageScore}%, your child is demonstrating 
                                    excellent understanding of the material. They're in the top tier of their class!
                                  </p>
                                </div>
                              </div>
                            ) : child.stats.averageScore <= 60 ? (
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100">
                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                  <Target className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Room for Improvement</p>
                                  <p className="text-sm text-gray-600">
                                    Your child's average score is {child.stats.averageScore}%. Consider reviewing 
                                    challenging topics together or requesting additional help from tutors.
                                  </p>
                                </div>
                              </div>
                            ) : null}

                            {/* Task Completion Insight */}
                            {child.stats.completionRate >= 80 ? (
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Great Task Completion</p>
                                  <p className="text-sm text-gray-600">
                                    Your child has completed {child.stats.completionRate}% of their assigned tasks. 
                                    This shows excellent responsibility and time management!
                                  </p>
                                </div>
                              </div>
                            ) : child.stats.completionRate <= 50 ? (
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100">
                                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Pending Tasks Need Attention</p>
                                  <p className="text-sm text-gray-600">
                                    Your child has {child.stats.tasksPending} pending tasks. Consider setting up 
                                    a regular study schedule to help them catch up.
                                  </p>
                                </div>
                              </div>
                            ) : null}

                            {/* Study Time Insight */}
                            {child.sessions.weeklyStudyTime >= 300 ? (
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <Clock className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Dedicated Study Time</p>
                                  <p className="text-sm text-gray-600">
                                    Your child has studied for {formatDuration(child.sessions.weeklyStudyTime)} this week. 
                                    This dedication is commendable and will surely lead to success!
                                  </p>
                                </div>
                              </div>
                            ) : child.sessions.weeklyStudyTime <= 120 ? (
                              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Clock className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 mb-1">Limited Study Time</p>
                                  <p className="text-sm text-gray-600">
                                    Your child has studied for {formatDuration(child.sessions.weeklyStudyTime)} this week. 
                                    Try to encourage more consistent daily study sessions.
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  )
}