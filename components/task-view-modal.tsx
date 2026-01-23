// components/task-view-modal.tsx - UPDATED VERSION
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Clock, CheckCircle2, AlertCircle, Calendar, FileText, ImageIcon, Video, Eye } from "lucide-react"

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
  assigned_count: number
  completed_count: number
  questions?: any[]
}

interface Student {
  id: string
  name: string
  grade: number
  email?: string
  courses?: string[]
  parentId?: string
}

interface TaskViewModalProps {
  task: Task
  students?: Student[] // Make optional
  open: boolean
  onClose: () => void
}

export function TaskViewModal({ task, students = [], open, onClose }: TaskViewModalProps) {
  // Safe calculation methods
  const completionRate = task.assigned_count > 0 
    ? Math.round((task.completed_count / task.assigned_count) * 100)
    : 0

 const getCourseLabel = (subject: string | undefined | null): string => {
  // Handle all edge cases
  if (subject === undefined || subject === null) {
    console.warn('getCourseLabel called with undefined/null subject')
    return "Unknown Course"
  }
  
  // Convert to string if it's not already
  const subjectStr = typeof subject === 'string' ? subject : String(subject)
  
  if (subjectStr.trim() === '') {
    return "Unknown Course"
  }
  
  const courseMap: Record<string, string> = {
    'math': 'Mathematics',
    'english': 'English',
    'amharic': 'Amharic',
    'science': 'Science',
    'general_science': 'General Science',
    'social_science': 'Social Science',
    'citizenship': 'Citizenship',
    'pva': 'PVA (Physical and Vocational Arts)',
    'hpe': 'HPE (Health and Physical Education)',
    'it': 'IT (Information Technology)',
    'ሂሳብ': 'Mathematics',
    'እንግሊዝኛ': 'English',
    'አማርኛ': 'Amharic',
    'አካባቢ_ሳይንስ': 'Environmental Science',
    'ስነምግባር': 'Citizenship',
    'ስነጥበብ': 'Arts',
    'ስፖርት': 'Sports',
    
    // Add database format mappings
    'math_g5': 'Mathematics (Grade 5)',
    'math_g6': 'Mathematics (Grade 6)',
    'math_g7': 'Mathematics (Grade 7)',
    'math_g8': 'Mathematics (Grade 8)',
    'english_g5': 'English (Grade 5)',
    'english_g6': 'English (Grade 6)',
    'english_g7': 'English (Grade 7)',
    'english_g8': 'English (Grade 8)',
  }
  
  try {
    // Try exact match first
    if (courseMap[subjectStr]) {
      return courseMap[subjectStr]
    }
    
    // Clean the subject - remove grade suffix
    let cleaned = subjectStr.replace(/_g[0-9]+$/i, '')
    
    // Try cleaned match
    if (courseMap[cleaned]) {
      return courseMap[cleaned]
    }
    
    // If still not found, format nicely
    cleaned = cleaned
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
    
    return cleaned
  } catch (error) {
    console.error('Error formatting course label:', error)
    return subjectStr // Return original as fallback
  }
}

  const getTaskTypeIcon = () => {
    if (task.video_link) return <Video className="h-4 w-4" />
    if (task.images && task.images.length > 0) return <ImageIcon className="h-4 w-4" />
    if (task.note_content) return <FileText className="h-4 w-4" />
    return <BookOpen className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
              {getTaskTypeIcon()}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{task.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline">
                  {getCourseLabel(task.subject)}
                </Badge>
                <span className="text-sm text-muted-foreground">Grade {task.grade_level}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground capitalize">{task.difficulty}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{task.estimated_time_minutes} min</span>
                </div>
                {task.parent_visibility && (
                  <>
                    <span className="text-sm text-muted-foreground">•</span>
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Parent Visible
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{task.assigned_count}</span>
                </div>
                <p className="text-sm text-muted-foreground">Assigned</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">{task.completed_count}</span>
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
                </div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Task Description */}
          {task.description && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Study Material */}
          {task.note_content && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Study Material</h3>
                  <Badge variant="outline">
                    <FileText className="h-3 w-3 mr-1" />
                    Note
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {task.note_content}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Video Link */}
          {task.video_link && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Video Resource</h3>
                  <Badge variant="outline">
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </Badge>
                </div>
                <a 
                  href={task.video_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  {task.video_link}
                </a>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {task.images && task.images.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Images ({task.images.length})</h3>
                  <Badge variant="outline">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Images
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {task.images.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Task image ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions */}
          {task.questions && task.questions.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Questions ({task.questions.length})</h3>
                <div className="space-y-3">
                  {task.questions.map((q, index) => (
                    <div key={q.id || index} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">
                        {index + 1}. {q.question_text || q.question}
                      </p>
                      {q.options && Array.isArray(q.options) && (
                        <div className="ml-4 mt-2 space-y-1">
                          {q.options.map((option, optIndex) => (
                            <p
                              key={optIndex}
                              className={`text-xs ${
                                option === q.correct_answer 
                                  ? "text-green-600 font-semibold" 
                                  : "text-muted-foreground"
                              }`}
                            >
                              • {option}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Task Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created by:</span>
                    <span className="ml-2">{task.created_by_name || 'Unknown'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Task ID:</span>
                    <span className="ml-2 font-mono text-xs">{task.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Subject Code:</span>
                    <span className="ml-2 font-mono text-xs">{task.subject}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}