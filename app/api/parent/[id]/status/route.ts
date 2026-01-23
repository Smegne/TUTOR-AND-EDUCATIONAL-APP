// app/api/parent/[id]/status/route.ts
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
        u.first_name,
        u.last_name,
        u.email
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
        u.email as student_email
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
        children: []
      })
    }

    // Get statistics for each child
    const childrenWithStats = await Promise.all(
      children.map(async (child) => {
        try {
          // Get task statistics
          const [taskStats] = await query<any[]>(
            `SELECT 
              COUNT(*) as total_tasks,
              COUNT(CASE WHEN st.status = 'completed' THEN 1 END) as completed_tasks,
              COUNT(CASE WHEN st.status = 'not_started' THEN 1 END) as pending_tasks,
              AVG(CASE WHEN st.status = 'completed' THEN st.score ELSE NULL END) as average_score
             FROM student_tasks st
             WHERE st.student_id = ?`,
            [child.id]
          ).catch(() => [{
            total_tasks: 0,
            completed_tasks: 0,
            pending_tasks: 0,
            average_score: 0
          }])

          // Calculate completion rate
          const totalTasks = taskStats?.total_tasks || 0
          const completedTasks = taskStats?.completed_tasks || 0
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          // Calculate streak (last 7 days of completed tasks)
          const [streakData] = await query<any[]>(
            `SELECT COUNT(DISTINCT DATE(st.completed_at)) as streak
             FROM student_tasks st
             WHERE st.student_id = ? 
               AND st.status = 'completed'
               AND st.completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [child.id]
          ).catch(() => [{ streak: 0 }])

          // Get study sessions (last 7 days)
          const sessions = await query<any[]>(
            `SELECT 
              id,
              login_time,
              logout_time,
              TIMESTAMPDIFF(MINUTE, login_time, COALESCE(logout_time, NOW())) as duration_minutes,
              device_info
             FROM study_sessions
             WHERE student_id = ?
               AND login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             ORDER BY login_time DESC
             LIMIT 10`,
            [child.id]
          ).catch(() => [])

          // Calculate total study time and average session time
          const totalStudyTime = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0)
          const avgSessionTime = sessions.length > 0 ? Math.round(totalStudyTime / sessions.length) : 0

          return {
            id: child.id,
            name: child.name,
            grade: child.grade || 5,
            email: child.student_email,
            stats: {
              completionRate: completionRate,
              averageScore: Math.round(taskStats?.average_score || 0),
              tasksCompleted: completedTasks,
              tasksPending: taskStats?.pending_tasks || 0,
              streak: streakData?.streak || 0,
              totalTasks: totalTasks
            },
            sessions: {
              totalStudyTime: totalStudyTime,
              avgSessionTime: avgSessionTime,
              totalSessions: sessions.length,
              recentSessions: sessions.map(session => ({
                id: session.id,
                login_time: session.login_time,
                logout_time: session.logout_time,
                duration_minutes: session.duration_minutes,
                device_info: session.device_info
              }))
            }
          }
        } catch (error) {
          console.warn(`Error fetching stats for child ${child.id}:`, error)
          return {
            id: child.id,
            name: child.name,
            grade: child.grade || 5,
            email: child.student_email,
            stats: {
              completionRate: 0,
              averageScore: 0,
              tasksCompleted: 0,
              tasksPending: 0,
              streak: 0,
              totalTasks: 0
            },
            sessions: {
              totalStudyTime: 0,
              avgSessionTime: 0,
              totalSessions: 0,
              recentSessions: []
            }
          }
        }
      })
    )

    // Calculate overall statistics for parent
    const overallStats = childrenWithStats.reduce(
      (acc, child) => {
        return {
          totalChildren: acc.totalChildren + 1,
          avgCompletionRate: acc.avgCompletionRate + child.stats.completionRate,
          avgScore: acc.avgScore + child.stats.averageScore,
          totalStudyTime: acc.totalStudyTime + child.sessions.totalStudyTime,
          totalTasks: acc.totalTasks + child.stats.totalTasks,
          completedTasks: acc.completedTasks + child.stats.tasksCompleted
        }
      },
      {
        totalChildren: 0,
        avgCompletionRate: 0,
        avgScore: 0,
        totalStudyTime: 0,
        totalTasks: 0,
        completedTasks: 0
      }
    )

    const avgCompletionRate = childrenWithStats.length > 0 
      ? Math.round(overallStats.avgCompletionRate / childrenWithStats.length)
      : 0
    const avgScore = childrenWithStats.length > 0 
      ? Math.round(overallStats.avgScore / childrenWithStats.length)
      : 0

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        name: parent.name || `${parent.first_name} ${parent.last_name}`,
        email: parent.email,
        childrenCount: children.length
      },
      children: childrenWithStats,
      overallStats: {
        avgCompletionRate,
        avgScore,
        totalStudyTime: overallStats.totalStudyTime,
        totalTasks: overallStats.totalTasks,
        completedTasks: overallStats.completedTasks
      }
    })

  } catch (error) {
    console.error('Error fetching parent status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parent status' },
      { status: 500 }
    )
  }
}