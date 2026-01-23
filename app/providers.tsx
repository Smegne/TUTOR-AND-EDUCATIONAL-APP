"use client"

import { AuthProvider } from "@/lib/providers/auth-provider"
import { DataProvider } from "@/lib/providers/data-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PWAInstallButton } from "@/components/pwa-install-button"
import { Analytics } from "@vercel/analytics/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <PWAInstallButton />
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  )
}