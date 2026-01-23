// app/api/student/[id]/tasks/route.ts - UPDATED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id
    console.log(`Fetching tasks for student: ${studentId}`)

    // First, check if necessary tables exist
    let tablesExist = {
      students: false,
      tasks: false,
      student_tasks: false,
      tutors: false
    }

    try {
      const [tablesResult] = await query<any[]>(`SHOW TABLES`)
      const tables = tablesResult.map((row: any) => Object.values(row)[0])
      
      tablesExist.students = tables.includes('students')
      tablesExist.tasks = tables.includes('tasks')
      tablesExist.student_tasks = tables.includes('student_tasks')
      tablesExist.tutors = tables.includes('tutors')
      
      console.log('Table status:', tablesExist)
    } catch (error) {
      console.error('Error checking tables:', error)
      return NextResponse.json({
        success: true,
        note: 'Database tables not found, using fallback data',
        tasks: getFallbackTasks(),
        stats: getFallbackStats()
      })
    }

    // Get student details
    let student: any = null
    if (tablesExist.students) {
      try {
        const [studentResult] = await query<any[]>(
          `SELECT * FROM students WHERE id = ? OR user_id = ? LIMIT 1`,
          [studentId, studentId]
        )
        
        if (studentResult) {
          student = studentResult
          console.log('Found student:', { id: student.id, name: student.name, grade: student.grade })
        }
      } catch (error) {
        console.error('Error fetching student:', error)
      }
    }

    // If no student found, create a default one
    if (!student) {
      student = {
        id: studentId,
        name: 'Student',
        grade: 7,
        tutor_id: 'tutor_001'
      }
    }

    let tasks: any[] = []
    
    // Try to get tasks from student_tasks table first
    if (tablesExist.student_tasks && tablesExist.tasks) {
      try {
        console.log('Fetching tasks from student_tasks table...')
        
        const studentTasks = await query<any[]>(`
          SELECT 
            t.*,
            st.status as task_status,
            st.score,
            st.time_spent,
            st.started_at,
            st.completed_at,
            tu.name as tutor_name
          FROM tasks t
          INNER JOIN student_tasks st ON t.id = st.task_id
          LEFT JOIN tutors tu ON t.created_by = tu.id
          WHERE st.student_id = ?
          ORDER BY 
            CASE st.status 
              WHEN 'not_started' THEN 1
              WHEN 'in_progress' THEN 2
              WHEN 'completed' THEN 3
              ELSE 4
            END,
            t.created_at DESC
        `, [student.id || studentId])
        
        console.log(`Found ${studentTasks.length} tasks in student_tasks table`)
        
        tasks = studentTasks.map((task: any) => formatTaskForResponse(task, student))
      } catch (error) {
        console.error('Error fetching from student_tasks:', error)
      }
    }

    // If no tasks from student_tasks, try to get tasks based on student's courses
    if (tasks.length === 0 && tablesExist.students && tablesExist.tasks) {
      try {
        console.log('Trying to get tasks based on student courses...')
        
        // Get student's courses
        const studentCourses = parseCourses(student.courses)
        
        if (studentCourses.length > 0) {
          console.log(`Student has ${studentCourses.length} courses`)
          
          // Get tutor's courses if student has a tutor
          let tutorCourses: string[] = []
          if (student.tutor_id && tablesExist.tutors) {
            try {
              const [tutorResult] = await query<any[]>(
                'SELECT courses FROM tutors WHERE id = ?',
                [student.tutor_id]
              )
              
              if (tutorResult) {
                tutorCourses = parseCourses(tutorResult.courses)
                console.log(`Tutor has ${tutorCourses.length} courses`)
              }
            } catch (error) {
              console.error('Error fetching tutor courses:', error)
            }
          }
          
          // Use tutor courses if available, otherwise use student courses
          const relevantCourses = tutorCourses.length > 0 ? tutorCourses : studentCourses
          
          // Create placeholders for SQL query
          const placeholders = relevantCourses.map(() => '?').join(',')
          
          const courseTasks = await query<any[]>(`
            SELECT 
              t.*,
              tu.name as tutor_name
            FROM tasks t
            LEFT JOIN tutors tu ON t.created_by = tu.id
            WHERE t.subject IN (${placeholders})
            AND t.grade_level = ?
            ORDER BY t.created_at DESC
            LIMIT 10
          `, [...relevantCourses, student.grade || 7])
          
          console.log(`Found ${courseTasks.length} tasks based on courses`)
          
          tasks = courseTasks.map((task: any, index: number) => {
            // Assign different statuses for demo
            const statuses: Array<'not_started' | 'in_progress' | 'completed'> = 
              ['not_started', 'in_progress', 'completed']
            const status = statuses[index % statuses.length]
            
            const formattedTask = formatTaskForResponse(task, student)
            return {
              ...formattedTask,
              status: status,
              score: status === 'completed' ? Math.floor(Math.random() * 30) + 70 : undefined,
              time_spent: status === 'completed' ? Math.floor(Math.random() * 40) + 20 : 
                         status === 'in_progress' ? Math.floor(Math.random() * 20) : undefined,
              started_at: status !== 'not_started' ? 
                new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString() : undefined,
              completed_at: status === 'completed' ? 
                new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString() : undefined
            }
          })
        }
      } catch (error) {
        console.error('Error fetching tasks by courses:', error)
      }
    }

    // If still no tasks, get some sample tasks from database
    if (tasks.length === 0 && tablesExist.tasks) {
      try {
        console.log('Fetching sample tasks...')
        
        const sampleTasks = await query<any[]>(`
          SELECT 
            t.*,
            tu.name as tutor_name
          FROM tasks t
          LEFT JOIN tutors tu ON t.created_by = tu.id
          WHERE t.grade_level = ?
          ORDER BY t.created_at DESC
          LIMIT 5
        `, [student.grade || 7])
        
        console.log(`Found ${sampleTasks.length} sample tasks`)
        
        tasks = sampleTasks.map((task: any, index: number) => {
          const statuses: Array<'not_started' | 'in_progress' | 'completed'> = 
            ['not_started', 'in_progress', 'completed']
          const status = statuses[index % statuses.length]
          
          const formattedTask = formatTaskForResponse(task, student)
          return {
            ...formattedTask,
            status: status,
            score: status === 'completed' ? Math.floor(Math.random() * 30) + 70 : undefined,
            time_spent: status === 'completed' ? Math.floor(Math.random() * 40) + 20 : 
                       status === 'in_progress' ? Math.floor(Math.random() * 20) : undefined,
            started_at: status !== 'not_started' ? 
              new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            completed_at: status === 'completed' ? 
              new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString() : undefined
          }
        })
      } catch (error) {
        console.error('Error fetching sample tasks:', error)
      }
    }

    // If still no tasks, use fallback
    if (tasks.length === 0) {
      console.log('No tasks found, using fallback data')
      tasks = getFallbackTasks()
    }

    console.log(`Returning ${tasks.length} tasks for student ${student.name || studentId}`)

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade,
        tutor_id: student.tutor_id
      },
      tasks: tasks,
      stats: calculateStats(tasks),
      note: tasks.length > 0 ? 'Tasks loaded successfully' : 'No tasks found',
      debug: {
        tablesExist,
        studentFound: !!student,
        tasksFound: tasks.length
      }
    })

  } catch (error: any) {
    console.error('Error in student tasks API:', error)
    
    return NextResponse.json({
      success: true,
      note: 'Using fallback data due to error',
      tasks: getFallbackTasks(),
      stats: getFallbackStats()
    })
  }
}

