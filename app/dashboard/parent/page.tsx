"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  Database, 
  Loader2, 
  Users, 
  AlertCircle, 
  Mail,
  UserPlus,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  ChevronRight
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"

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
  status?: string
  score?: number
  time_spent?: number
  completed_at?: string
}

interface Child {
  id: string
  name: string
  grade: number
  courses: string[]
  parent_id: string
  userId: string
  email?: string
  status: 'linked' | 'pending' | 'invited'
  linked_at?: string
  invitation_sent_at?: string
}

interface ParentStats {
  todaysCompleted: number
  todaysTotal: number
  todaysProgress: number
  weeklyStreak: number
  weeklyCompleted: number
  weeklyTotal: number
  weeklyProgress: number
  avgScore: number
  totalChildren: number
  linkedChildren: number
  pendingChildren: number
}

interface ParentDashboardData {
  children: Child[]
  tasks: Task[]
  stats: ParentStats
}

export default function ParentDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [dashboardData, setDashboardData] = useState<ParentDashboardData>({
    children: [],
    tasks: [],
    stats: {
      todaysCompleted: 0,
      todaysTotal: 0,
      todaysProgress: 0,
      weeklyStreak: 0,
      weeklyCompleted: 0,
      weeklyTotal: 0,
      weeklyProgress: 0,
      avgScore: 0,
      totalChildren: 0,
      linkedChildren: 0,
      pendingChildren: 0
    }
  })
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchParentDashboardData()
  }, [])

  const fetchParentDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const parentId = user?.parentId || user?.id || "parent_001"
      
      // Fetch parent dashboard data from API
      const response = await fetch(`/api/parent/${parentId}/dashboard`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setDashboardData(data)
          setUsingMockData(false)
          
          // Set first child as selected if available
          if (data.children && data.children.length > 0) {
            setSelectedChildId(data.children[0].id)
          }
        } else {
          throw new Error(data.error || 'Failed to fetch dashboard data')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching parent dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
      setUsingMockData(true)
      
      // Fallback to mock data
      const mockData: ParentDashboardData = {
        children: [
          {
            id: "student_001",
            name: "Abel Tesfaye",
            grade: 8,
            courses: ["Mathematics", "Science", "English"],
            parent_id: user?.id || "parent_001",
            userId: "s_user_001",
            email: "abel@student.com",
            status: 'linked',
            linked_at: new Date().toISOString()
          },
          {
            id: "student_002",
            name: "Emma Wilson",
            grade: 7,
            courses: ["Mathematics", "History"],
            parent_id: user?.id || "parent_001",
            userId: "s_user_002",
            email: "emma@student.com",
            status: 'linked',
            linked_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
          },
          {
            id: "pending_001",
            name: "Not Registered",
            grade: 0,
            courses: [],
            parent_id: user?.id || "parent_001",
            userId: "",
            email: "child3@example.com",
            status: 'pending'
          }
        ],
        tasks: [
          {
            id: "task_001",
            title: "Algebra Fundamentals",
            description: "Practice basic algebraic equations",
            subject: "Mathematics",
            grade_level: 8,
            difficulty: "medium",
            estimated_time_minutes: 45,
            parent_visibility: true,
            created_at: new Date().toISOString(),
            created_by: "tutor_001",
            status: 'completed',
            score: 92,
            time_spent: 38,
            completed_at: new Date().toISOString()
          },
          {
            id: "task_002",
            title: "Science Experiment Report",
            description: "Document your findings from the chemistry lab",
            subject: "Science",
            grade_level: 8,
            difficulty: "hard",
            estimated_time_minutes: 60,
            parent_visibility: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            created_by: "tutor_002",
            status: 'in_progress',
            time_spent: 25
          }
        ],
        stats: {
          todaysCompleted: 3,
          todaysTotal: 5,
          todaysProgress: 60,
          weeklyStreak: 7,
          weeklyCompleted: 5,
          weeklyTotal: 8,
          weeklyProgress: 63,
          avgScore: 85,
          totalChildren: 3,
          linkedChildren: 2,
          pendingChildren: 1
        }
      }
      
      setDashboardData(mockData)
      if (mockData.children.length > 0) {
        setSelectedChildId(mockData.children[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedChild = selectedChildId 
    ? dashboardData.children.find(child => child.id === selectedChildId) 
    : null

  const childTasks = selectedChild
    ? dashboardData.tasks.filter(task => task.grade_level === selectedChild.grade)
    : dashboardData.tasks

  const refreshData = () => {
    fetchParentDashboardData()
  }

  const sendInvitation = async (childEmail: string) => {
    try {
      const response = await fetch('/api/parent/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: user?.id,
          childEmail,
          parentName: user?.firstName
        })
      })
      
      if (response.ok) {
        alert('Invitation sent successfully!')
        refreshData()
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Failed to send invitation')
    }
  }

  const formatTime = (completedAt?: string) => {
    if (!completedAt) return "Pending"
    const date = new Date(completedAt)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not yet"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })
  }

  const getStatusBadge = (status: Child['status']) => {
    switch(status) {
      case 'linked':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Linked</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case 'invited':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Invited</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading parent dashboard...</p>
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
            <h3 className="text-lg font-semibold mb-2">Unable to Load Data</h3>
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
          <div className="flex items-center justify-center gap-2 text-yellow-700">
            <Database className="h-4 w-4" />
            <p className="text-sm font-medium">Using demo data</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshData}
              className="h-auto p-1 text-yellow-600 hover:text-yellow-800"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      )}
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">Parent Dashboard</h1>
              {usingMockData && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <Database className="h-3 w-3 mr-1" />
                  Demo Mode
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Monitor your children's learning progress</p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview">
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="children">
              <Users className="h-4 w-4 mr-2" />
              My Children ({dashboardData.children.length})
            </TabsTrigger>
            <TabsTrigger value="activity">
              <BookOpen className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Children Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>My Children</CardTitle>
                <CardDescription>
                  {dashboardData.stats.linkedChildren} linked • {dashboardData.stats.pendingChildren} pending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {dashboardData.children.slice(0, 3).map((child) => (
                    <Card 
                      key={child.id}
                      className={`cursor-pointer hover:border-primary transition-colors ${
                        selectedChildId === child.id ? 'border-primary border-2' : ''
                      }`}
                      onClick={() => setSelectedChildId(child.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-sm font-bold text-secondary">
                                {child.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <h4 className="font-semibold">{child.name}</h4>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(child.status)}
                                  {child.grade > 0 && (
                                    <span className="text-sm text-muted-foreground">Grade {child.grade}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {child.email && (
                              <p className="text-sm text-muted-foreground truncate">{child.email}</p>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {dashboardData.children.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveTab("children")}
                    >
                      View All {dashboardData.children.length} Children
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Overview */}
            {selectedChild && (
              <>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Today's Progress</CardDescription>
                      <CardTitle className="text-3xl">
                        {dashboardData.stats.todaysCompleted}/{dashboardData.stats.todaysTotal}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={dashboardData.stats.todaysProgress} className="h-2 mb-2" />
                      <p className="text-sm text-muted-foreground">{selectedChild.name}'s completed tasks</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Weekly Streak</CardDescription>
                      <CardTitle className="text-3xl">{dashboardData.stats.weeklyStreak} Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-secondary">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Consistent learning!
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Avg. Score</CardDescription>
                      <CardTitle className="text-3xl">{dashboardData.stats.avgScore}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-secondary">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Great performance
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity Preview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>{selectedChild.name}'s visible tasks</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {childTasks.length} visible tasks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {childTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{task.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{task.subject}</span>
                              <span>•</span>
                              <span>{formatTime(task.completed_at)}</span>
                            </div>
                          </div>
                        </div>
                        {task.status === 'completed' && task.score !== undefined && (
                          <Badge className="bg-secondary/20 text-secondary hover:bg-secondary/30">
                            {task.score}%
                          </Badge>
                        )}
                      </div>
                    ))}
                    {childTasks.length > 3 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("activity")}>
                          View All Activity
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* CHILDREN MANAGEMENT TAB */}
          <TabsContent value="children" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Children</CardTitle>
                    <CardDescription>
                      Manage and monitor all your linked children
                    </CardDescription>
                  </div>
                  <Button onClick={() => {/* Add new child functionality */}}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Child
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center text-lg font-bold text-secondary">
                          {child.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold">{child.name}</h4>
                            {getStatusBadge(child.status)}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {child.email && <span>{child.email}</span>}
                            {child.grade > 0 && (
                              <>
                                <span>•</span>
                                <span>Grade {child.grade}</span>
                              </>
                            )}
                            {child.status === 'linked' && child.linked_at && (
                              <>
                                <span>•</span>
                                <span>Linked {formatDate(child.linked_at)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {child.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => sendInvitation(child.email!)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Invite
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant={selectedChildId === child.id ? "default" : "outline"}
                          onClick={() => {
                            setSelectedChildId(child.id)
                            setActiveTab("overview")
                          }}
                        >
                          View Progress
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Activity</CardTitle>
                    <CardDescription>Tasks visible to parents across all children</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No visible tasks yet.</p>
                  </div>
                ) : (
                  dashboardData.tasks.map((task) => {
                    const isCompleted = task.status === 'completed'
                    const child = dashboardData.children.find(c => c.grade === task.grade_level)

                    return (
                      <div key={task.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{task.title}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(task.completed_at)}</span>
                              </div>
                              <span>•</span>
                              <span>Grade {task.grade_level}</span>
                              {child && (
                                <>
                                  <span>•</span>
                                  <span>{child.name}</span>
                                </>
                              )}
                              {task.time_spent && task.time_spent > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{task.time_spent} min</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isCompleted && task.score !== undefined && (
                            <div className="text-right">
                              <p className="font-semibold text-secondary">{task.score}%</p>
                              <p className="text-xs text-muted-foreground">Score</p>
                            </div>
                          )}
                          <Badge variant={isCompleted ? "secondary" : "outline"} className="gap-1">
                            {isCompleted ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Done
                              </>
                            ) : (
                              "Not Started"
                            )}
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}