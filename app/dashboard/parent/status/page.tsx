"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { User, TrendingUp, Clock, Award, Monitor, Calendar, Loader2, AlertCircle, Database, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"

interface Child {
  id: string
  name: string
  grade: number
  email?: string
  stats: {
    completionRate: number
    averageScore: number
    tasksCompleted: number
    tasksPending: number
    streak: number
    totalTasks: number
  }
  sessions: {
    totalStudyTime: number
    avgSessionTime: number
    totalSessions: number
    recentSessions: Array<{
      id: string
      login_time: string
      logout_time?: string
      duration_minutes?: number
      device_info?: string
    }>
  }
}

export default function ParentStatusPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [children, setChildren] = useState<Child[]>([])

  useEffect(() => {
    fetchParentStatus()
  }, [])

  const fetchParentStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const parentId = user?.parentId || "parent_001"
      
      // Fetch parent status from API
      const response = await fetch(`/api/parent/${parentId}/status`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setChildren(data.children || [])
          setUsingMockData(false)
        } else {
          throw new Error(data.error || 'Failed to fetch status data')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching parent status:', error)
      setError(error instanceof Error ? error.message : 'Failed to load status data')
      setUsingMockData(true)
      
      // Fallback to mock data
      const mockChildren: Child[] = [
        {
          id: "student_001",
          name: "Abel Tesfaye",
          grade: 5,
          email: "abel@example.com",
          stats: {
            completionRate: 80,
            averageScore: 85,
            tasksCompleted: 12,
            tasksPending: 3,
            streak: 7,
            totalTasks: 15
          },
          sessions: {
            totalStudyTime: 540, // minutes
            avgSessionTime: 45,
            totalSessions: 12,
            recentSessions: [
              {
                id: "session_1",
                login_time: new Date(Date.now() - 3600000).toISOString(),
                logout_time: new Date(Date.now() - 3300000).toISOString(),
                duration_minutes: 30,
                device_info: "Chrome on Windows"
              },
              {
                id: "session_2",
                login_time: new Date(Date.now() - 86400000).toISOString(),
                logout_time: new Date(Date.now() - 86100000).toISOString(),
                duration_minutes: 45,
                device_info: "Safari on iPad"
              }
            ]
          }
        }
      ]
      setChildren(mockChildren)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchParentStatus()
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return "Outstanding!"
    if (score >= 80) return "Excellent!"
    if (score >= 70) return "Good work!"
    if (score >= 60) return "Keep improving!"
    return "Needs attention"
  }

  const getStreakMessage = (streak: number) => {
    if (streak >= 14) return "🔥 Amazing streak!"
    if (streak >= 7) return "Great consistency!"
    if (streak >= 3) return "Keep going!"
    return "Build your streak!"
  }

  if (loading) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your children's learning status...</p>
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
            <h3 className="text-lg font-semibold mb-2">Unable to Load Status Data</h3>
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
            <h1 className="text-3xl font-bold text-balance">Learning Status</h1>
            <p className="text-muted-foreground">Overview of your children's academic progress and device usage</p>
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

        {children.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No children found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Your children will appear here once they are registered and enrolled in courses.
              </p>
              <Button onClick={refreshData} variant="outline">
                Check Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          children.map((child) => (
            <div key={child.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/20 p-3 rounded-full">
                    <User className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">{child.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Grade {child.grade}</span>
                      {child.email && (
                        <>
                          <span>•</span>
                          <span>{child.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">
                  {child.stats.completedTasks}/{child.stats.totalTasks} tasks
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Completion Rate</CardDescription>
                    <CardTitle className="text-3xl">{child.stats.completionRate}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={child.stats.completionRate} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {child.stats.completedTasks} of {child.stats.totalTasks} tasks
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Average Score</CardDescription>
                    <CardTitle className="text-3xl">{child.stats.averageScore}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-secondary">
                      <TrendingUp className="h-4 w-4" />
                      <span>{getPerformanceMessage(child.stats.averageScore)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Current Streak</CardDescription>
                    <CardTitle className="text-3xl">{child.stats.streak} days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>{getStreakMessage(child.stats.streak)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Tasks Status</CardDescription>
                    <CardTitle className="text-3xl">{child.stats.tasksCompleted}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{child.stats.tasksPending} pending</span>
                    </div>
                    {child.stats.tasksPending > 0 && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {Math.round((child.stats.tasksPending / child.stats.totalTasks) * 100)}% pending
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Device Usage (Last 7 Days)</CardTitle>
                    <CardDescription>Monitor learning time and device activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Total Time</span>
                        </div>
                        <p className="text-2xl font-bold">{formatDuration(child.sessions.totalStudyTime)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Monitor className="h-4 w-4" />
                          <span className="text-sm">Avg. Session</span>
                        </div>
                        <p className="text-2xl font-bold">{formatDuration(child.sessions.avgSessionTime)}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Sessions This Week</span>
                      </div>
                      <p className="text-2xl font-bold">{child.sessions.totalSessions}</p>
                    </div>
                    {child.sessions.recentSessions[0]?.device_info && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Most used device:</span> {child.sessions.recentSessions[0].device_info}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                    <CardDescription>Login and logout activity tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {child.sessions.recentSessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{formatDate(session.login_time)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(session.login_time)}
                            {session.logout_time && ` - ${formatTime(session.logout_time)}`}
                          </p>
                          {session.device_info && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📱 {session.device_info}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {session.duration_minutes ? formatDuration(session.duration_minutes) : "Active"}
                        </Badge>
                      </div>
                    ))}
                    {child.sessions.recentSessions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No session history available</p>
                        <p className="text-sm mt-1">Your child will appear here when they start studying</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance Insights */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance Insights
                  </CardTitle>
                  <CardDescription>Key observations about your child's learning</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Award className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium mb-1">Consistent Learning Habit</p>
                      <p className="text-sm text-muted-foreground">
                        Your child has maintained a {child.stats.streak}-day learning streak. This consistency is excellent for academic success!
                      </p>
                    </div>
                  </div>
                  
                  {child.stats.averageScore >= 80 && (
                    <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                      <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Strong Academic Performance</p>
                        <p className="text-sm text-muted-foreground">
                          With an average score of {child.stats.averageScore}%, your child is demonstrating excellent understanding of the material.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {child.sessions.totalStudyTime >= 300 && (
                    <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                      <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-3 w-3 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Dedicated Study Time</p>
                        <p className="text-sm text-muted-foreground">
                          Your child has studied for {formatDuration(child.sessions.totalStudyTime)} this week. This dedication is commendable!
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}

// Button component import
import { Button } from "@/components/ui/button"