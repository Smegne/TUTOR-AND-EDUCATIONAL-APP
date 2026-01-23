// components/task-execution/task-execution-view.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  BookOpen, 
  HelpCircle, 
  Timer, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { QuizQuestion } from "./quiz-question"
import { StudyNotes } from "./study-notes"
import { QuizResults } from "./quiz-results"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface TaskExecutionViewProps {
  task: any
  studentId: string
}

export function TaskExecutionView({ task, studentId }: TaskExecutionViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'notes' | 'quiz'>('notes')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [quizStarted, setQuizStarted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null)

  // Initialize session timer
  useEffect(() => {
    const sessionStart = Date.now()
    
    const timer = setInterval(() => {
      setTotalTimeSpent(Math.floor((Date.now() - sessionStart) / 60000)) // in minutes
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Auto-save progress
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress()
    }, 30000) // Auto-save every 30 seconds

    setAutoSaveInterval(interval)
    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval)
    }
  }, [answers, currentQuestionIndex, activeTab])

  const saveProgress = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      await fetch('/api/task-progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: task.id,
          studentId,
          answers,
          currentQuestionIndex,
          activeTab,
          timeSpent: totalTimeSpent
        })
      })
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [task.id, studentId, answers, currentQuestionIndex, activeTab, totalTimeSpent])

  const handleAnswerSubmit = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        answer,
        submittedAt: new Date().toISOString(),
        timeSpent: calculateQuestionTime(questionId)
      }
    }))
  }

  const calculateQuestionTime = (questionId: string): number => {
    // Implement question timing logic
    return 0
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setActiveTab('quiz')
    
    // Set timer if task has time limit
    if (task.time_limit_minutes) {
      setTimeRemaining(task.time_limit_minutes * 60)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (task.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      completeQuiz()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const completeQuiz = async () => {
    try {
      // Calculate score
      const calculatedScore = calculateScore()
      setScore(calculatedScore)
      setQuizCompleted(true)

      // Save final results
      const token = localStorage.getItem('accessToken')
      await fetch('/api/task-completion', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: task.id,
          studentId,
          answers,
          score: calculatedScore,
          totalTimeSpent,
          completedAt: new Date().toISOString()
        })
      })

      toast({
        title: "Quiz Completed!",
        description: `Your score: ${calculatedScore}%`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive"
      })
    }
  }

  const calculateScore = (): number => {
    // Implement scoring logic
    return 0
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/student/tasks')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tasks
              </Button>
              
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold">{task.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{task.subject}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {totalTimeSpent} min
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={saveProgress}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              
              <Badge variant={task.difficulty === 'advanced' ? 'destructive' : 'secondary'}>
                {task.difficulty}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6">
        {quizCompleted ? (
          <QuizResults
            score={score || 0}
            totalQuestions={task.questions?.length || 0}
            timeSpent={totalTimeSpent}
            task={task}
            onReview={() => {
              setQuizCompleted(false)
              setCurrentQuestionIndex(0)
            }}
          />
        ) : (
          <>
            {/* Progress Bar */}
            {quizStarted && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of {task.questions?.length || 0}
                  </span>
                  {timeRemaining !== null && (
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <Progress 
                  value={((currentQuestionIndex + 1) / (task.questions?.length || 1)) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Navigation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant={activeTab === 'notes' ? 'default' : 'outline'}
                      className="w-full justify-start gap-2"
                      onClick={() => setActiveTab('notes')}
                    >
                      <BookOpen className="h-4 w-4" />
                      Study Notes
                    </Button>
                    
                    <Button
                      variant={activeTab === 'quiz' ? 'default' : 'outline'}
                      className="w-full justify-start gap-2"
                      onClick={() => setActiveTab('quiz')}
                      disabled={!quizStarted && !task.questions}
                    >
                      <HelpCircle className="h-4 w-4" />
                      Quiz {task.questions && `(${task.questions.length})`}
                    </Button>

                    {/* Quiz Navigation (only when in quiz) */}
                    {quizStarted && (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Questions</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {task.questions?.map((q: any, index: number) => (
                            <Button
                              key={q.id}
                              size="sm"
                              variant={
                                currentQuestionIndex === index ? "default" :
                                answers[q.id] ? "secondary" : "outline"
                              }
                              className={cn(
                                "h-8 w-8 p-0",
                                answers[q.id] && "bg-green-100 text-green-800 hover:bg-green-200"
                              )}
                              onClick={() => setCurrentQuestionIndex(index)}
                            >
                              {index + 1}
                              {answers[q.id] && <CheckCircle className="h-3 w-3 ml-1" />}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3">
                {activeTab === 'notes' ? (
                  <StudyNotes
                    content={task.note_content}
                    attachments={task.attachments}
                    onComplete={startQuiz}
                    hasQuestions={!!task.questions?.length}
                  />
                ) : (
                  <div className="space-y-6">
                    {task.questions?.[currentQuestionIndex] && (
                      <>
                        <QuizQuestion
                          question={task.questions[currentQuestionIndex]}
                          questionNumber={currentQuestionIndex + 1}
                          totalQuestions={task.questions.length}
                          onAnswerSubmit={(answer) => 
                            handleAnswerSubmit(task.questions[currentQuestionIndex].id, answer)
                          }
                          initialAnswer={answers[task.questions[currentQuestionIndex].id]?.answer}
                        />
                        
                        {/* Navigation Controls */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="gap-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          
                          <div className="flex items-center gap-4">
                            <Button
                              variant="outline"
                              onClick={saveProgress}
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" />
                              Save Progress
                            </Button>
                            
                            <Button
                              onClick={handleNextQuestion}
                              className="gap-2"
                            >
                              {currentQuestionIndex === task.questions.length - 1 ? (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  Complete Quiz
                                </>
                              ) : (
                                <>
                                  Next
                                  <ChevronRight className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}