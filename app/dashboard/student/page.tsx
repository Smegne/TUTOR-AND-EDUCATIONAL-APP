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

  if (error && !usingMockData) {
    return (
      <DashboardLayout role="student" studentName={student?.name || user?.firstName}>
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
    <DashboardLayout role="student" studentName={student?.name || user?.firstName}>
      {/* Database Status Banner */}
      {usingMockData && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3">
          <div className="flex items-center justify-center gap-2 text-yellow-700">
            
           
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshData}
              className="h-auto p-1 text-yellow-600 hover:text-yellow-800"
            >
            
            </Button>
          </div>
        </div>
      )}
      
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-secondary to-secondary/70 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">
                  Welcome back, {student?.name || user?.firstName || "Student"}!
                </h1>
                {usingMockData && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  
                  </Badge>
                )}
              </div>
              <p className="text-white/90">
                {student?.grade ? `Grade ${student.grade} • ` : ''}
                {student?.courses?.length ? `${student.courses.length} courses • ` : ''}
                Let's continue learning today.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.streak}</span>
                </div>
                <p className="text-sm text-white/90">Day Streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.points}</span>
                </div>
                <p className="text-sm text-white/90">Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Today's Progress</CardDescription>
              <CardTitle className="text-3xl">
                {todaysCompleted}/{todaysTotal}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={todaysProgress} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">Tasks completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-3xl">
                {thisWeekCompleted}/{thisWeekTotal}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={thisWeekProgress} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">Tasks completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">{stats.avgScore}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-secondary" />
                <p className="text-sm text-muted-foreground">Great work!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>Complete your learning activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No tasks assigned yet. {usingMockData ? 'Add tasks to the database.' : 'Check back later!'}
              </p>
            ) : (
              tasks.map((task) => {
                const isCompleted = task.status === 'completed'

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <BookOpen className={`h-5 w-5 ${getCourseColor(task.course)}`} />
                      </div>
                      <div>
                        <p className="font-semibold">{task.topic}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Grade {task.grade}</span>
                          <span>•</span>
                          <span className="capitalize">{task.difficulty}</span>
                          {task.timeSpent && task.timeSpent > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{task.timeSpent} min</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {isCompleted ? (
                      <div className="flex items-center gap-3">
                        {task.score && (
                          <div className="text-right">
                            <p className="font-semibold text-secondary">{task.score}%</p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        )}
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-secondary hover:bg-secondary/90"
                        onClick={() => handleStartTask(task)}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>Keep up the great work!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "🔥", title: `${stats.streak} Day Streak`, description: "Stay consistent" },
                {
                  icon: "⭐",
                  title: "Great Scores",
                  description: `${stats.avgScore}% average`,
                },
                {
                  icon: "📚",
                  title: "Tasks Done",
                  description: `${stats.completedTasks} completed`,
                },
                { icon: "🎯", title: "Points", description: `${stats.points} earned` },
              ].map((achievement, index) => (
                <div
                  key={index}
                  className="text-center p-4 border border-border rounded-lg hover:border-secondary/50 transition-colors"
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <p className="font-semibold text-sm mb-1">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
  )
}