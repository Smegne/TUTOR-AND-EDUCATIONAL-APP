// components/task-execution/study-notes.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Video, Image as ImageIcon, ExternalLink, Download } from "lucide-react"
import { useState } from "react"

interface StudyNotesProps {
  content: string
  videoLink?: string
  images?: string[]
  onComplete?: () => void
}

export function StudyNotes({ content, videoLink, images, onComplete }: StudyNotesProps) {
  const [isCompleted, setIsCompleted] = useState(false)

  const handleComplete = () => {
    setIsCompleted(true)
    if (onComplete) onComplete()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle>Study Material</CardTitle>
        </div>
        <CardDescription>
          Read and understand the study material below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video Link */}
        {videoLink && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Video Resource</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={videoLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch Video
                </a>
              </Button>
              <span className="text-sm text-muted-foreground">
                Opens in new tab
              </span>
            </div>
          </div>
        )}

        {/* Images */}
        {images && images.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Images ({images.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    {/* Image preview placeholder */}
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    asChild
                  >
                    <a href={image} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Study Notes</span>
            <span className="text-sm text-muted-foreground">
              Read carefully
            </span>
          </div>
          <div 
            className="prose prose-sm max-w-none p-4 border rounded-lg bg-muted/50"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Completion Button */}
        <Button
          className="w-full"
          variant={isCompleted ? "outline" : "default"}
          onClick={handleComplete}
          disabled={isCompleted}
        >
          {isCompleted ? "✓ Material Reviewed" : "Mark as Reviewed"}
        </Button>

        {isCompleted && (
          <p className="text-sm text-center text-green-600">
            You can now proceed to the quiz section
          </p>
        )}
      </CardContent>
    </Card>
  )
}