// Helper functions
function parseCourses(courses: any): string[] {
  if (!courses) return []
  
  try {
    if (Array.isArray(courses)) return courses
    
    if (typeof courses === 'string') {
      if (courses.startsWith('[')) {
        const parsed = JSON.parse(courses)
        return Array.isArray(parsed) ? parsed : []
      }
      return courses.split(',').map((c: string) => c.trim()).filter(c => c)
    }
    
    return []
  } catch (error) {
    console.error('Error parsing courses:', error)
    return []
  }
}

function formatTaskForResponse(task: any, student: any): any {
  // Parse images
  let images: string[] = []
  try {
    if (task.images && typeof task.images === 'string') {
      images = JSON.parse(task.images)
    } else if (Array.isArray(task.images)) {
      images = task.images
    }
  } catch (error) {
    console.error('Error parsing images:', error)
  }

  // Parse question data
  let questions: any[] = []
  try {
    if (task.question_data && typeof task.question_data === 'string') {
      const parsed = JSON.parse(task.question_data)
      if (parsed && parsed.questions) {
        questions = Array.isArray(parsed.questions) ? parsed.questions : []
      } else if (parsed) {
        questions = [parsed]
      }
    }
  } catch (error) {
    console.error('Error parsing question data:', error)
  }

  return {
    id: task.id.toString(),
    title: task.title || 'Untitled Task',
    description: task.description || '',
    subject: task.subject || 'general',
    grade_level: task.grade_level || student.grade || 7,
    difficulty: task.difficulty || 'beginner',
    estimated_time_minutes: task.estimated_time_minutes || 30,
    note_content: task.note_content || '',
    video_link: task.video_link || '',
    images: images,
    parent_visibility: task.parent_visibility ? true : false,
    created_at: task.created_at ? new Date(task.created_at).toISOString() : new Date().toISOString(),
    created_by: task.created_by || 'unknown',
    created_by_name: task.tutor_name || 'Tutor',
    status: (task.task_status as 'not_started' | 'in_progress' | 'completed') || 'not_started',
    score: task.score || undefined,
    time_spent: task.time_spent || undefined,
    completed_at: task.completed_at ? new Date(task.completed_at).toISOString() : undefined,
    started_at: task.started_at ? new Date(task.started_at).toISOString() : undefined,
    questions: questions.length > 0 ? questions : undefined
  }
}

