// app/api/tutor/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tutorId = params.id

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

    // Parse tutor courses
    const parseCourses = (courses: any): string[] => {
      if (!courses) return []
      try {
        if (Array.isArray(courses)) return courses
        if (typeof courses === 'string') {
          if (courses.startsWith('[')) {
            const parsed = JSON.parse(courses)
            return Array.isArray(parsed) ? parsed : []
          }
          return courses.split(',').map(c => c.trim()).filter(c => c)
        }
        return []
      } catch (error) {
        console.error('Error parsing courses:', error)
        return []
      }
    }

    const tutorCourseIds = parseCourses(tutor.courses)

    // 1. Get overall statistics
    // Total students enrolled in tutor's courses
    const [studentCountResult] = await query<any[]>(
      `SELECT COUNT(DISTINCT s.id) as total_students
       FROM students s
       WHERE (
         SELECT COUNT(*) FROM JSON_TABLE(
           s.courses,
           '$[*]' COLUMNS(course VARCHAR(100) PATH '$')
         ) AS student_courses
         WHERE student_courses.course IN (?)
       ) > 0`,
      [tutorCourseIds.join(',')]
    ).catch(() => [{ total_students: 0 }])

    // Total tasks created by tutor
    const [taskCountResult] = await query<any[]>(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
       FROM tasks t
       WHERE t.created_by = ?`,
      [tutor.id]
    ).catch(() => [{ total_tasks: 0, completed_tasks: 0 }])

    // Overall completion rate and average score
    const [performanceResult] = await query<any[]>(
      `SELECT 
        AVG(CASE WHEN st.status = 'completed' THEN 100 ELSE 0 END) as overall_completion,
        AVG(st.score) as average_score
       FROM student_tasks st
       JOIN tasks t ON st.task_id = t.id
       WHERE t.created_by = ?`,
      [tutor.id]
    ).catch(() => [{ overall_completion: 0, average_score: 0 }])

    const stats = {
      totalStudents: studentCountResult?.total_students || 0,
      totalTasks: taskCountResult?.total_tasks || 0,
      tasksCompleted: taskCountResult?.completed_tasks || 0,
      overallCompletion: Math.round(performanceResult?.overall_completion || 0),
      averageScore: Math.round(performanceResult?.average_score || 0),
      totalCourses: tutorCourseIds.length
    }

    // 2. Get top performers
    const topPerformers = await query<any[]>(
      `SELECT 
        s.id,
        s.name,
        s.grade,
        s.user_id,
        COUNT(st.task_id) as total_tasks,
        COUNT(CASE WHEN st.status = 'completed' THEN st.task_id END) as completed_tasks,
        AVG(CASE WHEN st.status = 'completed' THEN st.score ELSE NULL END) as average_score
       FROM students s
       JOIN student_tasks st ON s.id = st.student_id
       JOIN tasks t ON st.task_id = t.id
       WHERE t.created_by = ?
       GROUP BY s.id
       HAVING total_tasks > 0
       ORDER BY average_score DESC
       LIMIT 10`,
      [tutor.id]
    ).catch(() => [])

    const formattedTopPerformers = topPerformers.map(student => ({
      id: student.id,
      name: student.name,
      grade: student.grade,
      userId: student.user_id,
      averageScore: Math.round(student.average_score || 0),
      completionRate: Math.round((student.completed_tasks / student.total_tasks) * 100),
      totalTasks: student.total_tasks,
      completedTasks: student.completed_tasks
    }))

    // 3. Get course statistics
    const courseStats = await Promise.all(
      tutorCourseIds.map(async (courseId) => {
        try {
          // Count students in this course
          const [studentCount] = await query<any[]>(
            `SELECT COUNT(DISTINCT s.id) as total_students
             FROM students s
             WHERE (
               SELECT COUNT(*) FROM JSON_TABLE(
                 s.courses,
                 '$[*]' COLUMNS(course VARCHAR(100) PATH '$')
               ) AS student_courses
               WHERE student_courses.course = ?
             ) > 0`,
            [courseId]
          )

          // Count tasks for this course
          const [taskCount] = await query<any[]>(
            `SELECT COUNT(*) as total_tasks
             FROM tasks t
             WHERE t.subject = ? AND t.created_by = ?`,
            [courseId, tutor.id]
          )

          // Calculate completion rate for this course
          const [completionResult] = await query<any[]>(
            `SELECT 
              AVG(CASE WHEN st.status = 'completed' THEN 100 ELSE 0 END) as completion_rate
             FROM student_tasks st
             JOIN tasks t ON st.task_id = t.id
             WHERE t.subject = ? AND t.created_by = ?`,
            [courseId, tutor.id]
          )

          // Get course name
          const getCourseName = (courseId: string): string => {
            const courseMap: Record<string, string> = {
              'math': 'Mathematics',
              'english': 'English',
              'amharic': 'Amharic',
              'general_science': 'General Science',
              'social_science': 'Social Science',
              'citizenship': 'Citizenship',
              'pva': 'PVA',
              'hpe': 'HPE',
              'it': 'IT',
              'ሂሳብ': 'Mathematics',
              'እንግሊዝኛ': 'English',
              'አማርኛ': 'Amharic',
              'አካባቢ_ሳይንስ': 'Environmental Science',
              'ስነምግባር': 'Citizenship',
              'ስነጥበብ': 'Arts',
              'ስፖርት': 'Sports'
            }

            const baseCourse = courseId.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
            return courseMap[baseCourse] || courseId.replace('_', ' ').toUpperCase()
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
              'ስፖርት': 'SPT'
            }

            const gradeMatch = courseId.match(/g(\d+)$/)
            const grade = gradeMatch ? gradeMatch[1] : '5'
            
            const baseCourse = courseId.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
            const codePrefix = courseCodeMap[baseCourse] || 'CRS'
            
            return `${codePrefix}-G${grade}`
          }

          const extractGradeFromCourseId = (courseId: string): number => {
            const gradeMatch = courseId.match(/g(\d+)$/)
            return gradeMatch ? parseInt(gradeMatch[1]) : 5
          }

          return {
            id: courseId,
            name: getCourseName(courseId),
            code: getCourseCode(courseId),
            grade: extractGradeFromCourseId(courseId),
            totalStudents: studentCount?.total_students || 0,
            totalTasks: taskCount?.total_tasks || 0,
            completionRate: Math.round(completionResult?.completion_rate || 0)
          }
        } catch (error) {
          console.warn(`Error fetching stats for course ${courseId}:`, error)
          return null
        }
      })
    ).then(results => results.filter(result => result !== null))

    // 4. Get student activity
    const studentActivity = await query<any[]>(
      `SELECT 
        s.id,
        s.name,
        s.grade,
        s.user_id,
        COUNT(DISTINCT ss.id) as sessions,
        SUM(TIMESTAMPDIFF(MINUTE, ss.login_time, COALESCE(ss.logout_time, NOW()))) as total_time,
        AVG(TIMESTAMPDIFF(MINUTE, ss.login_time, COALESCE(ss.logout_time, NOW()))) as avg_session_time,
        MAX(ss.login_time) as last_login,
        MAX(ss.device_info) as device_info,
        MAX(CASE WHEN ss.logout_time IS NULL THEN 1 ELSE 0 END) as is_online
       FROM students s
       LEFT JOIN study_sessions ss ON s.id = ss.student_id
       WHERE ss.login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         AND EXISTS (
           SELECT 1 FROM tasks t
           JOIN student_tasks st ON t.id = st.task_id
           WHERE t.created_by = ? AND st.student_id = s.id
         )
       GROUP BY s.id
       ORDER BY last_login DESC
       LIMIT 10`,
      [tutor.id]
    ).catch(() => [])

    const formattedStudentActivity = studentActivity.map(student => ({
      id: student.id,
      name: student.name,
      grade: student.grade,
      userId: student.user_id,
      sessions: student.sessions || 0,
      totalTime: student.total_time || 0,
      avgSessionTime: Math.round(student.avg_session_time || 0),
      lastLogin: student.last_login || new Date().toISOString(),
      deviceInfo: student.device_info,
      isOnline: Boolean(student.is_online)
    }))

    return NextResponse.json({
      success: true,
      tutor: {
        id: tutor.id,
        name: tutor.name || `${tutor.first_name} ${tutor.last_name}`,
        email: tutor.email,
        courses: tutorCourseIds
      },
      stats,
      topPerformers: formattedTopPerformers,
      courseStats,
      studentActivity: formattedStudentActivity
    })

  } catch (error) {
    console.error('Error fetching tutor status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutor status' },
      { status: 500 }
    )
  }
}