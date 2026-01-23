import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TokenManager } from '@/lib/auth/token-manager';

interface User {
  id: string;
  role: 'student' | 'tutor' | 'parent';
  email: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  tutorId?: string;
  parentId?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const token = TokenManager.getAccessToken();
      
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, clear it
        TokenManager.clearTokens();
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const { accessToken, refreshToken, user } = await response.json();
        TokenManager.setTokens(accessToken, refreshToken);
        setUser(user);
        
        // Redirect based on role
        router.push(`/dashboard/${user.role}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenManager.clearTokens();
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    fetchUser
  };
}