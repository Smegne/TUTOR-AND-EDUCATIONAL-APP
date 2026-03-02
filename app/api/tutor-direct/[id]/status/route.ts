// app/api/tutor-direct/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n========== TUTOR STATUS API CALLED ==========');
  
  try {
    // Get tutor ID from params or URL
    let tutorId = params?.id;
    
    if (!tutorId) {
      const url = request.url;
      const match = url.match(/\/api\/tutor-direct\/([^\/]+)\/status/);
      if (match && match[1]) {
        tutorId = match[1];
      }
    }

    console.log('Tutor ID:', tutorId);

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    // ===========================================
    // STEP 1: Get tutor info
    // ===========================================
    const tutors = await query<any[]>(
      `SELECT 
        t.*,
        u.first_name,
        u.last_name,
        u.email
       FROM tutors t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ? OR t.user_id = ?`,
      [tutorId, tutorId]
    );

    let tutor;
    if (tutors.length === 0) {
      console.log('No tutor found with ID:', tutorId);
      
      // Try to find in users table as fallback
      const users = await query<any[]>(
        `SELECT * FROM users WHERE id = ? AND role = 'tutor'`,
        [tutorId]
      );
      
      if (users.length === 0) {
        return NextResponse.json(
          { error: 'Tutor not found' },
          { status: 404 }
        );
      }
      
      const user = users[0];
      tutor = {
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email,
        user_id: user.id
      };
    } else {
      tutor = tutors[0];
    }

    console.log('Found tutor:', { 
      id: tutor.id, 
      name: tutor.name,
      email: tutor.email 
    });

    // ===========================================
    // STEP 2: Get all courses assigned to this tutor
    // ===========================================
    let tutorCourses = [];
    let courseIds: string[] = [];
    
    try {
      tutorCourses = await query<any[]>(
        `SELECT 
          tc.course_id,
          c.id as course_id,
          c.name as course_name,
          c.subject,
          c.grade_level,
          c.description
         FROM tutor_courses tc
         JOIN courses c ON tc.course_id = c.id
         WHERE tc.tutor_id = ?`,
        [tutor.id]
      );
      
      courseIds = tutorCourses.map(c => c.course_id);
      console.log(`Found ${tutorCourses.length} courses for tutor`);
    } catch (error) {
      console.log('tutor_courses table might not exist:', error.message);
      tutorCourses = [];
    }

    // ===========================================
    // STEP 3: Get all students enrolled in tutor's courses
    // ===========================================
    let students: any[] = [];
    let studentIds: string[] = [];
    
    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      
      try {
        students = await query<any[]>(
          `SELECT DISTINCT 
            s.id,
            s.name,
            s.grade,
            u.email,
            u.first_name,
            u.last_name
           FROM student_courses sc
           JOIN students s ON sc.student_id = s.id
           LEFT JOIN users u ON s.user_id = u.id
           WHERE sc.course_id IN (${placeholders})`,
          courseIds
        );
        
        studentIds = students.map(s => s.id);
        console.log(`Found ${students.length} students enrolled in courses`);
      } catch (error) {
        console.log('student_courses table might not exist:', error.message);
      }
    }

    // ===========================================
    // STEP 4: Get task statistics
    // ===========================================
    let totalTasks = 0;
    let completedTasks = 0;
    let totalScore = 0;
    let tasksWithScore = 0;
    
    if (studentIds.length > 0) {
      const studentPlaceholders = studentIds.map(() => '?').join(',');
      
      try {
        const taskStats = await query<any[]>(
          `SELECT 
            COUNT(*) as total_tasks,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN status = 'completed' THEN score ELSE 0 END) as total_score,
            COUNT(CASE WHEN status = 'completed' AND score IS NOT NULL THEN 1 END) as tasks_with_score
           FROM student_tasks
           WHERE student_id IN (${studentPlaceholders})`,
          studentIds
        );
        
        if (taskStats.length > 0) {
          totalTasks = Number(taskStats[0].total_tasks) || 0;
          completedTasks = Number(taskStats[0].completed_tasks) || 0;
          totalScore = Number(taskStats[0].total_score) || 0;
          tasksWithScore = Number(taskStats[0].tasks_with_score) || 0;
        }
      } catch (error) {
        console.log('student_tasks table might not exist:', error.message);
      }
    }

    // ===========================================
    // STEP 5: Calculate course-wise statistics
    // ===========================================
    const courseStats = await Promise.all(tutorCourses.map(async (course) => {
      let courseStudents: any[] = [];
      let courseTaskStats = { total: 0, completed: 0 };
      
      try {
        // Get students in this course
        courseStudents = await query<any[]>(
          `SELECT student_id FROM student_courses WHERE course_id = ?`,
          [course.course_id]
        );
        
        const courseStudentIds = courseStudents.map(s => s.student_id);
        
        if (courseStudentIds.length > 0) {
          const studentPlaceholders = courseStudentIds.map(() => '?').join(',');
          
          const stats = await query<any[]>(
            `SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
             FROM student_tasks
             WHERE student_id IN (${studentPlaceholders})`,
            courseStudentIds
          );
          
          if (stats.length > 0) {
            courseTaskStats = {
              total: Number(stats[0].total) || 0,
              completed: Number(stats[0].completed) || 0
            };
          }
        }
      } catch (error) {
        console.log('Error fetching course stats:', error.message);
      }
      
      const completionRate = courseTaskStats.total > 0 
        ? Math.round((courseTaskStats.completed / courseTaskStats.total) * 100)
        : 0;
      
      return {
        id: course.course_id,
        name: course.course_name || course.subject || 'Course',
        code: generateCourseCode(course.course_name || course.subject, course.grade_level || 5),
        grade: course.grade_level || 5,
        totalStudents: courseStudents.length,
        totalTasks: courseTaskStats.total,
        completionRate
      };
    }));

    // ===========================================
    // STEP 6: Calculate top performers
    // ===========================================
    const topPerformers = await Promise.all(students.slice(0, 5).map(async (student) => {
      let studentTaskStats = { total: 0, completed: 0, avgScore: 0 };
      
      try {
        const stats = await query<any[]>(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            AVG(CASE WHEN status = 'completed' THEN score ELSE NULL END) as avg_score
           FROM student_tasks
           WHERE student_id = ?`,
          [student.id]
        );
        
        if (stats.length > 0) {
          studentTaskStats = {
            total: Number(stats[0].total) || 0,
            completed: Number(stats[0].completed) || 0,
            avgScore: Math.round(Number(stats[0].avg_score) || 0)
          };
        }
      } catch (error) {
        console.log('Error fetching student stats:', error.message);
      }
      
      const completionRate = studentTaskStats.total > 0 
        ? Math.round((studentTaskStats.completed / studentTaskStats.total) * 100)
        : 0;
      
      return {
        id: student.id,
        name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student',
        email: student.email,
        grade: student.grade || 0,
        averageScore: studentTaskStats.avgScore,
        completionRate,
        totalTasks: studentTaskStats.total,
        completedTasks: studentTaskStats.completed
      };
    }));

    // Sort by average score and get top 3
    const sortedTopPerformers = topPerformers
      .filter(s => s.totalTasks > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3);

    // ===========================================
    // STEP 7: Get student activity (study sessions)
    // ===========================================
    let studentActivity: any[] = [];
    
    if (studentIds.length > 0) {
      const studentPlaceholders = studentIds.map(() => '?').join(',');
      
      try {
        // Get study sessions for last 7 days
        const sessions = await query<any[]>(
          `SELECT 
            ss.student_id,
            COUNT(*) as session_count,
            SUM(TIMESTAMPDIFF(MINUTE, ss.login_time, COALESCE(ss.logout_time, NOW()))) as total_time,
            AVG(TIMESTAMPDIFF(MINUTE, ss.login_time, COALESCE(ss.logout_time, NOW()))) as avg_session_time,
            MAX(ss.login_time) as last_login,
            MAX(ss.device_info) as device_info
           FROM study_sessions ss
           WHERE ss.student_id IN (${studentPlaceholders})
             AND ss.login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
           GROUP BY ss.student_id`,
          studentIds
        );
        
        // Create a map of session data
        const sessionMap = new Map();
        sessions.forEach(s => {
          sessionMap.set(s.student_id, {
            sessions: Number(s.session_count) || 0,
            totalTime: Number(s.total_time) || 0,
            avgSessionTime: Math.round(Number(s.avg_session_time) || 0),
            lastLogin: s.last_login,
            deviceInfo: s.device_info
          });
        });
        
        // Combine with student info
        studentActivity = students.map(student => {
          const sessionData = sessionMap.get(student.id) || {
            sessions: 0,
            totalTime: 0,
            avgSessionTime: 0,
            lastLogin: null,
            deviceInfo: null
          };
          
          // Check if online (active in last 15 minutes)
          const isOnline = sessionData.lastLogin 
            ? (new Date().getTime() - new Date(sessionData.lastLogin).getTime()) < 15 * 60 * 1000
            : false;
          
          return {
            id: student.id,
            name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student',
            email: student.email,
            grade: student.grade || 0,
            sessions: sessionData.sessions,
            totalTime: sessionData.totalTime,
            avgSessionTime: sessionData.avgSessionTime,
            lastLogin: sessionData.lastLogin || new Date(0).toISOString(),
            deviceInfo: sessionData.deviceInfo || 'Unknown device',
            isOnline
          };
        });
      } catch (error) {
        console.log('study_sessions table might not exist:', error.message);
        studentActivity = [];
      }
    }

    // ===========================================
    // STEP 8: Calculate overall statistics
    // ===========================================
    const overallCompletion = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;
    
    const averageScore = tasksWithScore > 0 
      ? Math.round(totalScore / tasksWithScore)
      : 0;

    const stats = {
      totalStudents: students.length,
      totalTasks,
      tasksCompleted: completedTasks,
      overallCompletion,
      averageScore,
      totalCourses: tutorCourses.length
    };

    console.log('✅ Tutor status API call successful!');
    console.log('Stats:', stats);

    return NextResponse.json({
      success: true,
      tutor: {
        id: tutor.id,
        name: tutor.name || `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim(),
        email: tutor.email
      },
      stats,
      topPerformers: sortedTopPerformers,
      courseStats,
      studentActivity: studentActivity.slice(0, 5) // Limit to 5 for display
    });

  } catch (error) {
    console.error('❌ Error in tutor status API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch tutor status data',
        message: error instanceof Error ? error.message : 'Unknown error',
        tutor: null,
        stats: {
          totalStudents: 0,
          totalTasks: 0,
          tasksCompleted: 0,
          overallCompletion: 0,
          averageScore: 0,
          totalCourses: 0
        },
        topPerformers: [],
        courseStats: [],
        studentActivity: []
      },
      { status: 500 }
    );
  }
}

// Helper function to generate course code
function generateCourseCode(name: string, grade: number): string {
  if (!name) return `CRS-G${grade}`;
  
  const firstWord = name.split(' ')[0];
  const prefix = firstWord.substring(0, 3).toUpperCase();
  return `${prefix}-G${grade}`;
}