"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createSession, endSession, getActiveSession } from "@/lib/data/mock-database"
import { Clock, LogOut } from "lucide-react"

interface SessionTrackerProps {
  studentId: string
  studentName: string
}

export function SessionTracker({ studentId, studentName }: SessionTrackerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const router = useRouter()
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    // Check for existing active session
    const existingSession = getActiveSession(studentId)

    if (existingSession) {
      setSessionId(existingSession.id)
      startTimeRef.current = new Date(existingSession.loginTime).getTime()
    } else {
      // Create new session on mount
      const deviceInfo = `${navigator.userAgent.includes("Chrome") ? "Chrome" : "Browser"} on ${navigator.platform}`
      const newSession = createSession(studentId, deviceInfo)
      setSessionId(newSession.id)
    }

    // Update session time every minute
    const timer = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / (1000 * 60))
      setSessionTime(elapsed)
    }, 60000)

    // Handle browser close/refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Are you sure you want to leave? Your session will be ended."
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(timer)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [studentId])

  const handleExitRequest = () => {
    setShowExitDialog(true)
  }

  const handleConfirmExit = () => {
    if (sessionId) {
      endSession(sessionId)
    }
    setShowExitDialog(false)
    router.push("/auth/login")
  }

  const handleCancelExit = () => {
    setShowExitDialog(false)
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <>
      {/* Session Info Display */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Session: {formatTime(sessionTime)}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExitRequest}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Exit
        </Button>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Your Learning Session?</DialogTitle>
            <div className="text-muted-foreground text-sm space-y-2 pt-2">
              <p>Hi {studentName}! Are you sure you want to exit?</p>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-secondary" />
                  <span className="font-medium">Session Time: {formatTime(sessionTime)}</span>
                </div>
              </div>
              <p className="text-xs">Your progress has been saved automatically.</p>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelExit}>
              Stay & Continue Learning
            </Button>
            <Button variant="default" onClick={handleConfirmExit}>
              Yes, Exit Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
