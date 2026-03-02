// app/dashboard/tutor/status/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Monitor, 
  Clock, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Database, 
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  GraduationCap,
  Target,
  Sparkles,
  BarChart,
  PieChart,
  Activity,
  Eye,
  EyeOff,
  Download,
  Printer,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  Medal,
  Trophy,
  Zap,
  Brain,
  Heart,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"

interface TutorStats {
  totalStudents: number
  totalTasks: number
  tasksCompleted: number
  overallCompletion: number
  averageScore: number
  totalCourses: number
}

interface Student {
  id: string
  name: string
  email?: string
  grade: number
  avatar?: string
  courses: string[]
  totalTasks: number
  completedTasks: number
  averageScore: number
  completionRate: number
  lastActive?: string
  isOnline: boolean
  streak: number
  points: number
  level: number
  performance: 'excellent' | 'good' | 'average' | 'needs_improvement'
}

interface TopPerformer {
  id: string
  name: string
  email?: string
  grade: number
  averageScore: number
  completionRate: number
  totalTasks: number
  completedTasks: number
  streak: number
}

interface CourseStats {
  id: string
  name: string
  code: string
  grade: number
  totalStudents: number
  totalTasks: number
  completionRate: number
  averageScore: number
}

interface StudentActivity {
  id: string
  name: string
  email?: string
  grade: number
  sessions: number
  totalTime: number
  avgSessionTime: number
  lastLogin: string
  deviceInfo?: string
  isOnline: boolean
  courses: string[]
  tasksCompleted: number
  tasksPending: number
  averageScore: number
}

interface StudentDetail {
  id: string
  name: string
  email: string
  grade: number
  courses: {
    id: string
    name: string
    code: string
    progress: number
    averageScore: number
    tasksCompleted: number
    tasksTotal: number
  }[]
  tasks: {
    id: string
    title: string
    subject: string
    status: string
    score?: number
    dueDate?: string
    completedAt?: string
    timeSpent?: number
  }[]
  activity: {
    date: string
    sessions: number
    timeSpent: number
    tasksCompleted: number
  }[]
  stats: {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    averageScore: number
    streak: number
    points: number
    level: number
    studyTime: number
    sessionsCount: number
  }
}

