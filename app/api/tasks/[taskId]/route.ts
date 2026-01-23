// app/api/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        notes: true,
        questions: {
          orderBy: { order_index: 'asc' },
          select: {
            id: true,
            question_text: true,
            question_type: true,
            options: true,
            points: true,
            time_limit_seconds: true,
            hint: true,
            order_index: true
            // Don't include correct_answer for security
          }
        },
        task_sessions: {
          where: { student_id: studentId || '' },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if student has access to this task
    const hasAccess = await prisma.studentTask.findFirst({
      where: {
        task_id: params.taskId,
        student_id: studentId
      }
    })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}