"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  Trophy, 
  Play, 
  Image as ImageIcon, 
  Video, 
  AlertCircle,
  FileText,
  HelpCircle,
  Loader2,
  Award,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  XCircle,
  User,
  Calendar,
  BarChart3,
  Sparkles,
  Monitor,
  PictureInPicture,
  CheckSquare,
  Square,
  Youtube,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Task } from "@/app/dashboard/student/tasks/page"
import Image from "next/image"

interface TaskDetailModalProps {
  task: Task
  studentId: string
  studentName: string
  open: boolean
  onClose: () => void
}

interface Question {
  id: string
  question: string
  type: 'multiple-choice' | 'short-answer' | 'true-false'
  options?: string[]
  correctAnswer?: string
  points?: number
}

type ModalStep = "overview" | "reading" | "watching" | "images" | "questions" | "complete"

export function TaskDetailModal({ task, studentId, studentName, open, onClose }: TaskDetailModalProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<ModalStep>("overview")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [noteRead, setNoteRead] = useState(false)
  const [videoWatched, setVideoWatched] = useState(false)
  const [imagesViewed, setImagesViewed] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)
  const [hasFetchedQuestions, setHasFetchedQuestions] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const lastToggleTime = useRef<number>(0)

  // Get task resources
  const hasNote = !!task.note_content
  const hasVideo = !!task.video_link
  const hasImages = task.images && Array.isArray(task.images) && task.images.length > 0
  const hasQuestions = (task.questions && task.questions.length > 0) || questions.length > 0
  
  // Determine task type and required steps
  const taskType = hasNote && hasQuestions ? "both" : hasNote ? "note" : hasQuestions ? "question" : "task"
  
  // Define required steps based on task content
  const getRequiredSteps = () => {
    const steps: ModalStep[] = ["overview"]
    
    if (hasNote) steps.push("reading")
    if (hasVideo) steps.push("watching")
    if (hasImages) steps.push("images")
    if (hasQuestions) steps.push("questions")
    
    steps.push("complete")
    return steps
  }

  const requiredSteps = getRequiredSteps()
  const currentStepIndex = requiredSteps.indexOf(currentStep)

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const now = Date.now()
    if (now - lastToggleTime.current < 300) return
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && open) {
      e.preventDefault()
      lastToggleTime.current = now
      setIsMinimized(!isMinimized)
    }
    
    if (e.key === 'Escape' && open) {
      if (isMinimized) {
        setIsMinimized(false)
      } else {
        onClose()
      }
    }
  }, [open, onClose, isMinimized])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
    }
  }, [open, handleKeyDown])

  // Update time spent every minute
  useEffect(() => {
    if (open && currentStep !== "overview" && currentStep !== "complete") {
      const interval = setInterval(() => {
        setTimeSpent(Math.round((Date.now() - startTime) / 60000))
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [open, currentStep])

  // Load questions when modal opens
  useEffect(() => {
    if (open && task.id && !hasFetchedQuestions) {
      loadQuestions()
    }
    
    // Reset state when modal opens
    if (open) {
      setCurrentStep("overview")
      setNoteRead(false)
      setVideoWatched(false)
      setImagesViewed(false)
      setAnswers({})
      setTimeSpent(0)
      setIsMinimized(false)
    }
  }, [open, task.id])

  // Fetch questions from API
  const loadQuestions = async () => {
    if (hasFetchedQuestions) return
    
    setIsLoadingQuestions(true)
    try {
      console.log("🔍 Loading questions for task:", task.id)
      
      // First check if questions are already in task object
      if (task.questions && task.questions.length > 0) {
        console.log("✅ Found questions in task object:", task.questions)
        setQuestions(task.questions as Question[])
        setHasFetchedQuestions(true)
        return
      }

      // Fetch from API
      const response = await fetch(`/api/student/tasks/${task.id}/questions`)
      console.log("📡 API Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("📦 API Response data:", data)
        
        if (data.success && data.questions && data.questions.length > 0) {
          console.log("✅ Loaded questions from API:", data.questions)
          setQuestions(data.questions)
        } else if (data.questions && data.questions.length === 0) {
          console.log("ℹ️ No questions found in API response")
          // Check if this task actually has questions in the database
          // You might want to fetch from a different endpoint
          await fetchQuestionsFromDatabase()
        }
      } else {
        console.error("❌ API Error:", response.status, response.statusText)
        // Try alternative endpoint
        await fetchQuestionsFromDatabase()
      }
    } catch (error) {
      console.error('❌ Error loading questions:', error)
      // Use sample questions as fallback
      setQuestions(getSampleQuestions(task.id))
    } finally {
      setIsLoadingQuestions(false)
      setHasFetchedQuestions(true)
    }
  }

  // Alternative method to fetch questions from database
  const fetchQuestionsFromDatabase = async () => {
    try {
      console.log("🔄 Trying alternative question fetch...")
      // Try direct database query endpoint
      const response = await fetch(`/api/tasks/${task.id}/questions`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.questions && data.questions.length > 0) {
          console.log("✅ Loaded questions from alternative endpoint:", data.questions)
          setQuestions(data.questions)
        } else {
          console.log("ℹ️ No questions found in database")
        }
      }
    } catch (error) {
      console.error("❌ Alternative fetch failed:", error)
    }
  }

  const getSampleQuestions = (taskId: string): Question[] => {
    const subject = task.subject.toLowerCase()
    
    if (subject.includes('math')) {
      return [
        {
          id: `${taskId}_1`,
          question: "What is 15 × 7?",
          type: "multiple-choice",
          options: ["95", "105", "115", "125"],
          correctAnswer: "105",
          points: 5
        }
      ]
    }
    
    return [
      {
        id: `${taskId}_1`,
        question: "Did you understand the material?",
        type: "short-answer",
        points: 5
      }
    ]
  }

  const getCourseLabel = (subject: string): string => {
    const courseMap: Record<string, string> = {
      'math': 'Mathematics',
      'english': 'English',
      'amharic': 'Amharic',
      'science': 'Science',
      'general_science': 'General Science',
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

  const startTask = async () => {
    try {
      if (task.status === 'not_started') {
        await fetch('/api/student/tasks/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            studentId: studentId,
            status: 'in_progress',
            startedAt: new Date().toISOString()
          })
        })
      }

      // Determine first step based on required resources
      if (hasNote) {
        setCurrentStep("reading")
      } else if (hasVideo) {
        setCurrentStep("watching")
      } else if (hasImages) {
        setCurrentStep("images")
      } else if (hasQuestions) {
        setCurrentStep("questions")
      } else {
        handleComplete()
      }
    } catch (error) {
      console.error('Error starting task:', error)
      toast({
        title: "Error",
        description: "Failed to start task. Please try again.",
        variant: "destructive"
      })
    }
  }

  const markNoteAsRead = () => {
    setNoteRead(true)
    toast({
      title: "Notes Completed",
      description: "Great! Now proceed to the next step.",
    })
    
    // Determine next step
    if (hasVideo) {
      setCurrentStep("watching")
    } else if (hasImages) {
      setCurrentStep("images")
    } else if (hasQuestions) {
      // Ensure questions are loaded before proceeding
      if (questions.length > 0 || hasQuestions) {
        setCurrentStep("questions")
      } else {
        toast({
          title: "Loading Questions",
          description: "Please wait while we load the questions...",
        })
        loadQuestions().then(() => {
          setCurrentStep("questions")
        })
      }
    } else {
      handleComplete()
    }
  }

  const markVideoAsWatched = () => {
    setVideoWatched(true)
    toast({
      title: "Video Completed",
      description: "Video watched! Proceed to next step.",
    })
    
    // Determine next step
    if (hasImages) {
      setCurrentStep("images")
    } else if (hasQuestions) {
      if (questions.length > 0 || hasQuestions) {
        setCurrentStep("questions")
      } else {
        toast({
          title: "Loading Questions",
          description: "Please wait while we load the questions...",
        })
        loadQuestions().then(() => {
          setCurrentStep("questions")
        })
      }
    } else {
      handleComplete()
    }
  }

  const markImagesAsViewed = () => {
    setImagesViewed(true)
    toast({
      title: "Images Viewed",
      description: "Images reviewed! Proceed to next step.",
    })
    
    // Determine next step
    if (hasQuestions) {
      if (questions.length > 0 || hasQuestions) {
        setCurrentStep("questions")
      } else {
        toast({
          title: "Loading Questions",
          description: "Please wait while we load the questions...",
        })
        loadQuestions().then(() => {
          setCurrentStep("questions")
        })
      }
    } else {
      handleComplete()
    }
  }

  const goToNextStep = () => {
    const currentIndex = requiredSteps.indexOf(currentStep)
    if (currentIndex < requiredSteps.length - 1) {
      setCurrentStep(requiredSteps[currentIndex + 1])
    }
  }

  const goToPreviousStep = () => {
    const currentIndex = requiredSteps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(requiredSteps[currentIndex - 1])
    }
  }

  const handleComplete = async () => {
    // Check if there are questions that haven't been answered
    if (hasQuestions && questions.length > 0 && !allQuestionsAnswered && !showAnswers) {
      toast({
        title: "Complete All Questions",
        description: "Please answer all questions before completing the task.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const timeSpent = Math.round((Date.now() - startTime) / 60000)
      const answersObject: Record<string, string> = {}
      
      questions.forEach(question => {
        const answer = answers[question.id]
        if (answer && answer.trim()) {
          answersObject[question.id] = answer.trim()
        }
      })

      console.log('📤 Submitting completion data:', {
        taskId: task.id,
        studentId,
        answersCount: Object.keys(answersObject).length,
        timeSpent
      })

      const response = await fetch('/api/student/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          studentId: studentId,
          timeSpent: timeSpent,
          answers: answersObject,
          completedAt: new Date().toISOString()
        })
      })

      const responseText = await response.text()
      console.log('📥 Raw API response:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Invalid server response')
      }
      
      if (!response.ok) {
        console.error('API Error:', data)
        throw new Error(data.error || data.details || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Task completion failed')
      }

      setCurrentStep("complete")
      toast({
        title: "Task Completed Successfully! 🎉",
        description: `You scored ${data.data?.percentage || 100}%! ${data.message || ''}`,
      })

      setTimeout(() => {
        onClose()
      }, 2500)

    } catch (error) {
      console.error('Error completing task:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit task.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const allQuestionsAnswered = questions.length > 0 
    ? questions.every((q) => answers[q.id] && answers[q.id].trim())
    : true

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTaskIcon = () => {
    switch (taskType) {
      case "note":
        return <FileText className="h-5 w-5" />
      case "question":
        return <HelpCircle className="h-5 w-5" />
      case "both":
        return <BookOpen className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const renderProgressIndicator = () => {
    if (requiredSteps.length <= 2) return null

    return (
      <div className="flex items-center justify-center gap-4 mb-6 px-4 overflow-x-auto">
        {requiredSteps.map((step, index) => {
          if (step === "overview" || step === "complete") return null
          
          let stepCompleted = false
          let stepLabel = ""
          let stepIcon = null
          
          switch (step) {
            case "reading":
              stepCompleted = noteRead
              stepLabel = "Read Notes"
              stepIcon = <FileText className="h-4 w-4" />
              break
            case "watching":
              stepCompleted = videoWatched
              stepLabel = "Watch Video"
              stepIcon = <Video className="h-4 w-4" />
              break
            case "images":
              stepCompleted = imagesViewed
              stepLabel = "View Images"
              stepIcon = <ImageIcon className="h-4 w-4" />
              break
            case "questions":
              stepCompleted = allQuestionsAnswered
              stepLabel = "Answer Questions"
              stepIcon = <HelpCircle className="h-4 w-4" />
              break
          }
          
          const isCurrent = currentStep === step
          const isPast = requiredSteps.indexOf(step) < currentStepIndex
          
          return (
            <div key={step} className="flex items-center">
              <div className={`flex flex-col items-center ${isMinimized ? 'w-20' : 'w-24'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  stepCompleted ? "bg-green-500 text-white border-green-500 shadow-lg" :
                  isCurrent ? "bg-primary text-white border-primary" :
                  isPast ? "bg-primary/20 text-primary border-primary/30" :
                  "bg-gray-100 text-gray-400 border-gray-200"
                }`}>
                  {stepCompleted ? <Check className="h-5 w-5" /> : stepIcon}
                </div>
                <span className={`text-xs mt-1 text-center font-medium ${
                  isCurrent ? "text-primary" : 
                  stepCompleted ? "text-green-600" : 
                  "text-muted-foreground"
                }`}>
                  {stepLabel}
                </span>
              </div>
              {index < requiredSteps.length - 2 && (
                <div className={`w-8 h-0.5 ${
                  isPast ? "bg-primary" : "bg-gray-200"
                }`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const canProceedToQuestions = () => {
    // Check if all required previous steps are completed
    if (hasNote && !noteRead) return false
    if (hasVideo && !videoWatched) return false
    if (hasImages && !imagesViewed) return false
    return true
  }

  const calculateScore = () => {
    if (!showAnswers || questions.length === 0) return null
    
    let correctCount = 0
    let totalPoints = 0
    
    questions.forEach(question => {
      totalPoints += question.points || 1
      const studentAnswer = answers[question.id]
      if (studentAnswer && question.correctAnswer && 
          studentAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
        correctCount += question.points || 1
      }
    })
    
    return Math.round((correctCount / totalPoints) * 100)
  }

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized)
  }

  // Fix YouTube URL for embedding
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null
    
    try {
      // Handle various YouTube URL formats
      if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1]?.split('&')[0]
        return `https://www.youtube.com/embed/${videoId}`
      } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0]
        return `https://www.youtube.com/embed/${videoId}`
      } else if (url.includes('youtube.com/embed/')) {
        return url // Already an embed URL
      }
      
      return url
    } catch (error) {
      console.error('Error parsing YouTube URL:', error)
      return null
    }
  }

  const youtubeEmbedUrl = task.video_link ? getYouTubeEmbedUrl(task.video_link) : null

  // Don't render if modal is closed
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-md transition-all duration-300 ${
          open ? 'animate-in fade-in' : 'animate-out fade-out'
        } ${isMinimized ? 'bg-black/40' : 'bg-black/70'}`}
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className={`fixed z-50 transition-all duration-300 ease-in-out ${
          isMinimized 
            ? 'top-4 right-4 w-96 h-[600px] shadow-2xl rounded-2xl animate-in slide-in-from-top duration-300' 
            : 'inset-0'
        }`}
      >
        {/* Modal Content */}
        <div 
          ref={modalRef}
          className={`relative w-full h-full bg-white dark:bg-gray-900 ${
            !isMinimized ? 'rounded-none' : 'rounded-2xl overflow-hidden shadow-2xl'
          }`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Modal Header */}
          <div className={`sticky top-0 z-50 flex items-center justify-between ${
            isMinimized ? 'border-b border-gray-200 dark:border-gray-800' : 'border-b border-gray-100 dark:border-gray-800'
          } bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4 ${!isMinimized ? 'px-6' : ''}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`${isMinimized ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 flex items-center justify-center flex-shrink-0`}>
                {getTaskIcon()}
              </div>
              <div className="min-w-0">
                <h2 
                  id="modal-title" 
                  className={`font-bold text-gray-900 dark:text-white truncate ${
                    isMinimized ? 'text-sm' : 'text-xl'
                  }`}
                >
                  {currentStep === "overview" ? task.title :
                   currentStep === "reading" ? "Study Notes" :
                   currentStep === "watching" ? "Watch Video" :
                   currentStep === "images" ? "View Images" :
                   currentStep === "questions" ? "Answer Questions" :
                   "Task Completed"}
                </h2>
                {!isMinimized && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {currentStep === "overview" ? `${getCourseLabel(task.subject)} • Grade ${task.grade_level}` :
                     currentStep === "reading" ? "Read carefully before proceeding" :
                     currentStep === "watching" ? "Watch the instructional video" :
                     currentStep === "images" ? "Review all images" :
                     currentStep === "questions" ? (isLoadingQuestions ? "Loading questions..." : "Complete all questions") :
                     "Great job! Task completed successfully"}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Time Spent Indicator */}
              {isMinimized && (currentStep === "reading" || currentStep === "watching" || currentStep === "images" || currentStep === "questions") && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{timeSpent || Math.round((Date.now() - startTime) / 60000)}m</span>
                </div>
              )}
              
              {/* Fullscreen Toggle */}
              {!isMinimized && (currentStep === "reading" || currentStep === "watching" || currentStep === "images" || currentStep === "questions") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="rounded-full h-8 w-8"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}
              
              {/* Show Answers Toggle */}
              {!isMinimized && currentStep === "questions" && questions.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="rounded-full h-8 w-8"
                  aria-label={showAnswers ? "Hide answers" : "Show answers"}
                >
                  {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
              
              {/* Window Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMinimized}
                className="rounded-full h-8 w-8"
                aria-label={isMinimized ? "Expand to full screen" : "Minimize to window"}
                title={isMinimized ? "Expand (Ctrl+F)" : "Minimize (Ctrl+F)"}
              >
                {isMinimized ? <Monitor className="h-4 w-4" /> : <PictureInPicture className="h-4 w-4" />}
              </Button>
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600"
                aria-label="Close modal"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Modal Content Area */}
          <div className={`overflow-y-auto ${
            isMinimized 
              ? 'h-[calc(600px-64px)]'
              : 'h-[calc(100vh-64px)]'
          }`}>
            <div className={`${!isMinimized ? 'p-6' : 'p-4'}`}>
              {/* Keyboard Shortcut Hint */}
              {!isMinimized && (
                <div className="flex items-center justify-end mb-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span className="hidden sm:inline">Press</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                      Ctrl+F
                    </kbd>
                    <span>to window mode</span>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {renderProgressIndicator()}

              {/* OVERVIEW STEP */}
              {currentStep === "overview" && (
                <div className={`space-y-6 animate-in fade-in duration-300 ${
                  isMinimized ? 'space-y-4' : ''
                }`}>
                  {/* Task Metadata */}
                  <div className={`flex flex-wrap items-center gap-2 ${isMinimized ? 'text-xs' : ''}`}>
                    <Badge variant="secondary" className={`${isMinimized ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1.5'}`}>
                      {getCourseLabel(task.subject)}
                    </Badge>
                    {!isMinimized && (
                      <>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">{formatDate(task.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <User className="h-3 w-3" />
                          <span className="text-xs">{task.created_by_name || "Teacher"}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{task.estimated_time_minutes} min</span>
                    </div>
                  </div>

                  {/* Task Description */}
                  {!isMinimized && (
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="font-semibold text-blue-800 dark:text-blue-300">Task Overview</h3>
                        </div>
                        <p className="text-blue-700 dark:text-blue-300">
                          {task.description || "Complete this task to demonstrate your understanding."}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Resources Section */}
                  {(hasNote || hasVideo || hasImages || hasQuestions) && !isMinimized && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Learning Flow
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hasNote && (
                          <Card className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                            onClick={() => setCurrentStep("reading")}>
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">Study Notes</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Required reading material
                                  </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                <Badge variant="secondary">Step 1</Badge>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Must complete before next step
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {hasVideo && (
                          <Card className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                            onClick={() => {
                              if (hasNote && !noteRead) {
                                toast({
                                  title: "Complete Notes First",
                                  description: "Please read the notes before watching the video.",
                                  variant: "destructive"
                                })
                              } else {
                                setCurrentStep("watching")
                              }
                            }}>
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center">
                                  <Youtube className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">Instructional Video</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Watch and learn from video
                                  </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                <Badge variant="secondary">
                                  {hasNote ? "Step 2" : "Step 1"}
                                </Badge>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {hasNote ? "Watch after notes" : "Required"}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {hasImages && (
                          <Card className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                            onClick={() => {
                              if ((hasNote && !noteRead) || (hasVideo && !videoWatched)) {
                                toast({
                                  title: "Complete Previous Steps",
                                  description: "Please complete all previous steps before viewing images.",
                                  variant: "destructive"
                                })
                              } else {
                                setCurrentStep("images")
                              }
                            }}>
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">
                                    {task.images?.length || 0} Image{task.images?.length !== 1 ? 's' : ''}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Visual aids and diagrams
                                  </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                <Badge variant="secondary">
                                  {hasNote && hasVideo ? "Step 3" : 
                                   hasNote || hasVideo ? "Step 2" : "Step 1"}
                                </Badge>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Review all images
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {hasQuestions && (
                          <Card className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                            onClick={() => {
                              if (!canProceedToQuestions()) {
                                toast({
                                  title: "Complete Previous Steps",
                                  description: "Please complete all previous steps before answering questions.",
                                  variant: "destructive"
                                })
                              } else {
                                // Ensure questions are loaded
                                if (questions.length > 0) {
                                  setCurrentStep("questions")
                                } else {
                                  toast({
                                    title: "Loading Questions",
                                    description: "Please wait while we load the questions...",
                                  })
                                  loadQuestions().then(() => {
                                    setCurrentStep("questions")
                                  })
                                }
                              }
                            }}>
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
                                  <HelpCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">
                                    {questions.length || task.questions?.length || 0} Question{questions.length !== 1 ? 's' : ''}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Final assessment
                                  </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                <Badge variant="secondary">
                                  {[hasNote, hasVideo, hasImages].filter(Boolean).length + 1} {/* Step number */}
                                </Badge>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Total: {(questions.length || task.questions?.length || 0) * 10} points
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className={`flex gap-3 ${isMinimized ? 'flex-col' : 'flex-col sm:flex-row'} ${!isMinimized ? 'pt-6 border-t border-gray-100 dark:border-gray-800' : ''}`}>
                    <Button 
                      className={`${isMinimized ? 'h-10 text-sm' : 'h-12 text-base'} flex-1`}
                      onClick={startTask}
                    >
                      <Play className={`${isMinimized ? 'h-3 w-3 mr-1' : 'h-5 w-5 mr-2'}`} />
                      {task.status === "completed" ? "Review Task" : "Start Task"}
                    </Button>
                    {!isMinimized && (
                      <Button 
                        variant="outline" 
                        className="h-12" 
                        onClick={onClose}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* READING STEP */}
              {currentStep === "reading" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <Card className={`${isFullscreen && !isMinimized ? 'h-[calc(100vh-200px)]' : ''} ${isMinimized ? 'border-0' : 'border-0 shadow-lg'}`}>
                    <CardContent className={`${isFullscreen && !isMinimized ? 'h-full overflow-y-auto pt-4' : 'pt-4'} ${isMinimized ? 'p-3' : ''}`}>
                      {!isMinimized && (
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Study Notes</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size={isMinimized ? "sm" : "default"}
                              onClick={() => setNoteRead(true)}
                              className="gap-2"
                            >
                              <CheckSquare className="h-4 w-4" />
                              Mark as Read
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className={`prose max-w-none dark:prose-invert ${
                        isMinimized ? 'prose-sm' : 'prose-lg'
                      }`}>
                        <div 
                          className="leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: task.note_content || "" }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className={`flex gap-3 ${isMinimized ? 'flex-col' : 'flex-col sm:flex-row'} ${!isMinimized ? 'pt-4 border-t border-gray-100 dark:border-gray-800' : ''}`}>
                    <Button 
                      className={`${isMinimized ? 'h-9 text-sm' : 'h-12 text-base'} flex-1`}
                      onClick={markNoteAsRead}
                    >
                      Continue to Next Step
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`${isMinimized ? 'h-9 text-sm' : 'h-12'}`}
                      onClick={() => setCurrentStep("overview")}
                    >
                      <ChevronLeft className={`${isMinimized ? 'h-3 w-3 mr-1' : 'h-5 w-5 mr-2'}`} />
                      Back to Overview
                    </Button>
                  </div>
                </div>
              )}

              {/* WATCHING STEP */}
              {currentStep === "watching" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <Card className={`${isMinimized ? 'border-0' : 'border-0 shadow-lg'}`}>
                    <CardContent className={`${isMinimized ? 'p-3' : 'pt-4'}`}>
                      {!isMinimized && (
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Instructional Video</h3>
                          </div>
                          <Button
                            variant="outline"
                            size={isMinimized ? "sm" : "default"}
                            onClick={() => setVideoWatched(true)}
                            className="gap-2"
                          >
                            <CheckSquare className="h-4 w-4" />
                            Mark as Watched
                          </Button>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {youtubeEmbedUrl ? (
                          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                            <iframe
                              src={youtubeEmbedUrl}
                              className="absolute inset-0 w-full h-full"
                              title="Task video"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                            <div className="text-center p-6">
                              <Youtube className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-400 mb-2">Video not available in embed format</p>
                              {task.video_link && (
                                <a 
                                  href={task.video_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Open video in new tab
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>Watch the entire video before proceeding</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className={`flex gap-3 ${isMinimized ? 'flex-col' : 'flex-col sm:flex-row'} ${!isMinimized ? 'pt-4 border-t border-gray-100 dark:border-gray-800' : ''}`}>
                    <Button 
                      className={`${isMinimized ? 'h-9 text-sm' : 'h-12 text-base'} flex-1`}
                      onClick={markVideoAsWatched}
                    >
                      Continue to Next Step
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`${isMinimized ? 'h-9 text-sm' : 'h-12'}`}
                      onClick={goToPreviousStep}
                    >
                      <ChevronLeft className={`${isMinimized ? 'h-3 w-3 mr-1' : 'h-5 w-5 mr-2'}`} />
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {/* IMAGES STEP */}
              {currentStep === "images" && hasImages && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <Card className={`${isMinimized ? 'border-0' : 'border-0 shadow-lg'}`}>
                    <CardContent className={`${isMinimized ? 'p-3' : 'pt-4'}`}>
                      {!isMinimized && (
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Visual Aids</h3>
                          </div>
                          <Button
                            variant="outline"
                            size={isMinimized ? "sm" : "default"}
                            onClick={() => setImagesViewed(true)}
                            className="gap-2"
                          >
                            <CheckSquare className="h-4 w-4" />
                            Mark as Viewed
                          </Button>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {task.images?.map((image, index) => (
                            <div key={index} className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`Task image ${index + 1}`}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg"
                                }}
                              />
                              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                Image {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>Review all images before proceeding</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className={`flex gap-3 ${isMinimized ? 'flex-col' : 'flex-col sm:flex-row'} ${!isMinimized ? 'pt-4 border-t border-gray-100 dark:border-gray-800' : ''}`}>
                    <Button 
                      className={`${isMinimized ? 'h-9 text-sm' : 'h-12 text-base'} flex-1`}
                      onClick={markImagesAsViewed}
                    >
                      Continue to Next Step
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`${isMinimized ? 'h-9 text-sm' : 'h-12'}`}
                      onClick={goToPreviousStep}
                    >
                      <ChevronLeft className={`${isMinimized ? 'h-3 w-3 mr-1' : 'h-5 w-5 mr-2'}`} />
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {/* QUESTIONS STEP */}
              {currentStep === "questions" && (
                <div className={`space-y-4 animate-in fade-in duration-300 ${isMinimized ? 'space-y-3' : ''}`}>
                  {isLoadingQuestions ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                      <span className="text-muted-foreground text-sm">Loading questions...</span>
                    </div>
                  ) : questions.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center">
                        <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-semibold mb-2">No Questions Available</h3>
                        <p className="text-muted-foreground mb-4 text-sm">
                          This task doesn't have any questions assigned yet.
                        </p>
                        <div className="flex gap-3 justify-center">
                          <Button onClick={handleComplete} size={isMinimized ? "sm" : "default"}>
                            Mark as Complete
                          </Button>
                          <Button 
                            variant="outline" 
                            size={isMinimized ? "sm" : "default"}
                            onClick={() => {
                              loadQuestions()
                              toast({
                                title: "Retrying",
                                description: "Attempting to load questions again...",
                              })
                            }}
                          >
                            Retry Loading
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Questions Count */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            {questions.length} Question{questions.length !== 1 ? 's' : ''}
                          </h3>
                        </div>
                        <Badge variant="outline">
                          {Object.keys(answers).length}/{questions.length} Answered
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {Object.keys(answers).length}/{questions.length}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {showAnswers && calculateScore() && `Score: ${calculateScore()}%`}
                          </span>
                        </div>
                        <Progress value={(Object.keys(answers).length / questions.length) * 100} className="h-1.5" />
                      </div>

                      {/* Questions List */}
                      <div className={`space-y-3 ${isMinimized ? 'max-h-[300px] overflow-y-auto pr-2' : ''}`}>
                        {questions.map((question, index) => {
                          const isCorrect = showAnswers && question.correctAnswer && 
                            answers[question.id]?.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
                          
                          return (
                            <Card 
                              key={question.id} 
                              className={`${isMinimized ? 'p-3' : ''} transition-all ${
                                showAnswers ? isCorrect ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' : ''
                              }`}
                            >
                              <CardContent className={`${isMinimized ? 'p-0' : 'pt-4'} space-y-3`}>
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 ${
                                    isMinimized ? 'h-6 w-6' : 'h-8 w-8'
                                  } rounded-full flex items-center justify-center ${
                                    showAnswers ? 
                                      isCorrect ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400' : 
                                      'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400' :
                                      'bg-primary/10 dark:bg-primary/20 text-primary'
                                  }`}>
                                    <span className={`${isMinimized ? 'text-xs' : 'text-sm'} font-bold`}>{index + 1}</span>
                                  </div>
                                  <div className="flex-1 space-y-3 min-w-0">
                                    <div>
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                                        <p className={`${isMinimized ? 'text-sm' : 'text-base'} font-medium break-words`}>{question.question}</p>
                                        {question.points && (
                                          <Badge variant="secondary" className={`self-start ${isMinimized ? 'text-xs' : ''}`}>
                                            {question.points} pt{question.points !== 1 ? 's' : ''}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {showAnswers && question.correctAnswer && (
                                        <div className={`mt-2 p-2 rounded-lg text-sm ${
                                          isCorrect ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 
                                          'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                                        }`}>
                                          <div className="flex items-center gap-2">
                                            {isCorrect ? (
                                              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                            ) : (
                                              <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                            )}
                                            <div>
                                              <span className={`font-medium ${isCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                                                {isCorrect ? 'Correct!' : 'Incorrect'}
                                              </span>
                                              {!isCorrect && (
                                                <p className="text-xs mt-0.5 text-red-700 dark:text-red-400">
                                                  Correct answer: <span className="font-semibold">{question.correctAnswer}</span>
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Answer Input */}
                                    {question.type === "multiple-choice" && question.options ? (
                                      <RadioGroup
                                        value={answers[question.id] || ""}
                                        onValueChange={(value) => handleAnswerChange(question.id, value)}
                                        disabled={showAnswers}
                                        className="space-y-1"
                                      >
                                        {question.options.map((option, optIndex) => (
                                          <div
                                            key={optIndex}
                                            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors border text-sm ${
                                              showAnswers && option === question.correctAnswer
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                          >
                                            <RadioGroupItem 
                                              value={option} 
                                              id={`${question.id}-${optIndex}`}
                                              disabled={showAnswers}
                                              className={`${isMinimized ? 'h-3 w-3' : ''}`}
                                            />
                                            <Label 
                                              htmlFor={`${question.id}-${optIndex}`} 
                                              className="cursor-pointer flex-1 text-sm"
                                            >
                                              {option}
                                            </Label>
                                          </div>
                                        ))}
                                      </RadioGroup>
                                    ) : question.type === "true-false" ? (
                                      <RadioGroup
                                        value={answers[question.id] || ""}
                                        onValueChange={(value) => handleAnswerChange(question.id, value)}
                                        className="flex gap-2"
                                        disabled={showAnswers}
                                      >
                                        <div className="flex items-center space-x-2 flex-1">
                                          <RadioGroupItem value="true" id={`${question.id}-true`} disabled={showAnswers} className={`${isMinimized ? 'h-3 w-3' : ''}`} />
                                          <Label htmlFor={`${question.id}-true`} className="cursor-pointer py-2 px-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 flex-1 text-sm">
                                            True
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-1">
                                          <RadioGroupItem value="false" id={`${question.id}-false`} disabled={showAnswers} className={`${isMinimized ? 'h-3 w-3' : ''}`} />
                                          <Label htmlFor={`${question.id}-false`} className="cursor-pointer py-2 px-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 flex-1 text-sm">
                                            False
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    ) : (
                                      <Textarea
                                        placeholder="Type your answer here..."
                                        value={answers[question.id] || ""}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        className={`${isMinimized ? 'min-h-16 text-sm' : 'min-h-24 text-base'}`}
                                        disabled={showAnswers}
                                      />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>

                      {/* Action Buttons */}
                      <div className={`flex gap-3 ${isMinimized ? 'flex-col' : 'flex-col sm:flex-row'} ${!isMinimized ? 'pt-4 border-t border-gray-100 dark:border-gray-800' : ''}`}>
                        <Button
                          className={`${isMinimized ? 'h-9 text-sm' : 'h-12 text-base'} flex-1`}
                          onClick={handleComplete}
                          disabled={(!allQuestionsAnswered && !showAnswers) || isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className={`${isMinimized ? 'h-3 w-3 mr-1' : 'h-5 w-5 mr-2'} animate-spin`} />
                              Submitting...
                            </>
                          ) : showAnswers ? (
                            "Finish Task"
                          ) : (
                            "Submit Answers & Complete"
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className={`${isMinimized ? 'h-9 text-sm' : 'h-12'}`}
                          onClick={goToPreviousStep}
                          disabled={isSubmitting}
                        >
                          <ChevronLeft className={`${isMinimized ? 'h-3 w-3 mr-1' : 'h-5 w-5 mr-2'}`} />
                          Back
                        </Button>
                      </div>

                      {!allQuestionsAnswered && !showAnswers && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                          <AlertCircle className="h-4 w-4" />
                          Please answer all questions before submitting.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* COMPLETE STEP */}
              {currentStep === "complete" && (
                <div className={`text-center animate-in fade-in duration-300 ${
                  isMinimized ? 'py-4 space-y-4' : 'py-8 space-y-8'
                }`}>
                  <div className={`mx-auto rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center ${
                    isMinimized ? 'w-16 h-16' : 'w-24 h-24'
                  }`}>
                    <CheckCircle2 className={isMinimized ? 'h-8 w-8 text-green-600' : 'h-12 w-12 text-green-600 dark:text-green-400'} />
                  </div>
                  
                  <div>
                    <h3 className={`font-bold mb-2 ${isMinimized ? 'text-lg' : 'text-2xl'}`}>Task Completed!</h3>
                    <p className={`text-gray-600 dark:text-gray-400 ${isMinimized ? 'text-sm' : 'text-lg'}`}>
                      You have successfully completed all required steps. Great job!
                    </p>
                  </div>

                  {/* Score Display */}
                  {questions.length > 0 && !isMinimized && (
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 mx-auto max-w-md">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 mb-4">
                            <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
                          </div>
                          <h4 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">Performance Summary</h4>
                          
                          {showAnswers ? (
                            <>
                              <div className="text-5xl font-bold text-green-900 dark:text-green-300 mb-4">
                                {calculateScore()}%
                              </div>
                              <p className="text-green-700 dark:text-green-400">
                                {calculateScore()! >= 80 
                                  ? "Excellent work! You've mastered this topic." 
                                  : calculateScore()! >= 60 
                                  ? "Good job! Keep practicing to improve." 
                                  : "Keep studying! Review the material and try again."}
                              </p>
                            </>
                          ) : (
                            <p className="text-green-700 dark:text-green-400">
                              Your answers have been submitted for review.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Stats */}
                  <div className={`grid gap-4 ${isMinimized ? 'grid-cols-2' : 'grid-cols-2 gap-6 max-w-sm mx-auto'}`}>
                    <div className="text-center">
                      <div className="flex items-center gap-1 mb-1 justify-center">
                        <Award className={`${isMinimized ? 'h-4 w-4' : 'h-6 w-6'} text-blue-600 dark:text-blue-400`} />
                        <span className={`font-bold ${isMinimized ? 'text-lg' : 'text-2xl'}`}>+10</span>
                      </div>
                      <p className={`text-gray-600 dark:text-gray-400 ${isMinimized ? 'text-xs' : 'text-sm'}`}>XP Earned</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 mb-1 justify-center">
                        <Clock className={`${isMinimized ? 'h-4 w-4' : 'h-6 w-6'} text-primary`} />
                        <span className={`font-bold ${isMinimized ? 'text-lg' : 'text-2xl'}`}>
                          {timeSpent || Math.round((Date.now() - startTime) / 60000)} min
                        </span>
                      </div>
                      <p className={`text-gray-600 dark:text-gray-400 ${isMinimized ? 'text-xs' : 'text-sm'}`}>Time Spent</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={`flex gap-3 justify-center ${isMinimized ? 'flex-col' : 'flex-col sm:flex-row'}`}>
                    <Button 
                      onClick={onClose} 
                      className={isMinimized ? 'h-9 text-sm' : 'h-12 px-8'}
                    >
                      Return to Tasks
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}