export default function TutorStatusPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Main data states
  const [stats, setStats] = useState<TutorStats>({
    totalStudents: 0,
    totalTasks: 0,
    tasksCompleted: 0,
    overallCompletion: 0,
    averageScore: 0,
    totalCourses: 0
  })
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [studentActivity, setStudentActivity] = useState<StudentActivity[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [performanceFilter, setPerformanceFilter] = useState<string>('all')
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'grade' | 'score' | 'activity'>('score')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get tutor ID
  const getTutorId = useCallback(() => {
    if ((user as any)?.tutorId) return (user as any).tutorId
    if ((user as any)?.userId) return (user as any).userId
    if (user?.id) return user.id
    return 'tutor_001'
  }, [user])

  const TUTOR_ID = getTutorId()

  const fetchTutorStatus = useCallback(async (showToast = true) => {
    try {
      setLoading(true)
      setError(null)
      setRefreshing(true)
      
      console.log("🎯 [TUTOR STATUS] Fetching for tutor:", TUTOR_ID)
      
      const response = await fetch(`/api/tutor-direct/${TUTOR_ID}/status`)
      
      console.log("📊 [TUTOR STATUS] Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("✅ [TUTOR STATUS] API Response:", data)
        
        if (data.success) {
          setStats(data.stats)
          setTopPerformers(data.topPerformers || [])
          setCourseStats(data.courseStats || [])
          setStudentActivity(data.studentActivity || [])
          
          // Transform students from activity data
          const transformedStudents = (data.studentActivity || []).map((activity: StudentActivity) => ({
            id: activity.id,
            name: activity.name,
            email: activity.email,
            grade: activity.grade,
            courses: activity.courses || [],
            totalTasks: activity.tasksCompleted + activity.tasksPending,
            completedTasks: activity.tasksCompleted,
            averageScore: activity.averageScore,
            completionRate: activity.tasksCompleted + activity.tasksPending > 0 
              ? Math.round((activity.tasksCompleted / (activity.tasksCompleted + activity.tasksPending)) * 100)
              : 0,
            lastActive: activity.lastLogin,
            isOnline: activity.isOnline,
            streak: Math.floor(Math.random() * 10) + 1, // This should come from API
            points: Math.floor(Math.random() * 2000) + 500, // This should come from API
            level: Math.floor(Math.random() * 5) + 1, // This should come from API
            performance: getPerformanceLevel(activity.averageScore)
          }))
          
          setStudents(transformedStudents)
          setUsingMockData(false)
          
          if (showToast) {
            toast.success(`Loaded status for ${transformedStudents.length} students`)
          }
        } else {
          throw new Error(data.error || 'Failed to fetch status data')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ [TUTOR STATUS] Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load status data')
      setUsingMockData(true)
      
      // Load mock data
      const mockData = getMockData()
      setStats(mockData.stats)
      setStudents(mockData.students)
      setTopPerformers(mockData.topPerformers)
      setCourseStats(mockData.courseStats)
      setStudentActivity(mockData.studentActivity)
      
      if (showToast) {
        toast.error("Failed to load real data. Using demo data.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [TUTOR_ID])

  useEffect(() => {
    fetchTutorStatus(false)
  }, [fetchTutorStatus])

  // Apply filters whenever filter criteria change
  useEffect(() => {
    let filtered = [...students]
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query)
      )
    }
    
    // Grade filter
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(student => student.grade === parseInt(selectedGrade))
    }
    
    // Performance filter
    if (performanceFilter !== 'all') {
      filtered = filtered.filter(student => student.performance === performanceFilter)
    }
    
    // Activity filter
    if (activityFilter !== 'all') {
      const now = new Date()
      switch(activityFilter) {
        case 'online':
          filtered = filtered.filter(s => s.isOnline)
          break
        case 'today':
          filtered = filtered.filter(s => s.lastActive && 
            new Date(s.lastActive).toDateString() === now.toDateString())
          break
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7))
          filtered = filtered.filter(s => s.lastActive && new Date(s.lastActive) >= weekAgo)
          break
        case 'inactive':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
          filtered = filtered.filter(s => !s.lastActive || new Date(s.lastActive) < monthAgo)
          break
      }
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'grade':
          return a.grade - b.grade
        case 'score':
          return b.averageScore - a.averageScore
        case 'activity':
          return (b.lastActive ? new Date(b.lastActive).getTime() : 0) - 
                 (a.lastActive ? new Date(a.lastActive).getTime() : 0)
        default:
          return b.averageScore - a.averageScore
      }
    })
    
    setFilteredStudents(filtered)
  }, [students, searchQuery, selectedGrade, performanceFilter, activityFilter, sortBy])

  const getMockData = () => {
    const mockStudents: Student[] = [
      {
        id: "student_001",
        name: "Abel Tesfaye",
        email: "abel@example.com",
        grade: 8,
        courses: ["Mathematics", "English", "Science"],
        totalTasks: 25,
        completedTasks: 23,
        averageScore: 94,
        completionRate: 92,
        lastActive: new Date().toISOString(),
        isOnline: true,
        streak: 12,
        points: 2450,
        level: 5,
        performance: 'excellent'
      },
      {
        id: "student_002",
        name: "Emma Wilson",
        email: "emma@example.com",
        grade: 8,
        courses: ["Mathematics", "English"],
        totalTasks: 20,
        completedTasks: 18,
        averageScore: 88,
        completionRate: 90,
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        isOnline: true,
        streak: 8,
        points: 1850,
        level: 4,
        performance: 'good'
      },
      {
        id: "student_003",
        name: "Daniel Johnson",
        email: "daniel@example.com",
        grade: 7,
        courses: ["Mathematics", "Science"],
        totalTasks: 22,
        completedTasks: 16,
        averageScore: 76,
        completionRate: 73,
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        isOnline: false,
        streak: 3,
        points: 950,
        level: 2,
        performance: 'average'
      },
      {
        id: "student_004",
        name: "Sarah Williams",
        email: "sarah@example.com",
        grade: 7,
        courses: ["English", "History"],
        totalTasks: 18,
        completedTasks: 10,
        averageScore: 65,
        completionRate: 56,
        lastActive: new Date(Date.now() - 172800000).toISOString(),
        isOnline: false,
        streak: 1,
        points: 450,
        level: 1,
        performance: 'needs_improvement'
      },
      {
        id: "student_005",
        name: "Michael Brown",
        email: "michael@example.com",
        grade: 8,
        courses: ["Mathematics", "Physics"],
        totalTasks: 24,
        completedTasks: 22,
        averageScore: 91,
        completionRate: 92,
        lastActive: new Date(Date.now() - 1800000).toISOString(),
        isOnline: true,
        streak: 10,
        points: 2150,
        level: 5,
        performance: 'excellent'
      }
    ]

    return {
      stats: {
        totalStudents: mockStudents.length,
        totalTasks: mockStudents.reduce((sum, s) => sum + s.totalTasks, 0),
        tasksCompleted: mockStudents.reduce((sum, s) => sum + s.completedTasks, 0),
        overallCompletion: 78,
        averageScore: 83,
        totalCourses: 6
      },
      students: mockStudents,
      topPerformers: mockStudents
        .filter(s => s.averageScore >= 85)
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 3),
      courseStats: [
        { id: "math_g8", name: "Mathematics", code: "MATH-G8", grade: 8, totalStudents: 8, totalTasks: 24, completionRate: 85, averageScore: 88 },
        { id: "english_g8", name: "English", code: "ENG-G8", grade: 8, totalStudents: 6, totalTasks: 18, completionRate: 78, averageScore: 82 },
        { id: "science_g8", name: "Science", code: "SCI-G8", grade: 8, totalStudents: 5, totalTasks: 15, completionRate: 92, averageScore: 90 }
      ],
      studentActivity: mockStudents.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        grade: s.grade,
        sessions: Math.floor(Math.random() * 20) + 5,
        totalTime: Math.floor(Math.random() * 600) + 200,
        avgSessionTime: 45,
        lastLogin: s.lastActive || new Date().toISOString(),
        deviceInfo: "Chrome on Windows",
        isOnline: s.isOnline,
        courses: s.courses,
        tasksCompleted: s.completedTasks,
        tasksPending: s.totalTasks - s.completedTasks,
        averageScore: s.averageScore
      }))
    }
  }

  const fetchStudentDetail = async (studentId: string) => {
    try {
      setLoadingStudentDetail(true)
      console.log(`Fetching details for student: ${studentId}`)
      
      // This would be a real API call
      // const response = await fetch(`/api/tutor-direct/${TUTOR_ID}/students/${studentId}`)
      
      // Mock data for now
      setTimeout(() => {
        const mockDetail: StudentDetail = {
          id: studentId,
          name: students.find(s => s.id === studentId)?.name || "Student Name",
          email: students.find(s => s.id === studentId)?.email || "student@example.com",
          grade: students.find(s => s.id === studentId)?.grade || 8,
          courses: [
            { id: "math_g8", name: "Mathematics", code: "MATH-G8", progress: 92, averageScore: 94, tasksCompleted: 12, tasksTotal: 13 },
            { id: "english_g8", name: "English", code: "ENG-G8", progress: 85, averageScore: 88, tasksCompleted: 11, tasksTotal: 13 },
            { id: "science_g8", name: "Science", code: "SCI-G8", progress: 78, averageScore: 82, tasksCompleted: 7, tasksTotal: 9 }
          ],
          tasks: [
            { id: "task_001", title: "Algebra Equations", subject: "Mathematics", status: "completed", score: 96, completedAt: new Date().toISOString(), timeSpent: 45 },
            { id: "task_002", title: "Essay Writing", subject: "English", status: "completed", score: 88, completedAt: new Date(Date.now() - 86400000).toISOString(), timeSpent: 60 },
            { id: "task_003", title: "Physics Lab Report", subject: "Science", status: "in_progress", dueDate: new Date(Date.now() + 86400000).toISOString(), timeSpent: 30 }
          ],
          activity: [
            { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], sessions: 2, timeSpent: 90, tasksCompleted: 2 },
            { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], sessions: 1, timeSpent: 45, tasksCompleted: 1 },
            { date: new Date(Date.now() - 259200000).toISOString().split('T')[0], sessions: 3, timeSpent: 135, tasksCompleted: 2 }
          ],
          stats: {
            totalTasks: 35,
            completedTasks: 30,
            pendingTasks: 5,
            averageScore: 91,
            streak: 12,
            points: 2450,
            level: 5,
            studyTime: 1240,
            sessionsCount: 28
          }
        }
        setSelectedStudent(mockDetail)
        setLoadingStudentDetail(false)
      }, 1000)
      
    } catch (error) {
      console.error('Error fetching student details:', error)
      toast.error("Failed to load student details")
      setLoadingStudentDetail(false)
    }
  }

  const getPerformanceLevel = (score: number): 'excellent' | 'good' | 'average' | 'needs_improvement' => {
    if (score >= 90) return 'excellent'
    if (score >= 80) return 'good'
    if (score >= 70) return 'average'
    return 'needs_improvement'
  }

  const getPerformanceColor = (level: string) => {
    switch(level) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'average': return 'text-yellow-600 bg-yellow-100'
      case 'needs_improvement': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPerformanceIcon = (level: string) => {
    switch(level) {
      case 'excellent': return Trophy
      case 'good': return ThumbsUp
      case 'average': return Meh
      case 'needs_improvement': return ThumbsDown
      default: return User
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const getUniqueGrades = () => {
    const grades = new Set(students.map(s => s.grade))
    return Array.from(grades).sort((a, b) => a - b)
  }

  const refreshData = () => {
    toast.info("Refreshing status data...")
    fetchTutorStatus()
  }

  if (loading && students.length === 0) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading your teaching status...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tutor ID: {TUTOR_ID}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData && students.length === 0) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center max-w-md space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Unable to Load Status</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tutor ID: {TUTOR_ID}
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={refreshData} className="gap-2" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Try Again'}
              </Button>
              <Button variant="outline" onClick={() => {
                const mockData = getMockData()
                setStats(mockData.stats)
                setStudents(mockData.students)
                setTopPerformers(mockData.topPerformers)
                setCourseStats(mockData.courseStats)
                setStudentActivity(mockData.studentActivity)
                setUsingMockData(true)
                setError(null)
                toast.info("Using demo data")
              }}>
                Use Demo Data
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="tutor">
      {/* Database Status Banner */}
      {usingMockData && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3">
          <div className="flex items-center justify-between gap-2 text-yellow-700">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Using demo data</span>
              <span className="text-xs">(Real data unavailable)</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={refreshData}
              className="h-7 text-yellow-700 border-yellow-300"
              disabled={refreshing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Teaching Status</h1>
            <p className="text-muted-foreground">
              Monitor student progress, activity, and performance
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tutor ID: {TUTOR_ID} • {students.length} students
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('grid')}
              >
                <BarChart className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('list')}
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-3 w-3" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>

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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Students</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tasks</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalTasks}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.tasksCompleted}</p>
                </div>
                <Award className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completion</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.overallCompletion}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Score</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.averageScore}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Courses</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalCourses}</p>
                </div>
                <BookOpen className="h-8 w-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="text-sm font-medium mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="w-full pl-9 pr-4 py-2 border rounded-md text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Grade</label>
                  <select 
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="all">All Grades</option>
                    {getUniqueGrades().map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Performance</label>
                  <select 
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={performanceFilter}
                    onChange={(e) => setPerformanceFilter(e.target.value)}
                  >
                    <option value="all">All Levels</option>
                    <option value="excellent">Excellent (90%+)</option>
                    <option value="good">Good (80-89%)</option>
                    <option value="average">Average (70-79%)</option>
                    <option value="needs_improvement">Needs Improvement (&lt;70%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Activity</label>
                  <select 
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                  >
                    <option value="all">All Students</option>
                    <option value="online">Online Now</option>
                    <option value="today">Active Today</option>
                    <option value="week">Active This Week</option>
                    <option value="inactive">Inactive (30d+)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Sort By</label>
                  <select 
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="score">Highest Score</option>
                    <option value="name">Name</option>
                    <option value="grade">Grade</option>
                    <option value="activity">Recent Activity</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => {
                  setSearchQuery('')
                  setSelectedGrade('all')
                  setPerformanceFilter('all')
                  setActivityFilter('all')
                  setSortBy('score')
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Split View */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Student List - Left Column */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Students</CardTitle>
                  <Badge variant="outline">{filteredStudents.length}</Badge>
                </div>
                <CardDescription>Click a student to view details</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto space-y-2">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No students match filters</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const PerformanceIcon = getPerformanceIcon(student.performance)
                    const isSelected = selectedStudent?.id === student.id
                    
                    return (
                      <div
                        key={student.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-primary/10 border border-primary' 
                            : 'hover:bg-muted/50 border border-transparent'
                        }`}
                        onClick={() => fetchStudentDetail(student.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`relative flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold`}>
                            {student.name.charAt(0)}
                            {student.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{student.name}</p>
                              <Badge variant="outline" className="ml-2 text-xs">
                                G{student.grade}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>{student.courses.length} courses</span>
                              <span>•</span>
                              <span>{student.completedTasks}/{student.totalTasks} tasks</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <PerformanceIcon className={`h-3 w-3 ${getPerformanceColor(student.performance).split(' ')[0]}`} />
                                <span className="text-xs font-medium">{student.averageScore}%</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(student.lastActive)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Top Performers Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPerformers.map((student, index) => (
                  <div key={student.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">Grade {student.grade}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {student.averageScore}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Student Details - Right Column */}
          <div className="lg:col-span-2">
            {loadingStudentDetail ? (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
              </Card>
            ) : selectedStudent ? (
              <div className="space-y-6">
                {/* Student Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white">
                          {selectedStudent.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="secondary">Grade {selectedStudent.grade}</Badge>
                            <span className="text-sm text-muted-foreground">{selectedStudent.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{selectedStudent.stats.streak}</div>
                        <div className="text-xs text-muted-foreground">Day Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedStudent.stats.level}</div>
                        <div className="text-xs text-muted-foreground">Level</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{selectedStudent.stats.points}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{formatDuration(selectedStudent.stats.studyTime)}</div>
                        <div className="text-xs text-muted-foreground">Study Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Courses Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Course Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedStudent.courses.map((course) => (
                      <div key={course.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{course.name}</p>
                            <p className="text-xs text-muted-foreground">{course.code}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              {course.averageScore}% avg
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {course.tasksCompleted}/{course.tasksTotal} tasks
                            </p>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedStudent.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{task.subject}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                        {task.score && (
                          <Badge variant="secondary" className="text-lg">
                            {task.score}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Weekly Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                      {selectedStudent.activity.map((day) => (
                        <div key={day.date} className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="h-20 flex flex-col justify-end">
                            <div 
                              className="w-full bg-primary/20 rounded-t"
                              style={{ height: `${(day.timeSpent / 180) * 100}%` }}
                            />
                          </div>
                          <div className="text-xs mt-1">{formatDuration(day.timeSpent)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Student Selected</h3>
                  <p className="text-muted-foreground text-center">
                    Click on a student from the list to view their detailed status and progress.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Course Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Course Overview</CardTitle>
            <CardDescription>Performance metrics by course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courseStats.map((course) => (
                <div key={course.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{course.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {course.code}
                        </Badge>
                        <span>Grade {course.grade}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">{course.completionRate}%</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-xl font-bold text-primary">{course.totalStudents}</div>
                      <div className="text-xs text-muted-foreground">Students</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">{course.averageScore}%</div>
                      <div className="text-xs text-muted-foreground">Avg Score</div>
                    </div>
                  </div>
                  
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${course.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}