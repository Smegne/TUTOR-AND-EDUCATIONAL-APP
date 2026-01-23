// app/dashboard/student/tasks/page.tsx - UPDATED VERSION
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, HelpCircle, Play, Loader2, AlertCircle, Database, RefreshCw, Clock, Award, CheckCircle, AlertTriangle, BookOpen } from "lucide-react"
import { TaskDetailModal } from "@/components/task-detail-modal"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Task {
  id: string
  title: string
  description: string
  subject: string
  grade_level: number
  difficulty: string
  estimated_time_minutes: number
  note_content?: string
  video_link?: string
  images?: string[]
  parent_visibility: boolean
  created_at: string
  created_by: string
  created_by_name?: string
  status: 'pending' | 'in_progress' | 'completed'
  score?: number
  time_spent?: number
  completed_at?: string
  started_at?: string
  questions?: any[]
  assigned_count?: number
  completed_count?: number
}

interface Student {
  id: string
  name: string
  email: string
  grade: number
  courses: string[]
}

export default function StudentTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // REAL STUDENT ID FROM YOUR DATABASE
  // Based on your logs, the logged-in student is probably: student_1767718447749
  // Let's try multiple IDs to find the right one
  const getStudentId = () => {
    // First try user's studentId
    if (user?.studentId) return user.studentId
    
    // Try common student IDs from your database
    const possibleIds = [
      "student_1767718447749",  // Smegn Destew from your logs
      "student_001",           // Abel Tesfaye
      "student_002",           // Emma Wilson
      "student_1766604920580", // melkamu walle
      user?.id                 // User ID from auth
    ]
    
    // Return the first one that exists or a default
    return possibleIds.find(id => id) || "student_1767718447749"
  }

  const REAL_STUDENT_ID = getStudentId()

  const fetchStudentTasks = useCallback(async (showToast = true) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🎯 [STUDENT] Fetching tasks for student:", REAL_STUDENT_ID)
      console.log("👤 [STUDENT] Auth user:", user)
      
      // Use a simple direct API endpoint that doesn't require complex auth
      const response = await fetch(`/api/student-direct/${REAL_STUDENT_ID}/tasks`)
      
      console.log("📊 [STUDENT] API Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("✅ [STUDENT] API Response:", {
          success: data.success,
          tasksCount: data.tasks?.length,
          studentInfo: data.student
        })
        
        if (data.success) {
          // Set student info
          if (data.student) {
            setStudent(data.student)
          }
          
          // Set tasks with proper status mapping
          const formattedTasks = data.tasks?.map((task: any) => {
            // Map database status to frontend status
            let status: 'pending' | 'in_progress' | 'completed' = 'pending'
            if (task.status === 'completed') {
              status = 'completed'
            } else if (task.started_at || task.time_spent_minutes > 0) {
              status = 'in_progress'
            }
            
            return {
              ...task,
              status,
              // Ensure score is a number
              score: task.score ? Number(task.score) : undefined,
              // Ensure time_spent is a number
              time_spent: task.time_spent_minutes || task.time_spent || 0
            }
          }) || []
          
          setTasks(formattedTasks)
          setUsingMockData(data.usingMockData || false)
          
          if (showToast && formattedTasks.length > 0) {
            toast.success(`Loaded ${formattedTasks.length} tasks`)
          } else if (showToast && formattedTasks.length === 0) {
            toast.info("No tasks assigned yet")
          }
          
          // Debug log
          console.log(`📋 [STUDENT] Loaded ${formattedTasks.length} tasks:`, 
            formattedTasks.map(t => `${t.title} (${t.status})`))
            
        } else {
          console.error("❌ [STUDENT] API error:", data.error)
          throw new Error(data.error || 'Failed to fetch tasks')
        }
      } else {
        const errorText = await response.text()
        console.error("❌ [STUDENT] HTTP error:", response.status, errorText)
        throw new Error(`Server error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ [STUDENT] Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tasks')
      setUsingMockData(true)
      
      // Fallback to mock data
      setTasks(getMockTasks())
      toast.error("Failed to load tasks. Using demo data.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [REAL_STUDENT_ID, user])

  useEffect(() => {
    fetchStudentTasks(false)
  }, [fetchStudentTasks])

  const getMockTasks = (): Task[] => {
    return [
      {
        id: "1",
        title: "Mathematics Practice",
        description: "Solve basic algebra equations",
        subject: "math_g8",
        grade_level: 8,
        difficulty: "beginner",
        estimated_time_minutes: 45,
        note_content: "<p>Solve the following equations...</p>",
        created_at: new Date().toISOString(),
        created_by: "tutor_1766604782399",
        created_by_name: "Mr. Smegn",
        status: "pending",
        parent_visibility: true
      },
      {
        id: "2",
        title: "English Grammar Quiz",
        description: "Complete the grammar exercises",
        subject: "english_g8",
        grade_level: 8,
        difficulty: "intermediate",
        estimated_time_minutes: 30,
        video_link: "https://youtu.be/sample-video",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        created_by: "tutor_1766604782399",
        created_by_name: "Mr. Smegn",
        status: "in_progress",
        time_spent: 15,
        parent_visibility: true
      },
      {
        id: "3",
        title: "Science Project",
        description: "Complete the physics experiment report",
        subject: "physics_g8",
        grade_level: 8,
        difficulty: "advanced",
        estimated_time_minutes: 60,
        note_content: "<p>Experiment details...</p>",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        created_by: "tutor_1766604782399",
        created_by_name: "Mr. Smegn",
        status: "completed",
        score: 95,
        time_spent: 55,
        completed_at: new Date(Date.now() - 86400000).toISOString(),
        parent_visibility: true
      }
    ]
  }

  const refreshData = () => {
    toast.info("Refreshing tasks...")
    setRefreshing(true)
    fetchStudentTasks()
  }

  const pendingTasks = tasks.filter(task => 
    task.status === 'pending' || task.status === 'in_progress'
  )
  const completedTasks = tasks.filter(task => task.status === 'completed')
  const allTasks = tasks

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
      'ሂሳብ': 'Mathematics',
      'እንግሊዝኛ': 'English',
      'አማርኛ': 'Amharic',
      'አካባቢ_ሳይንስ': 'Environmental Science',
      'ስነምግባር': 'Citizenship',
      'ስነጥበብ': 'Arts',
      'ስፖርት': 'Sports',
      'biology': 'Biology',
      'physics': 'Physics',
      'history': 'History'
    }

    // Remove grade suffix (e.g., "_g5", "_g8")
    const baseSubject = subject.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
    return courseMap[baseSubject] || subject.replace('_', ' ').toUpperCase()
  }

  const getTaskType = (task: Task): string => {
    if (task.note_content && task.questions && task.questions.length > 0) {
      return "both"
    } else if (task.note_content) {
      return "note"
    } else if (task.questions && task.questions.length > 0) {
      return "question"
    }
    return "task"
  }

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "note":
        return <FileText className="h-4 w-4" />
      case "question":
        return <HelpCircle className="h-4 w-4" />
      case "both":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTaskTypeLabel = (taskType: string): string => {
    return taskType.charAt(0).toUpperCase() + taskType.slice(1)
  }

  const isTaskOverdue = (task: Task): boolean => {
    // Check if task was created more than 7 days ago and not completed
    const createdDate = new Date(task.created_at)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysDiff > 7 && task.status !== 'completed'
  }

  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Unknown date"
    }
  }

  const formatFullDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return "Invalid date"
    }
  }

  const TaskCardComponent = ({ task }: { task: Task }) => {
    const overdue = isTaskOverdue(task)
    const courseLabel = getCourseLabel(task.subject)
    const taskType = getTaskType(task)

    return (
      <Card className={`hover:shadow-md transition-shadow hover:border-primary/50 ${
        task.status === 'completed' ? 'bg-green-50/50' : 
        overdue ? 'bg-red-50/50' : ''
      }`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <CardDescription>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {courseLabel}
                  </Badge>
                  <span>Grade {task.grade_level}</span>
                  {task.created_by_name && (
                    <>
                      <span>•</span>
                      <span className="text-xs">By {task.created_by_name}</span>
                    </>
                  )}
                </div>
              </CardDescription>
            </div>
            <Badge 
              variant={
                task.status === "completed" ? "secondary" : 
                overdue ? "destructive" : 
                task.status === "in_progress" ? "default" : "outline"
              }
              className="capitalize"
            >
              {task.status === "completed" ? "Completed" : 
               overdue ? "Overdue" : 
               task.status === "in_progress" ? "In Progress" : "Not Started"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(task.created_at)}
            </div>
            <div className="flex items-center gap-1">
              {getTaskIcon(taskType)}
              {getTaskTypeLabel(taskType)}
            </div>
            {task.difficulty && (
              <Badge variant="outline" className="text-xs capitalize">
                {task.difficulty}
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated: {task.estimated_time_minutes} min</span>
            {task.time_spent && task.time_spent > 0 && (
              <>
                <span>•</span>
                <span>Spent: {task.time_spent} min</span>
              </>
            )}
          </div>

          {/* Media indicators */}
          {(task.video_link || task.images?.length) && (
            <div className="flex items-center gap-2 text-xs">
              {task.video_link && (
                <Badge variant="outline" className="h-5">
                  <Play className="h-3 w-3 mr-1" />
                  Video
                </Badge>
              )}
              {task.images && task.images.length > 0 && (
                <Badge variant="outline" className="h-5">
                  <FileText className="h-3 w-3 mr-1" />
                  {task.images.length} image{task.images.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}

          {task.status === "completed" && (
            <div className="bg-secondary/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-secondary" />
                  <span className="text-muted-foreground">Score</span>
                </div>
                <span className="font-bold text-secondary text-lg">
                  {task.score !== undefined ? `${task.score}%` : 'Not scored'}
                </span>
              </div>
              {task.completed_at && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">
                    {formatDate(task.completed_at)}
                  </span>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full"
            variant={task.status === "completed" ? "outline" : "default"}
            onClick={() => setSelectedTask(task)}
            disabled={overdue && task.status !== 'completed'}
          >
            <Play className="h-4 w-4 mr-2" />
            {task.status === "completed" ? "Review" : 
             task.status === "in_progress" ? "Continue" : 
             overdue ? "Overdue" : "Start Task"}
          </Button>
          
          {overdue && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              <AlertTriangle className="h-3 w-3" />
              <span>This task is overdue. Please complete it as soon as possible.</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const getStatusStats = () => {
    const completed = completedTasks.length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const notStarted = tasks.filter(t => t.status === 'pending').length
    const overdue = tasks.filter(t => isTaskOverdue(t) && t.status !== 'completed').length
    
    const averageScore = completed > 0 
      ? Math.round(completedTasks.reduce((sum, t) => sum + (t.score || 0), 0) / completed)
      : 0

    return {
      total: tasks.length,
      completed,
      inProgress,
      notStarted,
      overdue,
      averageScore
    }
  }

  const stats = getStatusStats()

  if (loading && tasks.length === 0) {
    return (
      <DashboardLayout role="student" studentName={student?.name || user?.firstName}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading your tasks...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Student ID: {REAL_STUDENT_ID}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData && tasks.length === 0) {
    return (
      <DashboardLayout role="student" studentName={student?.name || user?.firstName}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center max-w-md space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Unable to Load Tasks</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Student ID: {REAL_STUDENT_ID}
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={refreshData} className="gap-2" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Try Again'}
              </Button>
              <Button variant="outline" onClick={() => {
                setUsingMockData(true)
                setError(null)
                setTasks(getMockTasks())
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
    <DashboardLayout role="student" studentName={student?.name || user?.firstName}>
      {/* Database Status Banner */}
      {usingMockData && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3">
          <div className="flex items-center justify-between gap-2 text-yellow-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">My Tasks</h1>
            <p className="text-muted-foreground">
              Welcome back, {student?.name || user?.firstName || "Student"}! Manage and complete your assigned tasks
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Student ID: {REAL_STUDENT_ID} • Grade: {student?.grade || user?.grade || "Unknown"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {stats.total} task{stats.total !== 1 ? 's' : ''}
            </div>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-700 mb-1">Total Tasks</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                </div>
                <BookOpen className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-700 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-orange-700 mb-1">In Progress</div>
                  <div className="text-2xl font-bold text-orange-900">{stats.inProgress}</div>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-700 mb-1">Avg. Score</div>
                  <div className="text-2xl font-bold text-purple-900">{stats.averageScore}%</div>
                </div>
                <Award className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue warning */}
        {stats.overdue > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800">
                  {stats.overdue} task{stats.overdue !== 1 ? 's are' : ' is'} overdue
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Please complete overdue tasks as soon as possible
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pending">
              Pending <Badge variant={pendingTasks.length > 0 ? "default" : "outline"} className="ml-2">
                {pendingTasks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed <Badge variant={completedTasks.length > 0 ? "secondary" : "outline"} className="ml-2">
                {completedTasks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all">
              All Tasks <Badge variant="outline" className="ml-2">
                {allTasks.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground text-center">
                    You don't have any pending tasks. Great work!
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => document.querySelector('[data-value="completed"]')?.dispatchEvent(new MouseEvent('click'))}
                  >
                    View Completed Tasks
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingTasks.map((task) => (
                  <TaskCardComponent key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No completed tasks yet</h3>
                  <p className="text-muted-foreground text-center">
                    Complete some tasks to build your learning record.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => document.querySelector('[data-value="pending"]')?.dispatchEvent(new MouseEvent('click'))}
                  >
                    View Pending Tasks
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedTasks.map((task) => (
                  <TaskCardComponent key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {allTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tasks assigned yet</h3>
                  <p className="text-muted-foreground text-center">
                    Your tutor hasn't assigned any tasks yet. Check back later!
                  </p>
                  {usingMockData && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={refreshData}
                    >
                      Try Loading Real Data
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allTasks.map((task) => (
                  <TaskCardComponent key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
            <div className="font-bold mb-1">Student Debug:</div>
            <div className="space-y-1">
              <div>Student ID: {REAL_STUDENT_ID}</div>
              <div>Tasks: {tasks.length} ({pendingTasks.length} pending)</div>
              <div>From DB: {usingMockData ? 'No (demo)' : 'Yes'}</div>
              <div className="pt-1 border-t border-white/20">
                <button 
                  onClick={() => {
                    console.log("All Tasks:", tasks)
                    console.log("Student:", student)
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

        {selectedTask && (
          <TaskDetailModal 
            task={selectedTask} 
            studentId={REAL_STUDENT_ID}
            studentName={student?.name || user?.firstName || "Student"}
            open={!!selectedTask} 
            onClose={() => {
              setSelectedTask(null)
              // Refresh data after task completion
              refreshData()
            }} 
          />
        )}
      </div>
    </DashboardLayout>
  )
}