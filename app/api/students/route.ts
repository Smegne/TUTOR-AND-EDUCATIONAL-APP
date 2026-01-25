// app/api/students/route.ts - UPDATED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tutorId = searchParams.get('tutorId');
    const grade = searchParams.get('grade');

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching students for tutor:', { tutorId, grade });

    // Get all students for the grade, whether they're assigned to this tutor or not
    // Use LEFT JOIN instead of INNER JOIN to include all students
    let sql = `
      SELECT 
        s.id,
        s.name,
        s.grade,
        s.courses,
        s.parent_id,
        s.user_id,
        u.email,
        ts.assigned_at,
        CASE 
          WHEN ts.tutor_id IS NOT NULL THEN 1 
          ELSE 0 
        END as is_assigned
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN tutor_students ts ON s.id = ts.student_id AND ts.tutor_id = ?
      WHERE (u.is_active = 1 OR u.is_active IS NULL)
    `;

    const params: any[] = [tutorId];

    // Filter by grade if provided
    if (grade && grade !== 'null' && grade !== 'undefined') {
      sql += ` AND s.grade = ?`;
      params.push(parseInt(grade));
    }

    sql += ` ORDER BY ts.assigned_at DESC, s.name ASC`;

    console.log('SQL Query:', sql);
    console.log('SQL Parameters:', params);

    const students = await query<any[]>(sql, params);

    console.log(`Found ${students.length} students for tutor ${tutorId}, grade ${grade || 'any'}`);

    // Format the response - handle NULL courses safely
    const formattedStudents = students.map(student => {
      // Parse courses safely
      let courses: any[] = [];
      if (student.courses) {
        try {
          if (typeof student.courses === 'string') {
            courses = JSON.parse(student.courses);
          } else if (Array.isArray(student.courses)) {
            courses = student.courses;
          }
        } catch (error) {
          console.error('Error parsing courses for student', student.id, error);
          courses = [];
        }
      }

      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        courses: courses,
        parentId: student.parent_id,
        email: student.email,
        assignedAt: student.assigned_at,
        isAssigned: student.is_assigned === 1
      };
    });

    return NextResponse.json(formattedStudents);

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}