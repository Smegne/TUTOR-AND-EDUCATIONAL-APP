// app/api/students/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tutorId = searchParams.get('tutorId');
    const grade = searchParams.get('grade');
    // Course parameter removed - we're not filtering by course anymore

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching students for tutor:', { tutorId, grade });

    // SIMPLIFIED: Get students assigned to this tutor, filter by grade only
    let sql = `
      SELECT 
        s.id,
        s.name,
        s.grade,
        s.courses,
        s.parent_id,
        s.user_id,
        u.email,
        ts.assigned_at
      FROM students s
      INNER JOIN tutor_students ts ON s.id = ts.student_id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE ts.tutor_id = ? 
        AND u.is_active = 1
    `;

    const params: any[] = [tutorId];

    // Filter by grade ONLY (removed course filter)
    if (grade) {
      sql += ` AND s.grade = ?`;
      params.push(parseInt(grade));
    }

    sql += ` ORDER BY s.name ASC`;

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
        assignedAt: student.assigned_at
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