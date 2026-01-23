// app/api/student/[id]/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id

    // Get student profile
    const [student] = await query<any[]>(
      `SELECT id, name, grade FROM students WHERE id = ? OR user_id = ?`,
      [studentId, studentId]
    )

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Parse courses from student record
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

    // Get student's courses from database
    const studentData = await query<any[]>(
      `SELECT courses FROM students WHERE id = ?`,
      [student.id]
    )

    const rawCourses = studentData[0]?.courses || '[]'
    const courseIds = parseCourses(rawCourses)

    // If no courses in database, use default based on grade
    let coursesList = courseIds
    if (coursesList.length === 0) {
      // Default courses based on grade
      if (student.grade === 5 || student.grade === 6) {
        coursesList = [
          `ሂሳብ_g${student.grade}`,
          `እንግሊዝኛ_g${student.grade}`,
          `አማርኛ_g${student.grade}`,
          `አካባቢ_ሳይንስ_g${student.grade}`,
          `ስነምግባር_g${student.grade}`,
          `ስነጥበብ_g${student.grade}`,
          `ስፖርት_g${student.grade}`
        ]
      } else if (student.grade === 7 || student.grade === 8) {
        coursesList = [
          `math_g${student.grade}`,
          `english_g${student.grade}`,
          `amharic_g${student.grade}`,
          `general_science_g${student.grade}`,
          `social_science_g${student.grade}`,
          `citizenship_g${student.grade}`,
          `pva_g${student.grade}`,
          `hpe_g${student.grade}`,
          `it_g${student.grade}`
        ]
      }
    }

    // Get task statistics for each course
    const coursesWithStats = await Promise.all(
      coursesList.map(async (courseId) => {
        try {
          const tasks = await query<any[]>(
            `SELECT 
              COUNT(*) as total_tasks,
              SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
             FROM tasks t
             LEFT JOIN student_tasks st ON t.id = st.task_id AND st.student_id = ?
             WHERE t.subject = ? AND st.student_id = ?`,
            [student.id, courseId, student.id]
          )

          const totalTasks = tasks[0]?.total_tasks || 0
          const completedTasks = tasks[0]?.completed_tasks || 0
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          return {
            id: courseId,
            totalTasks,
            completedTasks,
            progress
          }
        } catch (error) {
          console.warn(`Could not fetch stats for course ${courseId}:`, error)
          return {
            id: courseId,
            totalTasks: 0,
            completedTasks: 0,
            progress: 0
          }
        }
      })
    )

    // Get course names and descriptions
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

    const getCourseDescription = (courseId: string): string => {
      const descriptionMap: Record<string, string> = {
        'math': 'Basic arithmetic, geometry, and problem solving',
        'english': 'Reading, writing, and communication skills',
        'amharic': 'Amharic language and literature',
        'general_science': 'Introduction to biology, physics, and chemistry',
        'social_science': 'History, geography, and social studies',
        'citizenship': 'Civic education and ethical values',
        'pva': 'Physical and vocational arts education',
        'hpe': 'Health and physical education',
        'it': 'Information technology and computer basics',
        'ሂሳብ': 'መሰረታዊ ሒሳብ እና ችግር መፍታት',
        'እንግሊዝኛ': 'ማንበብ፣ መጻፍ እና የንግግር ክህሎቶች',
        'አማርኛ': 'የአማርኛ ቋንቋ እና ስነጽሁፍ',
        'አካባቢ_ሳይንስ': 'የተፈጥሮ ሳይንስ መሰረታዊ እውቀት',
        'ስነምግባር': 'የከተማ ትምህርት እና ስነምግባር',
        'ስነጥበብ': 'ስነጥበብ እና ፈጠራዊ ሥራዎች',
        'ስፖርት': 'አካላዊ ትምህርት እና የስፖርት እንቅስቃሴዎች'
      }

      const baseCourse = courseId.replace(/_(g\d+|g\d+)$/, '').split('_')[0]
      return descriptionMap[baseCourse] || 'Course description not available'
    }

    const extractGradeFromCourseId = (courseId: string): number => {
      const gradeMatch = courseId.match(/g(\d+)$/)
      return gradeMatch ? parseInt(gradeMatch[1]) : student.grade || 5
    }

    const courses = coursesWithStats.map(course => ({
      ...course,
      name: getCourseName(course.id),
      description: getCourseDescription(course.id),
      grade: extractGradeFromCourseId(course.id),
      code: getCourseCode(course.id)
    }))

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade
      },
      courses,
      stats: {
        totalCourses: courses.length,
        averageProgress: courses.length > 0 
          ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)
          : 0,
        totalTasks: courses.reduce((sum, course) => sum + course.totalTasks, 0),
        completedTasks: courses.reduce((sum, course) => sum + course.completedTasks, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching student courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student courses' },
      { status: 500 }
    )
  }
}

function getCourseCode(courseId: string): string {
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