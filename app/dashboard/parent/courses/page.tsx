"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, User, Loader2, AlertCircle, Database, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/providers/auth-provider"

interface Child {
  id: string
  name: string
  email?: string
  grade: number
  courses: ChildCourse[]
  stats: ChildStats
}

interface ChildCourse {
  id: string
  name: string
  code: string
  grade: number
  description: string
  completionRate: number
  avgScore: number
  totalTasks: number
  completedTasks: number
}

interface ChildStats {
  overallCompletionRate: number
  averageScore: number
  totalCourses: number
  totalTasks: number
  completedTasks: number
}

export default function ParentCoursesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [children, setChildren] = useState<Child[]>([])

  useEffect(() => {
    fetchParentChildrenCourses()
  }, [])

  const fetchParentChildrenCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const parentId = user?.parentId || "parent_001"
      
      // Fetch parent children's courses from API
      const response = await fetch(`/api/parent/${parentId}/children-courses`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setChildren(data.children || [])
          setUsingMockData(false)
        } else {
          throw new Error(data.error || 'Failed to fetch children courses')
        }
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching parent children courses:', error)
      setError(error instanceof Error ? error.message : 'Failed to load children courses')
      setUsingMockData(true)
      
      // Fallback to mock data
      const mockChildren: Child[] = [
        {
          id: "student_001",
          name: "Abel Tesfaye",
          grade: 5,
          stats: {
            overallCompletionRate: 75,
            averageScore: 85,
            totalCourses: 6,
            totalTasks: 45,
            completedTasks: 34
          },
          courses: [
            {
              id: "math_g5",
              name: "Mathematics",
              code: "MATH-G5",
              grade: 5,
              description: "Basic arithmetic, geometry, and problem solving",
              completionRate: 80,
              avgScore: 87,
              totalTasks: 15,
              completedTasks: 12
            },
            {
              id: "english_g5",
              name: "English Language",
              code: "ENG-G5",
              grade: 5,
              description: "Reading, writing, and communication skills",
              completionRate: 70,
              avgScore: 82,
              totalTasks: 10,
              completedTasks: 7
            },
            {
              id: "amharic_g5",
              name: "Amharic",
              code: "AMH-G5",
              grade: 5,
              description: "Amharic language and literature",
              completionRate: 90,
              avgScore: 92,
              totalTasks: 12,
              completedTasks: 11
            },
            {
              id: "science_g5",
              name: "Science",
              code: "SCI-G5",
              grade: 5,
              description: "Introduction to biology, physics, and chemistry",
              completionRate: 65,
              avgScore: 78,
              totalTasks: 8,
              completedTasks: 5
            }
          ]
        }
      ]
      setChildren(mockChildren)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchParentChildrenCourses()
  }

  const getCourseColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "text-blue-500"
    if (courseCode.includes('ENG')) return "text-green-500"
    if (courseCode.includes('SCI')) return "text-purple-500"
    if (courseCode.includes('AMH')) return "text-red-500"
    if (courseCode.includes('CIT')) return "text-orange-500"
    if (courseCode.includes('SPT')) return "text-pink-500"
    return "text-primary"
  }

  const getCourseBgColor = (courseCode: string) => {
    if (courseCode.includes('MATH')) return "bg-blue-500/10"
    if (courseCode.includes('ENG')) return "bg-green-500/10"
    if (courseCode.includes('SCI')) return "bg-purple-500/10"
    if (courseCode.includes('AMH')) return "bg-red-500/10"
    if (courseCode.includes('CIT')) return "bg-orange-500/10"
    if (courseCode.includes('SPT')) return "bg-pink-500/10"
    return "bg-primary/10"
  }

  const getPerformanceText = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Very Good"
    if (score >= 70) return "Good"
    if (score >= 60) return "Average"
    return "Needs Improvement"
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <DashboardLayout role="parent">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your children's courses...</p>
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
            <h3 className="text-lg font-semibold mb-2">Unable to Load Courses</h3>
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
            <h1 className="text-3xl font-bold text-balance">Children's Courses</h1>
            <p className="text-muted-foreground">View all courses your children are enrolled in</p>
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
              <h3 className="text-lg font-semibold mb-2">No children enrolled yet</h3>
              <p className="text-muted-foreground text-center">
                Your children's courses will appear here once they are enrolled in the system.
              </p>
            </CardContent>
          </Card>
        ) : (
          children.map((child) => (
            <div key={child.id} className="space-y-6">
              {/* Child Header */}
              <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center text-2xl font-bold text-secondary">
                      {child.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{child.name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-muted-foreground">Grade {child.grade}</p>
                        {child.email && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <p className="text-muted-foreground">{child.email}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold text-primary">
                      {child.stats.overallCompletionRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                  </div>
                </div>
                
                {/* Child Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Courses</div>
                    <div className="text-2xl font-bold">{child.stats.totalCourses}</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Tasks Completed</div>
                    <div className="text-2xl font-bold text-secondary">
                      {child.stats.completedTasks}/{child.stats.totalTasks}
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Average Score</div>
                    <div className="text-2xl font-bold">{child.stats.averageScore}%</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Performance</div>
                    <div className={`text-xl font-bold ${getPerformanceColor(child.stats.averageScore)}`}>
                      {getPerformanceText(child.stats.averageScore)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Courses Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {child.courses.map((course) => {
                  const courseColor = getCourseColor(course.code)
                  const courseBgColor = getCourseBgColor(course.code)
                  const pendingTasks = course.totalTasks - course.completedTasks

                  return (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow hover:border-primary/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className={`${courseBgColor} p-3 rounded-lg`}>
                            <BookOpen className={`h-5 w-5 ${courseColor}`} />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="secondary">Grade {course.grade}</Badge>
                            <Badge variant="outline" className="font-mono text-xs">
                              {course.code}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="mt-4">{course.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">{course.completionRate}%</span>
                          </div>
                          <Progress value={course.completionRate} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-muted/50 rounded-lg p-2">
                            <div className="text-lg font-bold">{course.completedTasks}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                          <div className="bg-primary/10 rounded-lg p-2">
                            <div className="text-lg font-bold text-primary">{pendingTasks}</div>
                            <div className="text-xs text-muted-foreground">Pending</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Average Score</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${getPerformanceColor(course.avgScore)}`}>
                              {course.avgScore}%
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getPerformanceText(course.avgScore)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Child Summary */}
              {child.courses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Course Summary</CardTitle>
                    <CardDescription>Overall performance across all courses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-sm text-muted-foreground mb-1">Courses</div>
                          <div className="text-2xl font-bold">{child.courses.length}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-sm text-muted-foreground mb-1">Total Tasks</div>
                          <div className="text-2xl font-bold">
                            {child.courses.reduce((sum, course) => sum + course.totalTasks, 0)}
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-sm text-muted-foreground mb-1">Completed</div>
                          <div className="text-2xl font-bold text-secondary">
                            {child.courses.reduce((sum, course) => sum + course.completedTasks, 0)}
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-sm text-muted-foreground mb-1">Avg. Score</div>
                          <div className="text-2xl font-bold">
                            {child.courses.length > 0
                              ? Math.round(
                                  child.courses.reduce((sum, course) => sum + course.avgScore, 0) / 
                                  child.courses.length
                                )
                              : 0}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Top Performing Course */}
                      {child.courses.length > 0 && (
                        <div className="bg-secondary/10 rounded-lg p-4">
                          <div className="text-sm text-muted-foreground mb-2">Top Performing Course</div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">
                                {child.courses.sort((a, b) => b.avgScore - a.avgScore)[0].name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {child.courses.sort((a, b) => b.avgScore - a.avgScore)[0].description}
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-lg">
                              {child.courses.sort((a, b) => b.avgScore - a.avgScore)[0].avgScore}%
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}

// Button component import
import { Button } from "@/components/ui/button"