// app/api/tasks/[taskId]/route.ts - UPDATED WITH YOUR JWT AUTH
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'  // Using your MySQL query function

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized - No token provided' 
      }, { status: 401 })
    }

    // Verify token
    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId') || decoded.userId

    // Fetch task details
    const [task] = await query<any[]>(`
      SELECT 
        t.*,
        tu.first_name as tutor_first_name,
        tu.last_name as tutor_last_name,
        tu.email as tutor_email
      FROM tasks t
      LEFT JOIN tutors tu ON t.created_by = tu.id
      WHERE t.id = ?
    `, [taskId])

    if (!task) {
      return NextResponse.json({ 
        success: false,
        error: 'Task not found' 
      }, { status: 404 })
    }

    // Check if student has access to this task
    if (studentId) {
      const hasAccess = await query<any[]>(`
        SELECT id FROM student_tasks 
        WHERE task_id = ? AND student_id = ?
        LIMIT 1
      `, [taskId, studentId])

      if (hasAccess.length === 0) {
        return NextResponse.json({ 
          success: false,
          error: 'Access denied - Task not assigned to student' 
        }, { status: 403 })
      }
    }

    // Fetch questions (without correct_answer for security)
    const questions = await query<any[]>(`
      SELECT 
        id,
        question_text,
        question_type,
        options,
        points,
        time_limit_seconds,
        hint,
        display_order as order_index
      FROM questions 
      WHERE task_id = ?
      ORDER BY display_order
    `, [taskId])

    // Fetch task sessions for this student
    const taskSessions = studentId ? await query<any[]>(`
      SELECT * FROM student_sessions 
      WHERE task_id = ? AND student_id = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `, [taskId, studentId]) : []

    // Fetch notes (if you have a notes table)
    const notes = await query<any[]>(`
      SELECT * FROM notes WHERE task_id = ?
    `, [taskId]).catch(() => [])

    // Parse task data
    let images: string[] = []
    try {
      if (task.images && typeof task.images === 'string') {
        images = JSON.parse(task.images)
      } else if (Array.isArray(task.images)) {
        images = task.images
      }
    } catch {
      images = []
    }

    // Format response
    const formattedTask = {
      id: task.id?.toString(),
      title: task.title || 'Untitled Task',
      description: task.description || '',
      subject: task.subject || 'general',
      subject_code: task.subject?.replace(/\s+/g, '_').toLowerCase() || '',
      grade_level: task.grade_level || 5,
      difficulty_level: task.difficulty || 'beginner',
      difficulty: task.difficulty || 'beginner',
      estimated_time_minutes: task.estimated_time_minutes || 30,
      due_date: null, // Your schema doesn't have due_date
      note_content: task.note_content || '',
      video_link: task.video_link || null,
      parent_visibility: task.parent_visibility ? true : false,
      created_at: task.created_at?.toISOString() || new Date().toISOString(),
      updated_at: task.updated_at?.toISOString() || new Date().toISOString(),
      created_by: task.created_by || 'unknown',
      tutor_name: task.tutor_first_name && task.tutor_last_name 
        ? `${task.tutor_first_name} ${task.tutor_last_name}`
        : 'Tutor',
      tutor_email: task.tutor_email || ''
    }

    return NextResponse.json({
      success: true,
      ...formattedTask,
      notes: notes,
      questions: questions.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ? JSON.parse(q.options) : null,
        points: q.points || 1,
        time_limit_seconds: q.time_limit_seconds || null,
        hint: q.hint || null,
        order_index: q.order_index || 0
      })),
      task_sessions: taskSessions.map((ts: any) => ({
        id: ts.id,
        student_id: ts.student_id,
        task_id: ts.task_id,
        current_question_index: 0, // Your schema doesn't have this
        answers: [], // Your schema doesn't have this
        start_time: ts.login_time?.toISOString(),
        last_activity: ts.login_time?.toISOString(),
        created_at: ts.created_at?.toISOString()
      })),
      attachments: images.map((img: string, index: number) => ({
        id: index.toString(),
        file_url: img,
        file_name: `image_${index + 1}.jpg`
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching task:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}