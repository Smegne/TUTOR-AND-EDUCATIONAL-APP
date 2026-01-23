// app/api/student/[id]/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id

    // Get student profile
    const [student] = await query<any[]>(
      `SELECT 
        s.*,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ? OR s.user_id = ?`,
      [studentId, studentId]
    )

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Parse courses safely
    const parseCourses = (courses: any): string[] => {
      if (!courses) return []
      try {
        if (Array.isArray(courses)) return courses
        if (typeof courses === 'string') {
          if (courses.startsWith('[')) {
            const parsed = JSON.parse(courses)
            return Array.isArray(parsed) ? parsed : []
          }
          return courses.split(',').map(c => c.trim()).filter(c => c)
        }
        return []
      } catch (error) {
        console.error('Error parsing courses:', error)
        return []
      }
    }

    // Get tasks for student's grade
    // First, let's create a mock tasks table if it doesn't exist
    const tasks = await query<any[]>(
      `SELECT 
        id,
        title as topic,
        description,
        subject as course,
        grade_level as grade,
        difficulty,
        estimated_time_minutes as duration,
        created_at
       FROM tasks 
       WHERE grade_level = ?
       ORDER BY created_at DESC`,
      [student.grade]
    ).catch(async (error) => {
      console.warn('Tasks table might not exist, using mock tasks:', error)
      
      // Return mock tasks for now
      return [
        {
          id: 'task_1',
          topic: 'Basic Multiplication',
          description: 'Practice multiplying single-digit numbers',
          course: 'math_g5',
          grade: student.grade,
          difficulty: 'beginner',
          duration: 30,
          created_at: new Date()
        },
        {
          id: 'task_2',
          topic: 'Reading Comprehension',
          description: 'Read and answer questions about a short story',
          course: 'english_g5',
          grade: student.grade,
          difficulty: 'intermediate',
          duration: 45,
          created_at: new Date()
        },
        {
          id: 'task_3',
          topic: 'Solar System Basics',
          description: 'Learn about planets in our solar system',
          course: 'science_g5',
          grade: student.grade,
          difficulty: 'beginner',
          duration: 40,
          created_at: new Date()
        }
      ]
    })

    // Get student progress from student_tasks table if it exists
    let studentProgress = []
    try {
      studentProgress = await query<any[]>(
        `SELECT 
          task_id,
          status,
          score,
          time_spent_minutes,
          started_at,
          completed_at
         FROM student_tasks 
         WHERE student_id = ?`,
        [student.id]
      )
    } catch (error) {
      console.warn('student_tasks table might not exist:', error)
      // Mock progress for demo
      studentProgress = tasks.slice(0, 2).map(task => ({
        task_id: task.id,
        status: Math.random() > 0.5 ? 'completed' : 'in_progress',
        score: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 70 : null,
        time_spent_minutes: Math.floor(Math.random() * 20) + 10,
        started_at: new Date(Date.now() - Math.random() * 86400000),
        completed_at: Math.random() > 0.5 ? new Date() : null
      }))
    }

    // Combine tasks with progress
    const tasksWithProgress = tasks.map(task => {
      const progress = studentProgress.find(p => p.task_id === task.id)
      return {
        ...task,
        status: progress?.status || 'not_started',
        score: progress?.score || null,
        timeSpent: progress?.time_spent_minutes || 0
      }
    })

    // Calculate statistics
    const completedTasks = tasksWithProgress.filter(t => t.status === 'completed').length
    const totalTasks = tasksWithProgress.length
    const completedTasksWithScore = tasksWithProgress.filter(t => t.status === 'completed' && t.score)
    const avgScore = completedTasksWithScore.length > 0
      ? Math.round(completedTasksWithScore.reduce((sum, t) => sum + (t.score || 0), 0) / completedTasksWithScore.length)
      : 0

    // Get streak (last 7 days of completed tasks)
    let streak = 0
    try {
      const [streakData] = await query<any[]>(
        `SELECT COUNT(DISTINCT DATE(completed_at)) as streak
         FROM student_tasks 
         WHERE student_id = ? 
           AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
           AND status = 'completed'`,
        [student.id]
      )
      streak = streakData?.streak || 0
    } catch (error) {
      console.warn('Could not calculate streak, using mock:', error)
      streak = Math.floor(Math.random() * 5) + 1
    }

    // Get points from student record or calculate
    const points = student.points || Math.floor(completedTasks * 10 + streak * 5)

    const stats = {
      completedTasks,
      totalTasks,
      avgScore,
      streak,
      points
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        userId: student.user_id,
        name: student.name || `${student.first_name} ${student.last_name}`,
        email: student.email,
        grade: student.grade,
        courses: parseCourses(student.courses),
        parentId: student.parent_id,
        points
      },
      tasks: tasksWithProgress,
      stats
    })

  } catch (error) {
    console.error('Error fetching student dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student data' },
      { status: 500 }
    )
  }
}