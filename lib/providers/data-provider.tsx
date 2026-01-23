"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { tasksApi, studentTasksApi, studentsApi } from "@/lib/api"
import type { Task, Student } from "@/lib/data/mock-database"

interface DataContextType {
  // Tasks
  tasks: Task[]
  loading: boolean
  error: string | null
  refreshTasks: () => void
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>

  // Students
  students: Student[]
  loadingStudents: boolean
  refreshStudents: () => void
  
  // Database status
  usingMockData: boolean
  switchToRealData: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [usingMockData, setUsingMockData] = useState(true)

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const refreshTasks = () => {
    triggerRefresh()
  }

  const refreshStudents = () => {
    triggerRefresh()
  }

  const switchToRealData = () => {
    setUsingMockData(false)
    triggerRefresh()
    console.log('[DataProvider] Switching to real data mode')
  }

  // Load all students (for tutor view)
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true)
        const studentsData = await studentsApi.getStudents()
        const safeStudents = Array.isArray(studentsData) ? studentsData : []
        setStudents(safeStudents)
      } catch (err) {
        console.error("Error loading students:", err)
        setError(err instanceof Error ? err.message : "Failed to load students")
      } finally {
        setLoadingStudents(false)
      }
    }
    
    loadStudents()
  }, [refreshTrigger])

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
    try {
      setLoading(true)
      const newTask = await tasksApi.createTask(taskData)
      triggerRefresh()
      return newTask
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const contextValue: DataContextType = {
    tasks,
    loading,
    error,
    refreshTasks,
    createTask,
    students,
    loadingStudents,
    refreshStudents,
    usingMockData,
    switchToRealData,
  }

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

export function useTutorData(tutorId: string) {
  const { refreshTasks, students, loadingStudents, usingMockData } = useData()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    activeTasks: 0, 
    completionRate: 0, 
    avgScore: 0 
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`[${usingMockData ? 'MOCK' : 'API'}] Loading tutor data...`)
      
      // Load tasks from API - WITH SAFETY CHECK
      const tutorTasks = await tasksApi.getTasks('tutor', tutorId)
      const safeTasks = Array.isArray(tutorTasks) ? tutorTasks : []
      setTasks(safeTasks)
      
      // Calculate stats
      const activeTasks = safeTasks.length
      const safeStudents = Array.isArray(students) ? students : []
      const totalStudents = safeStudents.length
      
      // Calculate completion rate and average score from student tasks
      let totalAssignments = 0
      let completedAssignments = 0
      let totalScore = 0
      let scoreCount = 0
      
      // For mock data, use simplified calculation
      if (usingMockData) {
        // Mock calculation for demo
        completedAssignments = Math.floor(activeTasks * totalStudents * 0.7)
        totalAssignments = activeTasks * totalStudents
        totalScore = completedAssignments * 85
        scoreCount = completedAssignments
      } else {
        // Real calculation from API
        for (const task of safeTasks) {
          const assignedIds = Array.isArray(task.assignedStudentIds) ? task.assignedStudentIds : []
          for (const studentId of assignedIds) {
            totalAssignments++
            try {
              const studentTask = await studentTasksApi.getStudentTasks(studentId, task.id)
              if (studentTask?.status === 'completed') {
                completedAssignments++
                if (studentTask.score) {
                  totalScore += studentTask.score
                  scoreCount++
                }
              }
            } catch (taskError) {
              console.error(`Error fetching task for student ${studentId}:`, taskError)
            }
          }
        }
      }
      
      const completionRate = totalAssignments > 0 
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0
      
      const avgScore = scoreCount > 0 
        ? Math.round(totalScore / scoreCount)
        : 0
      
      setStats({
        totalStudents,
        activeTasks,
        completionRate,
        avgScore
      })
      
    } catch (err) {
      console.error("Error loading tutor data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tutorId) {
      loadData()
    }
  }, [tutorId, refreshTrigger, students])

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1)
    refreshTasks()
  }

  return { 
    tasks, 
    students: Array.isArray(students) ? students : [], 
    stats, 
    loading: loading || loadingStudents, 
    error, 
    refresh,
    usingMockData
  }
}

export function useStudentData(studentId: string) {
  const { refreshTasks, usingMockData } = useData()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    avgScore: 0,
    streak: 0,
    points: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`[${usingMockData ? 'MOCK' : 'API'}] Loading student data...`)
      
      // Load tasks from API
      const studentTasks = await tasksApi.getTasks('student', studentId)
      const safeTasks = Array.isArray(studentTasks) ? studentTasks : []
      setTasks(safeTasks)
      
      // Load student tasks to calculate stats - WITH FIX
      const studentTaskStatuses = await studentTasksApi.getStudentTasks(studentId)
      
      // Check if studentTaskStatuses is defined and is an array
      const taskStatuses = Array.isArray(studentTaskStatuses) ? studentTaskStatuses : []
      
      const completedTasks = taskStatuses.filter((st: any) => st.status === 'completed').length
      const totalTasks = taskStatuses.length
      const pendingTasks = totalTasks - completedTasks
      
      // Calculate average score
      const completedWithScore = taskStatuses.filter(
        (st: any) => st.status === 'completed' && st.score
      )
      const avgScore = completedWithScore.length > 0 
        ? Math.round(completedWithScore.reduce((sum: number, st: any) => sum + (st.score || 0), 0) / completedWithScore.length)
        : 0
      
      // Mock values for now (we need sessions API)
      const streak = usingMockData ? 7 : 0 // Mock for demo
      const points = completedTasks * 10 + avgScore
      
      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        avgScore,
        streak,
        points
      })
      
    } catch (err) {
      console.error("Error loading student data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (studentId) {
      loadData()
    }
  }, [studentId, refreshTrigger])

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1)
    refreshTasks()
  }

  return { 
    tasks, 
    stats, 
    loading, 
    error, 
    refresh,
    usingMockData
  }
}

export function useParentData(parentId: string) {
  const { refreshTasks, usingMockData } = useData()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`[${usingMockData ? 'MOCK' : 'API'}] Loading parent data...`)
      
      const parentTasks = await tasksApi.getTasks('parent', parentId)
      const safeTasks = Array.isArray(parentTasks) ? parentTasks : []
      setTasks(safeTasks)
      
    } catch (err) {
      console.error("Error loading parent data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (parentId) {
      loadData()
    }
  }, [parentId, refreshTrigger])

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1)
    refreshTasks()
  }

  return { 
    tasks, 
    loading, 
    error, 
    refresh,
    usingMockData
  }
}

// Database Status Banner Component
export function DatabaseStatusBanner() {
  const { usingMockData, switchToRealData } = useData()
  
  if (!usingMockData) return null
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Using Demo Data</span> - Currently showing sample data. Connect to MySQL database to use real data.
          </p>
          <div className="mt-2">
            <button
              onClick={switchToRealData}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Try Connect to MySQL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { DataProvider, useData, useTutorData, useStudentData, useParentData }