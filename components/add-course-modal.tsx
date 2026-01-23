// components/add-course-modal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CourseData {
  name: string
  code: string
  grade: number
  description: string
  medium: "english" | "amharic"
  category: "core" | "arts" | "sports" | "vocational"
}

interface AddCourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCourseAdded?: () => void
  tutorId?: string
}

// Grade options
const gradeOptions = [
  { value: 5, label: "Grade 5" },
  { value: 6, label: "Grade 6" },
  { value: 7, label: "Grade 7" },
  { value: 8, label: "Grade 8" },
]

// Course categories
const categoryOptions = [
  { value: "core", label: "Core Subject" },
  { value: "arts", label: "Arts" },
  { value: "sports", label: "Sports" },
  { value: "vocational", label: "Vocational" },
]

// Predefined course templates for quick selection
const courseTemplates = [
  {
    name: "Mathematics",
    code: "MATH",
    description: "Basic arithmetic, geometry, and problem solving",
    category: "core" as const
  },
  {
    name: "English Language",
    code: "ENG",
    description: "Reading, writing, and communication skills",
    category: "core" as const
  },
  {
    name: "Amharic",
    code: "AMH",
    description: "Amharic language and literature",
    category: "core" as const
  },
  {
    name: "Science",
    code: "SCI",
    description: "Introduction to biology, physics, and chemistry",
    category: "core" as const
  },
  {
    name: "Social Science",
    code: "SOC",
    description: "History, geography, and social studies",
    category: "core" as const
  },
  {
    name: "Citizenship",
    code: "CIT",
    description: "Civic education and ethical values",
    category: "core" as const
  },
  {
    name: "አማርኛ",
    code: "AMH",
    description: "የአማርኛ ቋንቋ እና ስነጽሁፍ",
    category: "core" as const
  },
  {
    name: "ሂሳብ",
    code: "MATH",
    description: "መሰረታዊ ሒሳብ እና ችግር መፍታት",
    category: "core" as const
  },
]

export function AddCourseModal({ open, onOpenChange, onCourseAdded, tutorId }: AddCourseModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [useTemplate, setUseTemplate] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const [courseData, setCourseData] = useState<CourseData>({
    name: "",
    code: "",
    grade: 5,
    description: "",
    medium: "english",
    category: "core"
  })

  const handleInputChange = (field: keyof CourseData, value: string | number) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSelectTemplate = (templateName: string) => {
    const template = courseTemplates.find(t => t.name === templateName)
    if (template) {
      setSelectedTemplate(templateName)
      setCourseData(prev => ({
        ...prev,
        name: template.name,
        code: template.code,
        description: template.description,
        category: template.category
      }))
    }
  }

  const validateForm = () => {
    if (!courseData.name.trim()) {
      toast({
        title: "Course Name Required",
        description: "Please enter a course name",
        variant: "destructive"
      })
      return false
    }

    if (!courseData.code.trim()) {
      toast({
        title: "Course Code Required",
        description: "Please enter a course code",
        variant: "destructive"
      })
      return false
    }

    if (!courseData.grade) {
      toast({
        title: "Grade Required",
        description: "Please select a grade level",
        variant: "destructive"
      })
      return false
    }

    if (!courseData.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a course description",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Generate course ID based on name, grade, and medium
      const baseCourseId = courseData.name.toLowerCase().replace(/\s+/g, '_')
      const courseId = `${baseCourseId}_g${courseData.grade}`
      
      // Prepare course data for API
      const apiData = {
        ...courseData,
        id: courseId,
        tutorId: tutorId
      }

      console.log("Adding course:", apiData)

      // Make API call to add course
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add course')
      }

      toast({
        title: "Course Added Successfully",
        description: `${courseData.name} has been added to your courses.`,
      })

      // Reset form
      setCourseData({
        name: "",
        code: "",
        grade: 5,
        description: "",
        medium: "english",
        category: "core"
      })
      setSelectedTemplate(null)

      // Callback
      if (onCourseAdded) {
        onCourseAdded()
      }

      // Close modal
      onOpenChange(false)

    } catch (error) {
      console.error("Error adding course:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add course. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setCourseData({
      name: "",
      code: "",
      grade: 5,
      description: "",
      medium: "english",
      category: "core"
    })
    setSelectedTemplate(null)
    setUseTemplate(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Course</DialogTitle>
          <DialogDescription>
            Add a new course to your teaching portfolio. You can use a template or create a custom course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="use-template" 
                checked={useTemplate} 
                onCheckedChange={(checked) => setUseTemplate(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="use-template" className="font-medium cursor-pointer">
                Use Course Template
              </Label>
            </div>
            
            {useTemplate && (
              <div className="grid grid-cols-2 gap-2">
                {courseTemplates.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => handleSelectTemplate(template.name)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedTemplate === template.name
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{template.name}</span>
                      {selectedTemplate === template.name && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 bg-muted rounded-full">
                        {template.category.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Course Details
              </span>
            </div>
          </div>

          {/* Course Details Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course-name">
                  Course Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="course-name"
                  placeholder="e.g., Mathematics"
                  value={courseData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-code">
                  Course Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="course-code"
                  placeholder="e.g., MATH"
                  value={courseData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">
                  Grade Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={courseData.grade.toString()}
                  onValueChange={(value) => handleInputChange('grade', parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select grade" />
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

              <div className="space-y-2">
                <Label htmlFor="medium">Language Medium</Label>
                <Select
                  value={courseData.medium}
                  onValueChange={(value) => handleInputChange('medium', value as "english" | "amharic")}
                  disabled={isLoading}
                >
                  <SelectTrigger id="medium">
                    <SelectValue placeholder="Select medium" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English Medium</SelectItem>
                    <SelectItem value="amharic">Amharic Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={courseData.category}
                onValueChange={(value) => handleInputChange('category', value as CourseData['category'])}
                disabled={isLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Course Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the course content, objectives, and what students will learn..."
                value={courseData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Provide a clear description to help students understand what to expect from this course.
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-2">Course Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course ID:</span>
                <span className="font-mono">
                  {courseData.name ? `${courseData.name.toLowerCase().replace(/\s+/g, '_')}_g${courseData.grade}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Code:</span>
                <span className="font-mono">
                  {courseData.code ? `${courseData.code}-G${courseData.grade}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medium:</span>
                <span className="capitalize">{courseData.medium}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="capitalize">{courseData.category}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isLoading}
              type="button"
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              type="button"
            >
              Cancel
            </Button>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding Course...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Course
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}