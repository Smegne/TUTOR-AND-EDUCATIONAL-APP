"use client"

import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallPrompt(false)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="bg-card border-2 border-secondary rounded-lg shadow-lg p-4">
        <button onClick={handleDismiss} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Install ጥናት ቤት</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Install our app for a better experience and quick access from your home screen
            </p>
          </div>
        </div>
        <Button onClick={handleInstallClick} className="w-full bg-secondary hover:bg-secondary/90" size="sm">
          Install App
        </Button>
      </div>
    </div>
  )
}
