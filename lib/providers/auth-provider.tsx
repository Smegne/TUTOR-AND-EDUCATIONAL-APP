// lib/providers/auth-provider.tsx
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  role: 'student' | 'tutor' | 'parent'
  firstName: string
  lastName: string
  tutorId?: string
  studentId?: string
  parentId?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'student' | 'tutor' | 'parent'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setLoading(false)
        return
      }

      // Verify token with backend
      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        // Token invalid, try refresh
        await refreshToken()
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        logout()
        return
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        setUser(data.user)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Store tokens
        localStorage.setItem('accessToken', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)
        
        // Set user
        setUser(data.user)
        
        // Redirect based on role
        router.push(`/dashboard/${data.user.role}`)
        
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        // Store tokens
        localStorage.setItem('accessToken', result.tokens.accessToken)
        localStorage.setItem('refreshToken', result.tokens.refreshToken)
        
        // Set user
        setUser(result.user)
        
        // Redirect based on role
        router.push(`/dashboard/${result.user.role}`)
        
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const logout = () => {
    // Clear local storage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    
    // Clear state
    setUser(null)
    
    // Redirect to login
    router.push('/auth/login')
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}