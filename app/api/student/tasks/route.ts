// app/api/student/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const includeProgress = searchParams.get('includeProgress') === 'true'

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    // Fetch student's assigned tasks
    const studentTasks = await prisma.studentTask.findMany({
      where: { student_id: studentId },
      include: {
        task: {
          include: {
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            questions: {
              select: {
                id: true,
                question_text: true,
                question_type: true,
                points: true
              }
            },
            attachments: {
              select: {
                id: true,
                file_url: true,
                file_name: true
              }
            },
            taskSessions: {
              where: { student_id: studentId },
              orderBy: { created_at: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    // Transform data
    const tasks = studentTasks.map(st => {
      const task = st.task
      const latestSession = task.taskSessions[0]
      
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        subject: task.subject,
        subject_code: task.subject_code,
        grade_level: task.grade_level,
        difficulty: task.difficulty_level,
        estimated_time_minutes: task.estimated_time_minutes,
        due_date: task.due_date,
        note_content: task.note_content,
        video_link: task.video_link,
        parent_visibility: task.parent_visibility,
        created_at: task.created_at,
        updated_at: task.updated_at,
        created_by: task.created_by,
        tutor_name: task.createdBy ? 
          `${task.createdBy.firstName} ${task.createdBy.lastName}` : 
          'Tutor',
        status: st.status,
        score: st.score,
        time_spent: st.time_spent,
        completed_at: st.completed_at,
        started_at: st.started_at,
        last_accessed: latestSession?.last_activity,
        questions: task.questions,
        attachments: task.attachments.map(a => a.file_url),
        question_count: task.questions.length,
        task_session: latestSession ? {
          current_question_index: latestSession.current_question_index,
          answers: latestSession.answers,
          start_time: latestSession.start_time
        } : undefined
      }
    })

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
      studentId
    })
  } catch (error) {
    console.error('Error fetching student tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}