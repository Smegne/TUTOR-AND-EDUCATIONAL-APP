"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, CheckCircle2, Star, Trophy, Flame, Loader2, Database, AlertCircle } from "lucide-react"
import { TaskDetailModal } from "@/components/task-detail-modal"
import { useAuth } from "@/lib/providers/auth-provider"

interface Task {
  id: string
  topic: string
  description: string
  course: string
  grade: number
  difficulty: string
  duration: number
  status: 'not_started' | 'in_progress' | 'completed'
  score?: number
  timeSpent?: number
}

interface StudentStats {
  completedTasks: number
  totalTasks: number
  avgScore: number
  streak: number
  points: number
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [student, setStudent] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<StudentStats>({
    completedTasks: 0,
    totalTasks: 0,
    avgScore: 0,
    streak: 0,
    points: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    fetchStudentDashboardData()
  }, [])

  const fetchStudentDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the authenticated student ID or fallback to default
      const studentId = user?.studentId || "student_001"
      
      // Fetch from the new dashboard API
      const response = await fetch(`/api/student/${studentId}/dashboard`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setStudent(data.student)
          setTasks(data.tasks || [])
          setStats(data.stats)
          setUsingMockData(false)
        } else {
          throw new Error(data.error || 'Failed to fetch dashboard data')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
      setUsingMockData(true)
      
      // Fallback to mock data
      const { getTasksByGrade, getStudentStats, getStudentById } = await import('@/lib/data/mock-database')
      const mockStudent = getStudentById(user?.studentId || "student_001")
      const mockTasks = getTasksByGrade(mockStudent?.grade || 5)
      const mockStats = getStudentStats(user?.studentId || "student_001")
      
      setStudent(mockStudent)
      setTasks(mockTasks)
      setStats(mockStats)
    } finally {
      setLoading(false)
    }
  }

  // Get course color
  const getCourseColor = (course: string) => {
    if (course.includes("math")) return "text-blue-500"
    if (course.includes("english")) return "text-green-500"
    if (course.includes("science")) return "text-purple-500"
    if (course.includes("history")) return "text-orange-500"
    return "text-primary"
  }

  // Calculate today's progress (using first 5 tasks as "today's tasks")
  const todaysTasks = tasks.slice(0, 5)
  const todaysCompleted = todaysTasks.filter(task => task.status === 'completed').length
  const todaysTotal = todaysTasks.length
  const todaysProgress = todaysTotal > 0 ? Math.round((todaysCompleted / todaysTotal) * 100) : 0

  // This week's progress from stats
  const thisWeekCompleted = stats.completedTasks
  const thisWeekTotal = stats.totalTasks
  const thisWeekProgress = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 0

  const handleStartTask = (task: Task) => {
    console.log("[API] Starting task:", task.topic)
    setSelectedTask(task)
  }

  const handleCloseTask = () => {
    setSelectedTask(null)
    // Refresh data after task completion
    fetchStudentDashboardData()
  }

  const refreshData = () => {
    fetchStudentDashboardData()
  }

  if (loading) {
    return (
      <DashboardLayout role="student" studentName={student?.name || user?.firstName}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

 

 return (
  <DashboardLayout
    role="student"
    studentName={student?.name || user?.firstName}
  >
    <div className="p-6 space-y-6">

      {/* Welcome Section */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl">

        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/education-bg.jpg" // change to your image path
            alt="Education Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-10 text-white animate-fade-in">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">

            {/* Left Side */}
            <div className="space-y-4">

              {/* Animated Main Title */}
              <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Welcome to ጥናት ቤት
              </h1>

              {/* Student Greeting */}
              <h2 className="text-2xl font-semibold">
                {student?.name || user?.firstName || "Student"} 👋
              </h2>

              {/* Sub Info */}
              <p className="text-white/80 text-sm lg:text-base">
                {student?.grade ? `Grade ${student.grade} • ` : ""}
                {student?.courses?.length
                  ? `${student.courses.length} courses • `
                  : ""}
                Let’s continue learning today.
              </p>
            </div>

            {/* Right Stats */}
            <div className="flex flex-wrap gap-6">

              {/* Streak Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-5 text-center shadow-lg hover:scale-105 transition duration-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <span className="text-2xl font-bold">
                    {stats.streak}
                  </span>
                </div>
                <p className="text-sm text-white/80">Day Streak</p>
              </div>

              {/* Points Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-5 text-center shadow-lg hover:scale-105 transition duration-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="text-2xl font-bold">
                    {stats.points}
                  </span>
                </div>
                <p className="text-sm text-white/80">Points</p>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>

    {selectedTask && (
      <TaskDetailModal
        task={selectedTask}
        studentId={student?.id || user?.studentId || "student_001"}
        open={!!selectedTask}
        onClose={handleCloseTask}
      />
    )}
  </DashboardLayout>
);
}