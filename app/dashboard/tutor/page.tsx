// app/dashboard/tutor/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, BookOpen, TrendingUp, Plus, CheckCircle2, Clock, 
  AlertCircle, Loader2, RefreshCw, Sparkles, Target, Award,
  ChevronRight, Activity, Star, UserCheck, FileText
} from "lucide-react"
import { CreateTaskModal } from "@/components/create-task-modal"
import { TaskViewModal } from "@/components/task-view-modal"
import { useAuth } from "@/lib/providers/auth-provider"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

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

interface Tutor {
  id: string
  name: string
  email: string
  courses: string[]
}

export default function TutorDashboard() {
  const { user } = useAuth()
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tutor, setTutor] = useState<Tutor | null>(null)
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
  const [refreshing, setRefreshing] = useState(false)

  const getTutorId = useCallback(() => {
    if ((user as any)?.lookupId) return (user as any).lookupId
    if ((user as any)?.userId) return (user as any).userId
    if ((user as any)?.tutorId) return (user as any).tutorId
    if (user?.id) return user.id
    return null
  }, [user])

  const TUTOR_ID = getTutorId()

  const fetchTutorDashboardData = useCallback(async (showToast = false) => {
    if (!TUTOR_ID) {
      setError("No tutor ID found. Please log in again.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log("🔄 Fetching tutor dashboard from database for ID:", TUTOR_ID)
      
      const response = await fetch(`/api/tutor/${TUTOR_ID}/dashboard`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch data: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch dashboard data")
      }
      
      setTutor(data.tutor)
      setTasks(data.tasks || [])
      setStudents(data.students || [])
      setStats(data.stats)
      
      if (showToast) {
        toast.success(`Dashboard updated with ${data.tasks?.length || 0} tasks and ${data.students?.length || 0} students`)
      }
      
      console.log("✅ Database data loaded:", {
        tasks: data.tasks?.length,
        students: data.students?.length,
        stats: data.stats
      })
      
    } catch (err) {
      console.error("❌ Error fetching from database:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      if (showToast) {
        toast.error("Failed to load data from database")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [TUTOR_ID])

  useEffect(() => {
    if (TUTOR_ID) {
      fetchTutorDashboardData()
    } else {
      setLoading(false)
      setError("Authentication required. Please log in.")
    }
  }, [TUTOR_ID, fetchTutorDashboardData])

  const handleTaskCreated = () => {
    fetchTutorDashboardData(true)
  }

  const handleViewTask = (task: Task) => {
    setSelectedTask(task)
  }

  const handleCloseTask = () => {
    setSelectedTask(null)
  }

  const refreshData = () => {
    setRefreshing(true)
    fetchTutorDashboardData(true)
  }

  const getTaskStats = (task: Task) => {
    return {
      completed: task.completedCount || 0,
      total: task.assignedCount || 0,
      percentage: task.assignedCount > 0 
        ? Math.round((task.completedCount / task.assignedCount) * 100) 
        : 0
    }
  }

  const getTopPerformers = (): Student[] => {
    if (!students || students.length === 0) return []
    return students
      .filter(s => s.totalTasks > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3)
  }

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

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  if (loading) {
    return (
      <DashboardLayout role="tutor">
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
              <p className="text-lg font-medium text-gray-900">Loading dashboard...</p>
              <p className="text-sm text-gray-500 mt-2">Fetching your teaching data</p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="bg-red-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Data</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={refreshData} className="bg-green-500 hover:bg-green-600">
                Try Again
              </Button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="tutor">
      <div className="min-h-screen" style={{ background: brandColors.grayLight }}>
        {/* Top Gradient Bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.primaryLight})` }} />
        
        <div className="p-6 md:p-8 space-y-8">
          {/* Welcome Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ background: brandColors.primaryBg }}>
                  <Sparkles className="h-6 w-6" style={{ color: brandColors.primary }} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
              </div>
              <p className="text-gray-500 text-lg">
                Welcome back, <span className="font-semibold" style={{ color: brandColors.primary }}>{tutor?.name || "Tutor"}</span>! 
                Here's what's happening with your students today.
              </p>
            </div>
            <div className="flex items-center gap-3">
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
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ 
                    background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.primaryDark})`,
                    border: 'none'
                  }}
                  onClick={() => setIsCreateTaskModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create New Task
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-4 gap-6"
          >
            {[
              { icon: Users, label: "Total Students", value: stats.totalStudents, subtext: "Across all courses", gradient: "from-blue-500 to-blue-600", bgGradient: "from-blue-50 to-blue-100" },
              { icon: FileText, label: "Active Tasks", value: stats.activeTasks, subtext: "Total created tasks", gradient: "from-purple-500 to-purple-600", bgGradient: "from-purple-50 to-purple-100" },
              { icon: Target, label: "Completion Rate", value: `${stats.completionRate}%`, subtext: "Overall progress", gradient: "from-green-500 to-green-600", bgGradient: "from-green-50 to-green-100" },
              { icon: Award, label: "Avg Performance", value: `${stats.avgScore}%`, subtext: "Average score", gradient: "from-orange-500 to-orange-600", bgGradient: "from-orange-50 to-orange-100" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className={`bg-gradient-to-br ${stat.bgGradient} p-6`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-2">{stat.subtext}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 h-1 w-full bg-white/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${typeof stat.value === 'number' ? Math.min(stat.value, 100) : 75}%`,
                          background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.primaryDark})`
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Activity className="h-5 w-5" style={{ color: brandColors.primary }} />
                      Recent Tasks
                    </CardTitle>
                    <CardDescription>Monitor task completion and student progress</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    {tasks.length} Active Tasks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {tasks.length === 0 ? (
                  <motion.div className="text-center py-12">
                    <div className="bg-green-50 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="h-10 w-10" style={{ color: brandColors.primary }} />
                    </div>
                    <p className="text-gray-500 mb-2">No tasks created yet</p>
                    <p className="text-sm text-gray-400 mb-6">Create your first task to start engaging your students!</p>
                    <Button 
                      className="gap-2" 
                      style={{ background: brandColors.primary }}
                      onClick={() => setIsCreateTaskModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Create Your First Task
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task, index) => {
                      const taskStats = getTaskStats(task)
                      const isCompleted = taskStats.completed === taskStats.total

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01 }}
                          className="group relative p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
                          style={{ background: brandColors.white }}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="relative">
                                <div className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" 
                                     style={{ background: brandColors.primaryBg }}>
                                  <BookOpen className="h-6 w-6" style={{ color: brandColors.primary }} />
                                </div>
                                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{task.topic}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>Grade {task.grade}</span>
                                  </div>
                                  <span className="text-gray-300">•</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDueDate(task.createdAt)}</span>
                                  </div>
                                  <span className="text-gray-300">•</span>
                                  <Badge variant="outline" className="text-xs capitalize border-gray-200">
                                    {task.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {taskStats.completed}/{taskStats.total}
                                </p>
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${taskStats.percentage}%`,
                                      background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.primaryDark})`
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Completed</p>
                              </div>
                              {isCompleted ? (
                                <Badge className="gap-1 bg-green-100 text-green-700 border-green-200">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Complete
                                </Badge>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleViewTask(task)}
                                  className="group-hover:border-green-200 group-hover:bg-green-50 transition-all"
                                >
                                  View Details
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Student Performance Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-none shadow-lg h-full">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Students with highest completion rates</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {getTopPerformers().length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No student data available</p>
                      <p className="text-sm text-gray-400">Assign tasks to see performance</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getTopPerformers().map((student, index) => (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-lg hover:shadow-md transition-all duration-300"
                          style={{ background: brandColors.grayLight }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-12 w-12 rounded-full flex items-center justify-center font-semibold text-white"
                                   style={{ background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.primaryDark})` }}>
                                {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                              </div>
                              {index === 0 && (
                                <div className="absolute -top-1 -right-1">
                                  <Award className="h-5 w-5 text-yellow-500" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">
                                Grade {student.grade} • {student.completedTasks}/{student.totalTasks} tasks
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: brandColors.primary }}>
                              {student.completionRate}%
                            </p>
                            <p className="text-xs text-gray-500">Completion rate</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-none shadow-lg h-full">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Need Attention
                  </CardTitle>
                  <CardDescription>Students falling behind on tasks</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {getNeedsAttention().length === 0 ? (
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 text-green-300 mx-auto mb-3" />
                      <p className="text-gray-500">All students are doing well!</p>
                      <p className="text-sm text-green-600 mt-1">Great job keeping everyone on track!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getNeedsAttention().map((student) => (
                        <motion.div
                          key={student.id}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center justify-between p-3 rounded-lg border-l-4 transition-all duration-300"
                          style={{ 
                            background: brandColors.white,
                            borderLeftColor: '#F97316'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-600">
                              {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">
                                Grade {student.grade} • {student.completedTasks}/{student.totalTasks} tasks
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              <p className="font-semibold">{student.completionRate}%</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {student.totalTasks - student.completedTasks} pending
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Your Courses */}
          {tutor?.courses && tutor.courses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" style={{ color: brandColors.primary }} />
                    Your Courses
                  </CardTitle>
                  <CardDescription>Subjects you're currently teaching</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
                    {tutor.courses.map((course: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Badge 
                          className="px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer"
                          style={{ 
                            background: brandColors.primaryBg,
                            color: brandColors.primaryDark,
                            border: `1px solid ${brandColors.primaryLight}`
                          }}
                        >
                          {course.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <CreateTaskModal
        open={isCreateTaskModalOpen}
        onOpenChange={setIsCreateTaskModalOpen}
        onTaskCreated={handleTaskCreated}
        tutorId={TUTOR_ID || "tutor_001"}
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