"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, Target, Award, Clock, Monitor, Calendar, Loader2, AlertCircle, Database, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"

interface StudentStats {
  completedTasks: number
  totalTasks: number
  avgScore: number
  streak: number
  points: number
}

interface StudySession {
  id: string
  student_id: string
  login_time: string
  logout_time?: string
  duration_minutes?: number
  device_info?: string
}

interface RecentActivity {
  id: string
  title: string
  subject: string
  status: string
  score?: number
  completed_at?: string
  created_at: string
}

export default function StudentStatusPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [stats, setStats] = useState<StudentStats>({
    completedTasks: 0,
    totalTasks: 0,
    avgScore: 0,
    streak: 0,
    points: 0
  })
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    fetchStudentStatusData()
  }, [])

  const fetchStudentStatusData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const studentId = user?.studentId || "student_001"
      
      // Fetch student status data from API
      const response = await fetch(`/api/student/${studentId}/status`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setStats(data.stats)
          setSessions(data.sessions || [])
          setRecentActivity(data.recentActivity || [])
          setUsingMockData(false)
        } else {
          throw new Error(data.error || 'Failed to fetch status data')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching student status data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load status data')
      setUsingMockData(true)
      
      // Fallback to mock data
      const mockStats: StudentStats = {
        completedTasks: 12,
        totalTasks: 15,
        avgScore: 85,
        streak: 7,
        points: 1250
      }
      
      const mockSessions: StudySession[] = [
        {
          id: "session_1",
          student_id: "student_001",
          login_time: new Date(Date.now() - 86400000).toISOString(),
          logout_time: new Date(Date.now() - 86000000).toISOString(),
          duration_minutes: 45,
          device_info: "Chrome on Windows"
        },
        {
          id: "session_2",
          student_id: "student_001",
          login_time: new Date(Date.now() - 172800000).toISOString(),
          logout_time: new Date(Date.now() - 172000000).toISOString(),
          duration_minutes: 60,
          device_info: "Safari on iPad"
        }
      ]
      
      const mockRecentActivity: RecentActivity[] = [
        {
          id: "task_001",
          title: "Basic Multiplication Practice",
          subject: "Mathematics",
          status: "completed",
          score: 92,
          completed_at: new Date(Date.now() - 43200000).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "task_002",
          title: "Reading Comprehension",
          subject: "English",
          status: "completed",
          score: 88,
          completed_at: new Date(Date.now() - 129600000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
      
      setStats(mockStats)
      setSessions(mockSessions)
      setRecentActivity(mockRecentActivity)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchStudentStatusData()
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const getCompletionRate = () => {
    return stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
  }

  const getTotalStudyTime = () => {
    return sessions.reduce((total, session) => total + (session.duration_minutes || 0), 0)
  }

  const getAvgSessionTime = () => {
    const completedSessions = sessions.filter(s => s.duration_minutes && s.duration_minutes > 0)
    if (completedSessions.length === 0) return 0
    return Math.round(
      completedSessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) / 
      completedSessions.length
    )
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

  if (loading) {
    return (
      <DashboardLayout role="student" studentName={user?.firstName}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your learning status...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !usingMockData) {
    return (
      <DashboardLayout role="student" studentName={user?.firstName}>
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
    <DashboardLayout role="student" studentName={user?.firstName}>
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
            <p className="text-muted-foreground">Track your progress and performance</p>
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-3xl">
                {getCompletionRate()}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress
                value={getCompletionRate()}
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.completedTasks} of {stats.totalTasks} tasks completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">{stats.avgScore}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-secondary">
                <TrendingUp className="h-4 w-4" />
                <span>{stats.avgScore >= 80 ? 'Excellent!' : stats.avgScore >= 70 ? 'Good work!' : 'Keep improving!'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Streak</CardDescription>
              <CardTitle className="text-3xl">{stats.streak} days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>{stats.streak >= 7 ? '🔥 Amazing streak!' : 'Keep it up!'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Learning Points</CardDescription>
              <CardTitle className="text-3xl">{stats.points}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>{stats.points > 1000 ? '🏆 Top performer!' : 'Keep earning!'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Study Time Analytics</CardTitle>
              <CardDescription>Your device usage for the past 7 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Total Time</span>
                  </div>
                  <p className="text-2xl font-bold">{formatDuration(getTotalStudyTime())}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm">Avg. Session</span>
                  </div>
                  <p className="text-2xl font-bold">{formatDuration(getAvgSessionTime())}</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Total Sessions</span>
                </div>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              {sessions.length > 0 && sessions[0].device_info && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Most used device:</span> {sessions[0].device_info}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Your login and logout activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-secondary/20 p-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(session.login_time).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.login_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {session.logout_time &&
                          ` - ${new Date(session.logout_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {session.duration_minutes ? formatDuration(session.duration_minutes) : "Active"}
                  </Badge>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No session history yet</p>
                  <p className="text-sm mt-1">Start studying to see your session data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest completed tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    {activity.score !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {activity.score}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{getCourseLabel(activity.subject)}</span>
                    <span>•</span>
                    <span className="capitalize">{activity.status}</span>
                    {activity.completed_at && (
                      <>
                        <span>•</span>
                        <span>
                          Completed {new Date(activity.completed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No activity yet</p>
                <p className="text-sm mt-1">Complete tasks to see your activity here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

// Button component import
import { Button } from "@/components/ui/button"