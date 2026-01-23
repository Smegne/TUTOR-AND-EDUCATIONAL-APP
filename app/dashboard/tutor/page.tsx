"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, TrendingUp, Plus, CheckCircle2, Clock, AlertCircle, Loader2, Database, RefreshCw } from "lucide-react"
import { CreateTaskModal } from "@/components/create-task-modal"
import { TaskViewModal } from "@/components/task-view-modal"
import { useAuth } from "@/lib/providers/auth-provider"

interface Task {
  id: string
  topic: string
  description: string
  course: string
  grade: number
  difficulty: string
  duration: number
  createdAt: string
  assignedCount: number
  completedCount: number
}

interface Student {
  id: string
  name: string
  email: string
  grade: number
  courses: string[]
  completionRate: number
  avgScore: number
  completedTasks: number
  totalTasks: number
}

interface TutorStats {
  totalStudents: number
  activeTasks: number
  completionRate: number
  avgScore: number
}

export default function TutorDashboard() {
  const { user } = useAuth()
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tutor, setTutor] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<TutorStats>({
    totalStudents: 0,
    activeTasks: 0,
    completionRate: 0,
    avgScore: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  useEffect(() => {
    fetchTutorDashboardData()
  }, [])

 const fetchTutorDashboardData = async () => {
  try {
    setLoading(true)
    setError(null)
    
    // Use the authenticated tutor ID or fallback to default
    const tutorId = user?.tutorId || "tutor_001"
    console.log("🔄 Fetching dashboard for tutor ID:", tutorId)
    console.log("👤 Current user:", user)
    
    // Fetch from the new tutor dashboard API
    const response = await fetch(`/api/tutor/${tutorId}/dashboard`)
    
    console.log("📊 API Response status:", response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log("✅ API Response data:", data)
      
      if (data.success) {
        setTutor(data.tutor)
        setTasks(data.tasks || [])
        setStudents(data.students || [])
        setStats(data.stats)
        setUsingMockData(false)
        
        console.log(`✅ Loaded: ${data.tasks?.length || 0} tasks, ${data.students?.length || 0} students`)
      } else {
        console.error("❌ API returned error:", data.error)
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }
    } else {
      console.error("❌ API error status:", response.status)
      throw new Error(`API error: ${response.status}`)
    }
  } catch (error) {
    console.error('❌ Error fetching tutor dashboard data:', error)
    setError(error instanceof Error ? error.message : 'Failed to load data')
    setUsingMockData(true)
    
    console.log("🔄 Falling back to mock data...")
    // Fallback to mock data
    const { getTutorTasks, getTutorStudents, getTutorStats, getTutorById } = await import('@/lib/data/mock-database')
    const mockTutor = getTutorById(user?.tutorId || "tutor_001")
    const mockTasks = getTutorTasks(user?.tutorId || "tutor_001")
    const mockStudents = getTutorStudents(user?.tutorId || "tutor_001")
    const mockStats = getTutorStats(user?.tutorId || "tutor_001")
    
    setTutor(mockTutor)
    setTasks(mockTasks)
    setStudents(mockStudents)
    setStats(mockStats)
  } finally {
    setLoading(false)
  }
}

  const fetchTutorStudents = async (tutorId: string) => {
    try {
      const response = await fetch(`/api/tutors/${tutorId}/students`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStudents(data.students)
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleTaskCreated = () => {
    console.log("[API] Task created, refreshing tutor dashboard...")
    const tutorId = user?.tutorId || "tutor_001"
    fetchTutorDashboardData()
    fetchTutorStudents(tutorId)
  }

  const handleViewTask = (task: Task) => {
    console.log("[API] Viewing task:", task.topic)
    setSelectedTask(task)
  }

  const handleCloseTask = () => {
    setSelectedTask(null)
  }

  // Calculate task statistics
  const getTaskStats = (task: Task) => {
    return {
      completed: task.completedCount || 0,
      total: task.assignedCount || 0,
      percentage: task.assignedCount > 0 
        ? Math.round((task.completedCount / task.assignedCount) * 100) 
        : 0
    }
  }

  // Get top performing students
  const getTopPerformers = (): Student[] => {
    if (!students || students.length === 0) return []
    
    return students
      .filter(s => s.totalTasks > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3)
  }

  // Get students needing attention
  const getNeedsAttention = (): Student[] => {
    if (!students || students.length === 0) return []
    
    return students
      .filter(s => s.totalTasks > 0 && s.completionRate < 70)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 3)
  }

  const formatDueDate = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Created today"
    if (diffDays === 1) return "Created yesterday"
    if (diffDays < 7) return `Created ${diffDays} days ago`
    if (diffDays < 30) return `Created ${Math.floor(diffDays / 7)} weeks ago`
    return `Created ${Math.floor(diffDays / 30)} months ago`
  }

  const refreshData = () => {
    fetchTutorDashboardData()
  }

  if (loading) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading tutor dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={refreshData}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => setUsingMockData(true)}>
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
            
           
          </div>
        </div>
      )}
      
      <div className="p-6 space-y-6">
        {/* Header with Database Status */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">Tutor Dashboard</h1>
              {usingMockData && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                 
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Welcome back, {tutor?.name || user?.firstName || "Tutor"}! Manage your students and create learning tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
            <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => setIsCreateTaskModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create New Task
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Students</CardDescription>
              <CardTitle className="text-3xl">{stats.totalStudents}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Across all courses</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Tasks</CardDescription>
              <CardTitle className="text-3xl">{stats.activeTasks}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Total created tasks</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-3xl">{stats.completionRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <TrendingUp className="h-4 w-4" />
                <span>Overall progress</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Performance</CardDescription>
              <CardTitle className="text-3xl">{stats.avgScore}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Average score across all tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Monitor task completion and student progress</CardDescription>
              </div>
              <Badge variant="outline">
                {tasks.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No tasks yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first task to get started!</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsCreateTaskModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            ) : (
              tasks.slice(0, 5).map((task) => {
                const taskStats = getTaskStats(task)
                const isCompleted = taskStats.completed === taskStats.total

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{task.topic}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>
                              Grade {task.grade} • {taskStats.total} students
                            </span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDueDate(task.createdAt)}</span>
                          </div>
                          <span>•</span>
                          <span className="capitalize">{task.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {taskStats.completed}/{taskStats.total}
                        </p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      {isCompleted ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Done
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleViewTask(task)}>
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Student Performance */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Students with highest completion rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getTopPerformers().length === 0 ? (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground">No student data available</p>
                  <p className="text-sm text-muted-foreground mt-1">Assign tasks to see performance data</p>
                </div>
              ) : (
                getTopPerformers().map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center font-semibold text-secondary">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Grade {student.grade} • {student.completedTasks}/{student.totalTasks} tasks
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-secondary">{student.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Completion rate</p>
                      {student.avgScore > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Avg: {student.avgScore}%</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Attention</CardTitle>
              <CardDescription>Students falling behind on tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getNeedsAttention().length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500/50 mx-auto mb-2" />
                  <p className="text-muted-foreground">All students are doing well!</p>
                  <p className="text-sm text-muted-foreground mt-1">Great job keeping everyone on track!</p>
                </div>
              ) : (
                getNeedsAttention().map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center font-semibold text-destructive">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Grade {student.grade} • {student.completedTasks}/{student.totalTasks} tasks
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p className="font-semibold">{student.completionRate}%</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {student.totalTasks - student.completedTasks} tasks pending
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tutor Courses */}
        {tutor?.courses && tutor.courses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>Subjects you're currently teaching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tutor.courses.map((course: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                    {course.replace('_', ' ').replace('g5', 'Grade 5').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateTaskModal
        open={isCreateTaskModalOpen}
        onOpenChange={setIsCreateTaskModalOpen}
        onTaskCreated={handleTaskCreated}
        tutorId={user?.tutorId || "tutor_001"}
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
    </DashboardLayout>
  )
}