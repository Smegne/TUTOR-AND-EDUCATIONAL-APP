"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  FileText, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Award, 
  CheckCircle, 
  BookOpen,
  User,
  EyeOff,
  Filter,
  Search,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Star,
  Zap,
  Heart,
  GraduationCap
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

// Brand colors configuration
const brandColors = {
  primary: "#10B981",
  primaryDark: "#059669",
  primaryLight: "#D1FAE5",
  primaryBg: "#ECFDF5",
  white: "#FFFFFF",
  gray: "#6B7280",
  grayLight: "#F9FAFB",
  grayBorder: "#E5E7EB",
}

interface Task {
  id: string
  title: string
  description: string
  subject: string
  grade_level: number
  difficulty: string
  estimated_time_minutes: number
  note_content?: string
  video_link?: string
  images?: string[]
  parent_visibility: boolean
  created_at: string
  created_by: string
  created_by_name?: string
  status: 'pending' | 'in_progress' | 'completed'
  score?: number
  time_spent?: number
  completed_at?: string
  started_at?: string
  student_id: string
  student_name: string
  student_grade: number
}

interface Child {
  id: string
  name: string
  email: string
  grade: number
  courses: string[]
  status: string
}

interface Summary {
  totalChildren: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  inProgressTasks: number
  averageScore: number
  tasksByChild: Record<string, number>
}

