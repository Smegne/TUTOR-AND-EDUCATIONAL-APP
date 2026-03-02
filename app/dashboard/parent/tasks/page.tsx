// app/dashboard/parent/tasks/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  FileText, 
  Loader2, 
  AlertCircle, 
  Database, 
  RefreshCw, 
  Clock, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen,
  User,
  Eye,
  EyeOff,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  Users
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

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
  
  // Get the parent ID from auth - using the same logic as student page
  const getParentId = useCallback(() => {
    // Try to get from user object
    if ((user as any)?.lookupId) return (user as any).lookupId
    if ((user as any)?.userId) return (user as any).userId
    if ((user as any)?.parentId) return (user as any).parentId
    if (user?.id) return user.id
    
    // For ageru@gmail.com - hardcoded from your database
    if (user?.email === 'ageru@gmail.com') {
      return 'p_mm86u06x_974nf'
    }
    
    // Development fallback
    return 'p_mm86u06x_974nf'
  }, [user])

  const PARENT_ID = getParentId()

  const fetchParentTasks = useCallback(async (showToast = true) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🎯 [PARENT] Fetching tasks for parent:", PARENT_ID)
      console.log("👤 [PARENT] Auth user:", user)
      
      // Use the same simple pattern as student page - direct endpoint
      const response = await fetch(`/api/parent-direct/${PARENT_ID}/tasks`)
      
      console.log("📊 [PARENT] API Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("✅ [PARENT] API Response:", {
          success: data.success,
          tasksCount: data.tasks?.length,
          childrenCount: data.children?.length
        })
        
        if (data.success) {
          // Set children
          if (data.children) {
            setChildren(data.children)
          }
          
          // Set tasks
          const formattedTasks = data.tasks?.map((task: any) => ({
            ...task,
            status: task.status || 'pending',
            score: task.score ? Number(task.score) : undefined,
            time_spent: task.time_spent_minutes || task.time_spent || 0
          })) || []
          
          setTasks(formattedTasks)
          setUsingMockData(data.usingMockData || false)
          
          if (showToast && formattedTasks.length > 0) {
            toast.success(`Loaded ${formattedTasks.length} tasks across ${data.children?.length || 0} children`)
          } else if (showToast && formattedTasks.length === 0) {
            toast.info("No tasks found for your children")
          }
          
          console.log(`📋 [PARENT] Loaded ${formattedTasks.length} tasks:`, 
            formattedTasks.map(t => `${t.title} (${t.student_name})`))
            
        } else {
          console.error("❌ [PARENT] API error:", data.error)
          throw new Error(data.error || 'Failed to fetch tasks')
        }
      } else {
        const errorText = await response.text()
        console.error("❌ [PARENT] HTTP error:", response.status, errorText)
        throw new Error(`Server error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ [PARENT] Fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tasks')
      setUsingMockData(true)
      
      // Fallback to mock data
      const mockData = getMockData()
      setTasks(mockData.tasks)
      setChildren(mockData.children)
      toast.error("Failed to load tasks. Using demo data.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [PARENT_ID, user])

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
          description: "Practice basic algebraic equations",
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
          description: "Document your findings from the chemistry lab",
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
          description: "Practice operations with fractions",
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

  // Filter tasks based on selected child and search query
  const filteredTasks = tasks.filter(task => {
    // Filter by child
    if (selectedChild !== 'all' && task.student_id !== selectedChild) {
      return false
    }
    
    // Filter by search query
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

  // Group tasks by child
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

  // Calculate summary statistics
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
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      case 'hard': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Unknown date"
    }
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const courseLabel = getCourseLabel(task.subject)

    return (
      <Card className="hover:shadow-lg transition-all hover:border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {task.title}
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {courseLabel}
                  </Badge>
                  <span>Grade {task.grade_level}</span>
                  <span>•</span>
                  <span className="text-xs text-primary font-medium">{task.student_name}</span>
                </div>
              </CardDescription>
            </div>
            <Badge 
              variant="outline"
              className={getDifficultyColor(task.difficulty)}
            >
              {task.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={getStatusColor(task.status)}
            >
              {task.status === 'completed' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : task.status === 'in_progress' ? (
                <Clock className="h-3 w-3 mr-1" />
              ) : (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {task.status === 'completed' ? 'Completed' : 
               task.status === 'in_progress' ? 'In Progress' : 'Pending'}
            </Badge>

            {task.created_by_name && (
              <span className="text-xs text-muted-foreground">
                By {task.created_by_name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Assigned {formatDate(task.created_at)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Est: {task.estimated_time_minutes} min</span>
            {task.time_spent && task.time_spent > 0 && (
              <>
                <span>•</span>
                <span>Spent: {task.time_spent} min</span>
              </>
            )}
          </div>

          {task.status === 'completed' && task.score !== undefined && (
            <div className="bg-secondary/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">Score</span>
                </div>
                <span className="font-bold text-secondary text-lg">
                  {task.score}%
                </span>
              </div>
              {task.completed_at && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{formatDate(task.completed_at)}</span>
                </div>
              )}
            </div>
          )}

          {!task.parent_visibility && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700 flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              Hidden from parent view
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading && tasks.length === 0) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-lg font-medium">Loading your children's tasks...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Parent ID: {PARENT_ID}
              </p>
            </div>
          </div>
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
            <h1 className="text-3xl font-bold text-balance">Children's Tasks</h1>
            <p className="text-muted-foreground">
              Monitor task completion and learning progress across all your children
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Parent ID: {PARENT_ID} • {children.length} child{children.length !== 1 ? 'ren' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {tasks.length} total task{tasks.length !== 1 ? 's' : ''}
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

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-700 mb-1">Total Tasks</div>
                  <div className="text-2xl font-bold text-blue-900">{summary.totalTasks}</div>
                </div>
                <BookOpen className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-700 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-900">{summary.completedTasks}</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-orange-700 mb-1">In Progress</div>
                  <div className="text-2xl font-bold text-orange-900">{summary.inProgressTasks}</div>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-yellow-700 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-900">{summary.pendingTasks}</div>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-700 mb-1">Avg. Score</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.round(summary.averageScore)}%
                  </div>
                </div>
                <Award className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <select 
                className="border rounded-md px-3 py-2 text-sm"
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

              
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Child */}
        {Object.keys(tasksByChild).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || selectedChild !== 'all' 
                  ? "No tasks match your filters. Try adjusting your search criteria."
                  : "Your children don't have any visible tasks yet."}
              </p>
              {(searchQuery || selectedChild !== 'all') && (
                <Button variant="outline" onClick={() => {
                  setSelectedChild('all')
                  setSearchQuery('')
                }}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(tasksByChild).map(([childId, { childName, childGrade, tasks }]) => (
              <div key={childId} className="space-y-4">
                {/* Child Header */}
                <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{childName}</h2>
                    <p className="text-sm text-muted-foreground">Grade {childGrade}</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/5">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Tasks Grid for this Child */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
            <div className="font-bold mb-1">Parent Debug:</div>
            <div className="space-y-1">
              <div>Parent ID: {PARENT_ID}</div>
              <div>Children: {children.length}</div>
              <div>Tasks: {tasks.length}</div>
              <div>From DB: {usingMockData ? 'No (demo)' : 'Yes'}</div>
              <div className="pt-1 border-t border-white/20">
                <button 
                  onClick={() => {
                    console.log("All Tasks:", tasks)
                    console.log("Children:", children)
                    console.log("User:", user)
                  }}
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  Log Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}