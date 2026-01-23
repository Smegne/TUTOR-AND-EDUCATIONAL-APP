// app/api/parent/[id]/children-courses/route.ts
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
        children: []
      })
    }

    // For each child, get their courses and statistics
    const childrenWithCourses = await Promise.all(
      children.map(async (child) => {
        // Parse child courses
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

        const childCourseIds = parseCourses(child.courses)

        // Get course statistics for each course
        const coursesWithStats = await Promise.all(
          childCourseIds.map(async (courseId) => {
            try {
              // Get task statistics for this course
              const [courseStats] = await query<any[]>(
                `SELECT 
                  COUNT(*) as total_tasks,
                  COUNT(CASE WHEN st.status = 'completed' THEN 1 END) as completed_tasks,
                  AVG(CASE WHEN st.status = 'completed' THEN st.score ELSE NULL END) as avg_score
                 FROM tasks t
                 LEFT JOIN student_tasks st ON t.id = st.task_id AND st.student_id = ?
                 WHERE t.subject = ?`,
                [child.id, courseId]
              )

              // Get course information
              const getCourseName = (courseId: string): string => {
                const courseMap: Record<string, string> = {
                  'math': 'Mathematics',
                  'english': 'English',
                  'amharic': 'Amharic',
                  'science': 'Science',
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
                  'science': 'Introduction to biology, physics, and chemistry',
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

              const getCourseCode = (courseId: string): string => {
                const courseCodeMap: Record<string, string> = {
                  'math': 'MATH',
                  'english': 'ENG',
                  'amharic': 'AMH',
                  'science': 'SCI',
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
                return gradeMatch ? parseInt(gradeMatch[1]) : child.grade || 5
              }

              const totalTasks = courseStats?.total_tasks || 0
              const completedTasks = courseStats?.completed_tasks || 0
              const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
              const avgScore = Math.round(courseStats?.avg_score || 0)

              return {
                id: courseId,
                name: getCourseName(courseId),
                code: getCourseCode(courseId),
                grade: extractGradeFromCourseId(courseId),
                description: getCourseDescription(courseId),
                completionRate,
                avgScore,
                totalTasks,
                completedTasks
              }
            } catch (error) {
              console.warn(`Error fetching stats for course ${courseId}:`, error)
              return null
            }
          })
        )

        const validCourses = coursesWithStats.filter(course => course !== null)

        // Calculate overall child statistics
        const totalCourses = validCourses.length
        const totalTasks = validCourses.reduce((sum, course) => sum + (course?.totalTasks || 0), 0)
        const completedTasks = validCourses.reduce((sum, course) => sum + (course?.completedTasks || 0), 0)
        const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        const averageScore = validCourses.length > 0 
          ? Math.round(validCourses.reduce((sum, course) => sum + (course?.avgScore || 0), 0) / validCourses.length)
          : 0

        return {
          id: child.id,
          name: child.name || `${child.first_name} ${child.last_name}`,
          email: child.email,
          grade: child.grade,
          stats: {
            overallCompletionRate,
            averageScore,
            totalCourses,
            totalTasks,
            completedTasks
          },
          courses: validCourses
        }
      })
    )

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        name: parent.name || `${parent.first_name} ${parent.last_name}`,
        email: parent.email
      },
      children: childrenWithCourses,
      summary: {
        totalChildren: childrenWithCourses.length,
        totalCourses: childrenWithCourses.reduce((sum, child) => sum + child.stats.totalCourses, 0),
        totalTasks: childrenWithCourses.reduce((sum, child) => sum + child.stats.totalTasks, 0),
        totalCompletedTasks: childrenWithCourses.reduce((sum, child) => sum + child.stats.completedTasks, 0),
        overallAverageScore: childrenWithCourses.length > 0 
          ? Math.round(childrenWithCourses.reduce((sum, child) => sum + child.stats.averageScore, 0) / childrenWithCourses.length)
          : 0
      }
    })

  } catch (error) {
    console.error('Error fetching parent children courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch children courses' },
      { status: 500 }
    )
  }
}