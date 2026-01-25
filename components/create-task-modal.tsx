// components/create-task-modal.tsx - UPDATED WITH MULTIPLE QUESTIONS
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, FileText, HelpCircle, Eye, Video, ImageIcon, X, Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"

// Grade options
const gradeOptions = [
  { value: 5, label: "Grade 5" },
  { value: 6, label: "Grade 6" },
  { value: 7, label: "Grade 7" },
  { value: 8, label: "Grade 8" },
]

// Courses for Grade 7 & 8 (English medium)
const grade7And8Courses = [
  { value: "mathematics", label: "Mathematics" },
  { value: "english", label: "English" },
  { value: "amharic", label: "Amharic" },
  { value: "general_science", label: "General Science" },
  { value: "social_science", label: "Social Science" },
  { value: "citizenship", label: "Citizenship" },
  { value: "pva", label: "PVA (Physical and Vocational Arts)" },
  { value: "hpe", label: "HPE (Health and Physical Education)" },
  { value: "it", label: "IT (Information Technology)" },
]

// Courses for Grade 5 & 6 (Amharic medium)
const grade5And6Courses = [
  { value: "ሂሳብ", label: "ሂሳብ (Mathematics)" },
  { value: "እንግሊዝኛ", label: "እንግሊዝኛ (English)" },
  { value: "አማርኛ", label: "አማርኛ (Amharic)" },
  { value: "አካባቢ_ሳይንስ", label: "አካባቢ ሳይንስ (Environmental Science)" },
  { value: "ስነምግባር", label: "ስነምግባር (Citizenship)" },
  { value: "ስነጥበብ", label: "ስነጥበብ (Arts)" },
  { value: "ስፖርት", label: "ስፖርት (Sports)" },
]

interface Question {
  id: string
  type: 'multiple-choice' | 'short-answer' | 'true-false'
  question: string
  options?: string[]
  correctAnswer?: string
  sampleAnswer?: string
  points?: number
}

interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated?: () => void
  tutorId?: string
  tutorCourses?: string[]
}

