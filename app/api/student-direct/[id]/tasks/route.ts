// app/api/student-direct/[id]/tasks/route.ts - UPDATED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = id
    
    console.log('🎯 [STUDENT API] Fetching tasks for student:', studentId)

    // 1. Get student info
    let student
    try {
      const students = await query<any[]>(
        `SELECT id, name, email, grade, courses, parent_id FROM students 
         WHERE id = ? LIMIT 1`,
        [studentId]
      )
      student = students[0]
      
      if (!student) {
        // Try to find ANY student if specified one not found
        const allStudents = await query<any[]>(
          `SELECT id, name, email, grade, courses, parent_id FROM students 
           WHERE grade = 8 ORDER BY created_at DESC LIMIT 1`
        )
        student = allStudents[0]
        console.log(`⚠️ [STUDENT API] Student ${studentId} not found, using:`, student?.id)
      }
    } catch (error) {
      console.error('[STUDENT API] Error fetching student:', error)
      student = null
    }

    // 2. Get tasks assigned to this student WITH QUESTIONS
    let tasks = []
    try {
      console.log('📋 [STUDENT API] Querying tasks for student:', studentId)
      
      // Updated query to include questions using GROUP_CONCAT
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
        st.status as student_task_status,
        st.score,
        st.time_spent_minutes,
        st.completed_at,
        st.started_at,
        tu.name as created_by_name,
        -- Get all questions for this task as JSON array
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', q.id,
              'type', q.question_type,
              'question', q.question_text,
              'options', q.options,
              'correctAnswer', q.correct_answer,
              'points', q.points,
              'displayOrder', q.display_order
            )
          ),
          JSON_ARRAY()
        ) as questions
       FROM student_tasks st
       JOIN tasks t ON st.task_id = t.id
       LEFT JOIN tutors tu ON t.created_by = tu.id
       LEFT JOIN questions q ON t.id = q.task_id
       WHERE st.student_id = ?
       GROUP BY 
         t.id, t.title, t.description, t.subject, t.grade_level,
         t.difficulty, t.estimated_time_minutes, t.note_content,
         t.video_link, t.images, t.parent_visibility, t.created_at,
         t.created_by, st.status, st.score, st.time_spent_minutes,
         st.completed_at, st.started_at, tu.name
       ORDER BY 
         CASE WHEN st.status = 'pending' THEN 1
              WHEN st.status = 'in_progress' THEN 2
              WHEN st.status = 'completed' THEN 3
              ELSE 4 END,
         t.created_at DESC
       LIMIT 100`
      
      tasks = await query<any[]>(tasksQuery, [studentId || student?.id])
      console.log(`📊 [STUDENT API] Found ${tasks.length} tasks for student`)
      
    } catch (error) {
      console.error('❌ [STUDENT API] Tasks query failed:', error)
      // Try a simpler query without GROUP BY as fallback
      try {
        console.log('🔄 [STUDENT API] Trying simpler query...')
        const simpleQuery = `SELECT 
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
          st.status as student_task_status,
          st.score,
          st.time_spent_minutes,
          st.completed_at,
          st.started_at,
          tu.name as created_by_name
         FROM student_tasks st
         JOIN tasks t ON st.task_id = t.id
         LEFT JOIN tutors tu ON t.created_by = tu.id
         WHERE st.student_id = ?
         ORDER BY 
           CASE WHEN st.status = 'pending' THEN 1
                WHEN st.status = 'in_progress' THEN 2
                WHEN st.status = 'completed' THEN 3
                ELSE 4 END,
           t.created_at DESC
         LIMIT 100`
        
        tasks = await query<any[]>(simpleQuery, [studentId || student?.id])
        console.log(`📊 [STUDENT API] Found ${tasks.length} tasks (simple query)`)
        
        // Now fetch questions separately for each task
        for (const task of tasks) {
          const questionsQuery = `SELECT 
            id,
            question_type as type,
            question_text as question,
            options,
            correct_answer as correctAnswer,
            points,
            display_order as displayOrder
           FROM questions 
           WHERE task_id = ?
           ORDER BY display_order`
          
          const questions = await query<any[]>(questionsQuery, [task.id])
          
          // Add questions to task object
          task.questions = questions.map(q => ({
            id: q.id?.toString(),
            type: q.type || 'multiple-choice',
            question: q.question || '',
            options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
            correctAnswer: q.correctAnswer,
            points: q.points || 10,
            displayOrder: q.displayOrder || 1
          }))
        }
      } catch (fallbackError) {
        console.error('❌ [STUDENT API] Fallback query also failed:', fallbackError)
        tasks = []
      }
    }

    // 3. If no tasks found, try to get tasks by grade level
    if (tasks.length === 0 && student?.grade) {
      console.log(`📚 [STUDENT API] No assigned tasks, getting tasks for grade ${student.grade}`)
      try {
        const gradeTasksQuery = `SELECT 
          t.*,
          NULL as student_task_status,
          NULL as score,
          NULL as time_spent_minutes,
          NULL as completed_at,
          tu.name as created_by_name,
          -- Get questions for grade-level tasks too
          COALESCE(
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', q.id,
                'type', q.question_type,
                'question', q.question_text,
                'options', q.options,
                'correctAnswer', q.correct_answer,
                'points', q.points,
                'displayOrder', q.display_order
              )
            ),
            JSON_ARRAY()
          ) as questions
         FROM tasks t
         LEFT JOIN tutors tu ON t.created_by = tu.id
         LEFT JOIN questions q ON t.id = q.task_id
         WHERE t.grade_level = ?
         GROUP BY t.id, t.title, t.description, t.subject, t.grade_level,
           t.difficulty, t.estimated_time_minutes, t.note_content,
           t.video_link, t.images, t.parent_visibility, t.created_at,
           t.created_by, tu.name
         ORDER BY t.created_at DESC
         LIMIT 20`
        
        const gradeTasks = await query<any[]>(gradeTasksQuery, [student.grade])
        console.log(`📚 [STUDENT API] Found ${gradeTasks.length} tasks for grade ${student.grade}`)
        
        // Format these as unassigned tasks
        tasks = gradeTasks.map(task => ({
          ...task,
          student_task_status: 'pending',
          student_id: studentId
        }))
      } catch (error) {
        console.error('[STUDENT API] Grade tasks query failed:', error)
      }
    }

    // 4. Format tasks
    const formattedTasks = tasks.map(task => {
      // Parse images if they exist
      let images = []
      if (task.images) {
        try {
          if (typeof task.images === 'string') {
            images = JSON.parse(task.images)
          } else if (Array.isArray(task.images)) {
            images = task.images
          }
        } catch {
          images = []
        }
      }

      // Parse questions
      let questions = []
      if (task.questions) {
        try {
          if (typeof task.questions === 'string') {
            questions = JSON.parse(task.questions)
          } else if (Array.isArray(task.questions)) {
            questions = task.questions
          }
        } catch (error) {
          console.error('Error parsing questions:', error)
          questions = []
        }
      }
      
      // Filter out null/empty questions (from LEFT JOIN)
      questions = questions.filter((q: any) => q.id !== null && q.question)

      // Parse courses for student
      let courses = []
      if (student?.courses) {
        try {
          if (typeof student.courses === 'string') {
            courses = JSON.parse(student.courses)
          } else if (Array.isArray(student.courses)) {
            courses = student.courses
          }
        } catch {
          courses = []
        }
      }

      return {
        id: task.id?.toString(),
        title: task.title || 'Untitled Task',
        description: task.description || '',
        subject: task.subject || 'general',
        grade_level: task.grade_level || student?.grade || 5,
        difficulty: task.difficulty || 'beginner',
        estimated_time_minutes: task.estimated_time_minutes || 30,
        note_content: task.note_content || '',
        video_link: task.video_link || null,
        images: images,
        parent_visibility: task.parent_visibility ? true : false,
        created_at: task.created_at?.toISOString() || new Date().toISOString(),
        created_by: task.created_by || 'unknown',
        created_by_name: task.created_by_name || 'Tutor',
        status: task.student_task_status || 'pending',
        score: task.score || null,
        time_spent: task.time_spent_minutes || 0,
        completed_at: task.completed_at?.toISOString(),
        started_at: task.started_at?.toISOString(),
        // Include questions in the task data - just like notes and videos
        questions: questions.map((q: any) => ({
          id: q.id?.toString(),
          type: q.type || 'multiple-choice',
          question: q.question || '',
          options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
          correctAnswer: q.correctAnswer,
          points: q.points || 10,
          displayOrder: q.displayOrder || 1
        })),
        question_count: questions.length
      }
    })

    // 5. Return data
   // 5. Return data
return NextResponse.json({
  success: true,
  usingMockData: false,
  student: student ? {
    id: student.id,
    name: student.name || 'Student',
    email: student.email || '',
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
  } : null,
  tasks: formattedTasks,
  stats: {
    totalTasks: formattedTasks.length,
    pending: formattedTasks.filter(t => !t.completed_at).length,
    completed: formattedTasks.filter(t => t.completed_at).length,
    withQuestions: formattedTasks.filter(t => t.questions && t.questions.length > 0).length,
    // ⭐ FIX: Only include tasks with score > 0 in average calculation
    // Tasks with score = 0 (short-answer only) should NOT affect the average
    averageScore: (() => {
      const tasksWithValidScores = formattedTasks.filter(t => (t.score || 0) > 0)
      return tasksWithValidScores.length > 0
        ? Math.round(tasksWithValidScores.reduce((sum, t) => sum + (t.score || 0), 0) / tasksWithValidScores.length)
        : 0
    })()
  },
  debug: {
    studentId: studentId,
    foundStudentId: student?.id,
    tasksCount: tasks.length,
    formattedCount: formattedTasks.length,
    tasksWithQuestions: formattedTasks.filter(t => t.questions && t.questions.length > 0).length
  }
})

  } catch (error) {
    console.error('🚨 [STUDENT API] Error:', error)
    
    return NextResponse.json({
      success: false,
      usingMockData: true,
      error: 'Database query failed',
      errorDetails: error instanceof Error ? error.message : 'Unknown error',
      student: null,
      tasks: [],
      stats: {
        totalTasks: 0,
        pending: 0,
        completed: 0,
        withQuestions: 0,
        averageScore: 0
      },
      message: 'Using mock data due to error'
    }, { status: 500 })
  }
}