"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, CheckCircle, PlayCircle, Loader2, AlertCircle, Database, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"

interface Course {
  id: string
  name: string
  code: string
  grade: number
  description: string
  totalTasks: number
  completedTasks: number
  progress: number
}

export default function StudentCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  useEffect(() => {
    fetchStudentCourses()
  }, [])

  const fetchStudentCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const studentId = user?.studentId || "student_001"
      
      // Fetch student courses from API
      const response = await fetch(`/api/student/${studentId}/courses`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setCourses(data.courses || [])
          setUsingMockData(false)
        } else {
          throw new Error(data.error || 'Failed to fetch courses')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching student courses:', error)
      setError(error instanceof Error ? error.message : 'Failed to load courses')
      setUsingMockData(true)
      
      // Fallback to mock data
      const mockCourses: Course[] = [
        {
          id: "math_g5",
          name: "Mathematics",
          code: "MATH-G5",
          grade: 5,
          description: "Basic arithmetic, geometry, and problem solving",
          totalTasks: 15,
          completedTasks: 12,
          progress: 80
        },
        {
          id: "english_g5",
          name: "English Language",
          code: "ENG-G5",
          grade: 5,
          description: "Reading, writing, and communication skills",
          totalTasks: 10,
          completedTasks: 8,
          progress: 80
        },
        {
          id: "science_g5",
          name: "Science",
          code: "SCI-G5",
          grade: 5,
          description: "Introduction to biology, physics, and chemistry",
          totalTasks: 8,
          completedTasks: 6,
          progress: 75
        },
        {
          id: "amharic_g5",
          name: "Amharic",
          code: "AMH-G5",
          grade: 5,
          description: "Amharic language and literature",
          totalTasks: 12,
          completedTasks: 9,
          progress: 75
        },
        {
          id: "citizenship_g5",
          name: "Citizenship",
          code: "CIT-G5",
          grade: 5,
          description: "Civic education and ethical values",
          totalTasks: 6,
          completedTasks: 5,
          progress: 83
        },
        {
          id: "sports_g5",
          name: "Sports",
          code: "SPT-G5",
          grade: 5,
          description: "Physical education and sports activities",
          totalTasks: 4,
          completedTasks: 4,
          progress: 100
        }
      ]
      setCourses(mockCourses)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchStudentCourses()
  }

  const getCourseColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "text-blue-500"
    if (courseCode.includes('ENG')) return "text-green-500"
    if (courseCode.includes('SCI')) return "text-purple-500"
    if (courseCode.includes('AMH')) return "text-red-500"
    if (courseCode.includes('CIT')) return "text-orange-500"
    if (courseCode.includes('SPT')) return "text-pink-500"
    return "text-primary"
  }

  const getCourseBgColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "bg-blue-500/10"
    if (courseCode.includes('ENG')) return "bg-green-500/10"
    if (courseCode.includes('SCI')) return "bg-purple-500/10"
    if (courseCode.includes('AMH')) return "bg-red-500/10"
    if (courseCode.includes('CIT')) return "bg-orange-500/10"
    if (courseCode.includes('SPT')) return "bg-pink-500/10"
    return "bg-primary/10"
  }

  const getCourseName = (courseId: string): string => {
    const courseMap: Record<string, string> = {
      'math': 'Mathematics',
      'english': 'English',
      'amharic': 'Amharic',
      'science': 'Science',
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
      'ስፖርት': 'Sports'
    }

    // Remove grade suffix (e.g., "_g5")
    const baseCourse = courseId.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
    return courseMap[baseCourse] || courseId.replace('_', ' ').toUpperCase()
  }

  const getCourseDescription = (courseId: string): string => {
    const descriptionMap: Record<string, string> = {
      'math': 'Basic arithmetic, geometry, and problem solving',
      'english': 'Reading, writing, and communication skills',
      'amharic': 'Amharic language and literature',
      'science': 'Introduction to biology, physics, and chemistry',
      'social_science': 'History, geography, and social studies',
      'citizenship': 'Civic education and ethical values',
      'pva': 'Physical and vocational arts education',
      'hpe': 'Health and physical education',
      'it': 'Information technology and computer basics',
      'ሂሳብ': 'መሰረታዊ ሒሳብ እና ችግር መፍታት',
      'እንግሊዝኛ': 'ማንበብ፣ መጻፍ እና የንግግር ክህሎቶች',
      'አማርኛ': 'የአማርኛ ቋንቋ እና ስነጽሁፍ',
      'አካባቢ_ሳይንስ': 'የተፈጥሮ ሳይንስ መሰረታዊ እውቀት',
      'ስነምግባር': 'የከተማ ትምህርት እና ስነምግባር',
      'ስነጥበብ': 'ስነጥበብ እና ፈጠራዊ ሥራዎች',
      'ስፖርት': 'አካላዊ ትምህርት እና የስፖርት እንቅስቃሴዎች'
    }

    const baseCourse = courseId.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
    return descriptionMap[baseCourse] || 'Course description not available'
  }

  const getCourseCode = (courseId: string): string => {
    const courseCodeMap: Record<string, string> = {
      'math': 'MATH',
      'english': 'ENG',
      'amharic': 'AMH',
      'science': 'SCI',
      'social_science': 'SOC',
      'citizenship': 'CIT',
      'pva': 'PVA',
      'hpe': 'HPE',
      'it': 'IT',
      'ሂሳብ': 'MATH',
      'እንግሊዝኛ': 'ENG',
      'አማርኛ': 'AMH',
      'አካባቢ_ሳይንስ': 'SCI',
      'ስነምግባር': 'CIT',
      'ስነጥበብ': 'ART',
      'ስፖርት': 'SPT'
    }

    // Extract grade from courseId (e.g., "math_g5" -> "5")
    const gradeMatch = courseId.match(/g(\d+)$/)
    const grade = gradeMatch ? gradeMatch[1] : '5'
    
    const baseCourse = courseId.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
    const codePrefix = courseCodeMap[baseCourse] || 'CRS'
    
    return `${codePrefix}-G${grade}`
  }

  const extractGradeFromCourseId = (courseId: string): number => {
    const gradeMatch = courseId.match(/g(\d+)$/)
    return gradeMatch ? parseInt(gradeMatch[1]) : 5
  }

  if (loading) {
    return (
      <DashboardLayout role="student" studentName={user?.firstName}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your courses...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData) {
    return (
      <DashboardLayout role="student" studentName={user?.firstName}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Courses</h3>
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
    <DashboardLayout role="student" studentName={user?.firstName}>
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
            <h1 className="text-3xl font-bold text-balance">My Courses</h1>
            <p className="text-muted-foreground">View all your enrolled courses and progress</p>
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const courseCode = getCourseCode(course.id)
            const courseColor = getCourseColor(courseCode)
            const courseBgColor = getCourseBgColor(courseCode)
            const pendingTasks = course.totalTasks - course.completedTasks

            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`${courseBgColor} p-3 rounded-lg`}>
                      <BookOpen className={`h-6 w-6 ${courseColor}`} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">Grade {course.grade || extractGradeFromCourseId(course.id)}</Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {courseCode}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="mt-4">{course.name || getCourseName(course.id)}</CardTitle>
                  <CardDescription>
                    {course.description || getCourseDescription(course.id)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-semibold">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="text-lg font-bold">{course.totalTasks}</div>
                      <div className="text-xs text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="bg-secondary/20 rounded-lg p-2">
                      <div className="text-lg font-bold text-secondary">{course.completedTasks}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2">
                      <div className="text-lg font-bold text-primary">{pendingTasks}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    variant={course.progress === 100 ? "secondary" : "default"}
                    onClick={() => {
                      // Navigate to tasks for this course
                      window.location.href = `/dashboard/student/tasks?course=${course.id}`
                    }}
                  >
                    {course.progress === 100 ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Course Completed
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        View Tasks
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {courses.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses assigned yet</h3>
              <p className="text-muted-foreground text-center">
                Your courses will appear here once your tutor enrolls you in courses.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={refreshData}
              >
                Check Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}