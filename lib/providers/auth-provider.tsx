// lib/providers/auth-provider.tsx
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string                    // Database ID (parent_1772396028542)
  userId: string                // User table ID (p_mm86u06x_974nf) ← THIS IS CRITICAL!
  email: string
  role: 'student' | 'tutor' | 'parent'
  firstName: string
  lastName: string
  tutorId?: string
  studentId?: string
  parentId?: string             // For backward compatibility
  // Helper properties
  lookupId: string              // The ID to use for API lookups (same as userId)
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

      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        // Transform the user data to include both IDs
        const transformedUser = transformUserData(data.user)
        setUser(transformedUser)
      } else {
        await refreshToken()
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  // CRITICAL: Transform user data to ensure we have the correct lookup ID
  const transformUserData = (rawUser: any): User => {
    // For parent users, we need the user table ID (p_mm86u06x_974nf)
    if (rawUser.role === 'parent') {
      // The user ID from the users table (starts with p_)
      const userTableId = rawUser.userId || rawUser.id;
      
      return {
        // Keep all original data
        ...rawUser,
        // Ensure these fields are set correctly
        id: rawUser.id || userTableId,           // Database record ID
        userId: userTableId,                       // Users table ID (p_...)
        parentId: userTableId,                     // For backward compatibility
        lookupId: userTableId,                     // Helper for API calls
        // Also include the parents table ID if available
        parentRecordId: rawUser.parentRecordId
      };
    }
    
    // For students and tutors
    return {
      ...rawUser,
      lookupId: rawUser.id
    };
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
        
        const transformedUser = transformUserData(data.user)
        setUser(transformedUser)
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
        localStorage.setItem('accessToken', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)
        
        // Transform the user data
        const transformedUser = transformUserData(data.user)
        setUser(transformedUser)
        
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
        localStorage.setItem('accessToken', result.tokens.accessToken)
        localStorage.setItem('refreshToken', result.tokens.refreshToken)
        
        const transformedUser = transformUserData(result.user)
        setUser(transformedUser)
        
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
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
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