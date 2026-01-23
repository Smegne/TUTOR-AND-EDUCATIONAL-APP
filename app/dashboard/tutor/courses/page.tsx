// app/dashboard/tutor/courses/page.tsx
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, ListTodo, Plus, Loader2, AlertCircle, Database, RefreshCw, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { useRouter } from "next/navigation"
import { AddCourseModal } from "@/components/add-course-modal"
import { useToast } from "@/hooks/use-toast"

interface Course {
  id: string
  name: string
  code: string
  grade: number
  description: string
  studentCount: number
  taskCount: number
  completedTasks: number
  avgScore: number
}

interface CourseStats {
  [courseId: string]: {
    students: number
    tasks: number
    completedTasks: number
    avgScore: number
  }
}

export default function TutorCoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats>({})
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean
    tablesExist: boolean
  } | null>(null)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)

  useEffect(() => {
    fetchTutorCourses()
  }, [])

const fetchTutorCourses = async () => {
  try {
    setLoading(true)
    setError(null)
    
    const tutorId = user?.tutorId || user?.id || "tutor_001"
    
    // Test database connection AND data existence
    try {
      const testResponse = await fetch('/api/test-db')
      const testData = await testResponse.json()
      
      setDbStatus({
        connected: testData.success && testData.connection,
        tablesExist: testData.tables?.courses || false
      })
      
      // Check if there's actual data in courses table
      if (testData.success && testData.connection && testData.sampleData?.courses > 0) {
        // Database has courses, fetch real data
        const response = await fetch(`/api/tutor/${tutorId}/courses`)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.success && data.courses?.length > 0) {
            setCourses(data.courses)
            setCourseStats(data.stats || {})
            setUsingMockData(false)
          } else {
            // API returned empty courses
            setUsingMockData(true)
            setCourses(getMockCourses())
          }
        } else {
          throw new Error(`API error: ${response.status}`)
        }
      } else {
        // No database connection or no courses data
        setUsingMockData(true)
        setCourses(getMockCourses())
      }
      
    } catch (dbError) {
      console.log('Database error, using mock data:', dbError)
      setUsingMockData(true)
      setCourses(getMockCourses())
    }
  } catch (error) {
    console.error('Error fetching tutor courses:', error)
    setError(error instanceof Error ? error.message : 'Failed to load courses')
    setUsingMockData(true)
    setCourses(getMockCourses())
  } finally {
    setLoading(false)
  }
}

  const getMockCourses = (): Course[] => {
    return [
      {
        id: "math_g5",
        name: "Mathematics",
        code: "MATH-G5",
        grade: 5,
        description: "Basic arithmetic, geometry, and problem solving",
        studentCount: 12,
        taskCount: 15,
        completedTasks: 120,
        avgScore: 85
      },
      {
        id: "english_g5",
        name: "English Language",
        code: "ENG-G5",
        grade: 5,
        description: "Reading, writing, and communication skills",
        studentCount: 10,
        taskCount: 10,
        completedTasks: 80,
        avgScore: 82
      },
      {
        id: "amharic_g5",
        name: "Amharic",
        code: "AMH-G5",
        grade: 5,
        description: "Amharic language and literature",
        studentCount: 15,
        taskCount: 12,
        completedTasks: 135,
        avgScore: 88
      },
      {
        id: "science_g5",
        name: "Science",
        code: "SCI-G5",
        grade: 5,
        description: "Introduction to biology, physics, and chemistry",
        studentCount: 8,
        taskCount: 8,
        completedTasks: 60,
        avgScore: 79
      },
      {
        id: "citizenship_g5",
        name: "Citizenship",
        code: "CIT-G5",
        grade: 5,
        description: "Civic education and ethical values",
        studentCount: 10,
        taskCount: 6,
        completedTasks: 50,
        avgScore: 91
      },
      {
        id: "sports_g5",
        name: "Sports",
        code: "SPT-G5",
        grade: 5,
        description: "Physical education and sports activities",
        studentCount: 20,
        taskCount: 4,
        completedTasks: 80,
        avgScore: 95
      }
    ]
  }

  const refreshData = () => {
    fetchTutorCourses()
  }

  const getCourseColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "text-blue-600"
    if (courseCode.includes('ENG')) return "text-green-600"
    if (courseCode.includes('SCI')) return "text-purple-600"
    if (courseCode.includes('AMH')) return "text-red-600"
    if (courseCode.includes('CIT')) return "text-orange-600"
    if (courseCode.includes('SPT')) return "text-pink-600"
    if (courseCode.includes('SOC')) return "text-indigo-600"
    if (courseCode.includes('PVA')) return "text-teal-600"
    if (courseCode.includes('HPE')) return "text-cyan-600"
    if (courseCode.includes('IT')) return "text-amber-600"
    return "text-primary"
  }

  const getCourseBgColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "bg-blue-50 border-blue-200"
    if (courseCode.includes('ENG')) return "bg-green-50 border-green-200"
    if (courseCode.includes('SCI')) return "bg-purple-50 border-purple-200"
    if (courseCode.includes('AMH')) return "bg-red-50 border-red-200"
    if (courseCode.includes('CIT')) return "bg-orange-50 border-orange-200"
    if (courseCode.includes('SPT')) return "bg-pink-50 border-pink-200"
    if (courseCode.includes('SOC')) return "bg-indigo-50 border-indigo-200"
    if (courseCode.includes('PVA')) return "bg-teal-50 border-teal-200"
    if (courseCode.includes('HPE')) return "bg-cyan-50 border-cyan-200"
    if (courseCode.includes('IT')) return "bg-amber-50 border-amber-200"
    return "bg-primary/5 border-border"
  }

  const getCourseStats = (courseId: string) => {
    if (courseStats[courseId]) {
      return courseStats[courseId]
    }
    
    // Fallback to course data if stats not available
    const course = courses.find(c => c.id === courseId)
    if (course) {
      return {
        students: course.studentCount,
        tasks: course.taskCount,
        completedTasks: course.completedTasks,
        avgScore: course.avgScore
      }
    }
    
    return {
      students: 0,
      tasks: 0,
      completedTasks: 0,
      avgScore: 0
    }
  }

  const getCompletionRate = (courseId: string) => {
    const stats = getCourseStats(courseId)
    if (stats.tasks === 0) return 0
    const totalPossibleTasks = stats.students * stats.tasks
    if (totalPossibleTasks === 0) return 0
    return Math.round((stats.completedTasks / totalPossibleTasks) * 100)
  }

  const handleManageCourse = (courseId: string) => {
    router.push(`/dashboard/tutor/tasks?course=${encodeURIComponent(courseId)}`)
  }

  const handleCourseAdded = () => {
    toast({
      title: "Course Added",
      description: "The course has been added successfully. Refreshing your courses...",
    })
    // Refresh courses after adding new one
    fetchTutorCourses()
  }

  const handleRequestCourse = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Course request functionality will be available soon.",
    })
  }

  if (loading) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading your courses...</p>
              <p className="text-sm text-muted-foreground mt-2">
                {dbStatus ? (
                  dbStatus.connected ? "Connected to database" : "Checking database connection..."
                ) : "Initializing..."}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center max-w-md space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Unable to Load Courses</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={refreshData} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => {
                setUsingMockData(true)
                setError(null)
                setCourses(getMockCourses())
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
        <div className="bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100">
                <Database className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800">Using demo data</p>
                <p className="text-xs text-yellow-600">
                  {dbStatus?.connected 
                    ? "Database connected but no course data found" 
                    : "Database not connected - showing demo courses"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                className="h-8 gap-2 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                <RefreshCw className="h-3 w-3" />
                Retry Connection
              </Button>
              {dbStatus?.connected && (
                <Button 
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setShowAddCourseModal(true)}
                >
                  <Plus className="h-3 w-3" />
                  Add Courses
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Courses Management</h1>
            <p className="text-muted-foreground">Manage your courses and monitor student progress</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {courses.length} course{courses.length !== 1 ? 's' : ''}
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
            <Button 
              className="gap-2" 
              onClick={() => setShowAddCourseModal(true)}
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const courseCode = course.code
            const courseColor = getCourseColor(courseCode)
            const courseBgColor = getCourseBgColor(courseCode)
            const stats = getCourseStats(course.id)
            const completionRate = getCompletionRate(course.id)

            return (
              <Card 
                key={course.id} 
                className={`hover:shadow-lg transition-all duration-300 border-2 ${courseBgColor} hover:scale-[1.02]`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${getCourseColor(courseCode).replace('text-', 'bg-').replace('-600', '-100')}`}>
                      <BookOpen className={`h-6 w-6 ${courseColor}`} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary" className="font-medium">
                        Grade {course.grade}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs bg-background">
                        {courseCode}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl">{course.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Users className="h-3 w-3" />
                        Students
                      </div>
                      <div className="text-2xl font-bold">{stats.students}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <ListTodo className="h-3 w-3" />
                        Tasks
                      </div>
                      <div className="text-2xl font-bold">{stats.tasks}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-semibold">{completionRate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(Math.max(completionRate, 0), 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Average Score</span>
                    <Badge variant="secondary" className="font-semibold">
                      {stats.avgScore}%
                    </Badge>
                  </div>

                  <Button 
                    className="w-full bg-transparent hover:bg-primary hover:text-primary-foreground transition-colors" 
                    variant="outline"
                    onClick={() => handleManageCourse(course.id)}
                  >
                    <span>Manage Course</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {courses.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No courses assigned yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {usingMockData 
                  ? "Database connection not available. Set up your database to add courses."
                  : "Your courses will appear here once you're enrolled in teaching subjects."}
              </p>
              <div className="flex gap-3">
                <Button onClick={refreshData} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Check Again
                </Button>
                <Button className="gap-2" onClick={() => setShowAddCourseModal(true)}>
                  <Plus className="h-4 w-4" />
                  Add Your First Course
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {courses.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Courses Overview</CardTitle>
              <CardDescription>Summary of all your courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Courses</div>
                  <div className="text-2xl font-bold">{courses.length}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Students</div>
                  <div className="text-2xl font-bold">
                    {courses.reduce((sum, course) => sum + getCourseStats(course.id).students, 0)}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Tasks</div>
                  <div className="text-2xl font-bold">
                    {courses.reduce((sum, course) => sum + getCourseStats(course.id).tasks, 0)}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Avg. Completion</div>
                  <div className="text-2xl font-bold">
                    {courses.length > 0 
                      ? Math.round(courses.reduce((sum, course) => sum + getCompletionRate(course.id), 0) / courses.length)
                      : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database Setup Card (shown when using mock data) */}
        {usingMockData && dbStatus?.connected && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Setup Your Courses</h3>
                  <p className="text-muted-foreground mb-4">
                    Your database is connected but no courses are configured. Add your courses to start managing student assignments and track progress.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setShowAddCourseModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Courses
                    </Button>
                    <Button variant="outline" onClick={refreshData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Course Modal */}
      <AddCourseModal 
        open={showAddCourseModal}
        onOpenChange={setShowAddCourseModal}
        onCourseAdded={handleCourseAdded}
        tutorId={user?.tutorId || user?.id}
      />
    </DashboardLayout>
  )
}