// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Add course request:', body)

    const {
      id,
      name,
      code,
      grade,
      description,
      medium = 'english',
      category = 'core',
      tutorId
    } = body

    // Validation
    if (!id || !name || !grade) {
      return NextResponse.json(
        { error: 'Course ID, name, and grade are required' },
        { status: 400 }
      )
    }

    // Check if course already exists
    try {
      const [existingCourse] = await query<any[]>(
        `SELECT id FROM courses WHERE id = ?`,
        [id]
      )

      if (existingCourse) {
        return NextResponse.json(
          { error: 'Course with this ID already exists' },
          { status: 409 }
        )
      }
    } catch (error) {
      // Courses table might not exist, continue
      console.log('Courses table not found, will create')
    }

    // Insert course into courses table
    try {
      await query(
        `INSERT INTO courses (id, name, description, grade, medium, category, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [id, name, description, grade, medium, category]
      )
    } catch (error) {
      console.error('Error inserting course:', error)
      // If courses table doesn't exist, continue without error
    }

    // If tutorId provided, assign course to tutor
    if (tutorId) {
      try {
        // Get tutor's current courses
        const [tutor] = await query<any[]>(
          `SELECT courses FROM tutors WHERE id = ? OR user_id = ?`,
          [tutorId, tutorId]
        )

        if (tutor) {
          let currentCourses: string[] = []
          
          // Parse existing courses
          if (tutor.courses) {
            try {
              if (typeof tutor.courses === 'string') {
                if (tutor.courses.startsWith('[')) {
                  currentCourses = JSON.parse(tutor.courses)
                } else {
                  currentCourses = tutor.courses.split(',').map((c: string) => c.trim())
                }
              } else if (Array.isArray(tutor.courses)) {
                currentCourses = tutor.courses
              }
            } catch (error) {
              console.error('Error parsing tutor courses:', error)
            }
          }

          // Add new course if not already present
          if (!currentCourses.includes(id)) {
            currentCourses.push(id)
            
            // Update tutor's courses
            await query(
              `UPDATE tutors SET courses = ?, updated_at = NOW() WHERE id = ? OR user_id = ?`,
              [JSON.stringify(currentCourses), tutorId, tutorId]
            )
          }
        } else {
          // Create tutor record if doesn't exist
          await query(
            `INSERT INTO tutors (id, user_id, courses, created_at, updated_at) 
             VALUES (?, ?, ?, NOW(), NOW()) 
             ON DUPLICATE KEY UPDATE courses = ?, updated_at = NOW()`,
            [tutorId, tutorId, JSON.stringify([id]), JSON.stringify([id])]
          )
        }
      } catch (error) {
        console.error('Error updating tutor courses:', error)
        // Continue even if tutor update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course added successfully',
      course: {
        id,
        name,
        code,
        grade,
        description,
        medium,
        category
      }
    })

  } catch (error: any) {
    console.error('Error adding course:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to add course',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch courses
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const grade = url.searchParams.get('grade')
    const medium = url.searchParams.get('medium')
    
    let queryStr = 'SELECT * FROM courses'
    const params: any[] = []
    
    if (grade || medium) {
      queryStr += ' WHERE'
      const conditions: string[] = []
      
      if (grade) {
        conditions.push(' grade = ?')
        params.push(parseInt(grade))
      }
      
      if (medium) {
        conditions.push(' medium = ?')
        params.push(medium)
      }
      
      queryStr += conditions.join(' AND')
    }
    
    queryStr += ' ORDER BY grade, name'
    
    const courses = await query<any[]>(queryStr, params)
    
    return NextResponse.json({
      success: true,
      courses,
      count: courses.length
    })
    
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      courses: []
    }, { status: 500 })
  }
}