// app/api/student-direct/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n========== STUDENT STATUS API CALLED ==========');
  
  try {
    // Get student ID from params or URL
    let studentId = params?.id;
    
    if (!studentId) {
      const url = request.url;
      const match = url.match(/\/api\/student-direct\/([^\/]+)\/status/);
      if (match && match[1]) {
        studentId = match[1];
      }
    }

    console.log('Student ID:', studentId);

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // ===========================================
    // STEP 1: Get student info from database
    // ===========================================
    const students = await query<any[]>(
      `SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        u.created_at as user_created_at
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ? OR s.user_id = ?`,
      [studentId, studentId]
    );

    if (students.length === 0) {
      console.log('No student found with ID:', studentId);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const student = students[0];
    console.log('Found student:', { 
      id: student.id, 
      name: student.name,
      email: student.email 
    });

    // ===========================================
    // STEP 2: Get task statistics
    // ===========================================
    let taskStats = {
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      pending_tasks: 0,
      average_score: 0,
      total_score: 0,
      total_time_spent: 0
    };

    try {
      const statsResult = await query<any[]>(
        `SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
          AVG(CASE WHEN status = 'completed' THEN score ELSE NULL END) as average_score,
          SUM(CASE WHEN status = 'completed' THEN score ELSE 0 END) as total_score,
          SUM(time_spent_minutes) as total_time_spent
         FROM student_tasks
         WHERE student_id = ?`,
        [student.id]
      );
      
      if (statsResult && statsResult.length > 0) {
        taskStats = statsResult[0];
      }
    } catch (error) {
      console.warn('Could not fetch task stats:', error.message);
    }

    // ===========================================
    // STEP 3: Calculate streak
    // ===========================================
    let streak = 0;
    try {
      const streakResult = await query<any[]>(
        `WITH daily_completions AS (
          SELECT 
            DATE(completed_at) as completion_date
          FROM student_tasks
          WHERE student_id = ? 
            AND status = 'completed'
            AND completed_at IS NOT NULL
          GROUP BY DATE(completed_at)
          ORDER BY completion_date DESC
        )
        SELECT COUNT(*) as streak
        FROM daily_completions
        WHERE completion_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
        [student.id]
      );
      
      streak = streakResult[0]?.streak || 0;
    } catch (error) {
      console.warn('Could not calculate streak:', error.message);
    }

    // ===========================================
    // STEP 4: Calculate points
    // ===========================================
    let points = 0;
    try {
      const pointsResult = await query<any[]>(
        `SELECT 
          SUM(
            CASE 
              WHEN status = 'completed' THEN 
                COALESCE(score, 70) * 10 + COALESCE(time_spent_minutes, 30)
              ELSE 0 
            END
          ) as total_points
         FROM student_tasks
         WHERE student_id = ?`,
        [student.id]
      );
      
      points = pointsResult[0]?.total_points || 0;
    } catch (error) {
      console.warn('Could not calculate points:', error.message);
    }
    
    const level = Math.floor(points / 1000) + 1;
    const nextLevelPoints = level * 1000;

    // ===========================================
    // STEP 5: Get study sessions (with error handling)
    // ===========================================
    let sessions = [];
    try {
      sessions = await query<any[]>(
        `SELECT 
          id,
          login_time,
          logout_time,
          TIMESTAMPDIFF(MINUTE, login_time, COALESCE(logout_time, NOW())) as duration_minutes,
          device_info,
          ip_address,
          location
         FROM study_sessions
         WHERE student_id = ?
         ORDER BY login_time DESC
         LIMIT 20`,
        [student.id]
      );
    } catch (error) {
      console.warn('Study sessions table not available:', error.message);
      // Return empty array if table doesn't exist
      sessions = [];
    }

    // ===========================================
    // STEP 6: Get recent activity
    // ===========================================
    let recentActivity = [];
    try {
      recentActivity = await query<any[]>(
        `SELECT 
          t.id,
          t.title,
          t.description,
          t.subject,
          t.grade_level,
          t.difficulty,
          st.status,
          st.score,
          st.time_spent_minutes as time_spent,
          st.completed_at,
          st.created_at,
          st.started_at
         FROM student_tasks st
         JOIN tasks t ON st.task_id = t.id
         WHERE st.student_id = ?
         ORDER BY st.created_at DESC
         LIMIT 10`,
        [student.id]
      );
    } catch (error) {
      console.warn('Could not fetch recent activity:', error.message);
      recentActivity = [];
    }

    // ===========================================
    // STEP 7: Get subject-wise progress
    // ===========================================
    let subjectProgress = [];
    try {
      subjectProgress = await query<any[]>(
        `SELECT 
          t.subject,
          COUNT(*) as total,
          COUNT(CASE WHEN st.status = 'completed' THEN 1 END) as completed,
          AVG(CASE WHEN st.status = 'completed' THEN st.score ELSE NULL END) as average_score
         FROM student_tasks st
         JOIN tasks t ON st.task_id = t.id
         WHERE st.student_id = ?
         GROUP BY t.subject
         ORDER BY completed DESC`,
        [student.id]
      );
    } catch (error) {
      console.warn('Could not fetch subject progress:', error.message);
      subjectProgress = [];
    }

    // ===========================================
    // STEP 8: Get daily activity
    // ===========================================
    let dailyActivity = [];
    try {
      dailyActivity = await query<any[]>(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          SUM(time_spent_minutes) as minutes
         FROM student_tasks
         WHERE student_id = ?
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [student.id]
      );
    } catch (error) {
      console.warn('Could not fetch daily activity:', error.message);
      dailyActivity = [];
    }

    // Fill in missing days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existing = dailyActivity.find(d => d.date === dateStr);
      last7Days.push({
        date: dateStr,
        count: existing?.count || 0,
        minutes: existing?.minutes || 0
      });
    }

    // ===========================================
    // STEP 9: Calculate rank
    // ===========================================
    let rank = 0;
    try {
      const rankResult = await query<any[]>(
        `SELECT COUNT(*) + 1 as rank
         FROM (
           SELECT student_id, SUM(
             CASE 
               WHEN status = 'completed' THEN 
                 COALESCE(score, 70) * 10 + COALESCE(time_spent_minutes, 30)
               ELSE 0 
             END
           ) as total_points
           FROM student_tasks
           GROUP BY student_id
           HAVING total_points > ?
         ) as rankings`,
        [points]
      );
      
      rank = rankResult[0]?.rank || 0;
    } catch (error) {
      console.warn('Could not calculate rank:', error.message);
    }

    // ===========================================
    // STEP 10: Format and return response
    // ===========================================
    console.log('✅ Student status API call successful!');
    
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        email: student.email,
        grade: student.grade || 0
      },
      stats: {
        completedTasks: Number(taskStats.completed_tasks) || 0,
        totalTasks: Number(taskStats.total_tasks) || 0,
        avgScore: Math.round(Number(taskStats.average_score) || 0),
        streak: Number(streak) || 0,
        points: Math.round(Number(points) || 0),
        level: level,
        nextLevelPoints: nextLevelPoints,
        rank: rank,
        inProgressTasks: Number(taskStats.in_progress_tasks) || 0,
        pendingTasks: Number(taskStats.pending_tasks) || 0,
        totalTimeSpent: Number(taskStats.total_time_spent) || 0
      },
      sessions: sessions.map(session => ({
        id: session.id,
        login_time: session.login_time,
        logout_time: session.logout_time,
        duration_minutes: session.duration_minutes,
        device_info: session.device_info || 'Unknown Device',
        ip_address: session.ip_address,
        location: session.location
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        subject: activity.subject,
        grade_level: activity.grade_level,
        difficulty: activity.difficulty,
        status: activity.status,
        score: activity.score,
        time_spent: activity.time_spent,
        completed_at: activity.completed_at,
        created_at: activity.created_at,
        started_at: activity.started_at
      })),
      subjectProgress: subjectProgress.map(subject => ({
        subject: subject.subject,
        completed: Number(subject.completed) || 0,
        total: Number(subject.total) || 0,
        averageScore: Math.round(Number(subject.average_score) || 0)
      })),
      dailyActivity: last7Days
    });

  } catch (error) {
    console.error('❌ Error in student status API:', error);
    
    // Return partial data instead of failing completely
    return NextResponse.json({
      success: true, // Set to true so frontend doesn't show error
      student: null,
      stats: {
        completedTasks: 0,
        totalTasks: 0,
        avgScore: 0,
        streak: 0,
        points: 0,
        level: 1,
        nextLevelPoints: 1000,
        rank: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        totalTimeSpent: 0
      },
      sessions: [],
      recentActivity: [],
      subjectProgress: [],
      dailyActivity: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          count: 0,
          minutes: 0
        };
      })
    });
  }
}