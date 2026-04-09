// app/dashboard/parent/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, BookOpen, Clock, CheckCircle2, Award, Loader2, 
  AlertCircle, RefreshCw, ChevronRight, Heart, Target, Sparkles,
  Activity, UserPlus, Mail, Filter, Star, Calendar, Zap
} from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

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
  parent_visibility: boolean
  created_at: string
  status?: string
  score?: number
  completed_at?: string
  time_spent?: number
}

interface Child {
  id: string
  name: string
  grade: number
  courses: string[]
  email?: string
  status: 'linked' | 'pending' | 'invited'
  linked_at?: string
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

export default function ParentDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<ParentStats | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshing, setRefreshing] = useState(false)

  const getParentId = useCallback(() => {
    if ((user as any)?.lookupId) return (user as any).lookupId
    if ((user as any)?.userId) return (user as any).userId
    if ((user as any)?.parentId) return (user as any).parentId
    if (user?.id) return user.id
    return null
  }, [user])

  const PARENT_ID = getParentId()

  const fetchParentDashboardData = useCallback(async (showToast = false) => {
    if (!PARENT_ID) {
      setError("No parent ID found. Please log in again.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log("🔄 Fetching parent dashboard from database for ID:", PARENT_ID)
      
      const response = await fetch(`/api/parent/${PARENT_ID}/dashboard`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch data: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch dashboard data")
      }
      
      setChildren(data.children || [])
      setTasks(data.tasks || [])
      setStats(data.stats)
      
      if (data.children?.length > 0 && !selectedChildId) {
        setSelectedChildId(data.children[0].id)
      }
      
      if (showToast) {
        toast.success(`Dashboard updated with ${data.children?.length || 0} children`)
      }
      
      console.log("✅ Database data loaded:", {
        children: data.children?.length,
        tasks: data.tasks?.length,
        stats: data.stats
      })
      
    } catch (err) {
      console.error("❌ Error fetching from database:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      if (showToast) {
        toast.error("Failed to load data from database")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [PARENT_ID, selectedChildId])

  useEffect(() => {
    if (PARENT_ID) {
      fetchParentDashboardData()
    } else {
      setLoading(false)
      setError("Authentication required. Please log in.")
    }
  }, [PARENT_ID, fetchParentDashboardData])

  const refreshData = () => {
    setRefreshing(true)
    fetchParentDashboardData(true)
  }

  const sendInvitation = async (childEmail: string) => {
    try {
      const response = await fetch('/api/parent/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: PARENT_ID,
          childEmail,
          parentName: user?.firstName
        })
      })
      
      if (response.ok) {
        toast.success('Invitation sent successfully!')
        refreshData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error('Failed to send invitation')
    }
  }

  const getStatusBadge = (status: Child['status']) => {
    switch(status) {
      case 'linked':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Linked</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'invited':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Invited</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not yet"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })
  }

  const formatTime = (completedAt?: string) => {
    if (!completedAt) return "Pending"
    const date = new Date(completedAt)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  const selectedChild = selectedChildId 
    ? children.find(child => child.id === selectedChildId) 
    : null

  const childTasks = selectedChild
    ? tasks.filter(task => task.grade_level === selectedChild.grade)
    : tasks

  if (loading) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <motion.div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: brandColors.primary }} />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Loading dashboard...</p>
              <p className="text-sm text-gray-500 mt-2">Fetching your children's data</p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <motion.div className="text-center max-w-md">
            <div className="bg-red-50 rounded-full p-4 w-20 h-20 mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Unable to Load Data</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={refreshData} className="bg-green-500 hover:bg-green-600">
              Try Again
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="parent">
      <div className="min-h-screen" style={{ background: brandColors.grayLight }}>
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.primaryLight})` }} />
        
        <div className="p-6 md:p-8 space-y-8">
          {/* Header */}
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
                <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
              </div>
              <p className="text-gray-500">Monitor your children's learning progress</p>
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

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="border-b border-gray-200">
                <TabsList className="bg-transparent h-auto p-0 space-x-8">
                  {[
                    { value: "overview", icon: Activity, label: "Overview" },
                    { value: "children", icon: Users, label: "My Children" },
                    { value: "activity", icon: Calendar, label: "Activity" }
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none bg-transparent px-4 py-3 text-gray-600 data-[state=active]:text-green-600 data-[state=active]:shadow-none gap-2"
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                      {tab.value === "children" && (
                        <Badge className="ml-2 bg-green-100 text-green-700" variant="secondary">
                          {children.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                {stats && (
                  <>
                    {/* Children Summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="border-none shadow-lg overflow-hidden">
                        <CardHeader className="border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl flex items-center gap-2">
                                <Users className="h-5 w-5" style={{ color: brandColors.primary }} />
                                My Children
                              </CardTitle>
                              <CardDescription>
                                {stats.linkedChildren} linked • {stats.pendingChildren} pending
                              </CardDescription>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setActiveTab("children")}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              View All
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid md:grid-cols-3 gap-4">
                            {children.slice(0, 3).map((child, index) => (
                              <motion.div
                                key={child.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -4 }}
                              >
                                <Card 
                                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                                    selectedChildId === child.id 
                                      ? 'border-2 shadow-lg' 
                                      : 'border border-gray-100 hover:border-green-200'
                                  }`}
                                  style={{ 
                                    borderColor: selectedChildId === child.id ? brandColors.primary : undefined,
                                    background: brandColors.white
                                  }}
                                  onClick={() => setSelectedChildId(child.id)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div 
                                            className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                            style={{ background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.primaryDark})` }}
                                          >
                                            {child.name.split(" ").map((n) => n[0]).join("")}
                                          </div>
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{child.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                              {getStatusBadge(child.status)}
                                              {child.grade > 0 && (
                                                <span className="text-sm text-gray-500">Grade {child.grade}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        {child.email && (
                                          <p className="text-sm text-gray-500 truncate">{child.email}</p>
                                        )}
                                      </div>
                                      <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Stats Overview */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {[
                        { label: "Today's Progress", value: `${stats.todaysCompleted}/${stats.todaysTotal}`, subtext: `${selectedChild?.name || 'Your child'}'s completed tasks`, progress: stats.todaysProgress, gradient: "from-blue-500 to-blue-600", bgGradient: "from-blue-50 to-blue-100" },
                        { label: "Weekly Streak", value: `${stats.weeklyStreak} Days`, subtext: "Consistent learning!", gradient: "from-purple-500 to-purple-600", bgGradient: "from-purple-50 to-purple-100" },
                        { label: "Avg. Score", value: `${stats.avgScore}%`, subtext: "Great performance", gradient: "from-green-500 to-green-600", bgGradient: "from-green-50 to-green-100" }
                      ].map((stat, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          whileHover={{ y: -4 }}
                        >
                          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className={`bg-gradient-to-br ${stat.bgGradient} p-6`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-500 mb-2">{stat.label}</p>
                                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                  <p className="text-xs text-gray-400 mt-2">{stat.subtext}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                  {stat.label === "Today's Progress" ? <Target className="h-5 w-5 text-white" /> :
                                   stat.label === "Weekly Streak" ? <Zap className="h-5 w-5 text-white" /> :
                                   <Award className="h-5 w-5 text-white" />}
                                </div>
                              </div>
                              {stat.progress !== undefined && (
                                <div className="mt-4">
                                  <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ 
                                        width: `${stat.progress}%`,
                                        background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.primaryDark})`
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Recent Activity */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Card className="border-none shadow-lg overflow-hidden">
                        <CardHeader className="border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl flex items-center gap-2">
                                <Activity className="h-5 w-5" style={{ color: brandColors.primary }} />
                                Recent Activity
                              </CardTitle>
                              <CardDescription>{selectedChild?.name || 'Your child'}'s recent tasks</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              {childTasks.length} visible tasks
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          {childTasks.length === 0 ? (
                            <div className="text-center py-8">
                              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500">No tasks available</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {childTasks.slice(0, 3).map((task, index) => (
                                <motion.div
                                  key={task.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
                                  style={{ background: brandColors.white }}
                                >
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: brandColors.primaryBg }}>
                                      <BookOpen className="h-6 w-6" style={{ color: brandColors.primary }} />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">{task.title}</p>
                                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <span>{task.subject}</span>
                                        <span>•</span>
                                        <span>{formatTime(task.completed_at)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {task.status === 'completed' && task.score !== undefined && (
                                    <div className="text-right">
                                      <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        <p className="font-semibold text-gray-900">{task.score}%</p>
                                      </div>
                                    </div>
                                  )}
                                  <Badge className={task.status === 'completed' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                                    {task.status === 'completed' ? "Completed" : "In Progress"}
                                  </Badge>
                                </motion.div>
                              ))}
                              {childTasks.length > 3 && (
                                <div className="text-center pt-4">
                                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("activity")} className="text-green-600">
                                    View All Activity
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </>
                )}
              </TabsContent>

              {/* Children Tab */}
              <TabsContent value="children" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-none shadow-lg overflow-hidden">
                    <CardHeader className="border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <UserPlus className="h-5 w-5" style={{ color: brandColors.primary }} />
                            My Children
                          </CardTitle>
                          <CardDescription>Manage and monitor all your linked children</CardDescription>
                        </div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button className="gap-2" style={{ background: brandColors.primary }}>
                            <UserPlus className="h-4 w-4" />
                            Add Child
                          </Button>
                        </motion.div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {children.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No children added yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {children.map((child, index) => (
                            <motion.div
                              key={child.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
                              style={{ background: brandColors.white }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                     style={{ background: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.primaryDark})` }}>
                                  {child.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <div>
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-semibold text-gray-900 text-lg">{child.name}</h4>
                                    {getStatusBadge(child.status)}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                                    {child.email && <span>{child.email}</span>}
                                    {child.grade > 0 && <span>Grade {child.grade}</span>}
                                    {child.status === 'linked' && child.linked_at && (
                                      <span>Linked {formatDate(child.linked_at)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {child.status === 'pending' && (
                                  <Button size="sm" variant="outline" onClick={() => sendInvitation(child.email!)} className="gap-2">
                                    <Mail className="h-4 w-4" />
                                    Send Invite
                                  </Button>
                                )}
                                {child.status === 'linked' && (
                                  <Button size="sm" variant="ghost" onClick={() => setSelectedChildId(child.id)} className="text-green-600">
                                    View Progress
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-none shadow-lg overflow-hidden">
                    <CardHeader className="border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Activity className="h-5 w-5" style={{ color: brandColors.primary }} />
                            All Activity
                          </CardTitle>
                          <CardDescription>Tasks visible to parents across all children</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {tasks.length === 0 ? (
                        <div className="text-center py-12">
                          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No visible tasks yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tasks.map((task, index) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
                              style={{ background: brandColors.white }}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: brandColors.primaryBg }}>
                                  <BookOpen className="h-6 w-6" style={{ color: brandColors.primary }} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{task.title}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{formatTime(task.completed_at)}</span>
                                    </div>
                                    <span>•</span>
                                    <span>Grade {task.grade_level}</span>
                                    <span>•</span>
                                    <span>{task.subject}</span>
                                    {task.time_spent && task.time_spent > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{task.time_spent} min</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {task.status === 'completed' && task.score !== undefined && (
                                <div className="text-right">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <p className="font-semibold text-gray-900">{task.score}%</p>
                                  </div>
                                </div>
                              )}
                              <Badge className={task.status === 'completed' ? "bg-green-100 text-green-700 gap-1" : "bg-gray-100 text-gray-600"}>
                                {task.status === 'completed' ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed
                                  </>
                                ) : (
                                  "In Progress"
                                )}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}