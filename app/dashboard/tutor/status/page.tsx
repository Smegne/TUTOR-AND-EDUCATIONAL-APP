"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle, TrendingUp, Award, BookOpen, Monitor, Clock, Calendar, Loader2, AlertCircle, Database, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"

interface TutorStats {
  totalStudents: number
  totalTasks: number
  tasksCompleted: number
  overallCompletion: number
  averageScore: number
  totalCourses: number
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
}

interface CourseStats {
  id: string
  name: string
  code: string
  grade: number
  totalStudents: number
  totalTasks: number
  completionRate: number
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
}

export default function TutorStatusPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [stats, setStats] = useState<TutorStats>({
    totalStudents: 0,
    totalTasks: 0,
    tasksCompleted: 0,
    overallCompletion: 0,
    averageScore: 0,
    totalCourses: 0
  })
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [studentActivity, setStudentActivity] = useState<StudentActivity[]>([])

  useEffect(() => {
    fetchTutorStatus()
  }, [])

  const fetchTutorStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const tutorId = user?.tutorId || "tutor_001"
      
      // Fetch tutor status from API
      const response = await fetch(`/api/tutor/${tutorId}/status`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setStats(data.stats)
          setTopPerformers(data.topPerformers || [])
          setCourseStats(data.courseStats || [])
          setStudentActivity(data.studentActivity || [])
          setUsingMockData(false)
        } else {
          throw new Error(data.error || 'Failed to fetch status data')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching tutor status:', error)
      setError(error instanceof Error ? error.message : 'Failed to load status data')
      setUsingMockData(true)
      
      // Fallback to mock data
      const mockStats: TutorStats = {
        totalStudents: 25,
        totalTasks: 48,
        tasksCompleted: 36,
        overallCompletion: 75,
        averageScore: 85,
        totalCourses: 6
      }
      
      const mockTopPerformers: TopPerformer[] = [
        {
          id: "student_001",
          name: "Abel Tesfaye",
          grade: 5,
          averageScore: 92,
          completionRate: 95,
          totalTasks: 15,
          completedTasks: 14
        },
        {
          id: "student_002",
          name: "Emma Wilson",
          grade: 5,
          averageScore: 88,
          completionRate: 90,
          totalTasks: 15,
          completedTasks: 13
        },
        {
          id: "student_003",
          name: "Daniel Johnson",
          grade: 5,
          averageScore: 86,
          completionRate: 88,
          totalTasks: 15,
          completedTasks: 13
        }
      ]
      
      const mockCourseStats: CourseStats[] = [
        {
          id: "math_g5",
          name: "Mathematics",
          code: "MATH-G5",
          grade: 5,
          totalStudents: 12,
          totalTasks: 15,
          completionRate: 80
        },
        {
          id: "english_g5",
          name: "English",
          code: "ENG-G5",
          grade: 5,
          totalStudents: 10,
          totalTasks: 10,
          completionRate: 75
        },
        {
          id: "amharic_g5",
          name: "Amharic",
          code: "AMH-G5",
          grade: 5,
          totalStudents: 15,
          totalTasks: 12,
          completionRate: 85
        }
      ]
      
      const mockStudentActivity: StudentActivity[] = [
        {
          id: "student_001",
          name: "Abel Tesfaye",
          grade: 5,
          sessions: 12,
          totalTime: 540,
          avgSessionTime: 45,
          lastLogin: new Date(Date.now() - 3600000).toISOString(),
          deviceInfo: "Chrome on Windows",
          isOnline: true
        },
        {
          id: "student_002",
          name: "Emma Wilson",
          grade: 5,
          sessions: 8,
          totalTime: 360,
          avgSessionTime: 45,
          lastLogin: new Date(Date.now() - 86400000).toISOString(),
          deviceInfo: "Safari on iPad",
          isOnline: false
        }
      ]
      
      setStats(mockStats)
      setTopPerformers(mockTopPerformers)
      setCourseStats(mockCourseStats)
      setStudentActivity(mockStudentActivity)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchTutorStatus()
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your teaching status...</p>
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
            <h3 className="text-lg font-semibold mb-2">Unable to Load Status Data</h3>
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
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <p className="text-sm font-medium">Using demo data</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshData}
              className="h-auto p-1 text-yellow-600 hover:text-yellow-800"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry Connection
            </Button>
          </div>
        </div>
      )}
      
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Teaching Status</h1>
            <p className="text-muted-foreground">Overview of your teaching performance</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Students</CardDescription>
              <CardTitle className="text-3xl">{stats.totalStudents}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Active learners</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Tasks Created</CardDescription>
              <CardTitle className="text-3xl">{stats.totalTasks}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>{stats.tasksCompleted} completed</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-3xl">{stats.overallCompletion}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stats.overallCompletion} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.tasksCompleted} of {stats.totalTasks} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">{stats.averageScore}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-secondary">
                <TrendingUp className="h-4 w-4" />
                <span>
                  {stats.averageScore >= 90 ? 'Excellent!' : 
                   stats.averageScore >= 80 ? 'Great results!' : 
                   stats.averageScore >= 70 ? 'Good progress!' : 'Needs improvement'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Students with highest average scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPerformers.map((student, index) => (
                <div key={student.id} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    index === 0 ? 'bg-yellow-500/10 text-yellow-600' :
                    index === 1 ? 'bg-gray-400/10 text-gray-600' :
                    index === 2 ? 'bg-orange-500/10 text-orange-600' :
                    'bg-primary/10 text-primary'
                  } font-bold`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{student.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Grade {student.grade}</span>
                      <span>•</span>
                      <span>{student.completedTasks}/{student.totalTasks} tasks</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant="secondary" className="mb-1">
                      <Award className="h-3 w-3 mr-1" />
                      {student.averageScore}%
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {student.completionRate}% completion
                    </div>
                  </div>
                </div>
              ))}
              {topPerformers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No student data yet</p>
                  <p className="text-sm mt-1">Assign tasks to see student performance</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
              <CardDescription>Tasks and students per course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseStats.map((course) => (
                <div key={course.id} className="p-3 space-y-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{course.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {course.code}
                          </Badge>
                          <span>Grade {course.grade}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{course.completionRate}%</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{course.totalStudents} students</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>{course.totalTasks} tasks</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(course.completionRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {courseStats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No courses yet</p>
                  <p className="text-sm mt-1">You need to be assigned to courses</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Activity & Device Usage</CardTitle>
            <CardDescription>Monitor student engagement and login/logout times (Last 7 days)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentActivity.map((student) => (
              <div key={student.id} className="p-4 border border-border rounded-lg space-y-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{student.name}</p>
                      {student.isOnline && (
                        <Badge variant="secondary" className="gap-1">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          Online
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Grade {student.grade}</span>
                      {student.email && (
                        <>
                          <span>•</span>
                          <span>{student.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">Grade {student.grade}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">Total Time</span>
                    </div>
                    <p className="text-lg font-bold">{formatDuration(student.totalTime)}</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Monitor className="h-3 w-3" />
                      <span className="text-xs">Avg. Session</span>
                    </div>
                    <p className="text-lg font-bold">{formatDuration(student.avgSessionTime)}</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">Sessions</span>
                    </div>
                    <p className="text-lg font-bold">{student.sessions}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Last Activity: </span>
                    <span className="font-medium">{formatDate(student.lastLogin)}</span>
                  </div>
                  {student.deviceInfo && (
                    <div className="flex items-center gap-2">
                      <Monitor className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{student.deviceInfo}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {studentActivity.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No student activity yet</p>
                <p className="text-sm mt-1">Students will appear here when they start using the platform</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

// Button component import
import { Button } from "@/components/ui/button"