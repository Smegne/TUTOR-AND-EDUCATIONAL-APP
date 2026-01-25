// app/api/tutor/[id]/status/route.ts - SIMPLIFIED ROBUST VERSION
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tutorId = params.id

    console.log('Fetching status for tutor:', tutorId)

    // Get tutor profile
    const [tutor] = await query<any[]>(
      `SELECT 
        t.*,
        u.first_name,
        u.last_name,
        u.email
       FROM tutors t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ? OR t.user_id = ?`,
      [tutorId, tutorId]
    )

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    console.log('Found tutor:', tutor.name)

    // 1. Get overall statistics using tutor_students table
    // Total students assigned to this tutor
    const [studentCountResult] = await query<any[]>(
      `SELECT COUNT(DISTINCT ts.student_id) as total_students
       FROM tutor_students ts
       WHERE ts.tutor_id = ?`,
      [tutor.id]
    ).catch(() => {
      console.warn('Error fetching student count, using fallback')
      return [{ total_students: 0 }]
    })

    // Total tasks created by tutor
    const [taskCountResult] = await query<any[]>(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
       FROM tasks t
       WHERE t.created_by = ?`,
      [tutor.id]
    ).catch(() => {
      console.warn('Error fetching task count, using fallback')
      return [{ total_tasks: 0, completed_tasks: 0 }]
    })

    // Overall completion rate and average score for students assigned to this tutor
    const [performanceResult] = await query<any[]>(
      `SELECT 
        COALESCE(ROUND(AVG(CASE WHEN st.status = 'completed' THEN 100 ELSE 0 END), 0), 0) as overall_completion,
        COALESCE(ROUND(AVG(st.score), 0), 0) as average_score
       FROM student_tasks st
       JOIN tasks t ON st.task_id = t.id
       JOIN tutor_students ts ON st.student_id = ts.student_id
       WHERE t.created_by = ? AND ts.tutor_id = ?`,
      [tutor.id, tutor.id]
    ).catch(() => {
      console.warn('Error fetching performance data, using fallback')
      return [{ overall_completion: 0, average_score: 0 }]
    })

    const stats = {
      totalStudents: studentCountResult?.total_students || 0,
      totalTasks: taskCountResult?.total_tasks || 0,
      tasksCompleted: taskCountResult?.completed_tasks || 0,
      overallCompletion: performanceResult?.overall_completion || 0,
      averageScore: performanceResult?.average_score || 0,
      totalCourses: 0 // We'll calculate this separately
    }

    console.log('Stats calculated:', stats)

    // 2. Get top performers from students assigned to this tutor
    const topPerformers = await query<any[]>(
      `SELECT 
        s.id,
        s.name,
        s.grade,
        s.user_id,
        COUNT(st.task_id) as total_tasks,
        COUNT(CASE WHEN st.status = 'completed' THEN st.task_id END) as completed_tasks,
        COALESCE(ROUND(AVG(CASE WHEN st.status = 'completed' THEN st.score ELSE NULL END), 0), 0) as average_score
       FROM students s
       JOIN student_tasks st ON s.id = st.student_id
       JOIN tasks t ON st.task_id = t.id
       JOIN tutor_students ts ON s.id = ts.student_id
       WHERE t.created_by = ? AND ts.tutor_id = ?
       GROUP BY s.id
       HAVING total_tasks > 0
       ORDER BY average_score DESC
       LIMIT 10`,
      [tutor.id, tutor.id]
    ).catch((error) => {
      console.warn('Error fetching top performers:', error)
      return []
    })

    const formattedTopPerformers = topPerformers.map(student => ({
      id: student.id,
      name: student.name,
      grade: student.grade,
      userId: student.user_id,
      averageScore: student.average_score || 0,
      completionRate: student.total_tasks > 0 
        ? Math.round((student.completed_tasks / student.total_tasks) * 100)
        : 0,
      totalTasks: student.total_tasks,
      completedTasks: student.completed_tasks
    }))

    console.log('Top performers:', formattedTopPerformers.length)

    // 3. Get course statistics from tasks created by this tutor
    const courseStatsRaw = await query<any[]>(
      `SELECT 
        t.subject as course_id,
        COUNT(DISTINCT st.student_id) as total_students,
        COUNT(DISTINCT t.id) as total_tasks,
        COALESCE(ROUND(AVG(CASE WHEN st.status = 'completed' THEN 100 ELSE 0 END), 0), 0) as completion_rate
       FROM tasks t
       LEFT JOIN student_tasks st ON t.id = st.task_id
       WHERE t.created_by = ? AND t.subject IS NOT NULL AND t.subject != ''
       GROUP BY t.subject
       ORDER BY total_tasks DESC
       LIMIT 10`,
      [tutor.id]
    ).catch((error) => {
      console.warn('Error fetching course stats:', error)
      return []
    })

    const courseStats = courseStatsRaw.map(course => {
      // Helper functions to format course info
      const getCourseName = (courseId: string): string => {
        const courseMap: Record<string, string> = {
          'math': 'Mathematics',
          'english': 'English',
          'amharic': 'Amharic',
          'general_science': 'General Science',
          'social_science': 'Social Science',
          'citizenship': 'Citizenship',
          'pva': 'PVA (Physical & Vocational Arts)',
          'hpe': 'HPE (Health & Physical Ed)',
          'it': 'IT (Information Technology)',
          'ሂሳብ': 'Mathematics',
          'እንግሊዝኛ': 'English',
          'አማርኛ': 'Amharic',
          'አካባቢ_ሳይንስ': 'Environmental Science',
          'ስነምግባር': 'Citizenship',
          'ስነጥበብ': 'Arts',
          'ስፖርት': 'Sports',
          'history': 'History',
          'science': 'Science',
          'biology': 'Biology',
          'physics': 'Physics'
        }

        // Remove grade suffix if present
        let baseCourse = courseId
        if (courseId.includes('_g')) {
          baseCourse = courseId.split('_g')[0]
        } else if (courseId.includes('_')) {
          baseCourse = courseId.split('_')[0]
        }
        
        return courseMap[baseCourse] || baseCourse.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      }

      const getCourseCode = (courseId: string): string => {
        const courseCodeMap: Record<string, string> = {
          'math': 'MATH',
          'english': 'ENG',
          'amharic': 'AMH',
          'general_science': 'SCI',
          'social_science': 'SOC',
          'citizenship': 'CIT',
          'pva': 'PVA',
          'hpe': 'HPE',
          'it': 'IT',
          'ሂሳብ': 'MATH',
          'እንግሊዝኛ': 'ENG',
          'አማርኛ': 'AMH',
          'አካባቢ_ሳይንስ': 'SCI',
          'ስነምግባር': 'CIT',
          'ስነጥበብ': 'ART',
          'ስፖርት': 'SPT',
          'history': 'HIS',
          'science': 'SCI',
          'biology': 'BIO',
          'physics': 'PHY'
        }

        const gradeMatch = courseId.match(/g(\d+)$/)
        const grade = gradeMatch ? gradeMatch[1] : '5'
        
        let baseCourse = courseId
        if (courseId.includes('_g')) {
          baseCourse = courseId.split('_g')[0]
        } else if (courseId.includes('_')) {
          baseCourse = courseId.split('_')[0]
        }
        
        const codePrefix = courseCodeMap[baseCourse] || baseCourse.substring(0, 3).toUpperCase()
        
        return `${codePrefix}-G${grade}`
      }

      const extractGradeFromCourseId = (courseId: string): number => {
        const gradeMatch = courseId.match(/g(\d+)$/)
        return gradeMatch ? parseInt(gradeMatch[1]) : 5
      }

      return {
        id: course.course_id,
        name: getCourseName(course.course_id),
        code: getCourseCode(course.course_id),
        grade: extractGradeFromCourseId(course.course_id),
        totalStudents: course.total_students || 0,
        totalTasks: course.total_tasks || 0,
        completionRate: course.completion_rate || 0
      }
    })

    // Update total courses in stats
    stats.totalCourses = courseStats.length

    console.log('Course stats:', courseStats.length)

    // 4. Get student activity
    const studentActivity = await query<any[]>(
      `SELECT 
        s.id,
        s.name,
        s.grade,
        s.user_id,
        COUNT(DISTINCT ss.id) as sessions,
        COALESCE(SUM(ss.duration), 0) as total_time,
        ROUND(COALESCE(AVG(ss.duration), 0), 0) as avg_session_time,
        MAX(ss.login_time) as last_login,
        MAX(ss.device_info) as device_info,
        CASE 
          WHEN MAX(ss.logout_time) IS NULL AND MAX(ss.login_time) > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1
          ELSE 0 
        END as is_online
       FROM students s
       JOIN tutor_students ts ON s.id = ts.student_id
       LEFT JOIN student_sessions ss ON s.id = ss.student_id
       WHERE ts.tutor_id = ?
         AND (ss.login_time IS NULL OR ss.login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY))
       GROUP BY s.id
       ORDER BY last_login DESC
       LIMIT 20`,
      [tutor.id]
    ).catch((error) => {
      console.warn('Error fetching student activity:', error)
      return []
    })

    const formattedStudentActivity = studentActivity.map(student => ({
      id: student.id,
      name: student.name,
      grade: student.grade,
      userId: student.user_id,
      sessions: student.sessions || 0,
      totalTime: student.total_time || 0,
      avgSessionTime: student.avg_session_time || 0,
      lastLogin: student.last_login ? new Date(student.last_login).toISOString() : new Date().toISOString(),
      deviceInfo: student.device_info || 'Unknown device',
      isOnline: Boolean(student.is_online)
    }))

    console.log('Student activity:', formattedStudentActivity.length)

    return NextResponse.json({
      success: true,
      tutor: {
        id: tutor.id,
        name: tutor.name || `${tutor.first_name} ${tutor.last_name}`,
        email: tutor.email
      },
      stats,
      topPerformers: formattedTopPerformers,
      courseStats,
      studentActivity: formattedStudentActivity
    })

  } catch (error) {
    console.error('Error fetching tutor status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tutor status', details: String(error) },
      { status: 500 }
    )
  }
}