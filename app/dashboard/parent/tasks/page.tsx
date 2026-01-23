"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, CheckCircle, Clock, Loader2, AlertCircle, Database, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"

interface Child {
  id: string
  name: string
  grade: number
  email?: string
}

interface Task {
  id: number
  title: string
  description: string
  subject: string
  grade_level: number
  difficulty: string
  status: string
  score?: number
  completed_at?: string
  created_at: string
  due_date?: string
  created_by_name?: string
  parent_visibility: boolean
}

interface ChildTasks {
  child: Child
  tasks: Task[]
}

export default function ParentTasksPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [childrenTasks, setChildrenTasks] = useState<ChildTasks[]>([])

  useEffect(() => {
    fetchParentTasks()
  }, [])

  const fetchParentTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const parentId = user?.parentId || "parent_001"
      
      // Fetch parent tasks from API
      const response = await fetch(`/api/parent/${parentId}/tasks`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setChildrenTasks(data.childrenTasks || [])
          setUsingMockData(false)
        } else {
          throw new Error(data.error || 'Failed to fetch tasks')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching parent tasks:', error)
      setError(error instanceof Error ? error.message : 'Failed to load tasks')
      setUsingMockData(true)
      
      // Fallback to mock data
      const mockChildrenTasks: ChildTasks[] = [
        {
          child: {
            id: "student_001",
            name: "Abel Tesfaye",
            grade: 5,
            email: "abel@example.com"
          },
          tasks: [
            {
              id: 1,
              title: "Basic Multiplication Practice",
              description: "Practice multiplying single-digit numbers",
              subject: "math_g5",
              grade_level: 5,
              difficulty: "beginner",
              status: "completed",
              score: 92,
              completed_at: new Date(Date.now() - 43200000).toISOString(),
              created_at: new Date(Date.now() - 86400000).toISOString(),
              due_date: new Date(Date.now() + 86400000).toISOString(),
              created_by_name: "Mr. Johnson",
              parent_visibility: true
            },
            {
              id: 2,
              title: "Reading Comprehension",
              description: "Read and answer questions about a short story",
              subject: "english_g5",
              grade_level: 5,
              difficulty: "intermediate",
              status: "completed",
              score: 88,
              completed_at: new Date(Date.now() - 129600000).toISOString(),
              created_at: new Date(Date.now() - 172800000).toISOString(),
              due_date: new Date(Date.now() - 86400000).toISOString(),
              created_by_name: "Mr. Johnson",
              parent_visibility: true
            },
            {
              id: 3,
              title: "Science Experiment Report",
              description: "Write a report about the plant growth experiment",
              subject: "science_g5",
              grade_level: 5,
              difficulty: "intermediate",
              status: "in_progress",
              score: undefined,
              completed_at: undefined,
              created_at: new Date(Date.now() - 259200000).toISOString(),
              due_date: new Date(Date.now() + 172800000).toISOString(),
              created_by_name: "Ms. Williams",
              parent_visibility: true
            }
          ]
        }
      ]
      setChildrenTasks(mockChildrenTasks)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchParentTasks()
  }

  const getCourseLabel = (subject: string): string => {
    // Extract course name from subject (e.g., "math_g5" -> "Mathematics")
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

    const baseSubject = subject.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
    return courseMap[baseSubject] || subject.replace('_', ' ').toUpperCase()
  }

  const getTaskStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      case 'not_started':
        return 'Not Started'
      default:
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const isTaskOverdue = (task: Task): boolean => {
    if (task.status === 'completed') return false
    if (!task.due_date) return false
    
    const dueDate = new Date(task.due_date)
    const now = new Date()
    return dueDate < now
  }

  const getCompletedTasksCount = (tasks: Task[]): number => {
    return tasks.filter(task => task.status === 'completed').length
  }

  const getPendingTasksCount = (tasks: Task[]): number => {
    return tasks.filter(task => task.status !== 'completed').length
  }

  const getAvgScore = (tasks: Task[]): number => {
    const completedTasks = tasks.filter(task => task.status === 'completed' && task.score)
    if (completedTasks.length === 0) return 0
    return Math.round(completedTasks.reduce((sum, task) => sum + (task.score || 0), 0) / completedTasks.length)
  }

  if (loading) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your children's tasks...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Tasks</h3>
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
    <DashboardLayout role="parent">
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
            <h1 className="text-3xl font-bold text-balance">Children's Tasks</h1>
            <p className="text-muted-foreground">Monitor task completion and progress</p>
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

        {childrenTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No children tasks available</h3>
              <p className="text-muted-foreground text-center mb-4">
                Your children's tasks will appear here once tutors make them visible to parents.
              </p>
              <Button 
                variant="outline" 
                onClick={refreshData}
              >
                Check Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          childrenTasks.map((childTasks) => {
            const completedCount = getCompletedTasksCount(childTasks.tasks)
            const pendingCount = getPendingTasksCount(childTasks.tasks)
            const avgScore = getAvgScore(childTasks.tasks)
            const overdueCount = childTasks.tasks.filter(task => isTaskOverdue(task)).length

            return (
              <div key={childTasks.child.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-secondary/20 p-2 rounded-full">
                      <User className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{childTasks.child.name}</h2>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Grade {childTasks.child.grade}</span>
                        {childTasks.child.email && (
                          <>
                            <span>•</span>
                            <span>{childTasks.child.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Performance</div>
                      <div className="text-lg font-bold text-secondary">{avgScore}% avg</div>
                    </div>
                    <Badge variant="outline">
                      {completedCount} completed
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary">{completedCount}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{pendingCount}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
                        <div className="text-sm text-muted-foreground">Overdue</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{childTasks.tasks.length}</div>
                        <div className="text-sm text-muted-foreground">Total Tasks</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {childTasks.tasks.map((task) => {
                    const isOverdue = isTaskOverdue(task)
                    const isCompleted = task.status === 'completed'
                    const courseLabel = getCourseLabel(task.subject)

                    return (
                      <Card key={task.id} className="hover:shadow-md transition-shadow hover:border-primary/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{task.title}</CardTitle>
                              <CardDescription>
                                <div className="flex items-center gap-2 mt-1">
                                  <span>{courseLabel}</span>
                                  <span>•</span>
                                  <span>Grade {task.grade_level}</span>
                                </div>
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                isCompleted ? "secondary" : 
                                isOverdue ? "destructive" : 
                                "default"
                              }
                              className="gap-1"
                            >
                              {isCompleted ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {getTaskStatusLabel(task.status)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {task.due_date ? (
                                <>
                                  Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </>
                              ) : (
                                'No due date'
                              )}
                            </span>
                          </div>

                          {task.created_by_name && (
                            <div className="text-sm text-muted-foreground">
                              Assigned by: {task.created_by_name}
                            </div>
                          )}

                          {isCompleted && task.score !== undefined && (
                            <div className="bg-secondary/20 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Score</span>
                                <span className="font-bold text-secondary">{task.score}%</span>
                              </div>
                              {task.completed_at && (
                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                  <span>Completed on:</span>
                                  <span>
                                    {new Date(task.completed_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {isOverdue && (
                            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                              ⚠️ This task is overdue
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {childTasks.tasks.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No visible tasks for this child. Tutors can make tasks visible to parents when creating them.
                    </CardContent>
                  </Card>
                )}
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