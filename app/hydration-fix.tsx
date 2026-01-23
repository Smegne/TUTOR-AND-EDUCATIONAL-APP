"use client"

import { useEffect } from "react"

export function HydrationFix() {
  useEffect(() => {
    // Remove the extension-added attribute after hydration
    if (typeof document !== "undefined") {
      document.body.removeAttribute("cz-shortcut-listen")
    }
  }, [])
  
  return null
}