export default function ParentTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  const getParentId = useCallback(() => {
    if ((user as any)?.lookupId) return (user as any).lookupId
    if ((user as any)?.userId) return (user as any).userId
    if ((user as any)?.parentId) return (user as any).parentId
    if (user?.id) return user.id
    if (user?.email === 'ageru@gmail.com') {
      return 'p_mm86u06x_974nf'
    }
    return 'p_mm86u06x_974nf'
  }, [user])

  const PARENT_ID = getParentId()

  const fetchParentTasks = useCallback(async (showToast = true) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🎯 [PARENT] Fetching tasks for parent:", PARENT_ID)
      
      const response = await fetch(`/api/parent-direct/${PARENT_ID}/tasks`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          if (data.children) {
            setChildren(data.children)
          }
          
          const formattedTasks = data.tasks?.map((task: any) => ({
            ...task,
            status: task.status || 'pending',
            score: task.score ? Number(task.score) : undefined,
            time_spent: task.time_spent_minutes || task.time_spent || 0
          })) || []
          
          setTasks(formattedTasks)
          setUsingMockData(data.usingMockData || false)
          
          if (showToast && formattedTasks.length > 0) {
            toast.success(`Loaded ${formattedTasks.length} tasks`)
          }
        } else {
          throw new Error(data.error || 'Failed to fetch tasks')
        }
      } else {
        throw new Error(`Server error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ [PARENT] Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tasks')
      setUsingMockData(true)
      
      const mockData = getMockData()
      setTasks(mockData.tasks)
      setChildren(mockData.children)
      toast.error("Failed to load tasks. Using demo data.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [PARENT_ID])

  useEffect(() => {
    fetchParentTasks(false)
  }, [fetchParentTasks])

  const getMockData = () => {
    return {
      children: [
        {
          id: "student_001",
          name: "Abel Tesfaye",
          email: "abel@student.com",
          grade: 8,
          courses: ["Mathematics", "Science", "English"],
          status: "linked"
        },
        {
          id: "student_002",
          name: "Emma Wilson",
          email: "emma@student.com",
          grade: 7,
          courses: ["Mathematics", "History"],
          status: "linked"
        }
      ],
      tasks: [
        {
          id: "1",
          title: "Algebra Fundamentals",
          description: "Practice basic algebraic equations and solve for x in linear equations",
          subject: "math_g8",
          grade_level: 8,
          difficulty: "medium",
          estimated_time_minutes: 45,
          created_at: new Date().toISOString(),
          created_by: "tutor_001",
          created_by_name: "Mr. Johnson",
          status: "completed",
          score: 92,
          time_spent: 38,
          completed_at: new Date().toISOString(),
          student_id: "student_001",
          student_name: "Abel Tesfaye",
          student_grade: 8,
          parent_visibility: true
        },
        {
          id: "2",
          title: "Science Experiment Report",
          description: "Document your findings from the chemistry lab experiment on chemical reactions",
          subject: "science_g8",
          grade_level: 8,
          difficulty: "hard",
          estimated_time_minutes: 60,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          created_by: "tutor_002",
          created_by_name: "Ms. Davis",
          status: "in_progress",
          time_spent: 25,
          student_id: "student_001",
          student_name: "Abel Tesfaye",
          student_grade: 8,
          parent_visibility: true
        },
        {
          id: "3",
          title: "Fractions and Decimals",
          description: "Practice operations with fractions and decimal conversions",
          subject: "math_g7",
          grade_level: 7,
          difficulty: "beginner",
          estimated_time_minutes: 30,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          created_by: "tutor_001",
          created_by_name: "Mr. Johnson",
          status: "completed",
          score: 88,
          time_spent: 28,
          completed_at: new Date(Date.now() - 86400000).toISOString(),
          student_id: "student_002",
          student_name: "Emma Wilson",
          student_grade: 7,
          parent_visibility: true
        }
      ]
    }
  }

  const refreshData = () => {
    toast.info("Refreshing tasks...")
    setRefreshing(true)
    fetchParentTasks()
  }

  const filteredTasks = tasks.filter(task => {
    if (selectedChild !== 'all' && task.student_id !== selectedChild) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.student_name.toLowerCase().includes(query) ||
        task.subject.toLowerCase().includes(query)
      )
    }
    return true
  })

  const tasksByChild = filteredTasks.reduce((acc, task) => {
    if (!acc[task.student_id]) {
      acc[task.student_id] = {
        childName: task.student_name,
        childGrade: task.student_grade,
        tasks: []
      }
    }
    acc[task.student_id].tasks.push(task)
    return acc
  }, {} as Record<string, { childName: string; childGrade: number; tasks: Task[] }>)

  const summary = {
    totalChildren: children.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    averageScore: tasks.filter(t => t.status === 'completed' && t.score).reduce((sum, t) => sum + (t.score || 0), 0) / 
                 (tasks.filter(t => t.status === 'completed' && t.score).length || 1)
  }

  const getCourseLabel = (subject: string): string => {
    const courseMap: Record<string, string> = {
      'math': 'Mathematics',
      'english': 'English',
      'amharic': 'Amharic',
      'science': 'Science',
      'general_science': 'General Science',
      'social_science': 'Social Science',
      'citizenship': 'Citizenship',
      'pva': 'PVA',
      'hpe': 'HPE',
      'it': 'IT'
    }
    const baseSubject = subject.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
    return courseMap[baseSubject] || subject.replace('_', ' ').toUpperCase()
  }

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'intermediate': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'advanced': return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'hard': return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 mr-1" />
      case 'in_progress': return <Clock className="h-3 w-3 mr-1" />
      default: return <Clock className="h-3 w-3 mr-1" />
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Unknown date"
    }
  }

  const TaskCard = ({ task, index }: { task: Task; index: number }) => {
    const courseLabel = getCourseLabel(task.subject)
    const isCompleted = task.status === 'completed'
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -4 }}
      >
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          {/* Top accent bar based on status */}
          <div 
            className="h-1 w-full"
            style={{ 
              background: isCompleted 
                ? `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.primaryLight})`
                : task.status === 'in_progress'
                ? 'linear-gradient(90deg, #3B82F6, #93C5FD)'
                : 'linear-gradient(90deg, #F59E0B, #FDE68A)'
            }}
          />
          
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {courseLabel}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${getDifficultyColor(task.difficulty)}`}
                  >
                    {task.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {task.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <GraduationCap className="h-3 w-3" />
                    <span>Grade {task.grade_level}</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">{task.student_name}</span>
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3 pt-0">
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge
                variant="outline"
                className={`${getStatusColor(task.status)} gap-1`}
              >
                {getStatusIcon(task.status)}
                {task.status === 'completed' ? 'Completed' : 
                 task.status === 'in_progress' ? 'In Progress' : 'Pending'}
              </Badge>

              {task.created_by_name && (
                <span className="text-xs text-gray-400">
                  By {task.created_by_name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(task.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Est: {task.estimated_time_minutes} min</span>
              </div>
              {task.time_spent && task.time_spent > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Spent: {task.time_spent} min</span>
                </div>
              )}
            </div>

            {isCompleted && task.score !== undefined && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-100">
                      <Award className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Score</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-2xl text-green-600">
                      {task.score}%
                    </span>
                  </div>
                </div>
                {task.completed_at && (
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-green-100">
                    <span className="text-gray-500">Completed</span>
                    <span className="font-medium text-gray-700">{formatDate(task.completed_at)}</span>
                  </div>
                )}
              </motion.div>
            )}

            {!task.parent_visibility && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 flex items-center gap-2">
                <EyeOff className="h-3 w-3" />
                Hidden from parent view
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (loading && tasks.length === 0) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: brandColors.primary }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-white/20 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Loading tasks...</p>
              <p className="text-sm text-gray-500 mt-2">Fetching your children's assignments</p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="parent">
      <div className="min-h-screen" style={{ background: brandColors.grayLight, fontFamily: "'Roman Times New', sans-serif" }}>
        {/* Top Gradient Bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.primaryLight})` }} />
        
        <div className="p-6 md:p-8 space-y-8">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ background: brandColors.primaryBg }}>
                  <Heart className="h-6 w-6" style={{ color: brandColors.primary }} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Children's Tasks</h1>
                {usingMockData && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Demo Mode
                  </Badge>
                )}
              </div>
              <p className="text-gray-500">
                Monitor task completion and learning progress across all your children
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {children.length}  child{children.length !== 1 && 'ren'} linked
              </p>
            </div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                className="gap-2 border-gray-200 hover:border-green-200 hover:bg-green-50 transition-all"
                disabled={refreshing}
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </motion.div>
          </motion.div>

         

          {/* Tasks by Child Section */}
          <AnimatePresence mode="wait">
            {Object.keys(tasksByChild).length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-none shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="bg-green-50 rounded-full p-4 mb-4">
                      <BookOpen className="h-12 w-12" style={{ color: brandColors.primary }} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {searchQuery || selectedChild !== 'all' 
                        ? "No tasks match your filters. Try adjusting your search criteria."
                        : "Your children don't have any visible tasks yet."}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="tasks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {Object.entries(tasksByChild).map(([childId, { childName, childGrade, tasks: childTaskList }]) => (
                  <motion.div
                    key={childId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Child Header */}
                    <div 
                      className="flex items-center gap-3 p-4 rounded-xl shadow-sm"
                      style={{ background: brandColors.white }}
                    >
                      <div 
                        className="h-12 w-12 rounded-full flex items-center justify-center shadow-md"
                        style={{ background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.primaryDark})` }}
                      >
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900">{childName}</h2>
                        <p className="text-sm text-gray-500"> {childGrade}</p>
                      </div>
                      <Badge 
                        className="px-3 py-1 text-sm"
                        style={{ background: brandColors.primaryBg, color: brandColors.primaryDark }}
                      >
                        
                      </Badge>
                    </div>

                    {/* Tasks Grid */}
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {childTaskList.map((task, idx) => (
                        <TaskCard key={task.id} task={task} index={idx} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  )
}