// app/api/tasks/route.ts - UPDATED WITH QUESTIONS SUPPORT
import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Task creation request:', JSON.stringify(body, null, 2))

    const {
      title,
      description,
      subject,
      grade,
      difficulty,
      estimatedTimeMinutes,
      tutorId,
      studentIds = [],
      noteContent,
      questionData, // Single question (old format)
      questions = [], // Multiple questions (new format)
      parentVisibility = false,
      videoLink,
      images = []
    } = body

    // VALIDATION
    if (!title || !tutorId) {
      return NextResponse.json(
        { error: 'Title and tutor ID are required', received: { title, tutorId } },
        { status: 400 }
      )
    }

    // Convert grade to number
    const gradeLevel = grade ? parseInt(grade) : null
    
    // Convert single questionData to questions array for consistency
    const allQuestions = questions.length > 0 
      ? questions 
      : questionData 
        ? [{ ...questionData, displayOrder: 1 }] 
        : []

    console.log(`📋 Processing ${allQuestions.length} question(s) for task`)

    try {
      const result = await transaction(async (connection) => {
        // 1. Insert task into tasks table
        const insertResult = await connection.execute(
          `INSERT INTO tasks (
            title, 
            description, 
            subject, 
            grade_level, 
            difficulty, 
            estimated_time_minutes, 
            created_by,
            note_content,
            video_link,
            images,
            parent_visibility,
            status,
            priority,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'medium', NOW(), NOW())`,
          [
            title,
            description || null,
            subject || null,
            gradeLevel,
            difficulty || 'beginner',
            estimatedTimeMinutes || 30,
            tutorId,
            noteContent || null,
            videoLink || null,
            images.length > 0 ? JSON.stringify(images) : null,
            parentVisibility ? 1 : 0
          ]
        )

        // Get the inserted task ID
        const taskId = (insertResult as any)[0].insertId
        console.log(`✅ Task created with ID: ${taskId}`)

        // 2. Insert questions into questions table
        const savedQuestions = []
        let questionCounter = 1
        
        for (const question of allQuestions) {
          if (question.question && question.question.trim()) {
            const { type, question: questionText, options, correctAnswer, sampleAnswer, points = 10 } = question
            
            // Prepare options JSON for multiple choice
            let optionsJson = null
            let finalCorrectAnswer = correctAnswer || sampleAnswer || ''
            
            if (type === 'multiple-choice' && options && options.length > 0) {
              const validOptions = options.filter(opt => opt && opt.trim())
              if (validOptions.length > 0) {
                optionsJson = JSON.stringify(validOptions)
                // If no correct answer specified but options exist, default to first option
                if (!finalCorrectAnswer && validOptions[0]) {
                  finalCorrectAnswer = validOptions[0]
                }
              }
            }
            
            // Insert question
            const questionResult = await connection.execute(
              `INSERT INTO questions (
                task_id, 
                question_type, 
                question_text, 
                options, 
                correct_answer, 
                points, 
                display_order,
                created_at,
                updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                taskId,
                type || 'multiple-choice',
                questionText,
                optionsJson,
                finalCorrectAnswer,
                points,
                question.displayOrder || questionCounter
              ]
            )
            
            const questionId = (questionResult as any)[0].insertId
            savedQuestions.push({
              id: questionId.toString(),
              task_id: taskId,
              type: type || 'multiple-choice',
              question: questionText,
              options: optionsJson ? JSON.parse(optionsJson) : undefined,
              correctAnswer: finalCorrectAnswer,
              points: points,
              displayOrder: question.displayOrder || questionCounter
            })
            
            console.log(`✅ Question ${questionCounter} added (ID: ${questionId})`)
            questionCounter++
          }
        }

        // 3. Assign task to selected students
        if (studentIds && studentIds.length > 0) {
          for (const studentId of studentIds) {
            await connection.execute(
              `INSERT INTO student_tasks (task_id, student_id, status, created_at, updated_at) 
               VALUES (?, ?, 'pending', NOW(), NOW())`,
              [taskId, studentId]
            )
          }
          console.log(`✅ Task assigned to ${studentIds.length} student(s)`)
        }

        // 4. Get the complete task with details
        const [taskRows] = await connection.execute(
          `SELECT t.*,
            COUNT(DISTINCT st.student_id) as assigned_count
           FROM tasks t
           LEFT JOIN student_tasks st ON t.id = st.task_id
           WHERE t.id = ?
           GROUP BY t.id`,
          [taskId]
        )

        const task = (taskRows as any[])[0]

        return {
          success: true,
          message: 'Task created successfully',
          taskId: taskId,
          task: {
            id: taskId.toString(),
            title: task.title,
            description: task.description,
            subject: task.subject,
            grade_level: task.grade_level,
            difficulty: task.difficulty,
            estimated_time_minutes: task.estimated_time_minutes,
            note_content: task.note_content,
            video_link: task.video_link,
            images: task.images ? JSON.parse(task.images) : [],
            parent_visibility: task.parent_visibility,
            created_at: task.created_at,
            created_by: task.created_by,
            assigned_count: task.assigned_count || 0,
            questions: savedQuestions
          }
        }
      })

      return NextResponse.json(result)

    } catch (error) {
      console.error('Database operation failed:', error)
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
          sqlMessage: (error as any).sqlMessage
        })
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Database insertion failed',
          details: error instanceof Error ? error.message : 'Unknown database error',
          code: (error as any).code || 'UNKNOWN'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create task',
        details: error.message,
        step: 'Request parsing/validation'
      },
      { status: 500 }
    )
  }
}

// GET endpoint
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = url.searchParams.get('limit') || '10'
    
    const tasks = await query<any[]>(
      `SELECT 
        t.*,
        COUNT(DISTINCT st.student_id) as assigned_count,
        COUNT(DISTINCT CASE WHEN st.status = 'completed' THEN st.student_id END) as completed_count,
        GROUP_CONCAT(DISTINCT q.id) as question_ids
       FROM tasks t
       LEFT JOIN student_tasks st ON t.id = st.task_id
       LEFT JOIN questions q ON t.id = q.task_id
       GROUP BY t.id
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [parseInt(limit)]
    )
    
    const formattedTasks = tasks.map((task: any) => ({
      id: task.id.toString(),
      title: task.title,
      description: task.description,
      subject: task.subject,
      grade_level: task.grade_level,
      difficulty: task.difficulty,
      estimated_time_minutes: task.estimated_time_minutes,
      note_content: task.note_content,
      video_link: task.video_link,
      images: task.images ? JSON.parse(task.images) : [],
      parent_visibility: task.parent_visibility,
      created_at: task.created_at,
      created_by: task.created_by,
      assigned_count: task.assigned_count || 0,
      completed_count: task.completed_count || 0,
      has_questions: task.question_ids !== null
    }))
    
    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      count: formattedTasks.length
    })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}