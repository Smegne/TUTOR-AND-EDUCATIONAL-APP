// app/api/student/tasks/[taskId]/questions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId
    console.log(`📋 Fetching questions for task ${taskId}`)

    const questions = await query(
      `SELECT 
         q.id,
         q.task_id,
         q.question_type as type,
         q.question_text as question,
         q.options,
         q.correct_answer as correctAnswer,
         q.points,
         q.display_order as displayOrder
       FROM questions q
       WHERE q.task_id = ?
       ORDER BY q.display_order ASC, q.id ASC`,
      [taskId]
    ) as any[]

    let formattedQuestions = []
    
    if (Array.isArray(questions) && questions.length > 0) {
      // Parse JSON options
      formattedQuestions = questions.map(q => ({
        id: q.id.toString(),
        task_id: q.task_id,
        type: q.type || 'multiple-choice',
        question: q.question || '',
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : undefined,
        correctAnswer: q.correctAnswer || '',
        points: q.points || 10,
        displayOrder: q.displayOrder || 0
      }))
    }

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      count: formattedQuestions.length
    })

  } catch (error: any) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch questions', 
        details: error.message,
        questions: [] 
      },
      { status: 200 } // Return 200 with empty array instead of error
    )
  }
}