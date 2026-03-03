"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  CheckCircle, 
  PlayCircle, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
  Star,
  ImageIcon
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
  bannerImage?: string  // New field for course banner image
}

interface StudentInfo {
  id: string
  name: string
  email: string
  grade: number
}

interface Stats {
  totalCourses: number
  averageProgress: number
  totalTasks: number
  completedTasks: number
  averageScore: number
}

export default function StudentCoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [displayLanguage, setDisplayLanguage] = useState<'amharic' | 'english'>('english')
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    averageProgress: 0,
    totalTasks: 0,
    completedTasks: 0,
    averageScore: 0
  })

  // Get student ID from authenticated user
  const getStudentId = useCallback(() => {
    if ((user as any)?.studentId) return (user as any).studentId
    if ((user as any)?.userId) return (user as any).userId
    if (user?.id) return user.id
    return null
  }, [user])

  const STUDENT_ID = getStudentId()

  // Redirect if no student ID
  useEffect(() => {
    if (!STUDENT_ID && !loading) {
      toast.error("Student ID not found. Please log in again.")
      router.push("/login")
    }
  }, [STUDENT_ID, loading, router])

  const fetchStudentCourses = useCallback(async (showToast = true) => {
    if (!STUDENT_ID) {
      setError("No student ID available")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log("🎯 Fetching courses for student:", STUDENT_ID)
      
      const response = await fetch(`/api/student-direct/${STUDENT_ID}/courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      console.log("📊 Response status:", response.status)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Student not found")
        }
        if (response.status === 401) {
          throw new Error("Unauthorized access")
        }
        if (response.status === 500) {
          throw new Error("Server error. Please try again later.")
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("✅ API Response received")
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch courses')
      }
      
      // Update state with real data from API
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
      
      // Show success message if courses were loaded
      if (showToast) {
        if (data.courses?.length > 0) {
          toast.success(`Successfully loaded ${data.courses.length} courses`)
        } else {
          toast.info("No courses available for your grade level")
        }
      }
      
    } catch (error) {
      console.error('❌ Fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load courses'
      setError(errorMessage)
      
      if (showToast) {
        toast.error(errorMessage)
      }
      
      // Clear any existing data on error
      setCourses([])
      setStudent(null)
      setStats({
        totalCourses: 0,
        averageProgress: 0,
        totalTasks: 0,
        completedTasks: 0,
        averageScore: 0
      })
      
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [STUDENT_ID])

  // Initial fetch
  useEffect(() => {
    if (STUDENT_ID) {
      fetchStudentCourses(false)
    }
  }, [STUDENT_ID, fetchStudentCourses])

  const refreshData = () => {
    setRefreshing(true)
    toast.info("Refreshing courses...")
    fetchStudentCourses(true)
  }

  const handleCourseClick = (course: Course) => {
    router.push(course.tasksUrl || `/dashboard/student/courses/${course.id}`)
  }

  const getCourseColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "text-blue-500"
    if (courseCode.includes('ENG')) return "text-green-500"
    if (courseCode.includes('SCI')) return "text-purple-500"
    if (courseCode.includes('AMH')) return "text-red-500"
    if (courseCode.includes('CIT') || courseCode.includes('CIV')) return "text-orange-500"
    if (courseCode.includes('SPT') || courseCode.includes('HPE')) return "text-pink-500"
    if (courseCode.includes('ART') || courseCode.includes('PVA')) return "text-yellow-500"
    if (courseCode.includes('GEZ')) return "text-indigo-500"
    if (courseCode.includes('SOC')) return "text-teal-500"
    if (courseCode.includes('IT')) return "text-cyan-500"
    return "text-primary"
  }

  const getCourseBgColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "bg-blue-500/10"
    if (courseCode.includes('ENG')) return "bg-green-500/10"
    if (courseCode.includes('SCI')) return "bg-purple-500/10"
    if (courseCode.includes('AMH')) return "bg-red-500/10"
    if (courseCode.includes('CIT') || courseCode.includes('CIV')) return "bg-orange-500/10"
    if (courseCode.includes('SPT') || courseCode.includes('HPE')) return "bg-pink-500/10"
    if (courseCode.includes('ART') || courseCode.includes('PVA')) return "bg-yellow-500/10"
    if (courseCode.includes('GEZ')) return "bg-indigo-500/10"
    if (courseCode.includes('SOC')) return "bg-teal-500/10"
    if (courseCode.includes('IT')) return "bg-cyan-500/10"
    return "bg-primary/10"
  }

  // Get default banner image based on course code
  const getCourseBanner = (course: Course): string => {
    // If API provides banner image, use it
    if (course.bannerImage) {
      return course.bannerImage
    }
    
    // Otherwise, return subject-specific default banners
    if (course.code.includes('MATH')) return '/images/courses/math-banner.jpg'
    if (course.code.includes('ENG')) return '/images/courses/english-banner.jpg'
    if (course.code.includes('SCI')) return '/images/courses/science-banner.jpg'
    if (course.code.includes('AMH')) return '/images/courses/amharic-banner.jpg'
    if (course.code.includes('CIT') || course.code.includes('CIV')) return '/images/courses/civics-banner.jpg'
    if (course.code.includes('SPT') || course.code.includes('HPE')) return '/images/courses/sports-banner.jpg'
    if (course.code.includes('ART') || course.code.includes('PVA')) return '/images/courses/arts-banner.jpg'
    if (course.code.includes('GEZ')) return '/images/courses/geez-banner.jpg'
    if (course.code.includes('SOC')) return '/images/courses/social-banner.jpg'
    if (course.code.includes('IT')) return '/images/courses/it-banner.jpg'
    
    // Default banner
    return '/images/courses/default-banner.jpg'
  }

  // Loading state
  if (loading && !courses.length) {
    return (
      <DashboardLayout role="student" studentName={user?.firstName}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading your courses...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we fetch your enrolled courses
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state with retry option
  if (error && !courses.length) {
    return (
      <DashboardLayout role="student" studentName={user?.firstName}>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Failed to Load Courses</CardTitle>
              </div>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button onClick={refreshData} disabled={refreshing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Retrying...' : 'Try Again'}
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/student')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="student" studentName={student?.name || user?.firstName}>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">
              {displayLanguage === 'amharic' ? 'የእኔ ኮርሶች' : 'My Courses'}
            </h1>
            <p className="text-muted-foreground">
              {displayLanguage === 'amharic' 
                ? `ሁሉንም ኮርሶች እና እድገትዎን ይመልከቱ ${student?.grade ? `(ክፍል ${student.grade})` : ''}`
                : `View all your enrolled courses and progress ${student?.grade ? `(Grade ${student.grade})` : ''}`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {student?.grade && (
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {displayLanguage === 'amharic' ? `ክፍል ${student.grade}` : `Grade ${student.grade}`}
                </span>
              </div>
            )}
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

        {/* Stats Overview - Only show if there are courses */}
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
                    <p className="text-2xl font-bold text-green-600">{Math.round(stats.averageProgress)}%</p>
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
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.completedTasks}/{stats.totalTasks}
                    </p>
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
                {displayLanguage === 'amharic' ? 'ምንም ኮርሶች አልተመደቡም' : 'No Courses Available'}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {displayLanguage === 'amharic' 
                  ? 'እስካሁን ድረስ ምንም ኮርሶች አልተመደቡም። እባክዎ ከአስተማሪዎ ወይም ከአስተዳዳሪዎ ጋር ያነጋግሩ።'
                  : 'No courses have been assigned to you yet. Please contact your teacher or administrator.'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4 gap-2"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Checking...' : (displayLanguage === 'amharic' ? 'እንደገና ይሞክሩ' : 'Check Again')}
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
              const bannerImage = getCourseBanner(course)

              return (
                <Card 
                  key={course.id} 
                  className="hover:shadow-lg transition-all hover:border-primary/50 group cursor-pointer overflow-hidden"
                  onClick={() => handleCourseClick(course)}
                >
                  {/* Banner Image Section */}
                  <div className="relative h-60 w-full overflow-hidden bg-muted">
                    {bannerImage ? (
                      <Image
                        src={bannerImage}
                        alt={course.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={(e) => {
                          // If image fails to load, show fallback
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Overlay with course code */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="shadow-lg">
                        {course.code}
                      </Badge>
                    </div>

                    {/* Progress indicator overlay */}
                    {course.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                     
                      <div className="flex flex-col items-end gap-1">
                        {isCompleted && (
                          <Badge className="bg-green-500 text-white text-xs">
                            {displayLanguage === 'amharic' ? 'ተጠናቋል' : 'Completed'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-lg">{course.name}</CardTitle>
                    
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Progress Bar */}
                   

                    {/* Tasks and Score Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                     
                      
                      {course.averageScore > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Award className="h-3 w-3" />
                          <span>{Math.round(course.averageScore)}% avg</span>
                        </div>
                      )}
                    </div>

                    {/* Pending Tasks Badge */}
                    {pendingTasks > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-md">
                        <Clock className="h-3 w-3" />
                        <span>
                          {pendingTasks} {pendingTasks === 1 ? 'task' : 'tasks'} pending
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      className="w-full gap-2 mt-2 text-sm"
                      size="sm"
                      variant={pendingTasks > 0 ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCourseClick(course)
                      }}
                    >
                      {pendingTasks > 0 ? (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" />
                          {displayLanguage === 'amharic' ? 'ቀጥል' : 'Continue'}
                        </>
                      ) : isCompleted ? (
                        <>
                          <Star className="h-3.5 w-3.5" />
                          {displayLanguage === 'amharic' ? 'ገምግም' : 'Review'}
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-3.5 w-3.5" />
                          {displayLanguage === 'amharic' ? 'ጀምር' : 'Start'}
                        </>
                      )}
                    </Button>
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