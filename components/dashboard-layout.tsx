"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, Home, LayoutDashboard, Settings, LogOut, Bell, BookMarked, ListTodo, Activity } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { SessionTracker } from "./session-tracker"

interface DashboardLayoutProps {
  children: ReactNode
  role: "student" | "tutor" | "parent"
  studentId?: string
  studentName?: string
}

export function DashboardLayout({ children, role, studentId, studentName }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const roleColors = {
    student: "from-secondary to-secondary/70",
    tutor: "from-primary to-primary/70",
    parent: "from-secondary/80 to-primary/80",
  }

  const navItems = [
    {
      href: `/dashboard/${role}`,
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: `/dashboard/${role}/courses`,
      icon: BookMarked,
      label: "Courses",
    },
    {
      href: `/dashboard/${role}/tasks`,
      icon: ListTodo,
      label: "Tasks",
    },
    {
      href: `/dashboard/${role}/status`,
      icon: Activity,
      label: "Status",
    },
    {
      href: "/",
      icon: Home,
      label: "Home",
    },
  ]

  const handleLogout = () => {
    router.push("/auth/login")
  }

  const handleSettings = () => {
    router.push(`/dashboard/${role}/settings`)
  }

  const handleNotifications = () => {
    console.log("[v0] Notifications clicked")
    // Open notifications panel when created
  }

  const isActiveLink = (href: string) => {
    if (href === `/dashboard/${role}`) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 bg-gradient-to-br ${roleColors[role]} rounded-lg flex items-center justify-center`}
                >
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">ጥናት ቤት</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {role === "student" && studentId && studentName && (
                <SessionTracker studentId={studentId} studentName={studentName} />
              )}

              <Button variant="ghost" size="icon" className="relative" onClick={handleNotifications}>
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-secondary rounded-full" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSettings}>
                <Settings className="h-5 w-5" />
              </Button>
              {role !== "student" && (
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex relative">
        <aside className="hidden lg:flex lg:flex-shrink-0 w-64 border-r border-border bg-card">
          <div className="flex flex-col w-full">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActiveLink(item.href)
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          active && "bg-primary/10 text-primary hover:bg-primary/20",
                        )}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActiveLink(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  active
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
