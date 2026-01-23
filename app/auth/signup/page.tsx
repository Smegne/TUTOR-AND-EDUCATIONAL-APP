"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Loader2, Plus, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/providers/auth-provider"

export default function SignupPage() {
  const { register } = useAuth()
  const [role, setRole] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // New state for conditional fields
  const [grade, setGrade] = useState("")
  const [childrenEmails, setChildrenEmails] = useState<string[]>([""])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Existing validations
    if (!role) {
      setError("Please select your role")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    // New validations based on role
    if (role === "student" && !grade) {
      setError("Please select your grade")
      return
    }

    if (role === "parent") {
      // Validate children emails
      const validEmails = childrenEmails.filter(email => email.trim() !== "")
      if (validEmails.length === 0) {
        setError("Please add at least one child's email")
        return
      }

      // Validate email format for each child email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      for (const childEmail of validEmails) {
        if (!emailRegex.test(childEmail)) {
          setError(`Invalid email format for child: ${childEmail}`)
          return
        }
      }
    }

    setLoading(true)

    // Prepare data for registration
    const registrationData: any = {
      email,
      password,
      firstName,
      lastName,
      role: role as 'student' | 'parent' // Removed 'tutor' from type
    }

    // Add conditional data
    if (role === "student") {
      registrationData.grade = grade
    }

    if (role === "parent" && childrenEmails.some(email => email.trim() !== "")) {
      registrationData.childrenEmails = childrenEmails
        .filter(email => email.trim() !== "")
        .map(email => email.trim())
    }

    const result = await register(registrationData)

    if (!result.success) {
      setError(result.error || "Registration failed")
      setLoading(false)
    }
  }

  // Handler for adding child email input
  const addChildEmail = () => {
    setChildrenEmails([...childrenEmails, ""])
  }

  // Handler for updating child email
  const updateChildEmail = (index: number, value: string) => {
    const newEmails = [...childrenEmails]
    newEmails[index] = value
    setChildrenEmails(newEmails)
  }

  // Handler for removing child email
  const removeChildEmail = (index: number) => {
    if (childrenEmails.length === 1) {
      // Keep at least one empty field
      setChildrenEmails([""])
    } else {
      const newEmails = childrenEmails.filter((_, i) => i !== index)
      setChildrenEmails(newEmails)
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
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Start your learning journey today</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create your ጥናት ቤት account in seconds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection - Updated to exclude Tutor */}
              <div className="space-y-2">
                <Label htmlFor="role">I am a...</Label>
                <Select value={role} onValueChange={setRole} disabled={loading}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    {/* Tutor option removed as requested */}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional: Grade Selection for Students */}
              {role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade Level <span className="text-destructive">*</span></Label>
                  <Select value={grade} onValueChange={setGrade} disabled={loading}>
                    <SelectTrigger id="grade">
                      <SelectValue placeholder="Select your grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(gradeNum => (
                        <SelectItem key={gradeNum} value={`grade_${gradeNum}`}>
                          Grade {gradeNum}
                        </SelectItem>
                      ))}
                      <SelectItem value="grade_college">College</SelectItem>
                      <SelectItem value="grade_other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Conditional: Children Emails for Parents */}
              {role === "parent" && (
                <div className="space-y-3 p-4 border rounded-md bg-muted/20">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">
                      Add Children Email(s) <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add the email addresses of your children who will use this platform. 
                      We'll use these to link your parent account with their student accounts.
                    </p>
                  </div>

                  {childrenEmails.map((email, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          type="email"
                          placeholder={`child${index + 1}@example.com`}
                          value={email}
                          onChange={(e) => updateChildEmail(index, e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      {childrenEmails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChildEmail(index)}
                          disabled={loading}
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChildEmail}
                    disabled={loading}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Child Email
                  </Button>
                </div>
              )}

              {/* Existing Fields - Unchanged */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-secondary hover:bg-secondary/90 h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground pt-4">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-secondary font-semibold hover:underline">
                Sign in
              </Link>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-4">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}