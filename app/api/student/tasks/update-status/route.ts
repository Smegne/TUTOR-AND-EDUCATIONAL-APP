// app/api/student/tasks/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, studentId, status, startedAt } = body

    console.log(`📝 Updating task ${taskId} status for student ${studentId} to ${status}`)

    if (!taskId || !studentId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if student_task record exists
    const existingRecord = await query(
      'SELECT id FROM student_tasks WHERE task_id = ? AND student_id = ?',
      [taskId, studentId]
    ) as any[]

    if (Array.isArray(existingRecord) && existingRecord.length > 0) {
      // Update existing record
      await query(
        `UPDATE student_tasks 
         SET status = ?, 
             started_at = COALESCE(?, started_at),
             updated_at = CURRENT_TIMESTAMP
         WHERE task_id = ? AND student_id = ?`,
        [status, startedAt, taskId, studentId]
      )
    } else {
      // Create new record
      await query(
        `INSERT INTO student_tasks 
         (task_id, student_id, status, started_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [taskId, studentId, status, startedAt]
      )
    }

    // Also update main task status if needed
    if (status === 'in_progress' || status === 'completed') {
      await query(
        'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, taskId]
      )
    }

    return NextResponse.json({
      success: true,
      message: `Task status updated to ${status}`,
      data: { taskId, studentId, status }
    })

  } catch (error: any) {
    console.error('Error updating task status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task status', details: error.message },
      { status: 500 }
    )
  }
}