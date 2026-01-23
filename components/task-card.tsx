"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, HelpCircle, Play, Clock, Award, BookOpen } from "lucide-react"
import { useState } from "react"

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
  status: 'not_started' | 'in_progress' | 'completed'
  score?: number
  time_spent?: number
  completed_at?: string
  started_at?: string
  questions?: any[]
}

interface TaskCardProps {
  task: Task
  onStartTask: (task: Task) => void
  isTaskOverdue: (task: Task) => boolean
  getCourseLabel: (subject: string) => string
  formatDate: (dateString: string) => string
}

export function TaskCard({ 
  task, 
  onStartTask, 
  isTaskOverdue, 
  getCourseLabel, 
  formatDate 
}: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const overdue = isTaskOverdue(task)
  const courseLabel = getCourseLabel(task.subject)
  
  const hasQuestions = task.questions && task.questions.length > 0
  const hasNote = !!task.note_content
  const taskType = hasNote && hasQuestions ? "both" : hasNote ? "note" : hasQuestions ? "question" : "task"
  
  const getTaskTypeIcon = () => {
    switch (taskType) {
      case "note":
        return <FileText className="h-4 w-4" />
      case "question":
        return <HelpCircle className="h-4 w-4" />
      case "both":
        return <BookOpen className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }
  
  const getTaskTypeLabel = () => {
    return taskType.charAt(0).toUpperCase() + taskType.slice(1)
  }
  
  const getStatusColor = () => {
    if (task.status === "completed") return "bg-green-100 text-green-800 border-green-200"
    if (overdue) return "bg-red-100 text-red-800 border-red-200"
    if (task.status === "in_progress") return "bg-blue-100 text-blue-800 border-blue-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }
  
  const getStatusText = () => {
    if (task.status === "completed") return "Completed"
    if (overdue) return "Overdue"
    if (task.status === "in_progress") return "In Progress"
    return "Not Started"
  }
  
  const handleStartClick = async () => {
    setIsLoading(true)
    try {
      await onStartTask(task)
    } finally {
      setIsLoading(false)
    }
  }
  
  const getButtonText = () => {
    if (task.status === "completed") return "Review"
    if (task.status === "in_progress") return "Continue"
    return "Start Task"
  }
  
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {task.title}
            </CardTitle>
            <CardDescription>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-primary">{courseLabel}</span>
                <span>•</span>
                <span>Grade {task.grade_level}</span>
                {task.created_by_name && (
                  <>
                    <span>•</span>
                    <span className="text-muted-foreground">By {task.created_by_name}</span>
                  </>
                )}
              </div>
            </CardDescription>
          </div>
          <Badge 
            className={`ml-2 flex-shrink-0 ${getStatusColor()}`}
          >
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {/* Task Type & Date */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              {getTaskTypeIcon()}
              <span>{getTaskTypeLabel()}</span>
            </div>
            {task.difficulty && (
              <Badge variant="outline" className="text-xs capitalize">
                {task.difficulty}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">{formatDate(task.created_at)}</span>
          </div>
        </div>
        
        {/* Description */}
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        {/* Time Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Est: {task.estimated_time_minutes} min</span>
            </div>
            {task.time_spent !== undefined && (
              <div className="flex items-center gap-1">
                <span>•</span>
                <span>Actual: {task.time_spent} min</span>
              </div>
            )}
          </div>
          
          {/* Questions Count */}
          {hasQuestions && (
            <Badge variant="secondary" className="text-xs">
              {task.questions!.length} Qs
            </Badge>
          )}
        </div>
        
        {/* Score Section for Completed Tasks */}
        {task.status === "completed" && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Score</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-900">
                  {task.score !== undefined ? `${task.score}%` : 'Completed'}
                </span>
                {task.completed_at && (
                  <p className="text-xs text-green-600 mt-1">
                    Completed {formatDate(task.completed_at)}
                  </p>
                )}
              </div>
            </div>
            {task.time_spent && (
              <div className="flex items-center justify-between text-xs text-green-700 mt-2">
                <span>Time spent:</span>
                <span className="font-medium">{task.time_spent} minutes</span>
              </div>
            )}
          </div>
        )}
        
        {/* Start Button */}
        <Button
          className="w-full mt-auto"
          variant={task.status === "completed" ? "outline" : "default"}
          onClick={handleStartClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Loading...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {getButtonText()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}