export function CreateTaskModal({ open, onOpenChange, onTaskCreated, tutorId, tutorCourses = [] }: CreateTaskModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [fetchingStudents, setFetchingStudents] = useState(false)

  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [taskTopic, setTaskTopic] = useState("")
  const [taskInstructions, setTaskInstructions] = useState("")
  const [taskType, setTaskType] = useState<"note" | "question" | "both">("note")
  const [noteContent, setNoteContent] = useState("")
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: Date.now().toString(),
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: undefined,
      points: 10
    }
  ])
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [parentVisibility, setParentVisibility] = useState(false)
  const [videoLink, setVideoLink] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [imageInput, setImageInput] = useState("")
  const [duration, setDuration] = useState("30")
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner")

  // Get courses based on selected grade
  const getCoursesForGrade = (grade: number | null) => {
    if (!grade) return []
    
    if (grade === 7 || grade === 8) {
      return grade7And8Courses
    } else if (grade === 5 || grade === 6) {
      return grade5And6Courses
    }
    return []
  }

  // Current available courses based on selected grade
  const availableCourses = getCoursesForGrade(selectedGrade)

  // Fetch students when grade changes OR when modal opens
  useEffect(() => {
    const fetchStudentsForGrade = async () => {
      if (!selectedGrade || !tutorId || !open) {
        setAvailableStudents([]);
        return;
      }

      try {
        setFetchingStudents(true);
        
        console.log('Fetching students for grade:', {
          tutorId,
          grade: selectedGrade,
          timestamp: new Date().toISOString()
        });
        
        // Add cache-busting parameter to prevent stale data
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/students?tutorId=${tutorId}&grade=${selectedGrade}&_t=${timestamp}`
        );
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const students = await response.json();
          console.log(`Fetched ${students.length} students for grade ${selectedGrade} at ${new Date().toISOString()}`);
          setAvailableStudents(students);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch students:', errorText);
          setAvailableStudents([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setAvailableStudents([]);
      } finally {
        setFetchingStudents(false);
      }
    }

    fetchStudentsForGrade();
  }, [selectedGrade, tutorId, open]);

  // Question management functions
  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: undefined,
      points: 10
    }
    setQuestions([...questions, newQuestion])
    setActiveQuestionIndex(questions.length)
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index)
      setQuestions(newQuestions)
      if (activeQuestionIndex >= newQuestions.length) {
        setActiveQuestionIndex(newQuestions.length - 1)
      }
    }
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], ...updates }
    setQuestions(newQuestions)
  }

  const handleMcOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions]
    if (!newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options = ['', '', '', '']
    }
    newQuestions[questionIndex].options![optionIndex] = value
    setQuestions(newQuestions)
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const convertToDBCourseFormat = (course: string, grade: number): string => {
    const courseMap: Record<string, string> = {
      "ሂሳብ": "math",
      "እንግሊዝኛ": "english",
      "አማርኛ": "amharic",
      "አካባቢ_ሳይንስ": "science",
      "ስነምግባር": "citizenship",
      "ስነጥበብ": "arts",
      "ስፖርት": "sports",
    }

    const englishCourseMap: Record<string, string> = {
      "mathematics": "math",
      "english": "english",
      "amharic": "amharic",
      "general_science": "science",
      "social_science": "social_science",
      "citizenship": "citizenship",
      "pva": "pva",
      "hpe": "hpe",
      "it": "it",
    }

    let courseKey = course
    if (grade === 5 || grade === 6) {
      courseKey = courseMap[course] || course
    } else {
      courseKey = englishCourseMap[course] || course
    }

    return `${courseKey}_g${grade}`
  }

  const handleGradeChange = (value: string) => {
    const newGrade = Number.parseInt(value)
    setSelectedGrade(newGrade)
    setSelectedCourse("")
    setSelectedStudents([])
  }

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value)
    setSelectedStudents([])
  }

  const handleAddImage = () => {
    if (imageInput.trim() && !images.includes(imageInput.trim())) {
      setImages([...images, imageInput.trim()])
      setImageInput("")
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    if (!selectedGrade) {
      toast({
        title: "Grade Required",
        description: "Please select a grade.",
        variant: "destructive",
      })
      return false
    }

    if (!selectedCourse) {
      toast({
        title: "Course Required",
        description: "Please select a course.",
        variant: "destructive",
      })
      return false
    }

    if (!tutorId) {
      toast({
        title: "Tutor ID Missing",
        description: "Unable to identify tutor. Please log in again.",
        variant: "destructive",
      })
      return false
    }

    if (selectedStudents.length === 0) {
      toast({
        title: "Students Required",
        description: "Please assign the task to at least one student.",
        variant: "destructive",
      })
      return false
    }

    if (!taskTopic.trim()) {
      toast({
        title: "Task Topic Required",
        description: "Please enter a task topic.",
        variant: "destructive",
      })
      return false
    }

    if (!taskInstructions.trim()) {
      toast({
        title: "Instructions Required",
        description: "Please provide task instructions.",
        variant: "destructive",
      })
      return false
    }

    if (taskType === "note" && !noteContent.trim()) {
      toast({
        title: "Note Content Required",
        description: "Please write the task notes.",
        variant: "destructive",
      })
      return false
    }

    if (taskType === "question" || taskType === "both") {
      // Validate all questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        
        if (!q.question.trim()) {
          toast({
            title: "Question Required",
            description: `Please write question ${i + 1}.`,
            variant: "destructive",
          })
          setActiveQuestionIndex(i)
          return false
        }

        if (q.type === "multiple-choice" && q.options) {
          const filledOptions = q.options.filter((opt) => opt.trim())
          if (filledOptions.length < 2) {
            toast({
              title: "Options Required",
              description: `Question ${i + 1}: Please provide at least 2 answer options.`,
              variant: "destructive",
            })
            setActiveQuestionIndex(i)
            return false
          }
          if (!q.correctAnswer && filledOptions.length > 0) {
            // Auto-select first option as correct if none specified
            updateQuestion(i, { correctAnswer: filledOptions[0] })
          }
        }

        if (q.type === "true-false" && !q.correctAnswer) {
          toast({
            title: "Correct Answer Required",
            description: `Question ${i + 1}: Please select True or False as the correct answer.`,
            variant: "destructive",
          })
          setActiveQuestionIndex(i)
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Convert course to database format
      const dbCourse = convertToDBCourseFormat(selectedCourse, selectedGrade!)

      // Prepare task data
      const taskData: any = {
        title: taskTopic,
        description: taskInstructions,
        subject: dbCourse,
        grade: selectedGrade!.toString(),
        difficulty: difficulty,
        estimatedTimeMinutes: parseInt(duration) || 30,
        tutorId: tutorId!,
        studentIds: selectedStudents,
        parentVisibility: parentVisibility,
        videoLink: videoLink || undefined,
        images: images.length > 0 ? images : undefined,
      }

      // Add note content if task type includes note
      if (taskType === "note" || taskType === "both") {
        taskData.noteContent = noteContent
      }

      // Add questions if task type includes question
      if (taskType === "question" || taskType === "both") {
        // Prepare questions array with display order
        const formattedQuestions = questions.map((q, index) => ({
          type: q.type,
          question: q.question,
          options: q.type === "multiple-choice" ? q.options?.filter(opt => opt.trim()) : undefined,
          correctAnswer: q.correctAnswer,
          sampleAnswer: q.type === "short-answer" ? q.sampleAnswer : undefined,
          points: q.points || 10,
          displayOrder: index + 1
        }))

        taskData.questions = formattedQuestions
      }

      console.log("[API] Creating task with questions:", taskData)

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create task')
      }

      toast({
        title: "Task Created Successfully",
        description: `Task "${taskTopic}" with ${questions.length} question(s) has been assigned to ${selectedStudents.length} student(s).`,
      })

      resetForm()

      if (onTaskCreated) {
        onTaskCreated()
      }

      onOpenChange(false)
    } catch (error) {
      console.error("[API] Error creating task:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedGrade(null)
    setSelectedCourse("")
    setSelectedStudents([])
    setTaskTopic("")
    setTaskInstructions("")
    setTaskType("note")
    setNoteContent("")
    // Reset questions to single default question
    setQuestions([
      {
        id: Date.now().toString(),
        type: 'multiple-choice',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: undefined,
        points: 10
      }
    ])
    setActiveQuestionIndex(0)
    setParentVisibility(false)
    setVideoLink("")
    setImages([])
    setImageInput("")
    setDuration("30")
    setDifficulty("beginner")
    // Clear students list to ensure fresh fetch on next open
    setAvailableStudents([])
  }

  // Function to manually refresh students list
  const refreshStudents = async () => {
    if (!selectedGrade || !tutorId) return;
    
    setFetchingStudents(true);
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/students?tutorId=${tutorId}&grade=${selectedGrade}&_t=${timestamp}`
      );
      if (response.ok) {
        const students = await response.json();
        setAvailableStudents(students);
        toast({
          title: "Students Refreshed",
          description: `Loaded ${students.length} students for grade ${selectedGrade}`,
        });
      }
    } catch (error) {
      console.error('Error refreshing students:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh students list",
        variant: "destructive",
      });
    } finally {
      setFetchingStudents(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create and assign a new task to your students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Grade Selection */}
          <div className="space-y-2">
            <Label htmlFor="grade" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Select Grade <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedGrade?.toString() || ""} onValueChange={handleGradeChange} disabled={isLoading}>
              <SelectTrigger id="grade">
                <SelectValue placeholder="Choose a grade" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value.toString()}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Select Course <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedCourse} onValueChange={handleCourseChange} disabled={!selectedGrade || isLoading}>
              <SelectTrigger id="course">
                <SelectValue placeholder={selectedGrade ? `Choose a ${selectedGrade === 7 || selectedGrade === 8 ? 'course' : 'ኮርስ'}` : "Select a grade first"} />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course) => (
                  <SelectItem key={course.value} value={course.value}>
                    {course.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGrade && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedGrade === 7 || selectedGrade === 8 
                  ? "English medium courses" 
                  : "አማርኛ መካከለኛ ኮርሶች (Amharic medium courses)"}
              </p>
            )}
          </div>

          {/* Difficulty and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">
                {selectedGrade === 5 || selectedGrade === 6 ? "ዲግሪ ውስብስብነት" : "Difficulty Level"}
              </Label>
              <Select value={difficulty} onValueChange={(value: "beginner" | "intermediate" | "advanced") => setDifficulty(value)}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder={selectedGrade === 5 || selectedGrade === 6 ? "ይምረጡ" : "Select difficulty"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    {selectedGrade === 5 || selectedGrade === 6 ? "ጀማሪ" : "Beginner"}
                  </SelectItem>
                  <SelectItem value="intermediate">
                    {selectedGrade === 5 || selectedGrade === 6 ? "መካከለኛ" : "Intermediate"}
                  </SelectItem>
                  <SelectItem value="advanced">
                    {selectedGrade === 5 || selectedGrade === 6 ? "ከፍተኛ" : "Advanced"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">
                {selectedGrade === 5 || selectedGrade === 6 ? "የሚፈጀው ጊዜ (ደቂቃ)" : "Duration (minutes)"}
              </Label>
              <Input
                id="duration"
                type="number"
                min="10"
                max="180"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={selectedGrade === 5 || selectedGrade === 6 ? "ለም. 30" : "e.g., 30"}
              />
            </div>
          </div>

          {/* Student Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {selectedGrade 
                  ? (selectedGrade === 5 || selectedGrade === 6 
                      ? `ለደረጃ ${selectedGrade} ተማሪዎች ስራ ይሰጡ` 
                      : `Assign Task To Grade ${selectedGrade} Students`)
                  : (selectedGrade === 5 || selectedGrade === 6 
                      ? "ለተማሪዎች ስራ ይሰጡ" 
                      : "Assign Task To Students")
                } 
                <span className="text-destructive">*</span>
              </Label>
              {selectedGrade && availableStudents.length > 0 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshStudents}
                  disabled={fetchingStudents || isLoading}
                  className="h-8 text-xs"
                >
                  {fetchingStudents ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Refreshing...
                    </>
                  ) : (
                    "Refresh List"
                  )}
                </Button>
              )}
            </div>
            <div className="border border-border rounded-lg p-4 space-y-2 bg-muted/30">
              {fetchingStudents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    {selectedGrade === 5 || selectedGrade === 6 ? "ተማሪዎች በመጫን ላይ..." : "Loading students..."}
                  </span>
                </div>
              ) : !selectedGrade ? (
                <p className="text-sm text-muted-foreground">
                  {selectedGrade === 5 || selectedGrade === 6 
                    ? "ደረጃ ይምረጡ" 
                    : "Select grade to view students"}
                </p>
              ) : availableStudents.length === 0 ? (
                <div className="space-y-3 py-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedGrade === 5 || selectedGrade === 6 
                      ? `ለደረጃ ${selectedGrade} ተማሪዎች አልተገኙም` 
                      : `No students found for grade ${selectedGrade}`}
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshStudents}
                    disabled={fetchingStudents || isLoading}
                  >
                    {fetchingStudents ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        {selectedGrade === 5 || selectedGrade === 6 ? "በመጫን ላይ..." : "Loading..."}
                      </>
                    ) : (
                      selectedGrade === 5 || selectedGrade === 6 ? "ተማሪዎችን ዳግም ጫን" : "Refresh Students"
                    )}
                  </Button>
                </div>
              ) : (
                availableStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded transition-colors"
                  >
                    <Checkbox
                      id={student.id}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleStudentToggle(student.id)}
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Label htmlFor={student.id} className="cursor-pointer font-normal">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedGrade === 5 || selectedGrade === 6 ? "ደረጃ" : "Grade"} {student.grade}
                          {student.courses && student.courses.length > 0 && (
                            <span className="ml-2 text-xs">
                              • {student.courses.slice(0, 2).join(', ')}
                              {student.courses.length > 2 && '...'}
                            </span>
                          )}
                        </div>
                      </Label>
                    </div>
                  </div>
                ))
              )}
            </div>
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedStudents.map((studentId) => {
                  const student = availableStudents.find((s) => s.id === studentId)
                  return student ? (
                    <Badge key={studentId} variant="secondary" className="gap-1">
                      {student.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => !isLoading && handleStudentToggle(studentId)}
                      />
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* Task Topic */}
          <div className="space-y-2">
            <Label htmlFor="task-topic" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {selectedGrade === 5 || selectedGrade === 6 ? "የስራ ርዕስ" : "Task Title"} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-topic"
              placeholder={selectedGrade === 5 || selectedGrade === 6 ? "ለም. መሰረታዊ ማባዛት ልምምድ" : "e.g., Basic Multiplication Practice"}
              value={taskTopic}
              onChange={(e) => setTaskTopic(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Task Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {selectedGrade === 5 || selectedGrade === 6 ? "ለተማሪዎች መመሪያዎች" : "Instructions for Students"} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="instructions"
              placeholder={selectedGrade === 5 || selectedGrade === 6 ? "ተማሪዎች ምን ማድረግ እንዳለባቸው በግልጽ ይግለጹ..." : "Explain clearly what students must do..."}
              value={taskInstructions}
              onChange={(e) => setTaskInstructions(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Video Link input */}
          <div className="space-y-2 border border-border rounded-lg p-4 bg-muted/10">
            <Label htmlFor="video-link" className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              {selectedGrade === 5 || selectedGrade === 6 ? "የቪዲዮ አገናኝ (አማራጭ)" : "Video Link (Optional)"}
            </Label>
            <Input
              id="video-link"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {selectedGrade === 5 || selectedGrade === 6 
                ? "የYouTube፣ Vimeo ወይም ሌላ የቪዲዮ አገናኝ ያክሉ" 
                : "Add a YouTube, Vimeo, or other video link"}
            </p>
          </div>

          {/* Image Upload section */}
          <div className="space-y-2 border border-border rounded-lg p-4 bg-muted/10">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              {selectedGrade === 5 || selectedGrade === 6 ? "ምስሎች (አማራጭ)" : "Images (Optional)"}
            </Label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddImage()
                  }
                }}
                disabled={isLoading}
              />
              <Button type="button" onClick={handleAddImage} variant="secondary" disabled={isLoading}>
                {selectedGrade === 5 || selectedGrade === 6 ? "ጨምር" : "Add"}
              </Button>
            </div>
            {images.length > 0 && (
              <div className="space-y-2 mt-3">
                {images.map((img, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Upload ${index + 1}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <span className="flex-1 text-sm truncate">{img}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => !isLoading && handleRemoveImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Type */}
          <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/20">
            <Label className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4 text-primary" />
              {selectedGrade === 5 || selectedGrade === 6 ? "የስራ አይነት" : "Task Type"} <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={taskType} onValueChange={(value) => setTaskType(value as any)} disabled={isLoading}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="note" id="note" />
                <Label htmlFor="note" className="font-normal cursor-pointer">
                  {selectedGrade === 5 || selectedGrade === 6 ? "ማስታወሻ ብቻ" : "Note Only"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="question" id="question" />
                <Label htmlFor="question" className="font-normal cursor-pointer">
                  {selectedGrade === 5 || selectedGrade === 6 ? "ጥያቄ ብቻ" : "Question Only"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="font-normal cursor-pointer">
                  {selectedGrade === 5 || selectedGrade === 6 ? "ሁለቱም (ማስታወሻ + ጥያቄ)" : "Both (Note + Question)"}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Note Content */}
          {(taskType === "note" || taskType === "both") && (
            <div className="space-y-2 border-l-4 border-primary pl-4">
              <Label htmlFor="note-content" className="text-base">
                {selectedGrade === 5 || selectedGrade === 6 ? "የስራ ማስታወሻዎች ይጻፉ" : "Write Task Notes"} <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                content={noteContent}
                onChange={setNoteContent}
                placeholder={selectedGrade === 5 || selectedGrade === 6 
                  ? "የማስታወሻ ይዘትን ከባለ ብዙ ቅርጸት ጋር እዚህ ይጻፉ..." 
                  : "Write the note content here with rich formatting..."}
                readOnly={isLoading}
              />
            </div>
          )}

          {/* Question section with multiple questions support */}
          {(taskType === "question" || taskType === "both") && (
            <div className="space-y-6 border-l-4 border-secondary pl-4">
              {/* Question tabs */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {questions.map((q, index) => (
                    <Button
                      key={q.id}
                      type="button"
                      variant={activeQuestionIndex === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveQuestionIndex(index)}
                      className="min-w-[40px]"
                    >
                      {index + 1}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    disabled={isLoading}
                    className="ml-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(activeQuestionIndex)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Question count badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {questions.length} Question{questions.length !== 1 ? 's' : ''}
                </Badge>
                {questions.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Click question numbers to switch between them
                  </span>
                )}
              </div>

              {/* Active question content */}
              {questions.map((question, index) => (
                <div 
                  key={question.id} 
                  className={`space-y-4 ${activeQuestionIndex === index ? 'block' : 'hidden'}`}
                >
                  {/* Question type selection */}
                  <div>
                    <Label className="text-base mb-3 block">
                      {selectedGrade === 5 || selectedGrade === 6 
                        ? `የጥያቄ ${index + 1} አይነት` 
                        : `Question ${index + 1} Type`}
                    </Label>
                    <RadioGroup 
                      value={question.type} 
                      onValueChange={(value) => updateQuestion(index, { type: value as any })}
                      disabled={isLoading}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="multiple-choice" id={`mc-${index}`} />
                        <Label htmlFor={`mc-${index}`} className="font-normal cursor-pointer">
                          {selectedGrade === 5 || selectedGrade === 6 ? "ብዙ ምርጫ" : "Multiple Choice"}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="short-answer" id={`sa-${index}`} />
                        <Label htmlFor={`sa-${index}`} className="font-normal cursor-pointer">
                          {selectedGrade === 5 || selectedGrade === 6 ? "አጭር መልስ" : "Short Answer"}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true-false" id={`tf-${index}`} />
                        <Label htmlFor={`tf-${index}`} className="font-normal cursor-pointer">
                          {selectedGrade === 5 || selectedGrade === 6 ? "እውት/ሀሰት" : "True/False"}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Question text */}
                  <div className="space-y-2">
                    <Label htmlFor={`question-text-${index}`}>
                      {selectedGrade === 5 || selectedGrade === 6 ? "ጥያቄ" : "Question"} 
                      <span className="text-destructive">*</span>
                    </Label>
                    <RichTextEditor
                      content={question.question}
                      onChange={(content) => updateQuestion(index, { question: content })}
                      placeholder={selectedGrade === 5 || selectedGrade === 6 
                        ? "ጥያቄዎን ከቅርጸት ጋር እዚህ ይጻፉ..." 
                        : "Write your question here with formatting..."}
                      readOnly={isLoading}
                    />
                  </div>

                  {/* Answer options based on type */}
                  {question.type === "multiple-choice" && (
                    <div className="space-y-3">
                      <Label>
                        {selectedGrade === 5 || selectedGrade === 6 ? "የመልስ አማራጮች" : "Answer Options"} 
                        <span className="text-destructive">*</span>
                      </Label>
                      {(question.options || ['', '', '', '']).map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <Checkbox
                            checked={question.correctAnswer === option}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateQuestion(index, { correctAnswer: option })
                              }
                            }}
                            disabled={isLoading}
                          />
                          <Input
                            placeholder={selectedGrade === 5 || selectedGrade === 6 
                              ? `አማራጭ ${optionIndex + 1}` 
                              : `Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) => handleMcOptionChange(index, optionIndex, e.target.value)}
                            disabled={isLoading}
                          />
                          {question.correctAnswer === option && (
                            <Badge variant="secondary" className="ml-2">
                              {selectedGrade === 5 || selectedGrade === 6 ? "ትክክል" : "Correct"}
                            </Badge>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        {selectedGrade === 5 || selectedGrade === 6 
                          ? "ትክክለኛውን መልስ አጠገብ ያለውን ሳጥን ምልክት ያድርጉ" 
                          : "Check the box next to the correct answer"}
                      </p>
                    </div>
                  )}

                  {question.type === "true-false" && (
                    <div className="space-y-3">
                      <Label>
                        {selectedGrade === 5 || selectedGrade === 6 ? "ትክክለኛ መልስ" : "Correct Answer"} 
                        <span className="text-destructive">*</span>
                      </Label>
                      <RadioGroup 
                        value={question.correctAnswer} 
                        onValueChange={(value) => updateQuestion(index, { correctAnswer: value })}
                        disabled={isLoading}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id={`true-${index}`} />
                          <Label htmlFor={`true-${index}`} className="font-normal cursor-pointer">
                            {selectedGrade === 5 || selectedGrade === 6 ? "እውት" : "True"}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id={`false-${index}`} />
                          <Label htmlFor={`false-${index}`} className="font-normal cursor-pointer">
                            {selectedGrade === 5 || selectedGrade === 6 ? "ሀሰት" : "False"}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {question.type === "short-answer" && (
                    <div className="space-y-2">
                      <Label htmlFor={`sample-answer-${index}`}>
                        {selectedGrade === 5 || selectedGrade === 6 
                          ? "የናሙና መልስ (አማራጭ)" 
                          : "Sample Answer (Optional)"}
                      </Label>
                      <RichTextEditor
                        content={question.sampleAnswer || ''}
                        onChange={(content) => updateQuestion(index, { sampleAnswer: content })}
                        placeholder={selectedGrade === 5 || selectedGrade === 6 
                          ? "ለማጣቀሻ የናሙና መልስ ይስጡ..." 
                          : "Provide a sample answer for reference..."}
                        readOnly={isLoading}
                      />
                    </div>
                  )}

                  {/* Points for question */}
                  <div className="space-y-2">
                    <Label htmlFor={`points-${index}`}>
                      {selectedGrade === 5 || selectedGrade === 6 
                        ? "ነጥቦች" 
                        : "Points"}
                    </Label>
                    <Input
                      id={`points-${index}`}
                      type="number"
                      min="1"
                      max="100"
                      value={question.points || 10}
                      onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) || 10 })}
                      disabled={isLoading}
                      className="w-32"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Parent Visibility */}
          <div className="flex items-center justify-between border border-border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="parent-visibility" className="text-base cursor-pointer">
                  {selectedGrade === 5 || selectedGrade === 6 
                    ? "ወላጅ ይህን ስራ እንዲያይ ይፍቀዱ" 
                    : "Allow Parent to View This Task"}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedGrade === 5 || selectedGrade === 6 
                    ? "ወላጆች ስራ እና የተማሪ እድገት ሊያዩ ይችላሉ (ንክኪ ብቻ)" 
                    : "Parents can view task and student progress (read-only)"}
                </p>
              </div>
            </div>
            <Switch 
              id="parent-visibility" 
              checked={parentVisibility} 
              onCheckedChange={setParentVisibility}
              disabled={isLoading}
            />
          </div>

          {/* Parent visibility details */}
          {parentVisibility && selectedStudents.length > 0 && (
            <div className="border border-border rounded-lg p-4 bg-secondary/5">
              <Label className="text-sm mb-2 block">
                {selectedGrade === 5 || selectedGrade === 6 
                  ? "መዳረሻ የሚኖራቸው ወላጆች፡" 
                  : "Parents who will have access:"}
              </Label>
              <div className="space-y-1">
                {selectedStudents.map((studentId) => {
                  const student = availableStudents.find((s) => s.id === studentId)
                  return student ? (
                    <div key={studentId} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>
                        {selectedGrade === 5 || selectedGrade === 6 
                          ? `የ${student.name} ወላጅ` 
                          : `Parent of ${student.name}`}
                      </span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {selectedGrade === 5 || selectedGrade === 6 ? "ሰርዝ" : "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {selectedGrade === 5 || selectedGrade === 6 ? "ስራ በመፍጠር ላይ..." : "Creating Task..."}
              </>
            ) : selectedGrade === 5 || selectedGrade === 6 ? "ስራ ፍጠር" : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}