// app/dashboard/student/status/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
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
  Zap,
  Smartphone,
  Laptop,
  Tablet,
  ChevronRight,
  BarChart,
  LineChart,
  PieChart,
  Flame,
  Star,
  Medal,
  Trophy,
  Sparkles,
  Rocket,
  GraduationCap,
  Users,
  Globe,
  Download,
  Filter,
  Search,
  Eye,
  EyeOff,
  History,
  Settings,
  HelpCircle,
  Info
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"
import { formatDistanceToNow, format, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns"

interface StudentStats {
  completedTasks: number
  totalTasks: number
  avgScore: number
  streak: number
  points: number
  rank?: number
  level?: number
  nextLevelPoints?: number
}

interface StudySession {
  id: string
  student_id: string
  login_time: string
  logout_time?: string
  duration_minutes?: number
  device_info?: string
  ip_address?: string
  location?: string
}

interface RecentActivity {
  id: string
  title: string
  description?: string
  subject: string
  grade_level: number
  status: string
  score?: number
  completed_at?: string
  created_at: string
  time_spent?: number
  difficulty?: string
}

interface SubjectProgress {
  subject: string
  completed: number
  total: number
  averageScore: number
}

interface DailyActivity {
  date: string
  count: number
  minutes: number
}

export default function StudentStatusPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const [stats, setStats] = useState<StudentStats>({
    completedTasks: 0,
    totalTasks: 0,
    avgScore: 0,
    streak: 0,
    points: 0,
    level: 1,
    rank: 0
  })
  
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([])
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([])
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [activeTab, setActiveTab] = useState('overview')

  // Get the student ID using the same pattern as tasks page
  const getStudentId = useCallback(() => {
    if ((user as any)?.studentId) return (user as any).studentId
    if ((user as any)?.userId) return (user as any).userId
    if (user?.id) return user.id
    
    // Development fallback
    return 'student_1767718447749'
  }, [user])

  const STUDENT_ID = getStudentId()

 // app/dashboard/student/status/page.tsx
// ... (keep all your existing imports and UI code)

const fetchStudentStatus = useCallback(async (showToast = true) => {
  try {
    setLoading(true)
    setError(null)
    
    console.log("🎯 [STUDENT STATUS] Fetching for student:", STUDENT_ID)
    
    // Use the direct API endpoint we just created
    const response = await fetch(`/api/student-direct/${STUDENT_ID}/status`)
    
    console.log("📊 [STUDENT STATUS] Response status:", response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log("✅ [STUDENT STATUS] API Response:", data)
      
      if (data.success) {
        setStats(data.stats || {
          completedTasks: 0,
          totalTasks: 0,
          avgScore: 0,
          streak: 0,
          points: 0,
          level: 1,
          nextLevelPoints: 1000
        })
        
        setSessions(data.sessions || [])
        setRecentActivity(data.recentActivity || [])
        setSubjectProgress(data.subjectProgress || [])
        setDailyActivity(data.dailyActivity || [])
        setUsingMockData(false)
        
        if (showToast && data.stats?.totalTasks > 0) {
          toast.success(`Loaded your learning status`)
        } else if (showToast) {
          toast.info("No learning data found yet. Start studying to track your progress!")
        }
      } else {
        throw new Error(data.error || 'Failed to fetch status data')
      }
    } else {
      const errorText = await response.text()
      console.error("❌ [STUDENT STATUS] HTTP error:", response.status, errorText)
      
      // If 404, student not found in database
      if (response.status === 404) {
        setError("Student record not found. Please contact your tutor.")
        setUsingMockData(true)
        loadMockData()
      } else {
        throw new Error(`Server error: ${response.status}`)
      }
    }
  } catch (error) {
    console.error('❌ [STUDENT STATUS] Fetch error:', error)
    setError(error instanceof Error ? error.message : 'Failed to load status data')
    setUsingMockData(true)
    loadMockData()
    
    if (showToast) {
      toast.error("Failed to load real data. Using demo data.")
    }
  } finally {
    setLoading(false)
    setRefreshing(false)
  }
}, [STUDENT_ID])

// Helper function to load mock data
const loadMockData = () => {
  const mockData = {
    stats: {
      completedTasks: 24,
      totalTasks: 30,
      avgScore: 87,
      streak: 12,
      points: 2450,
      level: 5,
      nextLevelPoints: 3000,
      rank: 156,
      inProgressTasks: 3,
      pendingTasks: 3,
      totalTimeSpent: 1240
    },
    sessions: [
      {
        id: "session_1",
        login_time: new Date(Date.now() - 3600000).toISOString(),
        logout_time: new Date(Date.now() - 3300000).toISOString(),
        duration_minutes: 45,
        device_info: "Chrome on Windows 11",
        location: "Home"
      }
    ],
    recentActivity: [
      {
        id: "task_001",
        title: "Algebra: Linear Equations",
        subject: "math_g8",
        grade_level: 8,
        status: "completed",
        score: 92,
        difficulty: "intermediate",
        time_spent: 38,
        completed_at: new Date(Date.now() - 43200000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    subjectProgress: [
      { subject: "Mathematics", completed: 8, total: 10, averageScore: 89 },
      { subject: "English", completed: 6, total: 8, averageScore: 84 },
      { subject: "Science", completed: 5, total: 6, averageScore: 92 }
    ],
    dailyActivity: Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5) + 1,
        minutes: Math.floor(Math.random() * 120) + 30
      }
    }).reverse()
  }
  
  setStats(mockData.stats)
  setSessions(mockData.sessions)
  setRecentActivity(mockData.recentActivity)
  setSubjectProgress(mockData.subjectProgress)
  setDailyActivity(mockData.dailyActivity)
}

  useEffect(() => {
    fetchStudentStatus(false)
  }, [fetchStudentStatus])

  const getEnhancedMockData = () => {
    // Generate last 7 days of activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5) + 1,
        minutes: Math.floor(Math.random() * 120) + 30
      }
    }).reverse()

    return {
      stats: {
        completedTasks: 24,
        totalTasks: 30,
        avgScore: 87,
        streak: 12,
        points: 2450,
        level: 5,
        nextLevelPoints: 3000,
        rank: 156
      },
      sessions: [
        {
          id: "session_1",
          student_id: STUDENT_ID,
          login_time: new Date(Date.now() - 3600000).toISOString(),
          logout_time: new Date(Date.now() - 3300000).toISOString(),
          duration_minutes: 45,
          device_info: "Chrome on Windows 11",
          ip_address: "192.168.1.1",
          location: "Home, Addis Ababa"
        },
        {
          id: "session_2",
          student_id: STUDENT_ID,
          login_time: new Date(Date.now() - 86400000).toISOString(),
          logout_time: new Date(Date.now() - 86100000).toISOString(),
          duration_minutes: 35,
          device_info: "Safari on iPad",
          ip_address: "192.168.1.2",
          location: "School Library"
        },
        {
          id: "session_3",
          student_id: STUDENT_ID,
          login_time: new Date(Date.now() - 172800000).toISOString(),
          logout_time: new Date(Date.now() - 172500000).toISOString(),
          duration_minutes: 60,
          device_info: "Firefox on MacBook",
          ip_address: "192.168.1.3",
          location: "Home"
        },
        {
          id: "session_4",
          student_id: STUDENT_ID,
          login_time: new Date(Date.now() - 259200000).toISOString(),
          logout_time: new Date(Date.now() - 258000000).toISOString(),
          duration_minutes: 25,
          device_info: "Chrome on Android",
          ip_address: "192.168.1.4",
          location: "Cafe"
        }
      ],
      recentActivity: [
        {
          id: "task_001",
          title: "Algebra: Linear Equations",
          description: "Solve linear equations with one variable",
          subject: "math_g8",
          grade_level: 8,
          status: "completed",
          score: 92,
          difficulty: "intermediate",
          time_spent: 38,
          completed_at: new Date(Date.now() - 43200000).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "task_002",
          title: "Reading Comprehension: The Solar System",
          description: "Read the passage and answer questions",
          subject: "english_g8",
          grade_level: 8,
          status: "completed",
          score: 88,
          difficulty: "beginner",
          time_spent: 25,
          completed_at: new Date(Date.now() - 129600000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: "task_003",
          title: "Circulatory System Quiz",
          description: "Test your knowledge of the human circulatory system",
          subject: "science_g8",
          grade_level: 8,
          status: "completed",
          score: 95,
          difficulty: "advanced",
          time_spent: 42,
          completed_at: new Date(Date.now() - 259200000).toISOString(),
          created_at: new Date(Date.now() - 345600000).toISOString()
        },
        {
          id: "task_004",
          title: "Ancient Egypt Research",
          description: "Research and write about ancient Egyptian civilization",
          subject: "history_g8",
          grade_level: 8,
          status: "in_progress",
          time_spent: 35,
          created_at: new Date(Date.now() - 432000000).toISOString()
        }
      ],
      subjectProgress: [
        { subject: "Mathematics", completed: 8, total: 10, averageScore: 89 },
        { subject: "English", completed: 6, total: 8, averageScore: 84 },
        { subject: "Science", completed: 5, total: 6, averageScore: 92 },
        { subject: "History", completed: 3, total: 4, averageScore: 78 },
        { subject: "Amharic", completed: 2, total: 2, averageScore: 95 }
      ],
      dailyActivity: last7Days
    }
  }

  const refreshData = () => {
    toast.info("Refreshing your status...")
    setRefreshing(true)
    fetchStudentStatus()
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

  const getCompletionRate = () => {
    return stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
  }

  const getTotalStudyTime = () => {
    return sessions.reduce((total, session) => total + (session.duration_minutes || 0), 0)
  }

  const getAvgSessionTime = () => {
    const completedSessions = sessions.filter(s => s.duration_minutes && s.duration_minutes > 0)
    if (completedSessions.length === 0) return 0
    return Math.round(
      completedSessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) / 
      completedSessions.length
    )
  }

  const getWeeklyStudyTime = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    return sessions
      .filter(s => new Date(s.login_time) >= weekAgo)
      .reduce((total, session) => total + (session.duration_minutes || 0), 0)
  }

  const getCourseLabel = (subject: string): string => {
    const courseMap: Record<string, string> = {
      'math': 'Mathematics',
      'english': 'English',
      'amharic': 'Amharic',
      'science': 'Science',
      'general_science': 'General Science',
      'social_science': 'Social Science',
      'citizenship': 'Citizenship',
      'pva': 'PVA',
      'hpe': 'HPE',
      'it': 'IT',
      'history': 'History',
      'geography': 'Geography',
      'biology': 'Biology',
      'physics': 'Physics',
      'chemistry': 'Chemistry'
    }

    const baseSubject = subject.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
    return courseMap[baseSubject] || subject.replace('_', ' ').toUpperCase()
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDeviceIcon = (deviceInfo: string = "") => {
    const info = deviceInfo.toLowerCase()
    if (info.includes('iphone') || info.includes('android')) return Smartphone
    if (info.includes('ipad') || info.includes('tablet')) return Tablet
    if (info.includes('mac') || info.includes('windows') || info.includes('linux')) return Laptop
    return Monitor
  }

  const getPerformanceMessage = () => {
    if (stats.avgScore >= 90) return { text: "Outstanding Performance!", icon: Trophy, color: "text-yellow-600" }
    if (stats.avgScore >= 80) return { text: "Excellent Work!", icon: Medal, color: "text-blue-600" }
    if (stats.avgScore >= 70) return { text: "Good Progress!", icon: Star, color: "text-green-600" }
    if (stats.avgScore >= 60) return { text: "Keep Improving!", icon: Target, color: "text-orange-600" }
    return { text: "More Practice Needed", icon: AlertTriangle, color: "text-red-600" }
  }

  const getStreakMessage = () => {
    if (stats.streak >= 14) return { text: "🔥 Amazing Streak!", icon: Flame, color: "text-orange-600" }
    if (stats.streak >= 7) return { text: "Great Consistency!", icon: Zap, color: "text-yellow-600" }
    if (stats.streak >= 3) return { text: "Good Start!", icon: Sparkles, color: "text-blue-600" }
    return { text: "Start Your Streak", icon: Target, color: "text-muted-foreground" }
  }

  const getLevelProgress = () => {
    if (!stats.nextLevelPoints) return 0
    return Math.round((stats.points / stats.nextLevelPoints) * 100)
  }

  const performance = getPerformanceMessage()
  const streak = getStreakMessage()
  const PerformanceIcon = performance.icon
  const StreakIcon = streak.icon

  if (loading && stats.totalTasks === 0) {
    return (
      <DashboardLayout role="student" studentName={user?.firstName}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading your learning status...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Student ID: {STUDENT_ID}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }



  return (
    <DashboardLayout role="student" studentName={user?.firstName}>
     

      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Learning Status</h1>
            <p className="text-muted-foreground">
              Track your progress, performance, and study habits
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Student ID: {STUDENT_ID}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
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

        {/* Level Progress Bar */}
        {stats.level && (
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="font-medium">Level {stats.level} Learner</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{stats.points} points</span>
                  {stats.nextLevelPoints && (
                    <>
                      <span>→</span>
                      <span className="text-primary">{stats.nextLevelPoints} points</span>
                    </>
                  )}
                </div>
              </div>
              <Progress value={getLevelProgress()} className="h-2" />
              {stats.rank && (
                <p className="text-xs text-muted-foreground mt-2">
                  Rank #{stats.rank} among students in your grade
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardHeader className="pb-2">
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{getCompletionRate()}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={getCompletionRate()} className="h-2 bg-blue-100" />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.completedTasks} of {stats.totalTasks} tasks
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardHeader className="pb-2">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.avgScore}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-1 text-sm ${performance.color}`}>
                <PerformanceIcon className="h-4 w-4" />
                <span>{performance.text}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <CardHeader className="pb-2">
              <CardDescription>Learning Streak</CardDescription>
              <CardTitle className="text-3xl text-orange-600">{stats.streak} days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center gap-1 text-sm ${streak.color}`}>
                <StreakIcon className="h-4 w-4" />
                <span>{streak.text}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10">
            <CardHeader className="pb-2">
              <CardDescription>Study Time ({timeRange})</CardDescription>
              <CardTitle className="text-3xl text-purple-600">
                {formatDuration(timeRange === 'week' ? getWeeklyStudyTime() : getTotalStudyTime())}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{sessions.length} sessions</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Daily Activity (Last 7 Days)
                </CardTitle>
                <CardDescription>Tasks completed and study time per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {dailyActivity.map((day) => (
                    <div key={day.date} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        {format(new Date(day.date), 'EEE')}
                      </div>
                      <div className="space-y-1">
                        <div className="h-20 flex flex-col justify-end">
                          <div 
                            className="w-full bg-primary/20 rounded-t"
                            style={{ height: `${(day.count / 5) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs font-medium">{day.count} tasks</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(day.minutes)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest completed and in-progress tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        {activity.difficulty && (
                          <Badge variant="outline" className={getDifficultyColor(activity.difficulty)}>
                            {activity.difficulty}
                          </Badge>
                        )}
                        {activity.score !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.score}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{getCourseLabel(activity.subject)}</span>
                        <span>•</span>
                        <span className="capitalize">{activity.status.replace('_', ' ')}</span>
                        {activity.time_spent && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(activity.time_spent)}</span>
                          </>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.completed_at || activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No activity yet</p>
                    <p className="text-sm mt-1">Complete tasks to see your activity here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Study Sessions
                </CardTitle>
                <CardDescription>Your login and logout activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessions.slice(0, 5).map((session) => {
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
                            {session.location && ` • ${session.location}`}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {session.duration_minutes ? formatDuration(session.duration_minutes) : "Active"}
                      </Badge>
                    </div>
                  )
                })}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No session history yet</p>
                    <p className="text-sm mt-1">Start studying to see your session data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUBJECTS TAB */}
          <TabsContent value="subjects" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {subjectProgress.map((subject) => {
                const completionRate = Math.round((subject.completed / subject.total) * 100)
                return (
                  <Card key={subject.subject}>
                    <CardHeader>
                      <CardTitle className="text-lg">{subject.subject}</CardTitle>
                      <CardDescription>
                        {subject.completed} of {subject.total} tasks completed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{completionRate}%</span>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Average Score</p>
                          <p className="text-2xl font-bold text-secondary">{subject.averageScore}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={subject.completed === subject.total ? "secondary" : "outline"}>
                            {subject.completed === subject.total ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value="activity" className="space-y-6">
            {/* All Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Activity History</CardTitle>
                <CardDescription>All your tasks and sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Tasks</h3>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">{activity.title}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-6">
                            <span>{getCourseLabel(activity.subject)}</span>
                            <span>•</span>
                            <span>Grade {activity.grade_level}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.created_at)}
                          </p>
                          {activity.score && (
                            <Badge variant="secondary" className="mt-1">
                              {activity.score}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Study Sessions</h3>
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {formatDate(session.login_time)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-6">
                            <span>{formatTime(session.login_time)}</span>
                            {session.logout_time && (
                              <>
                                <span>→</span>
                                <span>{formatTime(session.logout_time)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {session.duration_minutes ? formatDuration(session.duration_minutes) : "Active"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
            <div className="font-bold mb-1">Student Status Debug:</div>
            <div className="space-y-1">
              <div>Student ID: {STUDENT_ID}</div>
              <div>Tasks: {stats.completedTasks}/{stats.totalTasks}</div>
              <div>Avg Score: {stats.avgScore}%</div>
              <div>Streak: {stats.streak} days</div>
              <div>From DB: {usingMockData ? 'No (demo)' : 'Yes'}</div>
              <div className="pt-1 border-t border-white/20">
                <button 
                  onClick={() => {
                    console.log("Student Stats:", stats)
                    console.log("Sessions:", sessions)
                    console.log("Activities:", recentActivity)
                    console.log("Subject Progress:", subjectProgress)
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