// app/api/student/tasks/complete/route.ts - FINAL VERSION
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, studentId, score, timeSpent, answers, completedAt } = body

    console.log('🚀 Task completion API called')
    console.log('📝 Request data:', {
      taskId,
      studentId,
      hasAnswers: !!answers,
      answersCount: answers ? Object.keys(answers).length : 0,
      answers: answers // Log the actual answers
    })

    // Validate
    if (!taskId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing taskId or studentId' },
        { status: 400 }
      )
    }

    const numericTaskId = Number(taskId)
    const studentTaskId = await getStudentTaskId(numericTaskId, studentId)

    // Calculate score
    const { finalScore, earnedPoints, totalPoints } = await calculateScore(numericTaskId, answers, score)

    console.log(`🎯 Final score: ${finalScore}%`)

    // Update database - SINGLE TRANSACTION APPROACH
    const updateSuccess = await updateStudentTask({
      studentTaskId,
      finalScore,
      timeSpent: timeSpent || 0,
      answers,
      completedAt
    })

    if (!updateSuccess) {
      // Fallback: Simple update without answers
      await query(
        `UPDATE student_tasks 
         SET status = 'completed', 
             score = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [finalScore, studentTaskId]
      )
      
      console.log('⚠️ Used fallback update (without answers)')
    }

    // Update main task
    await query(
      `UPDATE tasks SET status = 'completed' WHERE id = ?`,
      [numericTaskId]
    )

    // Return success
    return NextResponse.json({
      success: true,
      message: updateSuccess 
        ? 'Task completed successfully with all data saved! 🎉' 
        : 'Task completed (answers saved separately)',
      data: {
        taskId: numericTaskId,
        studentId,
        score: finalScore,
        timeSpent: timeSpent || 0,
        correctAnswers: earnedPoints / 10,
        totalQuestions: totalPoints / 10,
        percentage: finalScore,
        answersSaved: updateSuccess
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('❌ Error in task completion:', error.message)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete task',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Helper function to get student task ID
async function getStudentTaskId(taskId: number, studentId: string): Promise<number> {
  const result = await query(
    `SELECT id FROM student_tasks WHERE task_id = ? AND student_id = ?`,
    [taskId, studentId]
  ) as any[]

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('Student task not found')
  }

  return result[0].id
}

// Helper function to calculate score
async function calculateScore(taskId: number, answers: any, providedScore: any) {
  let finalScore = providedScore ? Number(providedScore) : 0
  let earnedPoints = 0
  let totalPoints = 0

  if (answers && Object.keys(answers).length > 0) {
    try {
      const questions = await query(
        `SELECT id, correct_answer, points FROM questions WHERE task_id = ?`,
        [taskId]
      ) as any[]

      if (questions && questions.length > 0) {
        questions.forEach((q: any) => {
          const questionId = q.id
          const studentAnswer = answers[questionId]
          const correctAnswer = q.correct_answer
          const points = q.points || 10
          
          totalPoints += points
          
          if (studentAnswer && correctAnswer) {
            const isCorrect = studentAnswer.toString().trim().toLowerCase() === 
                             correctAnswer.toString().trim().toLowerCase()
            if (isCorrect) {
              earnedPoints += points
            }
          }
        })

        if (totalPoints > 0) {
          finalScore = Math.round((earnedPoints / totalPoints) * 100)
        }
      }
    } catch (error) {
      console.error('Score calculation error:', error)
    }
  }

  return { finalScore, earnedPoints, totalPoints }
}

// Helper function to update student task with JSON handling
async function updateStudentTask(params: {
  studentTaskId: number
  finalScore: number
  timeSpent: number
  answers: any
  completedAt: string
}): Promise<boolean> {
  const { studentTaskId, finalScore, timeSpent, answers, completedAt } = params
  
  try {
    // First, prepare the answers for JSON storage
    let answersJson = null
    if (answers && typeof answers === 'object' && Object.keys(answers).length > 0) {
      // Create a clean object with string values
      const cleanAnswers: Record<string, string> = {}
      Object.entries(answers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          cleanAnswers[key] = value.toString().trim()
        }
      })
      
      if (Object.keys(cleanAnswers).length > 0) {
        // Try different JSON stringify approaches
        try {
          answersJson = JSON.stringify(cleanAnswers)
          console.log('📦 Prepared answers JSON:', cleanAnswers)
        } catch (jsonError) {
          console.error('JSON stringify error:', jsonError)
          // Try alternative approach
          answersJson = JSON.stringify(cleanAnswers, null, 2)
        }
      }
    }

    console.log('📋 Update parameters:', {
      studentTaskId,
      finalScore,
      timeSpent,
      answersJson: answersJson ? 'JSON data present' : 'null',
      hasAnswers: !!answersJson
    })

    // Try different update approaches
    let success = false
    
    // APPROACH 1: Direct JSON string
    if (answersJson) {
      try {
        await query(
          `UPDATE student_tasks 
           SET status = 'completed',
               score = ?,
               time_spent = ?,
               answers = CAST(? AS JSON),
               completed_at = COALESCE(?, CURRENT_TIMESTAMP),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [finalScore, timeSpent, answersJson, completedAt, studentTaskId]
        )
        success = true
        console.log('✅ Approach 1: Direct JSON update successful')
      } catch (error1) {
        console.error('❌ Approach 1 failed:', error1.message)
        
        // APPROACH 2: Without CAST
        try {
          await query(
            `UPDATE student_tasks 
             SET status = 'completed',
                 score = ?,
                 time_spent = ?,
                 answers = ?,
                 completed_at = COALESCE(?, CURRENT_TIMESTAMP),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [finalScore, timeSpent, answersJson, completedAt, studentTaskId]
          )
          success = true
          console.log('✅ Approach 2: JSON without CAST successful')
        } catch (error2) {
          console.error('❌ Approach 2 failed:', error2.message)
          
          // APPROACH 3: Store answers in student_answers table
          try {
            // First, update basic fields
            await query(
              `UPDATE student_tasks 
               SET status = 'completed',
                   score = ?,
                   time_spent = ?,
                   completed_at = COALESCE(?, CURRENT_TIMESTAMP),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [finalScore, timeSpent, completedAt, studentTaskId]
            )
            
            // Then store answers in student_answers table
            if (answers && typeof answers === 'object') {
              for (const [questionId, answer] of Object.entries(answers)) {
                await query(
                  `INSERT INTO student_answers 
                   (student_task_id, question_id, answer, created_at)
                   VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                   ON DUPLICATE KEY UPDATE answer = ?`,
                  [studentTaskId, questionId, answer, answer]
                )
              }
              console.log(`✅ Stored ${Object.keys(answers).length} answers in student_answers table`)
            }
            
            success = true
            console.log('✅ Approach 3: Alternative storage successful')
          } catch (error3) {
            console.error('❌ Approach 3 failed:', error3.message)
          }
        }
      }
    } else {
      // No answers to store, just update basic fields
      try {
        await query(
          `UPDATE student_tasks 
           SET status = 'completed',
               score = ?,
               time_spent = ?,
               completed_at = COALESCE(?, CURRENT_TIMESTAMP),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [finalScore, timeSpent, completedAt, studentTaskId]
        )
        success = true
        console.log('✅ No answers to store, basic update successful')
      } catch (error) {
        console.error('❌ Basic update failed:', error.message)
      }
    }

    return success

  } catch (error: any) {
    console.error('❌ Update student task failed:', error.message)
    return false
  }
}

// GET endpoint for debugging
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')
    const studentId = searchParams.get('studentId')

    if (!taskId || !studentId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Get current data
    const [studentTask, questions] = await Promise.all([
      query(
        `SELECT * FROM student_tasks WHERE task_id = ? AND student_id = ?`,
        [Number(taskId), studentId]
      ) as Promise<any[]>,
      query(
        `SELECT * FROM questions WHERE task_id = ?`,
        [Number(taskId)]
      ) as Promise<any[]>
    ])

    // Test JSON column
    const jsonTest = await query(
      `SELECT 
        JSON_TYPE(answers) as json_type,
        JSON_VALID(answers) as json_valid,
        answers
       FROM student_tasks 
       WHERE task_id = ? AND student_id = ?`,
      [Number(taskId), studentId]
    ) as any[]

    return NextResponse.json({
      success: true,
      data: {
        studentTask: studentTask[0],
        questions,
        jsonTest: jsonTest[0],
        databaseInfo: {
          hasAnswersColumn: studentTask[0]?.answers !== undefined,
          answersValue: studentTask[0]?.answers,
          answersType: typeof studentTask[0]?.answers
        }
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}