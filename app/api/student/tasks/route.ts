// app/api/student/tasks/route.ts - UPDATED WITH YOUR JWT AUTH
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'  // Using your MySQL query function

export async function GET(request: NextRequest) {
  try {
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
    const studentId = searchParams.get('studentId')
    const includeProgress = searchParams.get('includeProgress') === 'true'

    // If no studentId in query, use the authenticated user's ID
    const targetStudentId = studentId || decoded.userId
    
    if (!targetStudentId) {
      return NextResponse.json({ 
        success: false,
        error: 'Student ID required' 
      }, { status: 400 })
    }

    // Fetch student's assigned tasks using your MySQL database
    const studentTasks = await query<any[]>(`
      SELECT 
        st.*,
        t.id as task_id,
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
        t.created_at as task_created_at,
        t.updated_at as task_updated_at,
        t.created_by,
        tu.first_name as tutor_first_name,
        tu.last_name as tutor_last_name,
        tu.email as tutor_email,
        COUNT(q.id) as question_count
      FROM student_tasks st
      JOIN tasks t ON st.task_id = t.id
      LEFT JOIN tutors tu ON t.created_by = tu.id
      LEFT JOIN questions q ON t.id = q.task_id
      WHERE st.student_id = ?
      GROUP BY st.id, t.id, tu.id
      ORDER BY st.created_at DESC
    `, [targetStudentId])

    // Get latest session for each task
    const tasksWithSessions = await Promise.all(
      studentTasks.map(async (st: any) => {
        const [latestSession] = await query<any[]>(`
          SELECT * FROM student_sessions 
          WHERE student_id = ? AND task_id = ?
          ORDER BY created_at DESC 
          LIMIT 1
        `, [targetStudentId, st.task_id])
        
        return { ...st, latestSession }
      })
    )

    // Define a type for the task object to ensure questions is any[]
    type Task = {
      id: string;
      title: string;
      description: string;
      subject: string;
      subject_code: string;
      grade_level: number;
      difficulty: string;
      difficulty_level: string;
      estimated_time_minutes: number;
      due_date: any;
      note_content: string;
      video_link: string | null;
      parent_visibility: boolean;
      created_at: string;
      updated_at: string;
      created_by: string;
      tutor_name: string;
      status: string;
      score: number | null;
      time_spent: number;
      completed_at?: string;
      started_at?: string;
      last_accessed?: string;
      questions: any[];
      attachments: string[];
      question_count: number;
      task_session?: {
        current_question_index: number;
        answers: any[];
        start_time?: string;
      };
    };

    // Transform data - similar to your original logic
    const tasks: Task[] = tasksWithSessions.map(st => {
      const latestSession = st.latestSession
      
      // Parse images if they exist
      let images: string[] = []
      try {
        if (st.images && typeof st.images === 'string') {
          images = JSON.parse(st.images)
        } else if (Array.isArray(st.images)) {
          images = st.images
        }
      } catch {
        images = []
      }

      return {
        id: st.task_id?.toString(),
        title: st.title || 'Untitled Task',
        description: st.description || '',
        subject: st.subject || 'general',
        subject_code: st.subject?.replace(/\s+/g, '_').toLowerCase() || '',
        grade_level: st.grade_level || 5,
        difficulty: st.difficulty || 'beginner',
        difficulty_level: st.difficulty || 'beginner',
        estimated_time_minutes: st.estimated_time_minutes || 30,
        due_date: null, // Your schema doesn't have due_date in tasks table
        note_content: st.note_content || '',
        video_link: st.video_link || null,
        parent_visibility: st.parent_visibility ? true : false,
        created_at: st.task_created_at?.toISOString() || new Date().toISOString(),
        updated_at: st.task_updated_at?.toISOString() || new Date().toISOString(),
        created_by: st.created_by || 'unknown',
        tutor_name: st.tutor_first_name && st.tutor_last_name 
          ? `${st.tutor_first_name} ${st.tutor_last_name}`
          : 'Tutor',
        status: st.status || 'pending',
        score: st.score || null,
        time_spent: st.time_spent_minutes || 0,
        completed_at: st.completed_at?.toISOString(),
        started_at: st.started_at?.toISOString(),
        last_accessed: latestSession?.login_time?.toISOString(),
        questions: [], // Will be fetched separately if needed
        attachments: images, // Using images as attachments
        question_count: st.question_count || 0,
        task_session: latestSession ? {
          current_question_index: 0,
          answers: [],
          start_time: latestSession.login_time?.toISOString()
        } : undefined
      }
    })

    // If includeProgress is true, fetch questions for each task
    if (includeProgress) {
      for (const task of tasks) {
        const questions = await query<any[]>(`
          SELECT 
            id,
            question_text,
            question_type,
            points
          FROM questions 
          WHERE task_id = ?
          ORDER BY display_order
        `, [task.id])
        
        task.questions = questions
      }
    }

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
      studentId: targetStudentId
    })
  } catch (error) {
    console.error('❌ Error fetching student tasks:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tasks',
      details: error instanceof Error ? error.message : 'Unknown error',
      tasks: []
    }, { status: 500 })
  }
}