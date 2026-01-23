// components/task-execution/quiz-results.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Award, CheckCircle, XCircle, BarChart } from "lucide-react"

interface QuizResultsProps {
  score: number
  totalPoints: number
  correctAnswers: number
  totalQuestions: number
  onRetry?: () => void
  onContinue?: () => void
}

export function QuizResults({ 
  score, 
  totalPoints, 
  correctAnswers, 
  totalQuestions,
  onRetry,
  onContinue 
}: QuizResultsProps) {
  const percentage = Math.round((score / totalPoints) * 100)
  const isPassing = percentage >= 70

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-6 w-6" />
          Quiz Results
        </CardTitle>
        <CardDescription>
          You have completed the quiz
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <div className="text-3xl font-bold text-primary">{score}/{totalPoints}</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <div className="text-3xl font-bold text-primary">{percentage}%</div>
            <div className="text-sm text-muted-foreground">Percentage</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Performance</span>
            <span>{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Correct Answers</span>
            </div>
            <span className="font-medium">{correctAnswers}/{totalQuestions}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>Incorrect Answers</span>
            </div>
            <span className="font-medium">{totalQuestions - correctAnswers}/{totalQuestions}</span>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${isPassing ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center gap-2">
            <BarChart className={`h-5 w-5 ${isPassing ? 'text-green-600' : 'text-yellow-600'}`} />
            <span className={`font-medium ${isPassing ? 'text-green-800' : 'text-yellow-800'}`}>
              {isPassing ? 'Great job! You passed.' : 'Keep practicing. Try again!'}
            </span>
          </div>
          <p className={`text-sm mt-1 ${isPassing ? 'text-green-700' : 'text-yellow-700'}`}>
            {isPassing 
              ? 'You have successfully completed this quiz.' 
              : 'You need 70% or higher to pass. Consider reviewing the material.'}
          </p>
        </div>

        <div className="flex gap-3">
          {onRetry && (
            <Button variant="outline" className="flex-1" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {onContinue && (
            <Button className="flex-1" onClick={onContinue}>
              Continue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}