// app/dashboard/tutor/tasks/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, Filter, Plus, MoreVertical, Eye, Edit, Trash2, CheckCircle, 
  Clock, AlertCircle, Loader2, Users, BookOpen, RefreshCw, FileText,
  Video, Image, Eye as EyeIcon, EyeOff, Download, Upload, FilterX,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, BarChart3
} from "lucide-react"
import { CreateTaskModal } from "@/components/create-task-modal"
import { TaskViewModal } from "@/components/task-view-modal"
import { useAuth } from "@/lib/providers/auth-provider"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  description: string
  subject: string
  grade_level: number
  difficulty: string
  estimated_time_minutes: number
  note_content: string
  video_link: string | null
  images: string[]
  parent_visibility: boolean
  created_at: string
  created_by: string
  created_by_name: string
  assigned_count: number
  completed_count: number
  questions: any[]
  status?: string
  priority?: string
}

interface Student {
  id: string
  name: string
  grade: number
  courses: string[]
  parentId: string | null
}

interface Tutor {
  id: string
  name: string
  email: string
  courses: string[]
  isActive: boolean
}

interface TutorTasksResponse {
  success: boolean
  usingMockData: boolean
  tutor: Tutor
  tasks: Task[]
  students: Student[]
  stats: {
    totalTasks: number
    totalAssigned: number
    totalCompleted: number
    totalStudents: number
  }
}

