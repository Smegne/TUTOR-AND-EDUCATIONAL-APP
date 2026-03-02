// app/dashboard/tutor/courses/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  Users, 
  ListTodo, 
  Plus, 
  Loader2, 
  AlertCircle, 
  Database, 
  RefreshCw, 
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Award,
  Clock,
  Target,
  Sparkles,
  Filter,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Star,
  BarChart,
  PieChart,
  Download,
  Upload,
  Settings,
  HelpCircle
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { useRouter } from "next/navigation"
import { AddCourseModal } from "@/components/add-course-modal"
import { toast } from "sonner"

interface Course {
  id: string
  name: string
  englishName: string
  amharicName: string
  code: string
  grade: number
  description: string
  studentCount: number
  taskCount: number
  completedTasks: number
  avgScore: number
  totalPossibleCompletions: number
  completionRate: number
  color: string
  bgColor: string
  borderColor: string
}

interface CourseStats {
  [courseId: string]: {
    students: number
    tasks: number
    completedTasks: number
    avgScore: number
    totalPossibleCompletions: number
  }
}

interface GradeGroup {
  grade: number
  courses: Course[]
  totalStudents: number
  totalTasks: number
  avgCompletionRate: number
  avgScore: number
}

export default function TutorCoursesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats>({})
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean
    tablesExist: boolean
  } | null>(null)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  
  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'grade' | 'students' | 'completion'>('grade')
  const [showFilters, setShowFilters] = useState(false)

  // Get tutor ID
  const getTutorId = useCallback(() => {
    if ((user as any)?.tutorId) return (user as any).tutorId
    if ((user as any)?.userId) return (user as any).userId
    if (user?.id) return user.id
    return 'tutor_001'
  }, [user])

  const TUTOR_ID = getTutorId()

  // Define course templates by grade
  const getCourseTemplates = (grade: number) => {
    if (grade >= 7 && grade <= 8) {
      return [
        { id: 'math', name: 'Mathematics', amharicName: 'ሂሳብ', code: 'MATH', description: 'Basic arithmetic, geometry, and problem solving' },
        { id: 'english', name: 'English', amharicName: 'እንግሊዝኛ', code: 'ENG', description: 'Reading, writing, and communication skills' },
        { id: 'amharic', name: 'Amharic', amharicName: 'አማርኛ', code: 'AMH', description: 'Amharic language and literature' },
        { id: 'general_science', name: 'General Science', amharicName: 'አጠቃላይ ሳይንስ', code: 'SCI', description: 'Introduction to biology, physics, and chemistry' },
        { id: 'citizenship', name: 'Citizenship', amharicName: 'ስነምግባር', code: 'CIT', description: 'Civic education and ethical values' },
        { id: 'social_science', name: 'Social Science', amharicName: 'ህብረተሰብ ሳይንስ', code: 'SOC', description: 'History, geography, and social studies' },
        { id: 'pva', name: 'PVA', amharicName: 'ስነጥበብ', code: 'PVA', description: 'Physical and vocational arts education' },
        { id: 'hpe', name: 'HPE', amharicName: 'ስፖርት', code: 'HPE', description: 'Health and physical education' },
        { id: 'it', name: 'IT', amharicName: 'ኢንፎርሜሽን ቴክኖሎጂ', code: 'IT', description: 'Information technology and computer basics' }
      ]
    } else if (grade >= 5 && grade <= 6) {
      return [
        { id: 'math', name: 'ሂሳብ', englishName: 'Mathematics', code: 'MATH', description: 'መሰረታዊ ሒሳብ፣ ጂኦሜትሪ እና ችግር መፍታት' },
        { id: 'english', name: 'እንግሊዝኛ', englishName: 'English', code: 'ENG', description: 'ማንበብ፣ መጻፍ እና የንግግር ክህሎቶች' },
        { id: 'amharic', name: 'አማርኛ', englishName: 'Amharic', code: 'AMH', description: 'የአማርኛ ቋንቋ እና ስነጽሁፍ' },
        { id: 'environmental_science', name: 'አካባቢ ሳይንስ', englishName: 'Environmental Science', code: 'SCI', description: 'የተፈጥሮ ሳይንስ መሰረታዊ እውቀት' },
        { id: 'civics', name: 'ግብረ ግብ', englishName: 'Civics', code: 'CIV', description: 'የሲቪክ ትምህርት እና ስነምግባር' },
        { id: 'arts', name: 'ስነ ጥበብ', englishName: 'Arts', code: 'ART', description: 'ስነጥበብ እና ፈጠራዊ ሥራዎች' },
        { id: 'sports', name: 'ስፖርት', englishName: 'Sports', code: 'SPT', description: 'አካላዊ ትምህርት እና የስፖርት እንቅስቃሴዎች' },
        { id: 'geez', name: 'ግዕዝ', englishName: 'Geez', code: 'GEZ', description: 'የግዕዝ ቋንቋ እና ሥነ ጽሑፍ' }
      ]
    }
    return []
  }

  const fetchTutorCourses = useCallback(async (showToast = true) => {
    try {
      setLoading(true)
      setError(null)
      setRefreshing(true)
      
      console.log("🎯 [TUTOR COURSES] Fetching for tutor:", TUTOR_ID)
      
      // Test database connection
      try {
        const testResponse = await fetch('/api/test-db')
        const testData = await testResponse.json()
        
        setDbStatus({
          connected: testData.success && testData.connection,
          tablesExist: testData.tables?.courses || false
        })
        
        // Try to fetch real tutor courses
        const response = await fetch(`/api/tutor-direct/${TUTOR_ID}/courses`)
        
        console.log("📊 [TUTOR COURSES] Response status:", response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log("✅ [TUTOR COURSES] API Response:", data)
          
          if (data.success && data.courses?.length > 0) {
            setCourses(data.courses)
            setCourseStats(data.stats || {})
            setUsingMockData(false)
            
            if (showToast) {
              toast.success(`Loaded ${data.courses.length} courses`)
            }
          } else if (testData.sampleData?.courses > 0) {
            // Database has courses but tutor has none assigned
            setUsingMockData(true)
            setCourses([])
            if (showToast) {
              toast.info("No courses assigned to you yet")
            }
          } else {
            // No courses in database at all
            setUsingMockData(true)
            // Generate grade-appropriate courses based on common grades
            const mockCourses = generateMockCourses()
            setCourses(mockCourses)
            if (showToast) {
              toast.info("Using demo courses. Add your courses to get started!")
            }
          }
        } else {
          throw new Error(`API error: ${response.status}`)
        }
        
      } catch (dbError) {
        console.log('Database error, using mock data:', dbError)
        setUsingMockData(true)
        const mockCourses = generateMockCourses()
        setCourses(mockCourses)
        
        if (showToast) {
          toast.error("Failed to load real data. Using demo courses.")
        }
      }
    } catch (error) {
      console.error('❌ [TUTOR COURSES] Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load courses')
      setUsingMockData(true)
      const mockCourses = generateMockCourses()
      setCourses(mockCourses)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [TUTOR_ID])

  // Generate mock courses for all grades
  const generateMockCourses = (): Course[] => {
    const grades = [5, 6, 7, 8]
    let allCourses: Course[] = []
    
    grades.forEach(grade => {
      const templates = getCourseTemplates(grade)
      const courseCount = templates.length
      
      templates.forEach((template, index) => {
        const studentCount = Math.floor(Math.random() * 15) + 5 // 5-20 students
        const taskCount = Math.floor(Math.random() * 10) + 5 // 5-15 tasks
        const avgScore = Math.floor(Math.random() * 30) + 70 // 70-100%
        const completionRate = Math.floor(Math.random() * 40) + 60 // 60-100%
        const completedTasks = Math.floor((completionRate / 100) * taskCount * studentCount)
        
        allCourses.push({
          id: `${template.id}_g${grade}`,
          name: template.name,
          englishName: template.englishName || template.name,
          amharicName: template.amharicName || template.name,
          code: `${template.code}-G${grade}`,
          grade,
          description: template.description,
          studentCount,
          taskCount,
          completedTasks,
          avgScore,
          totalPossibleCompletions: studentCount * taskCount,
          completionRate,
          color: getCourseColor(template.code),
          bgColor: getCourseBgColor(template.code),
          borderColor: getCourseBorderColor(template.code)
        })
      })
    })
    
    return allCourses
  }

  useEffect(() => {
    fetchTutorCourses(false)
  }, [fetchTutorCourses])

  // Apply filters and search
  useEffect(() => {
    let filtered = [...courses]
    
    // Filter by grade
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(c => c.grade === parseInt(selectedGrade))
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(query) ||
        course.code.toLowerCase().includes(query) ||
        course.englishName?.toLowerCase().includes(query) ||
        course.amharicName?.toLowerCase().includes(query)
      )
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'grade':
          return a.grade - b.grade
        case 'students':
          return b.studentCount - a.studentCount
        case 'completion':
          return b.completionRate - a.completionRate
        default:
          return a.grade - b.grade
      }
    })
    
    setFilteredCourses(filtered)
  }, [courses, selectedGrade, searchQuery, sortBy])

  const refreshData = () => {
    toast.info("Refreshing courses...")
    fetchTutorCourses()
  }

  const getCourseColor = (code: string): string => {
    const colorMap: Record<string, string> = {
      'MATH': 'text-blue-600',
      'ENG': 'text-green-600',
      'AMH': 'text-red-600',
      'SCI': 'text-purple-600',
      'CIT': 'text-orange-600',
      'SOC': 'text-indigo-600',
      'PVA': 'text-teal-600',
      'HPE': 'text-cyan-600',
      'IT': 'text-amber-600',
      'CIV': 'text-orange-600',
      'ART': 'text-pink-600',
      'SPT': 'text-emerald-600',
      'GEZ': 'text-violet-600'
    }
    return colorMap[code] || 'text-primary'
  }

  const getCourseBgColor = (code: string): string => {
    const colorMap: Record<string, string> = {
      'MATH': 'bg-blue-50',
      'ENG': 'bg-green-50',
      'AMH': 'bg-red-50',
      'SCI': 'bg-purple-50',
      'CIT': 'bg-orange-50',
      'SOC': 'bg-indigo-50',
      'PVA': 'bg-teal-50',
      'HPE': 'bg-cyan-50',
      'IT': 'bg-amber-50',
      'CIV': 'bg-orange-50',
      'ART': 'bg-pink-50',
      'SPT': 'bg-emerald-50',
      'GEZ': 'bg-violet-50'
    }
    return colorMap[code] || 'bg-primary/5'
  }

  const getCourseBorderColor = (code: string): string => {
    const colorMap: Record<string, string> = {
      'MATH': 'border-blue-200',
      'ENG': 'border-green-200',
      'AMH': 'border-red-200',
      'SCI': 'border-purple-200',
      'CIT': 'border-orange-200',
      'SOC': 'border-indigo-200',
      'PVA': 'border-teal-200',
      'HPE': 'border-cyan-200',
      'IT': 'border-amber-200',
      'CIV': 'border-orange-200',
      'ART': 'border-pink-200',
      'SPT': 'border-emerald-200',
      'GEZ': 'border-violet-200'
    }
    return colorMap[code] || 'border-border'
  }

  const getGradeGroups = (): GradeGroup[] => {
    const groups: { [key: number]: GradeGroup } = {}
    
    filteredCourses.forEach(course => {
      if (!groups[course.grade]) {
        groups[course.grade] = {
          grade: course.grade,
          courses: [],
          totalStudents: 0,
          totalTasks: 0,
          avgCompletionRate: 0,
          avgScore: 0
        }
      }
      
      groups[course.grade].courses.push(course)
      groups[course.grade].totalStudents += course.studentCount
      groups[course.grade].totalTasks += course.taskCount
    })
    
    // Calculate averages
    Object.values(groups).forEach(group => {
      if (group.courses.length > 0) {
        group.avgCompletionRate = Math.round(
          group.courses.reduce((sum, c) => sum + c.completionRate, 0) / group.courses.length
        )
        group.avgScore = Math.round(
          group.courses.reduce((sum, c) => sum + c.avgScore, 0) / group.courses.length
        )
      }
    })
    
    return Object.values(groups).sort((a, b) => a.grade - b.grade)
  }

  const handleManageCourse = (courseId: string) => {
    router.push(`/dashboard/tutor/tasks?course=${encodeURIComponent(courseId)}`)
  }

  const handleCourseAdded = () => {
    toast.success("Course added successfully! Refreshing your courses...")
    fetchTutorCourses()
  }

  const getUniqueGrades = () => {
    const grades = new Set(courses.map(c => c.grade))
    return Array.from(grades).sort((a, b) => a - b)
  }

  const calculateOverallStats = () => {
    const totalStudents = filteredCourses.reduce((sum, c) => sum + c.studentCount, 0)
    const totalTasks = filteredCourses.reduce((sum, c) => sum + c.taskCount, 0)
    const avgCompletion = filteredCourses.length > 0
      ? Math.round(filteredCourses.reduce((sum, c) => sum + c.completionRate, 0) / filteredCourses.length)
      : 0
    const avgScore = filteredCourses.length > 0
      ? Math.round(filteredCourses.reduce((sum, c) => sum + c.avgScore, 0) / filteredCourses.length)
      : 0
    
    return { totalStudents, totalTasks, avgCompletion, avgScore }
  }

  if (loading && courses.length === 0) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading your courses...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tutor ID: {TUTOR_ID}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData && courses.length === 0) {
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
              <Button onClick={refreshData} className="gap-2" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Try Again'}
              </Button>
              <Button variant="outline" onClick={() => {
                setUsingMockData(true)
                setError(null)
                setCourses(generateMockCourses())
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

  const overallStats = calculateOverallStats()
  const gradeGroups = getGradeGroups()
  const uniqueGrades = getUniqueGrades()

  return (
    <DashboardLayout role="tutor">
  

      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Courses Management</h1>
            <p className="text-muted-foreground">
              Manage your courses across all grades and monitor student progress
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tutor ID: {TUTOR_ID} • {courses.length} total courses
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

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

            <Button 
              className="gap-2" 
              onClick={() => setShowAddCourseModal(true)}
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Grade</label>
                  <select 
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="all">All Grades</option>
                    {uniqueGrades.map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Sort By</label>
                  <select 
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="grade">Grade</option>
                    <option value="name">Course Name</option>
                    <option value="students">Student Count</option>
                    <option value="completion">Completion Rate</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Search</label>
                  <div className="relative">
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overall Stats */}
        {filteredCourses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Courses</p>
                    <p className="text-2xl font-bold">{filteredCourses.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                    <p className="text-2xl font-bold text-green-600">{overallStats.totalStudents}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Completion</p>
                    <p className="text-2xl font-bold text-blue-600">{overallStats.avgCompletion}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Score</p>
                    <p className="text-2xl font-bold text-purple-600">{overallStats.avgScore}%</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Courses by Grade */}
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {searchQuery || selectedGrade !== 'all'
                  ? "No courses match your filters. Try adjusting your search criteria."
                  : "You don't have any courses assigned yet. Add your first course to get started!"}
              </p>
              <div className="flex gap-3">
                {(searchQuery || selectedGrade !== 'all') && (
                  <Button variant="outline" onClick={() => {
                    setSelectedGrade('all')
                    setSearchQuery('')
                  }}>
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => setShowAddCourseModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          // Grid View
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Courses</TabsTrigger>
              {gradeGroups.map(group => (
                <TabsTrigger key={group.grade} value={`grade-${group.grade}`}>
                  Grade {group.grade}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-8">
              {gradeGroups.map(group => (
                <div key={group.grade} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Grade {group.grade}
                      <Badge variant="secondary" className="ml-2">
                        {group.courses.length} courses
                      </Badge>
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {group.totalStudents} students
                      </span>
                      <span className="text-muted-foreground">
                        Avg Score: {group.avgScore}%
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {group.courses.map((course) => (
                      <Card 
                        key={course.id} 
                        className={`hover:shadow-lg transition-all duration-300 border-2 ${course.bgColor} ${course.borderColor} hover:scale-[1.02] group`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-lg bg-white`}>
                              <BookOpen className={`h-6 w-6 ${course.color}`} />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="secondary" className="font-medium">
                                Grade {course.grade}
                              </Badge>
                              <Badge variant="outline" className="font-mono text-xs bg-white">
                                {course.code}
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
                              <div className="text-2xl font-bold">{course.studentCount}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <ListTodo className="h-3 w-3" />
                                Tasks
                              </div>
                              <div className="text-2xl font-bold">{course.taskCount}</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Completion Rate</span>
                              <span className="font-semibold">{course.completionRate}%</span>
                            </div>
                            <div className="h-2 bg-white rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${course.color.replace('text', 'bg')} rounded-full transition-all duration-500`}
                                style={{ width: `${course.completionRate}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Average Score</span>
                            <Badge variant="secondary" className={`font-semibold ${course.color}`}>
                              {course.avgScore}%
                            </Badge>
                          </div>

                          <Button 
                            className="w-full bg-white hover:bg-primary hover:text-primary-foreground transition-colors group-hover:border-primary" 
                            variant="outline"
                            onClick={() => handleManageCourse(course.id)}
                          >
                            <span>Manage Course</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {gradeGroups.map(group => (
              <TabsContent key={group.grade} value={`grade-${group.grade}`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Grade {group.grade} Courses</h2>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {group.courses.length} courses
                      </Badge>
                      <Badge variant="outline">
                        {group.totalStudents} students
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {group.courses.map((course) => (
                      <Card 
                        key={course.id} 
                        className={`hover:shadow-lg transition-all duration-300 border-2 ${course.bgColor} ${course.borderColor}`}
                      >
                        {/* Same card content as above */}
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-lg bg-white`}>
                              <BookOpen className={`h-6 w-6 ${course.color}`} />
                            </div>
                            <Badge variant="outline" className="font-mono text-xs bg-white">
                              {course.code}
                            </Badge>
                          </div>
                          <CardTitle className="mt-4 text-xl">{course.name}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-2">
                            {course.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-3 border">
                              <div className="text-2xl font-bold">{course.studentCount}</div>
                              <div className="text-xs text-muted-foreground">Students</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border">
                              <div className="text-2xl font-bold">{course.taskCount}</div>
                              <div className="text-xs text-muted-foreground">Tasks</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Completion</span>
                              <span className="font-semibold">{course.completionRate}%</span>
                            </div>
                            <div className="h-2 bg-white rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${course.color.replace('text', 'bg')} rounded-full`}
                                style={{ width: `${course.completionRate}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span>Avg Score</span>
                            <span className={`font-semibold ${course.color}`}>{course.avgScore}%</span>
                          </div>

                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => handleManageCourse(course.id)}
                          >
                            Manage Course
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // List View
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredCourses.map((course) => (
                  <div key={course.id} className={`p-4 hover:bg-muted/50 transition-colors ${course.bgColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-white`}>
                            <BookOpen className={`h-5 w-5 ${course.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{course.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{course.code}</span>
                              <span>•</span>
                              <span>Grade {course.grade}</span>
                              <span>•</span>
                              <span>{course.studentCount} students</span>
                              <span>•</span>
                              <span>{course.taskCount} tasks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Completion</div>
                          <div className="font-semibold">{course.completionRate}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Avg Score</div>
                          <div className={`font-semibold ${course.color}`}>{course.avgScore}%</div>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleManageCourse(course.id)}
                        >
                          Manage
                          <ArrowRight className="h-3 w-3 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Management Tips */}
        {filteredCourses.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Course Management Tips</h3>
                  <p className="text-muted-foreground mb-4">
                    Get the most out of your courses by regularly updating tasks, monitoring student progress, and providing timely feedback.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Target className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Set Clear Goals</p>
                        <p className="text-xs text-muted-foreground">Define learning objectives</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Regular Updates</p>
                        <p className="text-xs text-muted-foreground">Keep tasks current</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Award className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Track Progress</p>
                        <p className="text-xs text-muted-foreground">Monitor student success</p>
                      </div>
                    </div>
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
        tutorId={TUTOR_ID}
      />
    </DashboardLayout>
  )
}