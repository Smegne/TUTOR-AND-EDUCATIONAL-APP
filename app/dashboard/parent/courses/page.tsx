// app/dashboard/parent/courses/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  User, 
  Loader2, 
  AlertCircle, 
  Database, 
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
  Zap
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"

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
}

export default function ParentCoursesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Get parent ID using the same pattern as other pages
  const getParentId = useCallback(() => {
    if ((user as any)?.lookupId) return (user as any).lookupId
    if ((user as any)?.userId) return (user as any).userId
    if ((user as any)?.parentId) return (user as any).parentId
    if (user?.id) return user.id
    return 'p_mm86u06x_974nf' // Fallback
  }, [user])

  const PARENT_ID = getParentId()

  const fetchParentChildrenCourses = useCallback(async (showToast = true) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🎯 [PARENT COURSES] Fetching for parent:", PARENT_ID)
      
      const response = await fetch(`/api/parent-direct/${PARENT_ID}/children-courses`)
      
      console.log("📊 [PARENT COURSES] Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("✅ [PARENT COURSES] API Response:", data)
        
        if (data.success) {
          setChildren(data.children || [])
          setUsingMockData(false)
          
          if (showToast && data.children?.length > 0) {
            toast.success(`Loaded courses for ${data.children.length} children`)
          } else if (showToast && data.children?.length === 0) {
            toast.info("No children linked yet")
          }
        } else {
          throw new Error(data.error || 'Failed to fetch children courses')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ [PARENT COURSES] Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load children courses')
      setUsingMockData(true)
      
      // Load mock data
      const mockData = getMockChildrenData()
      setChildren(mockData)
      
      if (showToast) {
        toast.error("Failed to load real data. Using demo data.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [PARENT_ID])

  useEffect(() => {
    fetchParentChildrenCourses(false)
  }, [fetchParentChildrenCourses])

  const getMockChildrenData = (): Child[] => {
    return [
      {
        id: "student_001",
        name: "Abel Tesfaye",
        grade: 8,
        email: "abel@example.com",
        courses: getMockCoursesForGrade(8),
        stats: calculateChildStats(getMockCoursesForGrade(8))
      },
      {
        id: "student_002",
        name: "Emma Wilson",
        grade: 5,
        email: "emma@example.com",
        courses: getMockCoursesForGrade(5),
        stats: calculateChildStats(getMockCoursesForGrade(5))
      }
    ]
  }

  const getMockCoursesForGrade = (grade: number): ChildCourse[] => {
    if (grade >= 7) {
      // Grade 7-8 courses
      const courses = [
        { id: 'math', name: 'Mathematics', code: 'MATH', color: 'blue', baseDesc: 'Basic arithmetic, geometry, and problem solving' },
        { id: 'english', name: 'English', code: 'ENG', color: 'green', baseDesc: 'Reading, writing, and communication skills' },
        { id: 'amharic', name: 'Amharic', code: 'AMH', color: 'red', baseDesc: 'Amharic language and literature' },
        { id: 'general_science', name: 'General Science', code: 'SCI', color: 'purple', baseDesc: 'Introduction to biology, physics, and chemistry' },
        { id: 'citizenship', name: 'Citizenship', code: 'CIT', color: 'orange', baseDesc: 'Civic education and ethical values' },
        { id: 'social_science', name: 'Social Science', code: 'SOC', color: 'yellow', baseDesc: 'History, geography, and social studies' },
        { id: 'pva', name: 'PVA', code: 'PVA', color: 'pink', baseDesc: 'Physical and vocational arts education' },
        { id: 'hpe', name: 'HPE', code: 'HPE', color: 'teal', baseDesc: 'Health and physical education' },
        { id: 'it', name: 'IT', code: 'IT', color: 'indigo', baseDesc: 'Information technology and computer basics' }
      ]
      
      return courses.map(course => ({
        id: `${course.id}_g${grade}`,
        name: course.name,
        englishName: course.name,
        amharicName: getAmharicName(course.id),
        code: `${course.code}-G${grade}`,
        grade: grade,
        description: course.baseDesc,
        completionRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        avgScore: Math.floor(Math.random() * 30) + 70, // 70-100%
        totalTasks: Math.floor(Math.random() * 20) + 10, // 10-30
        completedTasks: Math.floor(Math.random() * 15) + 5, // 5-20
        pendingTasks: 0,
        color: course.color,
        bgColor: `${course.color}-500/10`
      })).map(course => ({
        ...course,
        pendingTasks: course.totalTasks - course.completedTasks
      }))
    } else {
      // Grade 5-6 courses
      const courses = [
        { id: 'math', name: 'ሂሳብ', englishName: 'Mathematics', code: 'MATH', color: 'blue', desc: 'መሰረታዊ ሒሳብ፣ ጂኦሜትሪ እና ችግር መፍታት' },
        { id: 'english', name: 'እንግሊዝኛ', englishName: 'English', code: 'ENG', color: 'green', desc: 'ማንበብ፣ መጻፍ እና የንግግር ክህሎቶች' },
        { id: 'amharic', name: 'አማርኛ', englishName: 'Amharic', code: 'AMH', color: 'red', desc: 'የአማርኛ ቋንቋ እና ስነጽሁፍ' },
        { id: 'environmental_science', name: 'አካባቢ ሳይንስ', englishName: 'Environmental Science', code: 'SCI', color: 'purple', desc: 'የተፈጥሮ ሳይንስ መሰረታዊ እውቀት' },
        { id: 'civics', name: 'ግብረ ግብ', englishName: 'Civics', code: 'CIV', color: 'orange', desc: 'የሲቪክ ትምህርት እና ስነምግባር' },
        { id: 'arts', name: 'ስነ ጥበብ', englishName: 'Arts', code: 'ART', color: 'pink', desc: 'ስነጥበብ እና ፈጠራዊ ሥራዎች' },
        { id: 'sports', name: 'ስፖርት', englishName: 'Sports', code: 'SPT', color: 'teal', desc: 'አካላዊ ትምህርት እና የስፖርት እንቅስቃሴዎች' },
        { id: 'geez', name: 'ግዕዝ', englishName: 'Geez', code: 'GEZ', color: 'indigo', desc: 'የግዕዝ ቋንቋ እና ሥነ ጽሑፍ' }
      ]
      
      return courses.map(course => ({
        id: `${course.id}_g${grade}`,
        name: course.name,
        englishName: course.englishName,
        amharicName: course.name,
        code: `${course.code}-G${grade}`,
        grade: grade,
        description: course.desc,
        completionRate: Math.floor(Math.random() * 40) + 60,
        avgScore: Math.floor(Math.random() * 30) + 70,
        totalTasks: Math.floor(Math.random() * 20) + 10,
        completedTasks: Math.floor(Math.random() * 15) + 5,
        pendingTasks: 0,
        color: course.color,
        bgColor: `${course.color}-500/10`
      })).map(course => ({
        ...course,
        pendingTasks: course.totalTasks - course.completedTasks
      }))
    }
  }

  const getAmharicName = (courseId: string): string => {
    const map: Record<string, string> = {
      'math': 'ሂሳብ',
      'english': 'እንግሊዝኛ',
      'amharic': 'አማርኛ',
      'general_science': 'አጠቃላይ ሳይንስ',
      'citizenship': 'ስነምግባር',
      'social_science': 'ህብረተሰብ ሳይንስ',
      'pva': 'ስነጥበብ',
      'hpe': 'ስፖርት',
      'it': 'ኢንፎርሜሽን ቴክኖሎጂ'
    }
    return map[courseId] || courseId
  }

  const calculateChildStats = (courses: ChildCourse[]): ChildStats => {
    const totalTasks = courses.reduce((sum, c) => sum + c.totalTasks, 0)
    const completedTasks = courses.reduce((sum, c) => sum + c.completedTasks, 0)
    const totalScore = courses.reduce((sum, c) => sum + (c.avgScore * c.totalTasks), 0)
    
    const sortedByScore = [...courses].sort((a, b) => b.avgScore - a.avgScore)
    const sortedByCompletion = [...courses].sort((a, b) => a.completionRate - b.completionRate)

    return {
      overallCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      averageScore: totalTasks > 0 ? Math.round(totalScore / totalTasks) : 0,
      totalCourses: courses.length,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      topPerformingCourse: sortedByScore[0],
      needsAttentionCourse: sortedByCompletion[0]
    }
  }

  const refreshData = () => {
    toast.info("Refreshing courses data...")
    setRefreshing(true)
    fetchParentChildrenCourses()
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

  if (loading && children.length === 0) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading children's courses...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Parent ID: {PARENT_ID}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData && children.length === 0) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center max-w-md space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Unable to Load Courses</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Parent ID: {PARENT_ID}
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={refreshData} className="gap-2" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Try Again'}
              </Button>
              <Button variant="outline" onClick={() => {
                setChildren(getMockChildrenData())
                setUsingMockData(true)
                setError(null)
                toast.info("Using demo data")
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
    <DashboardLayout role="parent">
      {/* Database Status Banner */}
      {usingMockData && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3">
          <div className="flex items-center justify-between gap-2 text-yellow-700">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Using demo data</span>
              <span className="text-xs">(Real data unavailable)</span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={refreshData}
              className="h-7 text-yellow-700 border-yellow-300"
              disabled={refreshing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Retry Connection
            </Button>
          </div>
        </div>
      )}
      
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Children's Courses</h1>
            <p className="text-muted-foreground">
              View all courses your children are enrolled in and track their progress
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Parent ID: {PARENT_ID} • {children.length} child{children.length !== 1 ? 'ren' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
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
              <p className="text-muted-foreground text-center">
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
                            Grade {child.grade}
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
                        <div className="text-3xl font-bold text-primary">
                          {child.stats.overallCompletionRate}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Average Score</div>
                        <div className={`text-3xl font-bold ${
                          getPerformanceText(child.stats.averageScore).color
                        }`}>
                          {child.stats.averageScore}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Child Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
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
                      <div className={`text-xl font-bold ${
                        getPerformanceText(child.stats.averageScore).color
                      }`}>
                        {getPerformanceText(child.stats.averageScore).text}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Courses Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCoursesList.map((course) => {
                    const courseColor = getCourseColor(course.code)
                    const courseBgColor = getCourseBgColor(course.code)
                    const performance = getPerformanceText(course.avgScore)

                    return (
                      <Card key={course.id} className="hover:shadow-lg transition-all hover:border-primary/50 group">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className={`${courseBgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                              <BookOpen className={`h-5 w-5 ${courseColor}`} />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Grade {course.grade}
                              </Badge>
                              <Badge variant="outline" className="font-mono text-xs">
                                {course.code}
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="mt-4 text-xl">{course.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {course.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold">{course.completionRate}%</span>
                            </div>
                            <Progress value={course.completionRate} className="h-2" />
                          </div>

                          {/* Tasks Stats */}
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-muted/50 rounded-lg p-2">
                              <div className="text-lg font-bold">{course.completedTasks}</div>
                              <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                            <div className="bg-primary/10 rounded-lg p-2">
                              <div className="text-lg font-bold text-primary">{course.pendingTasks}</div>
                              <div className="text-xs text-muted-foreground">Pending</div>
                            </div>
                          </div>

                          {/* Score and Performance */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Average Score</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${performance.color}`}>
                                {course.avgScore}%
                              </span>
                              <Badge variant="outline" className={`text-xs ${performance.color}`}>
                                {performance.text}
                              </Badge>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                window.location.href = `/dashboard/parent/tasks?child=${child.id}&course=${course.id}`
                              }}
                            >
                              View Tasks
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                window.location.href = `/dashboard/parent/status?child=${child.id}&course=${course.id}`
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

                {/* Course Insights */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Top Performing Course */}
                  {child.stats.topPerformingCourse && (
                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                          <Award className="h-5 w-5" />
                          Top Performing Course
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{child.stats.topPerformingCourse.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {child.stats.topPerformingCourse.code}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Score: {child.stats.topPerformingCourse.avgScore}%
                              </Badge>
                              <Badge variant="outline">
                                Progress: {child.stats.topPerformingCourse.completionRate}%
                              </Badge>
                            </div>
                          </div>
                          <Sparkles className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Needs Attention Course */}
                  {child.stats.needsAttentionCourse && child.stats.needsAttentionCourse.completionRate < 70 && (
                    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                          <Target className="h-5 w-5" />
                          Needs Attention
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{child.stats.needsAttentionCourse.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {child.stats.needsAttentionCourse.code}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                Progress: {child.stats.needsAttentionCourse.completionRate}%
                              </Badge>
                              <Badge variant="outline">
                                Pending: {child.stats.needsAttentionCourse.pendingTasks} tasks
                              </Badge>
                            </div>
                          </div>
                          <Brain className="h-8 w-8 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </DashboardLayout>
  )
}

// Button component import
import { Button } from "@/components/ui/button"