export default function TutorTasksPage() {
  const { user } = useAuth()
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalAssigned: 0,
    totalCompleted: 0,
    totalStudents: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [usingMockData, setUsingMockData] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [refreshing, setRefreshing] = useState(false)
  
  // THE REAL TUTOR ID FROM YOUR DATABASE
  const REAL_TUTOR_ID = "tutor_1766604782399"

  // Function to save tasks to localStorage
  const saveTasksToLocalStorage = useCallback((tasksToSave: Task[]) => {
    try {
      localStorage.setItem('tutor_tasks_cache', JSON.stringify({
        tasks: tasksToSave,
        timestamp: Date.now(),
        tutorId: REAL_TUTOR_ID
      }))
    } catch (err) {
      console.warn('Could not save to localStorage:', err)
    }
  }, [])

  // Function to load tasks from localStorage
  const loadTasksFromLocalStorage = useCallback(() => {
    try {
      const cached = localStorage.getItem('tutor_tasks_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        // Only use cache if it's less than 5 minutes old and same tutor
        if (Date.now() - parsed.timestamp < 300000 && parsed.tutorId === REAL_TUTOR_ID) {
          return parsed.tasks
        }
      }
    } catch (err) {
      console.warn('Could not load from localStorage:', err)
    }
    return null
  }, [])

  const fetchTasksData = useCallback(async (showToast = true) => {
    try {
      if (!refreshing) {
        setRefreshing(true)
      }
      if (!loading) {
        setLoading(true)
      }
      setError(null)
      
      console.log("🔄 [API CALL] Fetching tasks for tutor:", REAL_TUTOR_ID)
      
      // Try to get data from localStorage first for instant load
      const cachedTasks = loadTasksFromLocalStorage()
      if (cachedTasks && cachedTasks.length > 0) {
        console.log("📦 Loaded", cachedTasks.length, "tasks from cache")
        setTasks(cachedTasks)
        setUsingMockData(false)
      }
      
      // Use the SIMPLE API endpoint without auth issues
      const response = await fetch(`/api/tutor-direct/${REAL_TUTOR_ID}/tasks`)
      
      console.log("📊 [API RESPONSE] Status:", response.status)
      
      if (response.ok) {
        const data: TutorTasksResponse = await response.json()
        console.log("✅ [API SUCCESS] Tasks found:", data.tasks?.length || 0)
        console.log("[DEBUG] First few tasks:", data.tasks?.slice(0, 3))
        
        if (data.success) {
          // Save tutor data
          if (data.tutor) {
            setTutor(data.tutor)
          }
          
          // Save tasks - IMPORTANT: Filter to only show tasks created by this tutor
          const tutorsOwnTasks = data.tasks?.filter(task => 
            task.created_by === REAL_TUTOR_ID || 
            !task.created_by || // Include tasks with no creator specified
            task.created_by === "tutor_1766604782399" // Also match the exact string
          ) || []
          
          console.log(`📋 After filtering: ${tutorsOwnTasks.length} tasks belong to tutor ${REAL_TUTOR_ID}`)
          
          setTasks(tutorsOwnTasks)
          saveTasksToLocalStorage(tutorsOwnTasks)
          
          // Save students
          setStudents(data.students || [])
          
          // Calculate real stats based on filtered tasks
          const totalAssigned = tutorsOwnTasks.reduce((sum, task) => sum + (task.assigned_count || 0), 0)
          const totalCompleted = tutorsOwnTasks.reduce((sum, task) => sum + (task.completed_count || 0), 0)
          
          setStats({
            totalTasks: tutorsOwnTasks.length,
            totalAssigned,
            totalCompleted,
            totalStudents: data.students?.length || 0
          })
          
          setUsingMockData(data.usingMockData || false)
          
          if (showToast && data.tasks?.length > 0) {
            toast.success(`Loaded ${tutorsOwnTasks.length} tasks`)
          }
          
          // Debug: Show all task IDs and titles
          if (tutorsOwnTasks.length > 0) {
            console.log("📋 TASK LIST FOR TUTOR", REAL_TUTOR_ID + ":")
            tutorsOwnTasks.forEach((task, i) => {
              console.log(`${i+1}. ID: ${task.id}, Title: "${task.title}", Created by: ${task.created_by}`)
            })
          }
        } else {
          console.error("❌ [API ERROR]", data.error)
          throw new Error(data.error || 'Failed to fetch tasks')
        }
      } else {
        const errorText = await response.text()
        console.error("❌ [API HTTP ERROR]", response.status, errorText)
        throw new Error(`Server error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ [FETCH ERROR]', error)
      setError(error instanceof Error ? error.message : 'Failed to load tasks')
      setUsingMockData(true)
      
      // Show error toast
      toast.error("Failed to load tasks from server")
      
      // Try to use cache if available
      const cachedTasks = loadTasksFromLocalStorage()
      if (cachedTasks && cachedTasks.length > 0) {
        console.log("Using cached tasks due to error")
        setTasks(cachedTasks)
        toast.info("Showing cached data")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [saveTasksToLocalStorage, loadTasksFromLocalStorage])

  // Initial load and auto-refresh
  useEffect(() => {
    fetchTasksData(false)
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      if (!loading && !refreshing && document.visibilityState === 'visible') {
        console.log("🔄 Auto-refreshing tasks...")
        fetchTasksData(false)
      }
    }, 120000) // 2 minutes
    
    return () => clearInterval(interval)
  }, [fetchTasksData, loading, refreshing])

  const handleTaskCreated = useCallback((newTaskData: any) => {
    console.log("🎉 [TASK CREATED] New task:", newTaskData)
    
    // Add the new task to the beginning of the list
    const newTask: Task = {
      id: newTaskData.id?.toString() || `task_${Date.now()}`,
      title: newTaskData.title || "New Task",
      description: newTaskData.description || "",
      subject: newTaskData.subject || "general",
      grade_level: newTaskData.grade_level || 5,
      difficulty: newTaskData.difficulty || "beginner",
      estimated_time_minutes: newTaskData.estimated_time_minutes || 30,
      note_content: newTaskData.note_content || "",
      video_link: newTaskData.video_link || null,
      images: newTaskData.images || [],
      parent_visibility: newTaskData.parent_visibility || false,
      created_at: new Date().toISOString(),
      created_by: REAL_TUTOR_ID,
      created_by_name: tutor?.name || "You",
      assigned_count: 0,
      completed_count: 0,
      questions: [],
      status: "active",
      priority: "medium"
    }
    
    // Update state immediately
    setTasks(prev => [newTask, ...prev])
    setStats(prev => ({
      ...prev,
      totalTasks: prev.totalTasks + 1
    }))
    
    // Save to localStorage
    const updatedTasks = [newTask, ...tasks]
    saveTasksToLocalStorage(updatedTasks)
    
    // Show success message
    toast.success("Task created successfully!")
    
    // Refresh from server after 2 seconds to get accurate counts
    setTimeout(() => {
      fetchTasksData(false)
    }, 2000)
  }, [tutor, tasks, saveTasksToLocalStorage, fetchTasksData])

  const handleViewTask = (task: Task) => {
    console.log("[VIEW TASK]", task.title)
    setSelectedTask(task)
  }

  const handleCloseTask = () => {
    setSelectedTask(null)
  }

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (window.confirm(`Are you sure you want to delete task "${taskTitle}"? This action cannot be undone.`)) {
      try {
        toast.loading("Deleting task...")
        
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        toast.dismiss()
        
        if (response.ok) {
          console.log("✅ Task deleted successfully")
          
          // Remove from local state immediately
          setTasks(prev => prev.filter(task => task.id !== taskId))
          setStats(prev => ({
            ...prev,
            totalTasks: prev.totalTasks - 1
          }))
          
          // Save updated list to localStorage
          saveTasksToLocalStorage(tasks.filter(task => task.id !== taskId))
          
          toast.success("Task deleted successfully")
          
          // Refresh from server after 1 second
          setTimeout(() => {
            fetchTasksData(false)
          }, 1000)
        } else {
          const errorData = await response.json()
          toast.error(`Failed to delete: ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error deleting task:', error)
        toast.error("Network error. Please try again.")
      }
    }
  }

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.grade_level?.toString().includes(searchQuery)
    
    // Status filter based on completion
    const isCompleted = task.completed_count >= task.assigned_count && task.assigned_count > 0
    const isActive = task.assigned_count > 0 && !isCompleted
    const isPending = task.assigned_count === 0
    
    let taskStatus = "pending"
    if (isCompleted) taskStatus = "completed"
    else if (isActive) taskStatus = "active"
    
    const matchesStatus = statusFilter === "all" || taskStatus === statusFilter
    
    // Difficulty filter
    const matchesDifficulty = difficultyFilter === "all" || task.difficulty === difficultyFilter
    
    return matchesSearch && matchesStatus && matchesDifficulty
  }).sort((a, b) => {
    // Sort tasks
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case "mostAssigned":
        return b.assigned_count - a.assigned_count
      case "mostCompleted":
        return b.completed_count - a.completed_count
      case "highestGrade":
        return b.grade_level - a.grade_level
      case "longestDuration":
        return b.estimated_time_minutes - a.estimated_time_minutes
      case "titleAZ":
        return a.title.localeCompare(b.title)
      case "titleZA":
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

  // Calculate task completion percentage
  const getCompletionPercentage = (task: Task) => {
    if (task.assigned_count === 0) return 0
    return Math.round((task.completed_count / task.assigned_count) * 100)
  }

  // Get task status
  const getTaskStatus = (task: Task) => {
    if (task.completed_count >= task.assigned_count && task.assigned_count > 0) {
      return "completed"
    } else if (task.assigned_count > 0) {
      return "active"
    } else {
      return "pending"
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Unknown date"
    }
  }

  // Format full date
  const formatFullDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return "Invalid date"
    }
  }

  // Get status badge
  const getStatusBadge = (task: Task) => {
    const status = getTaskStatus(task)
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">Completed</Badge>
      case "active":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">Active</Badge>
      case "pending":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get difficulty badge
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">Beginner</Badge>
      case "intermediate":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">Intermediate</Badge>
      case "advanced":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">Advanced</Badge>
      default:
        return <Badge variant="outline">{difficulty}</Badge>
    }
  }

  // Format subject name
  const formatSubjectName = (subject: string) => {
    if (!subject) return "General"
    return subject
      .replace('_', ' ')
      .replace('g5', 'Grade 5')
      .replace('g6', 'Grade 6')
      .replace('g7', 'Grade 7')
      .replace('g8', 'Grade 8')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const refreshData = () => {
    toast.info("Refreshing tasks...")
    fetchTasksData()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDifficultyFilter("all")
    setSortBy("newest")
    setCurrentPage(1)
    toast.info("Filters cleared")
  }

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `tasks_${REAL_TUTOR_ID}_${format(new Date(), 'yyyy-MM-dd')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success("Tasks exported successfully")
  }

  if (loading && tasks.length === 0) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your tasks...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData && tasks.length === 0) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Tasks</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => {
                const cached = loadTasksFromLocalStorage()
                if (cached) {
                  setTasks(cached)
                  setUsingMockData(true)
                  toast.info("Using cached data")
                }
              }}>
                Use Cached Data
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="tutor">
      <div className="p-6 space-y-6">
        {/* Database Status Banner */}
        {usingMockData && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3">
            <div className="flex items-center justify-between gap-2 text-yellow-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Using cached data</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={refreshData}
                className="h-7 text-yellow-700 border-yellow-300"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry Connection
              </Button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">
              Welcome back, {tutor?.name || user?.firstName || "Tutor"}! Manage all your learning tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <Button 
              variant="outline"
              size="sm"
              onClick={exportTasks}
              className="gap-2"
              disabled={tasks.length === 0}
            >
              <Download className="h-3 w-3" />
              Export
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 gap-2" 
              onClick={() => setIsCreateTaskModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create New Task
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Tasks</CardDescription>
              <CardTitle className="text-3xl">{stats.totalTasks}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Your created tasks</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Assigned Students</CardDescription>
              <CardTitle className="text-3xl">{stats.totalAssigned}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Total assignments</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl">{stats.totalCompleted}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Finished work</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-3xl">
                {stats.totalAssigned > 0 
                  ? Math.round((stats.totalCompleted / stats.totalAssigned) * 100)
                  : 0}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>Overall progress</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tasks by title, description, or subject..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1) }}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={(value) => { setDifficultyFilter(value); setCurrentPage(1) }}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulty</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="titleAZ">Title A-Z</SelectItem>
                    <SelectItem value="titleZA">Title Z-A</SelectItem>
                    <SelectItem value="mostAssigned">Most Assigned</SelectItem>
                    <SelectItem value="mostCompleted">Most Completed</SelectItem>
                    <SelectItem value="highestGrade">Highest Grade</SelectItem>
                    <SelectItem value="longestDuration">Longest Duration</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={clearFilters}
                  title="Clear all filters"
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Tasks</CardTitle>
                <CardDescription>
                  Showing {filteredTasks.length} of {tasks.length} tasks
                  {filteredTasks.length !== tasks.length && " (filtered)"}
                  {tutor && ` for ${tutor.name}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Tutor ID: {REAL_TUTOR_ID}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No tasks found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || statusFilter !== "all" || difficultyFilter !== "all" 
                    ? "Try changing your filters or search query" 
                    : "Create your first task to get started!"}
                </p>
                {!searchQuery && statusFilter === "all" && difficultyFilter === "all" && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsCreateTaskModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Task
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-md border mb-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Task Details</TableHead>
                        <TableHead>Subject & Grade</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTasks.map((task) => {
                        const completionPercentage = getCompletionPercentage(task)
                        const hasVideo = !!task.video_link
                        const hasNotes = !!task.note_content && task.note_content.length > 10
                        const hasImages = task.images && task.images.length > 0
                        
                        return (
                          <TableRow key={task.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div>
                                <p className="font-semibold hover:text-primary cursor-pointer" onClick={() => handleViewTask(task)}>
                                  {task.title}
                                </p>
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {task.description || "No description"}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{task.estimated_time_minutes} mins</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {hasVideo && (
                                      <Badge variant="outline" className="h-5 px-1">
                                        <Video className="h-3 w-3" />
                                      </Badge>
                                    )}
                                    {hasNotes && (
                                      <Badge variant="outline" className="h-5 px-1">
                                        <FileText className="h-3 w-3" />
                                      </Badge>
                                    )}
                                    {hasImages && (
                                      <Badge variant="outline" className="h-5 px-1">
                                        <Image className="h-3 w-3" />
                                      </Badge>
                                    )}
                                    {task.parent_visibility ? (
                                      <Badge variant="outline" className="h-5 px-1 bg-green-50">
                                        <EyeIcon className="h-3 w-3" />
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="h-5 px-1">
                                        <EyeOff className="h-3 w-3" />
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <Badge variant="secondary" className="mb-1">
                                  {formatSubjectName(task.subject)}
                                </Badge>
                                <p className="text-sm font-medium">
                                  Grade {task.grade_level}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{task.assigned_count}</span>
                                  <span className="text-sm text-muted-foreground">students</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span>Completion</span>
                                    <span className="font-medium">{completionPercentage}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-300 ${
                                        completionPercentage >= 80 ? 'bg-green-500' : 
                                        completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${completionPercentage}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {task.completed_count} of {task.assigned_count} completed
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(task)}</TableCell>
                            <TableCell>{getDifficultyBadge(task.difficulty)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{formatDate(task.created_at)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFullDate(task.created_at)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewTask(task)}
                                  title="View task details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Edit task"
                                  onClick={() => {
                                    toast.info("Edit functionality coming soon!")
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete task"
                                  onClick={() => handleDeleteTask(task.id, task.title)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length} tasks
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={itemsPerPage.toString()} 
                        onValueChange={(value) => {
                          setItemsPerPage(parseInt(value))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Items per page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 per page</SelectItem>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="20">20 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="px-4 text-sm">
                          Page {currentPage} of {totalPages}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Statistics - Only show if we have tasks */}
        {tasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Task Analytics</CardTitle>
              <CardDescription>Overview of your task performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Tasks by Difficulty</p>
                  <div className="space-y-2">
                    {['beginner', 'intermediate', 'advanced'].map(difficulty => {
                      const count = tasks.filter(t => t.difficulty === difficulty).length
                      const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0
                      return (
                        <div key={difficulty} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{difficulty}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{count}</span>
                            <span className="text-xs text-muted-foreground">({percentage}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium">Tasks by Grade Level</p>
                  <div className="space-y-2">
                    {Array.from(new Set(tasks.map(t => t.grade_level)))
                      .sort((a, b) => a - b)
                      .map(grade => {
                        const count = tasks.filter(t => t.grade_level === grade).length
                        const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0
                        return (
                          <div key={grade} className="flex items-center justify-between">
                            <span className="text-sm">Grade {grade}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{count}</span>
                              <span className="text-xs text-muted-foreground">({percentage}%)</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium">Completion Status</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fully Completed</span>
                      <span className="text-sm font-medium">
                        {tasks.filter(task => getCompletionPercentage(task) === 100).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In Progress</span>
                      <span className="text-sm font-medium">
                        {tasks.filter(task => getCompletionPercentage(task) > 0 && getCompletionPercentage(task) < 100).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Not Started</span>
                      <span className="text-sm font-medium">
                        {tasks.filter(task => getCompletionPercentage(task) === 0).length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium">Media Content</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">With Video</span>
                      <span className="text-sm font-medium">
                        {tasks.filter(t => t.video_link).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">With Notes</span>
                      <span className="text-sm font-medium">
                        {tasks.filter(t => t.note_content && t.note_content.length > 10).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Parent Visible</span>
                      <span className="text-sm font-medium">
                        {tasks.filter(t => t.parent_visibility).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        open={isCreateTaskModalOpen}
        onOpenChange={setIsCreateTaskModalOpen}
        onTaskCreated={handleTaskCreated}
        tutorId={REAL_TUTOR_ID}
        tutorCourses={tutor?.courses || []}
      />

      {selectedTask && (
        <TaskViewModal 
          task={selectedTask} 
          students={students} 
          open={!!selectedTask} 
          onClose={handleCloseTask} 
        />
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
          <div className="font-bold mb-1">Debug Info:</div>
          <div className="space-y-1">
            <div>Total Tasks: {tasks.length}</div>
            <div>Filtered: {filteredTasks.length}</div>
            <div>Tutor ID: {REAL_TUTOR_ID}</div>
            <div>From DB: {usingMockData ? 'No (cached)' : 'Yes'}</div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div className="pt-1 border-t border-white/20">
              <button 
                onClick={() => {
                  console.log("All Tasks:", tasks)
                  console.log("Tutor:", tutor)
                  console.log("Stats:", stats)
                }}
                className="text-blue-300 hover:text-blue-200 underline"
              >
                Log to Console
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}