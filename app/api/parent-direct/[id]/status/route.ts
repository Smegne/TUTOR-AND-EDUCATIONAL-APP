// app/api/parent-direct/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n========== PARENT STATUS API CALLED ==========');
  
  try {
    // Get parent ID from params or URL
    let parentId = params?.id;
    
    // If params empty, extract from URL
    if (!parentId) {
      const url = request.url;
      const match = url.match(/\/api\/parent-direct\/([^\/]+)\/status/);
      if (match && match[1]) {
        parentId = match[1];
      }
    }

    console.log('Parent ID:', parentId);

    if (!parentId) {
      return NextResponse.json(
        { error: 'Parent ID is required' },
        { status: 400 }
      );
    }

    // ===========================================
    // STEP 1: Get the parent from users table
    // ===========================================
    const users = await query<any[]>(
      `SELECT * FROM users WHERE id = ? AND role = 'parent'`,
      [parentId]
    );

    if (users.length === 0) {
      console.log('No parent found in users table with ID:', parentId);
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    const parent = users[0];
    console.log('Found parent:', { 
      id: parent.id, 
      email: parent.email,
      firstName: parent.first_name,
      lastName: parent.last_name 
    });

    // ===========================================
    // STEP 2: Get all linked children for this parent
    // ===========================================
    const childLinks = await query<any[]>(
      `SELECT 
        pcl.*,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email as user_email,
        s.id as student_id,
        s.name as student_name,
        s.grade,
        s.courses
       FROM parent_child_links pcl
       LEFT JOIN users u ON u.email = pcl.child_email
       LEFT JOIN students s ON s.user_id = u.id
       WHERE pcl.parent_id = ? AND pcl.status = 'linked'`,
      [parentId]
    );

    console.log(`Found ${childLinks.length} linked children`);

    if (childLinks.length === 0) {
      return NextResponse.json({
        success: true,
        parent: {
          id: parent.id,
          name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim() || 'Parent',
          email: parent.email
        },
        children: [],
        overallStats: {
          avgCompletionRate: 0,
          avgScore: 0,
          totalStudyTime: 0,
          totalTasks: 0,
          completedTasks: 0
        }
      });
    }

    // ===========================================
    // STEP 3: Get statistics for each child
    // ===========================================
    const childrenWithStats = await Promise.all(
      childLinks.map(async (link) => {
        try {
          const studentId = link.student_id;
          
          if (!studentId) {
            return {
              id: link.id,
              name: link.student_name || link.child_email?.split('@')[0] || 'Child',
              grade: link.grade || 0,
              email: link.child_email,
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
            };
          }

          // Get task statistics
          const [taskStats] = await query<any[]>(
            `SELECT 
              COUNT(*) as total_tasks,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
              COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
              AVG(CASE WHEN status = 'completed' THEN score ELSE NULL END) as average_score
             FROM student_tasks
             WHERE student_id = ?`,
            [studentId]
          ).catch(() => [{
            total_tasks: 0,
            completed_tasks: 0,
            pending_tasks: 0,
            average_score: 0
          }]);

          // Calculate completion rate
          const totalTasks = taskStats?.total_tasks || 0;
          const completedTasks = taskStats?.completed_tasks || 0;
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          // Calculate streak (consecutive days with completed tasks)
          const [streakData] = await query<any[]>(
            `SELECT COUNT(DISTINCT DATE(completed_at)) as streak
             FROM student_tasks
             WHERE student_id = ? 
               AND status = 'completed'
               AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
            [studentId]
          ).catch(() => [{ streak: 0 }]);

          // Get study sessions (last 30 days)
          const sessions = await query<any[]>(
            `SELECT 
              id,
              login_time,
              logout_time,
              TIMESTAMPDIFF(MINUTE, login_time, COALESCE(logout_time, NOW())) as duration_minutes,
              device_info,
              ip_address
             FROM study_sessions
             WHERE student_id = ?
               AND login_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             ORDER BY login_time DESC
             LIMIT 20`,
            [studentId]
          ).catch(() => []);

          // Calculate total study time and average session time
          const totalStudyTime = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
          const avgSessionTime = sessions.length > 0 ? Math.round(totalStudyTime / sessions.length) : 0;

          // Calculate weekly study time
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          const weeklySessions = sessions.filter(s => new Date(s.login_time) >= weekAgo);
          const weeklyStudyTime = weeklySessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);

          return {
            id: studentId,
            name: link.student_name || `${link.first_name || ''} ${link.last_name || ''}`.trim() || link.child_email?.split('@')[0] || 'Child',
            grade: link.grade || 0,
            email: link.child_email,
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
              weeklyStudyTime: weeklyStudyTime,
              avgSessionTime: avgSessionTime,
              totalSessions: sessions.length,
              recentSessions: sessions.map(session => ({
                id: session.id,
                login_time: session.login_time,
                logout_time: session.logout_time,
                duration_minutes: session.duration_minutes,
                device_info: session.device_info || 'Unknown Device',
                ip_address: session.ip_address
              }))
            }
          };
        } catch (error) {
          console.warn(`Error fetching stats for child:`, error);
          return {
            id: link.student_id || link.id,
            name: link.student_name || link.child_email?.split('@')[0] || 'Child',
            grade: link.grade || 0,
            email: link.child_email,
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
              weeklyStudyTime: 0,
              avgSessionTime: 0,
              totalSessions: 0,
              recentSessions: []
            }
          };
        }
      })
    );

    // ===========================================
    // STEP 4: Calculate overall statistics
    // ===========================================
    const overallStats = childrenWithStats.reduce(
      (acc, child) => {
        return {
          totalChildren: acc.totalChildren + 1,
          avgCompletionRate: acc.avgCompletionRate + child.stats.completionRate,
          avgScore: acc.avgScore + child.stats.averageScore,
          totalStudyTime: acc.totalStudyTime + child.sessions.totalStudyTime,
          weeklyStudyTime: acc.weeklyStudyTime + (child.sessions.weeklyStudyTime || 0),
          totalTasks: acc.totalTasks + child.stats.totalTasks,
          completedTasks: acc.completedTasks + child.stats.tasksCompleted
        };
      },
      {
        totalChildren: 0,
        avgCompletionRate: 0,
        avgScore: 0,
        totalStudyTime: 0,
        weeklyStudyTime: 0,
        totalTasks: 0,
        completedTasks: 0
      }
    );

    const avgCompletionRate = childrenWithStats.length > 0 
      ? Math.round(overallStats.avgCompletionRate / childrenWithStats.length)
      : 0;
      
    const avgScore = childrenWithStats.length > 0 
      ? Math.round(overallStats.avgScore / childrenWithStats.length)
      : 0;

    console.log('✅ Status API call successful!');
    console.log(`Returning ${childrenWithStats.length} children with stats`);

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim() || 'Parent',
        email: parent.email,
        childrenCount: childrenWithStats.length
      },
      children: childrenWithStats,
      overallStats: {
        avgCompletionRate,
        avgScore,
        totalStudyTime: overallStats.totalStudyTime,
        weeklyStudyTime: overallStats.weeklyStudyTime,
        totalTasks: overallStats.totalTasks,
        completedTasks: overallStats.completedTasks,
        totalChildren: overallStats.totalChildren
      }
    });

  } catch (error) {
    console.error('❌ Error in parent status API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch parent status data',
        message: error instanceof Error ? error.message : 'Unknown error',
        parent: null,
        children: [],
        overallStats: {
          avgCompletionRate: 0,
          avgScore: 0,
          totalStudyTime: 0,
          weeklyStudyTime: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalChildren: 0
        }
      },
      { status: 500 }
    );
  }
}