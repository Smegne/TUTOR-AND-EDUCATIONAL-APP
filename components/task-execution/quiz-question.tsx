// components/task-execution/quiz-question.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle } from "lucide-react"

interface QuizQuestionProps {
  question: {
    id: number
    question_type: string
    question_text: string
    options?: string[]
    correct_answer: string
    points: number
  }
  onAnswer: (answer: string) => void
  currentAnswer?: string
}

export function QuizQuestion({ question, onAnswer, currentAnswer }: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(currentAnswer || "")

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer)
    onAnswer(answer)
  }

  const isCorrect = currentAnswer === question.correct_answer

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Question</h3>
              <span className="text-sm text-muted-foreground">
                ({question.points} point{question.points !== 1 ? 's' : ''})
              </span>
            </div>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: question.question_text }}
            />
          </div>
          
          {currentAnswer && (
            <div className={`flex items-center gap-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Incorrect</span>
                </>
              )}
            </div>
          )}
        </div>

        {question.question_type === 'multiple-choice' && question.options && (
          <RadioGroup 
            value={selectedAnswer} 
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.question_type === 'true-false' && (
          <div className="flex gap-3">
            <Button
              variant={selectedAnswer === 'true' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleAnswer('true')}
            >
              True
            </Button>
            <Button
              variant={selectedAnswer === 'false' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleAnswer('false')}
            >
              False
            </Button>
          </div>
        )}

        {question.question_type === 'short-answer' && (
          <div className="space-y-2">
            <textarea
              className="w-full p-3 border rounded-lg min-h-[100px]"
              placeholder="Type your answer here..."
              value={selectedAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
            />
            {currentAnswer && !isCorrect && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Correct answer:</p>
                <p className="text-sm text-red-600 mt-1">{question.correct_answer}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}