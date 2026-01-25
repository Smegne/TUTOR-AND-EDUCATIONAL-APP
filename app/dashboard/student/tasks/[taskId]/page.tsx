// app/dashboard/student/tasks/[taskId]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { TaskExecutionView } from "@/components/task-execution/task-execution-view"
import { TaskLoadingSkeleton } from "@/components/task-execution/task-loading-skeleton"
import { useAuth } from "@/lib/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Task {
  id: string
  title: string
  description?: string
  created_at?: string
  due_date?: string
  status?: 'pending' | 'in_progress' | 'completed'
}

interface TaskDetail extends Task {
  notes?: {
    id: string
    title: string
    content: string
    attachments?: string[]
    created_at: string
  }
  questions?: {
    id: string
    question_text: string
    question_type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false'
    options?: string[]
    correct_answer?: string
    points: number
    time_limit_seconds?: number
    hint?: string
  }[]
  session_data?: {
    current_question_index: number
    answers: Record<string, any>
    time_spent: number
    start_time: string
  }
}

export default function TaskExecutionPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchTaskDetails()
  }, [params.taskId, isAuthenticated])

  const fetchTaskDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const studentId = user?.studentId || user?.id

      const response = await fetch(`/api/tasks/${params.taskId}?studentId=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) throw new Error('Failed to fetch task details')

      const data = await response.json()
      setTask(data)
      
      // If task has saved session, restore it
      if (data.session_data) {
        // Handle session restoration logic
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load task')
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <TaskLoadingSkeleton />
  
  if (error || !task) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-destructive">Task Not Found</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return <TaskExecutionView task={task} studentId={user?.id || ''} />
}