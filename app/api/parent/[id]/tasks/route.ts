// app/api/parent/[id]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parentId = params.id

    // Get parent profile
    const [parent] = await query<any[]>(
      `SELECT 
        p.*,
        u.email,
        u.first_name,
        u.last_name
       FROM parents p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = ? OR p.user_id = ?`,
      [parentId, parentId]
    )

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }

    // Get parent's children
    const children = await query<any[]>(
      `SELECT 
        s.*,
        u.email,
        u.first_name,
        u.last_name
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.parent_id = ?`,
      [parent.id]
    )

    if (children.length === 0) {
      return NextResponse.json({
        success: true,
        parent: {
          id: parent.id,
          name: parent.name || `${parent.first_name} ${parent.last_name}`,
          email: parent.email
        },
        childrenTasks: []
      })
    }

    // Get tasks for each child that are visible to parents
    const childrenTasks = await Promise.all(
      children.map(async (child) => {
        try {
          const tasks = await query<any[]>(
            `SELECT 
              t.*,
              st.status,
              st.score,
              st.completed_at,
              st.started_at,
              u.first_name as created_by_first_name,
              u.last_name as created_by_last_name
             FROM tasks t
             LEFT JOIN student_tasks st ON t.id = st.task_id AND st.student_id = ?
             LEFT JOIN users u ON t.created_by = u.id
             WHERE st.student_id = ? 
               AND t.parent_visibility = TRUE
             ORDER BY t.created_at DESC`,
            [child.id, child.id]
          )

          return {
            child: {
              id: child.id,
              name: child.name || `${child.first_name} ${child.last_name}`,
              email: child.email,
              grade: child.grade
            },
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              description: task.description,
              subject: task.subject,
              grade_level: task.grade_level,
              difficulty: task.difficulty,
              status: task.status || 'not_started',
              score: task.score,
              completed_at: task.completed_at,
              created_at: task.created_at,
              due_date: task.due_date,
              created_by_name: task.created_by_first_name && task.created_by_last_name 
                ? `${task.created_by_first_name} ${task.created_by_last_name}`
                : 'Unknown Tutor',
              parent_visibility: Boolean(task.parent_visibility)
            }))
          }
        } catch (error) {
          console.warn(`Error fetching tasks for child ${child.id}:`, error)
          return {
            child: {
              id: child.id,
              name: child.name || `${child.first_name} ${child.last_name}`,
              email: child.email,
              grade: child.grade
            },
            tasks: []
          }
        }
      })
    )

    // Calculate summary statistics
    const summary = {
      totalChildren: childrenTasks.length,
      totalTasks: childrenTasks.reduce((sum, child) => sum + child.tasks.length, 0),
      completedTasks: childrenTasks.reduce((sum, child) => 
        sum + child.tasks.filter(t => t.status === 'completed').length, 0
      ),
      pendingTasks: childrenTasks.reduce((sum, child) => 
        sum + child.tasks.filter(t => t.status !== 'completed').length, 0
      ),
      overdueTasks: childrenTasks.reduce((sum, child) => 
        sum + child.tasks.filter(task => {
          if (task.status === 'completed') return false
          if (!task.due_date) return false
          const dueDate = new Date(task.due_date)
          const now = new Date()
          return dueDate < now
        }).length, 0
      ),
      avgScore: (() => {
        const completedTasks = childrenTasks.flatMap(child => 
          child.tasks.filter(t => t.status === 'completed' && t.score)
        )
        if (completedTasks.length === 0) return 0
        return Math.round(
          completedTasks.reduce((sum, task) => sum + (task.score || 0), 0) / completedTasks.length
        )
      })()
    }

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        name: parent.name || `${parent.first_name} ${parent.last_name}`,
        email: parent.email
      },
      childrenTasks,
      summary
    })

  } catch (error) {
    console.error('Error fetching parent tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parent tasks' },
      { status: 500 }
    )
  }
}