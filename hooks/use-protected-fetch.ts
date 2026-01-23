import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useProtectedFetch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async <T>(
    url: string, 
    options?: RequestInit
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/login');
        return null;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token expired, clear and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        throw new Error('Session expired. Please login again.');
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to access this resource.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { fetchData, loading, error, clearError };
}