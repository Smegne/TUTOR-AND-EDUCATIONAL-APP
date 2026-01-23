const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Configuration - set to true to use mock data until MySQL is ready
const USE_MOCK_DATA = false; // Changed to false for MySQL

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

async function apiClient<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  // If using mock data, don't make actual API calls
  if (USE_MOCK_DATA && endpoint.startsWith('/api/')) {
    try {
      return await mockApiClient(endpoint, options) as T;
    } catch (mockError) {
      console.error('[API] Mock API failed, trying real API:', mockError);
      // Fall through to real API
    }
  }

  const { method = 'GET', headers = {}, body } = options;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
    credentials: 'include',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    console.error('API Client Error:', error);
    // Fallback to mock data on API failure
    try {
      return await mockApiClient(endpoint, options) as T;
    } catch (fallbackError) {
      console.error('[API] Both real and mock API failed:', fallbackError);
      // Return safe defaults based on endpoint
      if (endpoint.includes('/tasks')) return [] as T;
      if (endpoint.includes('/students')) return [] as T;
      if (endpoint.includes('/student-tasks')) return [] as T;
      return {} as T;
    }
  }
}

// Mock API client for when MySQL isn't available
async function mockApiClient(endpoint: string, options: ApiOptions = {}) {
  console.log(`[MOCK] Using mock data for: ${endpoint}`);
  
  try {
    // Dynamically import mock database to avoid circular dependencies
    const mockModule = await import('@/lib/data/mock-database');
    
    // Parse query parameters
    const url = new URL(endpoint, 'http://localhost:3000');
    const params = url.searchParams;
    
    // Handle different endpoints
    if (endpoint.startsWith('/api/tasks')) {
      const role = params.get('role');
      const userId = params.get('userId');
      const taskId = params.get('taskId');
      
      if (taskId) {
        return mockModule.getTaskById(taskId) || null;
      }
      
      if (role && userId) {
        switch (role) {
          case 'tutor':
            return mockModule.getTasksByTutor(userId) || [];
          case 'student':
            return mockModule.getTasksByStudent(userId) || [];
          case 'parent':
            return mockModule.getTasksByParent(userId) || [];
          default:
            return [];
        }
      }
      
      return [];
    }
    
    if (endpoint.startsWith('/api/students')) {
      const tutorId = params.get('tutorId');
      const studentId = params.get('studentId');
      
      if (studentId) {
        return mockModule.getStudentById(studentId) || null;
      }
      
      if (tutorId) {
        const students = mockModule.getStudentsByTutor(tutorId);
        return Array.isArray(students) ? students : [];
      }
      
      return Array.isArray(mockModule.studentsDB) ? mockModule.studentsDB : [];
    }
    
    if (endpoint.startsWith('/api/student-tasks')) {
      const studentId = params.get('studentId');
      const taskId = params.get('taskId');
      
      if (studentId) {
        // Get all student tasks
        const allTasks = Array.isArray(mockModule.studentTasksDB) 
          ? mockModule.studentTasksDB.filter((st: any) => st.studentId === studentId)
          : [];
        
        if (taskId) {
          return allTasks.find((st: any) => st.taskId === taskId) || null;
        }
        return allTasks;
      }
      
      return [];
    }
    
    if (endpoint.startsWith('/api/health')) {
      return {
        status: 'healthy',
        database: 'mock_data',
        timestamp: new Date().toISOString(),
        message: 'Using mock data - MySQL not connected'
      };
    }
    
    // Handle POST/PUT requests for mock data
    if (options.method === 'POST' || options.method === 'PUT') {
      if (endpoint.startsWith('/api/tasks') && options.body) {
        // For demo purposes, simulate creating a task
        const newTask = {
          ...options.body,
          id: `task_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        console.log('[MOCK] Created task:', newTask);
        return newTask;
      }
      
      if (endpoint.startsWith('/api/student-tasks') && options.body) {
        console.log('[MOCK] Updated student task:', options.body);
        return options.body;
      }
    }
    
    // Default empty response for other endpoints
    return {};
  } catch (error) {
    console.error('[MOCK] Error in mockApiClient:', error);
    // Return safe defaults on error
    if (endpoint.includes('/tasks')) return [];
    if (endpoint.includes('/students')) return [];
    if (endpoint.includes('/student-tasks')) return [];
    return {};
  }
}

// Tasks API
export const tasksApi = {
  getTasks: (role: string, userId: string) =>
    apiClient(`/api/tasks?role=${role}&userId=${userId}`),
  
  getTaskById: (taskId: string) =>
    apiClient(`/api/tasks?taskId=${taskId}`),
  
  createTask: (taskData: any) =>
    apiClient('/api/tasks', { method: 'POST', body: taskData }),
  
  updateTask: (id: string, updates: any) =>
    apiClient('/api/tasks', { method: 'PUT', body: { id, ...updates } }),
  
  deleteTask: (id: string) =>
    apiClient(`/api/tasks?id=${id}`, { method: 'DELETE' }),
};

// Student Tasks API - THIS WAS MISSING
export const studentTasksApi = {
  getStudentTasks: (studentId: string, taskId?: string) => {
    const url = taskId 
      ? `/api/student-tasks?studentId=${studentId}&taskId=${taskId}`
      : `/api/student-tasks?studentId=${studentId}`;
    return apiClient(url);
  },
  
  updateStudentTask: (data: any) =>
    apiClient('/api/student-tasks', { method: 'POST', body: data }),
};

// Students API
export const studentsApi = {
  getStudents: (tutorId?: string) => {
    const url = tutorId 
      ? `/api/students?tutorId=${tutorId}`
      : '/api/students';
    return apiClient(url);
  },
  
  getStudentById: (studentId: string) =>
    apiClient(`/api/students?studentId=${studentId}`),
};

// Health check
export const healthApi = {
  check: () => apiClient('/api/health'),
};

// Export the main apiClient too
export default apiClient;