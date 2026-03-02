// app/dashboard/student/courses/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  CheckCircle, 
  PlayCircle, 
  Loader2, 
  AlertCircle, 
  Database, 
  RefreshCw,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
  BarChart,
  Target,
  Sparkles,
  Star
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"

interface Course {
  id: string
  name: string
  englishName: string
  amharicName: string
  code: string
  grade: number
  description: string
  totalTasks: number
  completedTasks: number
  averageScore: number
  progress: number
  tasksUrl: string
}

interface StudentInfo {
  id: string
  name: string
  email: string
  grade: number
}

export default function StudentCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [displayLanguage, setDisplayLanguage] = useState<'amharic' | 'english'>('english')
  const [stats, setStats] = useState({
    totalCourses: 0,
    averageProgress: 0,
    totalTasks: 0,
    completedTasks: 0,
    averageScore: 0
  })

  // Get student ID using the same pattern as other pages
  const getStudentId = useCallback(() => {
    if ((user as any)?.studentId) return (user as any).studentId
    if ((user as any)?.userId) return (user as any).userId
    if (user?.id) return user.id
    return 'student_1767718447749' // Fallback
  }, [user])

  const STUDENT_ID = getStudentId()

  const fetchStudentCourses = useCallback(async (showToast = true) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🎯 [STUDENT COURSES] Fetching for student:", STUDENT_ID)
      
      const response = await fetch(`/api/student-direct/${STUDENT_ID}/courses`)
      
      console.log("📊 [STUDENT COURSES] Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("✅ [STUDENT COURSES] API Response:", data)
        
        if (data.success) {
          setCourses(data.courses || [])
          setStudent(data.student)
          setStats(data.stats || {
            totalCourses: 0,
            averageProgress: 0,
            totalTasks: 0,
            completedTasks: 0,
            averageScore: 0
          })
          setDisplayLanguage(data.displayLanguage || 'english')
          setUsingMockData(false)
          
          if (showToast && data.courses?.length > 0) {
            toast.success(`Loaded ${data.courses.length} courses for grade ${data.student?.grade}`)
          } else if (showToast) {
            toast.info("No courses available for your grade level")
          }
        } else {
          throw new Error(data.error || 'Failed to fetch courses')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ [STUDENT COURSES] Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load courses')
      setUsingMockData(true)
      
      // Load grade-appropriate mock data based on assumed grade
      const assumedGrade = user?.grade || 5
      const mockData = getMockCoursesForGrade(assumedGrade)
      setCourses(mockData.courses)
      setStudent(mockData.student)
      setStats(mockData.stats)
      setDisplayLanguage(assumedGrade >= 7 ? 'english' : 'amharic')
      
      if (showToast) {
        toast.error("Failed to load real data. Using demo data.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [STUDENT_ID, user?.grade])

  useEffect(() => {
    fetchStudentCourses(false)
  }, [fetchStudentCourses])

  const getMockCoursesForGrade = (grade: number) => {
    if (grade >= 7) {
      return {
        student: { id: 'mock_student', name: 'Demo Student', grade: 8 },
        courses: [
          {
            id: 'math_g8',
            name: 'Mathematics',
            englishName: 'Mathematics',
            amharicName: 'ሂሳብ',
            code: 'MATH-G8',
            grade: 8,
            description: 'Basic arithmetic, geometry, and problem solving',
            totalTasks: 15,
            completedTasks: 12,
            averageScore: 89,
            progress: 80,
            tasksUrl: '/dashboard/student/tasks?course=math&grade=8'
          },
          {
            id: 'english_g8',
            name: 'English',
            englishName: 'English',
            amharicName: 'እንግሊዝኛ',
            code: 'ENG-G8',
            grade: 8,
            description: 'Reading, writing, and communication skills',
            totalTasks: 10,
            completedTasks: 8,
            averageScore: 84,
            progress: 80,
            tasksUrl: '/dashboard/student/tasks?course=english&grade=8'
          }
        ],
        stats: {
          totalCourses: 2,
          averageProgress: 80,
          totalTasks: 25,
          completedTasks: 20,
          averageScore: 86.5
        }
      }
    } else {
      return {
        student: { id: 'mock_student', name: 'Demo Student', grade: 5 },
        courses: [
          {
            id: 'math_g5',
            name: 'ሂሳብ',
            englishName: 'Mathematics',
            amharicName: 'ሂሳብ',
            code: 'MATH-G5',
            grade: 5,
            description: 'መሰረታዊ ሒሳብ፣ ጂኦሜትሪ እና ችግር መፍታት',
            totalTasks: 12,
            completedTasks: 9,
            averageScore: 85,
            progress: 75,
            tasksUrl: '/dashboard/student/tasks?course=math&grade=5'
          },
          {
            id: 'amharic_g5',
            name: 'አማርኛ',
            englishName: 'Amharic',
            amharicName: 'አማርኛ',
            code: 'AMH-G5',
            grade: 5,
            description: 'የአማርኛ ቋንቋ እና ስነጽሁፍ',
            totalTasks: 8,
            completedTasks: 6,
            averageScore: 82,
            progress: 75,
            tasksUrl: '/dashboard/student/tasks?course=amharic&grade=5'
          }
        ],
        stats: {
          totalCourses: 2,
          averageProgress: 75,
          totalTasks: 20,
          completedTasks: 15,
          averageScore: 83.5
        }
      }
    }
  }

  const refreshData = () => {
    toast.info("Refreshing courses...")
    setRefreshing(true)
    fetchStudentCourses()
  }

  const getCourseColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "text-blue-500"
    if (courseCode.includes('ENG')) return "text-green-500"
    if (courseCode.includes('SCI')) return "text-purple-500"
    if (courseCode.includes('AMH')) return "text-red-500"
    if (courseCode.includes('CIT')) return "text-orange-500"
    if (courseCode.includes('SPT')) return "text-pink-500"
    if (courseCode.includes('ART')) return "text-yellow-500"
    if (courseCode.includes('GEZ')) return "text-indigo-500"
    return "text-primary"
  }

  const getCourseBgColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "bg-blue-500/10"
    if (courseCode.includes('ENG')) return "bg-green-500/10"
    if (courseCode.includes('SCI')) return "bg-purple-500/10"
    if (courseCode.includes('AMH')) return "bg-red-500/10"
    if (courseCode.includes('CIT')) return "bg-orange-500/10"
    if (courseCode.includes('SPT')) return "bg-pink-500/10"
    if (courseCode.includes('ART')) return "bg-yellow-500/10"
    if (courseCode.includes('GEZ')) return "bg-indigo-500/10"
    return "bg-primary/10"
  }

  if (loading && courses.length === 0) {
    return (
      <DashboardLayout role="student" studentName={user?.firstName}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading your courses...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Student ID: {STUDENT_ID}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  

  return (
    <DashboardLayout role="student" studentName={student?.name || user?.firstName}>
      

      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">
              {displayLanguage === 'amharic' ? 'የእኔ ኮርሶች' : 'My Courses'}
            </h1>
            <p className="text-muted-foreground">
              {displayLanguage === 'amharic' 
                ? `ሁሉንም ኮርሶች እና እድገትዎን ይመልከቱ (ክፍል ${student?.grade || '?'})`
                : `View all your enrolled courses and progress (Grade ${student?.grade || '?'})`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Student ID: {STUDENT_ID}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {displayLanguage === 'amharic' ? `ክፍል ${student?.grade}` : `Grade ${student?.grade}`}
              </span>
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
        {stats.totalCourses > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {displayLanguage === 'amharic' ? 'አጠቃላይ ኮርሶች' : 'Total Courses'}
                    </p>
                    <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {displayLanguage === 'amharic' ? 'አማካይ እድገት' : 'Avg Progress'}
                    </p>
                    <p className="text-2xl font-bold text-green-600">{stats.averageProgress}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {displayLanguage === 'amharic' ? 'የተጠናቀቁ ተግባራት' : 'Completed Tasks'}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">{stats.completedTasks}/{stats.totalTasks}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {displayLanguage === 'amharic' ? 'አማካይ ውጤት' : 'Avg Score'}
                    </p>
                    <p className="text-2xl font-bold text-purple-600">{Math.round(stats.averageScore)}%</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {displayLanguage === 'amharic' ? 'ምንም ኮርሶች አልተመደቡም' : 'No courses assigned yet'}
              </h3>
              <p className="text-muted-foreground text-center">
                {displayLanguage === 'amharic' 
                  ? 'ኮርሶችዎ አስተማሪዎ ሲመዘግቧቸው እዚህ ይታያሉ።'
                  : 'Your courses will appear here once your tutor enrolls you in courses.'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={refreshData}
              >
                {displayLanguage === 'amharic' ? 'እንደገና ይሞክሩ' : 'Check Again'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const courseColor = getCourseColor(course.code)
              const courseBgColor = getCourseBgColor(course.code)
              const pendingTasks = course.totalTasks - course.completedTasks
              const isCompleted = course.progress === 100

              return (
                <Card key={course.id} className="hover:shadow-lg transition-all hover:border-primary/50 group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`${courseBgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                        <BookOpen className={`h-6 w-6 ${courseColor}`} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {course.code}
                        </Badge>
                        {isCompleted && (
                          <Badge className="bg-green-500 text-white text-xs">
                            {displayLanguage === 'amharic' ? 'ተጠናቋል' : 'Completed'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="mt-4 text-xl">{course.name}</CardTitle>
                    
                  </CardHeader>
                  <CardContent className="space-y-4">
                   
                   

                   

                    {/* Average Score if available */}
                    {course.averageScore > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {displayLanguage === 'amharic' ? 'አማካይ ውጤት' : 'Average Score'}
                        </span>
                        <Badge variant="outline" className="bg-secondary/10">
                          {course.averageScore}%
                        </Badge>
                      </div>
                    )}

                    {/* Action Button */}
                    
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}