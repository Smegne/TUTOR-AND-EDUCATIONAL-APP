"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  User, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  GraduationCap,
  TrendingUp,
  Award,
  Clock,
  Target,
  Sparkles,
  Star,
  ChevronRight,
  Filter,
  Search,
  Brain,
  Zap,
  ImageIcon
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface ChildCourse {
  id: string
  name: string
  englishName: string
  amharicName: string
  code: string
  grade: number
  description: string
  completionRate: number
  avgScore: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  color: string
  bgColor: string
  bannerImage?: string
  icon?: string
}

interface ChildStats {
  overallCompletionRate: number
  averageScore: number
  totalCourses: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  topPerformingCourse?: ChildCourse
  needsAttentionCourse?: ChildCourse
}

interface Child {
  id: string
  name: string
  email?: string
  grade: number
  courses: ChildCourse[]
  stats: ChildStats
  displayLanguage?: 'amharic' | 'english'
}

export default function ParentCoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Get parent ID
  const getParentId = useCallback(() => {
    if ((user as any)?.lookupId) return (user as any).lookupId
    if ((user as any)?.userId) return (user as any).userId
    if ((user as any)?.parentId) return (user as any).parentId
    if (user?.id) return user.id
    return null
  }, [user])

  const PARENT_ID = getParentId()

  // Redirect if no parent ID
  useEffect(() => {
    if (!PARENT_ID && !loading) {
      toast.error("Parent ID not found. Please log in again.")
      router.push("/login")
    }
  }, [PARENT_ID, loading, router])

  const fetchParentChildrenCourses = useCallback(async (showToast = true) => {
    if (!PARENT_ID) {
      setError("No parent ID available")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log("🎯 Fetching children courses for parent:", PARENT_ID)
      
      const response = await fetch(`/api/parent-direct/${PARENT_ID}/children-courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      console.log("📊 Response status:", response.status)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Parent not found")
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
        throw new Error(data.error || 'Failed to fetch children courses')
      }
      
      setChildren(data.children || [])
      
      if (showToast) {
        if (data.children?.length > 0) {
          toast.success(`Loaded courses for ${data.children.length} children`)
        } else {
          toast.info("No children linked yet")
        }
      }
      
    } catch (error) {
      console.error('❌ Fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load children courses'
      setError(errorMessage)
      
      if (showToast) {
        toast.error(errorMessage)
      }
      
      setChildren([])
      
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [PARENT_ID])

  useEffect(() => {
    if (PARENT_ID) {
      fetchParentChildrenCourses(false)
    }
  }, [PARENT_ID, fetchParentChildrenCourses])

  const refreshData = () => {
    setRefreshing(true)
    toast.info("Refreshing courses data...")
    fetchParentChildrenCourses(true)
  }

  const getCourseColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "text-blue-500"
    if (courseCode.includes('ENG')) return "text-green-500"
    if (courseCode.includes('SCI')) return "text-purple-500"
    if (courseCode.includes('AMH')) return "text-red-500"
    if (courseCode.includes('CIT')) return "text-orange-500"
    if (courseCode.includes('SOC')) return "text-yellow-500"
    if (courseCode.includes('PVA')) return "text-pink-500"
    if (courseCode.includes('HPE')) return "text-teal-500"
    if (courseCode.includes('IT')) return "text-indigo-500"
    if (courseCode.includes('CIV')) return "text-orange-500"
    if (courseCode.includes('ART')) return "text-pink-500"
    if (courseCode.includes('SPT')) return "text-teal-500"
    if (courseCode.includes('GEZ')) return "text-indigo-500"
    return "text-primary"
  }

  const getCourseBgColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "bg-blue-500/10"
    if (courseCode.includes('ENG')) return "bg-green-500/10"
    if (courseCode.includes('SCI')) return "bg-purple-500/10"
    if (courseCode.includes('AMH')) return "bg-red-500/10"
    if (courseCode.includes('CIT')) return "bg-orange-500/10"
    if (courseCode.includes('SOC')) return "bg-yellow-500/10"
    if (courseCode.includes('PVA')) return "bg-pink-500/10"
    if (courseCode.includes('HPE')) return "bg-teal-500/10"
    if (courseCode.includes('IT')) return "bg-indigo-500/10"
    if (courseCode.includes('CIV')) return "bg-orange-500/10"
    if (courseCode.includes('ART')) return "bg-pink-500/10"
    if (courseCode.includes('SPT')) return "bg-teal-500/10"
    if (courseCode.includes('GEZ')) return "bg-indigo-500/10"
    return "bg-primary/10"
  }

  const getPerformanceText = (score: number) => {
    if (score >= 90) return { text: "Excellent", color: "text-green-600" }
    if (score >= 80) return { text: "Very Good", color: "text-blue-600" }
    if (score >= 70) return { text: "Good", color: "text-yellow-600" }
    if (score >= 60) return { text: "Average", color: "text-orange-600" }
    return { text: "Needs Improvement", color: "text-red-600" }
  }

  const getGradeLabel = (grade: number) => {
    if (grade >= 7) return `${grade} (ሁለተኛ ደረጃ)`
    return `${grade} (አንደኛ ደረጃ)`
  }

  const getCourseBanner = (course: ChildCourse): string => {
    if (course.bannerImage) {
      return course.bannerImage
    }
    
    if (course.code.includes('MATH')) return '/images/courses/mathematics-banner.jpg'
    if (course.code.includes('ENG')) return '/images/courses/english-banner.jpg'
    if (course.code.includes('SCI')) return '/images/courses/science-banner.jpg'
    if (course.code.includes('AMH')) return '/images/courses/amharic-banner.jpg'
    if (course.code.includes('CIT') || course.code.includes('CIV')) return '/images/courses/citizenship-banner.jpg'
    if (course.code.includes('SPT') || course.code.includes('HPE')) return '/images/courses/sports-banner.jpg'
    if (course.code.includes('ART') || course.code.includes('PVA')) return '/images/courses/arts-banner.jpg'
    if (course.code.includes('GEZ')) return '/images/courses/geez-banner.jpg'
    if (course.code.includes('SOC')) return '/images/courses/social-banner.jpg'
    if (course.code.includes('IT')) return '/images/courses/it-banner.jpg'
    
    return '/images/courses/default-banner.jpg'
  }

  const filteredChildren = selectedChild === 'all' 
    ? children 
    : children.filter(c => c.id === selectedChild)

  const filteredCourses = (courses: ChildCourse[]) => {
    if (!searchQuery) return courses
    const query = searchQuery.toLowerCase()
    return courses.filter(course => 
      course.name.toLowerCase().includes(query) ||
      course.englishName?.toLowerCase().includes(query) ||
      course.amharicName?.toLowerCase().includes(query) ||
      course.code.toLowerCase().includes(query)
    )
  }

  // Loading state
  if (loading && children.length === 0) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading children's courses...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait while we fetch your children's enrolled courses
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error && children.length === 0) {
    return (
      <DashboardLayout role="parent">
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
              <Button variant="outline" onClick={() => router.push('/dashboard/parent')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Children's Courses</h1>
            <p className="text-muted-foreground">
              View all courses your children are enrolled in and track their progress
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {children.length > 0 && (
              <select 
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
              >
                <option value="all">All Children</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name} (Grade {child.grade})
                  </option>
                ))}
              </select>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-3 w-3" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>

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

        {/* Search Filter */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search courses by name or code..."
                    className="w-full pl-9 pr-4 py-2 border rounded-md text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredChildren.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No children found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {selectedChild !== 'all' 
                  ? "No data available for the selected child."
                  : "Your children's courses will appear here once they are enrolled in the system."}
              </p>
              {selectedChild !== 'all' && (
                <Button variant="outline" className="mt-4" onClick={() => setSelectedChild('all')}>
                  View All Children
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredChildren.map((child) => {
            const filteredCoursesList = filteredCourses(child.courses)
            if (filteredCoursesList.length === 0) return null

            return (
              <div key={child.id} className="space-y-6">
                {/* Child Header with Stats */}
                <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-xl p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-2xl font-bold">
                        {child.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{child.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary" className="gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {getGradeLabel(child.grade)}
                          </Badge>
                          {child.email && (
                            <span className="text-sm text-muted-foreground">{child.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Overall Progress</div>
                        {/* <div className="text-3xl font-bold text-primary">
                          {child.stats.overallCompletionRate}%
                        </div> */}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Average Score</div>
                        {/* <div className={`text-3xl font-bold ${
                          getPerformanceText(child.stats.averageScore).color
                        }`}>
                          {child.stats.averageScore}%
                        </div> */}
                      </div>
                    </div>
                  </div>
                  
                  {/* Child Stats Grid */}
                  {/* <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Courses</div>
                      <div className="text-2xl font-bold">{child.stats.totalCourses}</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Total Tasks</div>
                      <div className="text-2xl font-bold">{child.stats.totalTasks}</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Completed</div>
                      <div className="text-2xl font-bold text-green-600">{child.stats.completedTasks}</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Pending</div>
                      <div className="text-2xl font-bold text-yellow-600">{child.stats.pendingTasks}</div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground mb-1">Performance</div>
                      <div className={`text-lg font-bold ${
                        getPerformanceText(child.stats.averageScore).color
                      }`}>
                        {getPerformanceText(child.stats.averageScore).text}
                      </div>
                    </div>
                  </div> */}
                </div>

                {/* Courses Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCoursesList.map((course) => {
                    const courseColor = getCourseColor(course.code)
                    const performance = getPerformanceText(course.avgScore)
                    const bannerImage = getCourseBanner(course)
                    const pendingTasks = course.pendingTasks

                    return (
                      <Card 
                        key={course.id} 
                        className="hover:shadow-lg transition-all hover:border-primary/50 group overflow-hidden"
                      >
                        {/* Banner Image Section */}
                        <div className="relative h-36 w-full overflow-hidden bg-muted">
                          {bannerImage ? (
                            <Image
                              src={bannerImage}
                              alt={course.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-muted">
                              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                          )}
                          
                          {/* Overlay with course code */}
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Badge variant="secondary" className="shadow-lg">
                              Grade {course.grade}
                            </Badge>
                            <Badge variant="outline" className="bg-background/80 shadow-lg font-mono">
                              {course.code}
                            </Badge>
                          </div>

                          {/* Completion indicator */}
                          {course.completionRate > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${course.completionRate}%` }}
                              />
                            </div>
                          )}
                        </div>

                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{course.name}</CardTitle>
                          </div>
                          <CardDescription className="line-clamp-2 text-xs">
                            {course.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* Progress Bar */}
                         

                          {/* Tasks and Score Info */}
                          {/* <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <BookOpen className="h-3 w-3" />
                              <span>
                                {course.completedTasks}/{course.totalTasks} tasks
                              </span>
                            </div>
                            
                            {course.avgScore > 0 && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Award className="h-3 w-3" />
                                <span className={performance.color}>
                                  {course.avgScore}% avg
                                </span>
                              </div>
                            )}
                          </div> */}

                          {/* Pending Tasks Badge */}
                          {pendingTasks > 0 && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-md">
                              <Clock className="h-3 w-3" />
                              <span>
                                {pendingTasks} {pendingTasks === 1 ? 'task' : 'tasks'} pending
                              </span>
                            </div>
                          )}

                          {/* Score Performance Badge */}
                          {course.avgScore > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Performance</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${performance.color} border-current/20`}
                              >
                                {performance.text}
                              </Badge>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                router.push(`/dashboard/parent/tasks?child=${child.id}&course=${course.id}`)
                              }}
                            >
                              View Tasks
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                router.push(`/dashboard/parent/status?child=${child.id}&course=${course.id}`)
                              }}
                            >
                              Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

               
              </div>
            )
          })
        )}
      </div>
    </DashboardLayout>
  )
}