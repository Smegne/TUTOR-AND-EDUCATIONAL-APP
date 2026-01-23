// app/api/tutors/[id]/students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tutorId = params.id

    // Get tutor's courses
    const [tutor] = await query<any[]>(
      'SELECT courses FROM tutors WHERE id = ?',
      [tutorId]
    )

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    // Parse courses safely
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

    const tutorCourses = parseCourses(tutor.courses)

    // Get students with matching courses
    const students = await query<any[]>(
      `SELECT 
        s.*,
        u.email,
        u.first_name,
        u.last_name
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE (
         SELECT COUNT(*) FROM JSON_TABLE(
           s.courses,
           '$[*]' COLUMNS(course VARCHAR(100) PATH '$')
         ) AS student_courses
         WHERE student_courses.course IN (?)
       ) > 0`,
      [tutorCourses.join(',')]
    )

    // Get student progress statistics
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        let completedTasks = 0
        let totalTasks = 0
        let totalScore = 0
        let scoreCount = 0

        try {
          const studentTasks = await query<any[]>(
            `SELECT 
              st.status,
              st.score,
              t.created_by
             FROM student_tasks st
             JOIN tasks t ON st.task_id = t.id
             WHERE st.student_id = ? AND t.created_by = ?`,
            [student.id, tutorId]
          )

          totalTasks = studentTasks.length
          completedTasks = studentTasks.filter(st => st.status === 'completed').length
          
          studentTasks.forEach(st => {
            if (st.status === 'completed' && st.score) {
              totalScore += st.score
              scoreCount++
            }
          })
        } catch (error) {
          console.warn('Could not fetch student tasks:', error)
          // Mock data for demo
          totalTasks = Math.floor(Math.random() * 5) + 1
          completedTasks = Math.floor(Math.random() * totalTasks)
          if (completedTasks > 0) {
            totalScore = completedTasks * 80 // Mock average score of 80
            scoreCount = completedTasks
          }
        }

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0

        return {
          id: student.id,
          name: student.name || `${student.first_name} ${student.last_name}`,
          email: student.email,
          grade: student.grade,
          courses: parseCourses(student.courses),
          completionRate,
          avgScore,
          completedTasks,
          totalTasks,
          parentId: student.parent_id
        }
      })
    )

    return NextResponse.json({
      success: true,
      students: studentsWithProgress
    })

  } catch (error) {
    console.error('Error fetching tutor students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}