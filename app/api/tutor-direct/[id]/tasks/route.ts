// app/api/tutor-direct/[id]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tutorId = id
    
    console.log('🎯 DIRECT API: Fetching tasks for tutor:', tutorId)

    // 1. Get tutor info
    let tutor
    try {
      const tutors = await query<any[]>(
        `SELECT id, name, email, courses FROM tutors 
         WHERE id = ? OR user_id = ? 
         LIMIT 1`,
        [tutorId, tutorId]
      )
      tutor = tutors[0]
      
      if (!tutor) {
        // Try to find ANY tutor if specified one not found
        const allTutors = await query<any[]>(
          `SELECT id, name, email, courses FROM tutors LIMIT 1`
        )
        tutor = allTutors[0]
      }
    } catch (error) {
      console.error('Error fetching tutor:', error)
      tutor = null
    }

    // 2. Get ALL tasks (not just by created_by) - For testing
    console.log('📋 DIRECT API: Querying ALL tasks from database')
    
    let tasks = []
    try {
      // First, let's see what tasks exist
      const allTasksDebug = await query<any[]>(
        `SELECT id, title, created_by FROM tasks ORDER BY created_at DESC`
      )
      console.log('🔍 DIRECT API: All tasks in database:', allTasksDebug)

      // Now get tasks with counts
      const tasksQuery = `SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.subject, 
        t.grade_level,
        t.difficulty,
        t.estimated_time_minutes,
        t.note_content,
        t.video_link,
        t.images,
        t.parent_visibility,
        t.created_at,
        t.created_by,
        t.status,
        t.priority,
        COUNT(DISTINCT st.id) as assigned_count,
        SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) as completed_count
       FROM tasks t
       LEFT JOIN student_tasks st ON t.id = st.task_id
       GROUP BY t.id
       ORDER BY t.created_at DESC
       LIMIT 100`
      
      tasks = await query<any[]>(tasksQuery)
      console.log(`📊 DIRECT API: Found ${tasks.length} TOTAL tasks in database`)
      
    } catch (error) {
      console.error('❌ DIRECT API: Tasks query failed:', error)
      tasks = []
    }

    // 3. Get students
    let students = []
    try {
      const studentsQuery = `
        SELECT s.* FROM students s
        ORDER BY s.name
        LIMIT 100
      `
      students = await query<any[]>(studentsQuery)
      console.log(`👥 DIRECT API: Found ${students.length} students`)
    } catch (error) {
      console.warn('DIRECT API: Students query failed:', error)
      students = []
    }

    // 4. Calculate stats
    const totalAssigned = tasks.reduce((sum, task) => sum + (task.assigned_count || 0), 0)
    const totalCompleted = tasks.reduce((sum, task) => sum + (task.completed_count || 0), 0)

    // 5. Return ALL data
    return NextResponse.json({
      success: true,
      usingMockData: false,
      tutor: tutor ? {
        id: tutor.id,
        name: tutor.name || 'Unknown Tutor',
        email: tutor.email || '',
        courses: tutor.courses ? 
          (typeof tutor.courses === 'string' ? 
            (() => {
              try { return JSON.parse(tutor.courses) } 
              catch { return [] }
            })() 
            : tutor.courses) 
          : [],
      } : null,
      tasks: tasks.map(task => ({
        id: task.id?.toString() || `task_${Date.now()}`,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        subject: task.subject || 'general',
        grade_level: task.grade_level || 5,
        difficulty: task.difficulty || 'beginner',
        estimated_time_minutes: task.estimated_time_minutes || 30,
        note_content: task.note_content || '',
        video_link: task.video_link || null,
        images: task.images ? 
          (typeof task.images === 'string' ? 
            (() => {
              try { return JSON.parse(task.images) } 
              catch { return [] }
            })() 
            : task.images) 
          : [],
        parent_visibility: task.parent_visibility ? true : false,
        status: task.status || 'active',
        priority: task.priority || 'medium',
        created_at: task.created_at?.toISOString() || new Date().toISOString(),
        created_by: task.created_by || 'unknown',
        assigned_count: task.assigned_count || 0,
        completed_count: task.completed_count || 0,
        questions: []
      })),
      students: students.map(student => ({
        id: student.id,
        name: student.name || 'Unknown Student',
        grade: student.grade || 5,
        courses: student.courses ? 
          (typeof student.courses === 'string' ? 
            (() => {
              try { return JSON.parse(student.courses) } 
              catch { return [] }
            })() 
            : student.courses) 
          : [],
        parentId: student.parent_id || null
      })),
      stats: {
        totalTasks: tasks.length,
        totalAssigned,
        totalCompleted,
        totalStudents: students.length
      },
      debug: {
        tutorId: tutorId,
        requestedTutorId: tutorId,
        foundTutorId: tutor?.id,
        tasksCount: tasks.length,
        studentsCount: students.length
      }
    })

  } catch (error) {
    console.error('🚨 DIRECT API Error:', error)
    
    return NextResponse.json({
      success: false,
      usingMockData: true,
      error: 'Database query failed',
      errorDetails: error instanceof Error ? error.message : 'Unknown error',
      tasks: [],
      students: [],
      stats: {
        totalTasks: 0,
        totalAssigned: 0,
        totalCompleted: 0,
        totalStudents: 0
      },
      message: 'Using mock data due to error'
    }, { status: 500 })
  }
}