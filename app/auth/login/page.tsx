"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/providers/auth-provider"

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(email, password)
    
    if (!result.success) {
      setError(result.error || "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">ጥናት ቤት</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to continue your learning journey</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="text-sm text-secondary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 h-11"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Demo Access</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Link href="/dashboard/student" className="w-full">
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent" 
                      type="button"
                      disabled={loading}
                    >
                      Student Demo
                    </Button>
                  </Link>
                  <Link href="/dashboard/tutor" className="w-full">
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent" 
                      type="button"
                      disabled={loading}
                    >
                      Tutor Demo
                    </Button>
                  </Link>
                  <Link href="/dashboard/parent" className="w-full">
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent" 
                      type="button"
                      disabled={loading}
                    >
                      Parent Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </form>

            <div className="text-center text-sm text-muted-foreground pt-4">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-secondary font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          Protected by enterprise-grade security. Your data is safe with us.
        </div>
      </div>
    </div>
  )
}