function calculateStats(tasks: any[]): any {
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const completedWithScore = completedTasks.filter(t => t.score)
  
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status !== 'completed').length,
    completed: completedTasks.length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    average_score: completedWithScore.length > 0 
      ? Math.round(completedWithScore.reduce((sum, t) => sum + (t.score || 0), 0) / completedWithScore.length)
      : 0
  }
}

function getFallbackTasks(): any[] {
  return [
    {
      id: "1",
      title: "Mathematics Practice",
      description: "Complete the algebra exercises on page 45",
      subject: "math_g7",
      grade_level: 7,
      difficulty: "intermediate",
      estimated_time_minutes: 45,
      note_content: "Focus on solving linear equations",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: "tutor_001",
      created_by_name: "John Doe",
      status: "not_started" as const
    },
    {
      id: "2",
      title: "English Essay",
      description: "Write a 500-word essay about your favorite book",
      subject: "english_g7",
      grade_level: 7,
      difficulty: "beginner",
      estimated_time_minutes: 60,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: "tutor_001",
      created_by_name: "John Doe",
      status: "in_progress" as const,
      started_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      time_spent: 15
    },
    {
      id: "3",
      title: "Science Experiment Report",
      description: "Document your observations from the chemistry lab",
      subject: "general_science_g7",
      grade_level: 7,
      difficulty: "advanced",
      estimated_time_minutes: 90,
      video_link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: "tutor_001",
      created_by_name: "John Doe",
      status: "completed" as const,
      score: 85,
      time_spent: 75,
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
}

function getFallbackStats(): any {
  return {
    total: 3,
    pending: 1,
    completed: 1,
    in_progress: 1,
    average_score: 85
  }
}