import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isTutorTeachingStudent, isParentOfStudent } from '@/lib/auth/middleware';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await requireAuth(request, ['student', 'tutor', 'parent']);
    if (authResult instanceof NextResponse) return authResult;
    
    const currentUser = authResult;
    const searchParams = request.nextUrl.searchParams;
    const requestedStudentId = searchParams.get('studentId');
    const taskId = searchParams.get('taskId');

    // 2. Determine which student's tasks to fetch
    let authorizedStudentId: string;

    if (currentUser.role === 'student') {
      // Students can only see their own tasks
      authorizedStudentId = currentUser.studentId!;
    } 
    else if (currentUser.role === 'tutor') {
      // Tutors can see tasks of students they teach
      if (!requestedStudentId) {
        return NextResponse.json(
          { error: 'Student ID is required for tutor access' },
          { status: 400 }
        );
      }
      
      // Verify tutor-student relationship
      const isTeaching = await isTutorTeachingStudent(currentUser.tutorId!, requestedStudentId);
      if (!isTeaching) {
        return NextResponse.json(
          { error: 'Not authorized to view this student\'s tasks' },
          { status: 403 }
        );
      }
      
      authorizedStudentId = requestedStudentId;
    } 
    else if (currentUser.role === 'parent') {
      // Parents can see tasks of their children
      if (!requestedStudentId) {
        return NextResponse.json(
          { error: 'Student ID is required for parent access' },
          { status: 400 }
        );
      }
      
      // Verify parent-child relationship
      const isChild = await isParentOfStudent(currentUser.parentId!, requestedStudentId);
      if (!isChild) {
        return NextResponse.json(
          { error: 'Not authorized to view this student\'s tasks' },
          { status: 403 }
        );
      }
      
      authorizedStudentId = requestedStudentId;
    } else {
      return NextResponse.json(
        { error: 'Unauthorized role' },
        { status: 403 }
      );
    }

    // 3. Build query based on whether we want a specific task or all tasks
    let sql: string;
    let params: any[];

    if (taskId) {
      sql = `
        SELECT 
          t.*,
          st.status,
          st.score,
          st.time_spent,
          st.completed_at,
          tu.name as tutor_name
        FROM tasks t
        INNER JOIN student_tasks st ON t.id = st.task_id
        LEFT JOIN tutors tu ON t.created_by = tu.id
        WHERE st.student_id = ? AND t.id = ?
      `;
      params = [authorizedStudentId, taskId];
    } else {
      sql = `
        SELECT 
          t.*,
          st.status,
          st.score,
          st.time_spent,
          st.completed_at,
          tu.name as tutor_name
        FROM tasks t
        INNER JOIN student_tasks st ON t.id = st.task_id
        LEFT JOIN tutors tu ON t.created_by = tu.id
        WHERE st.student_id = ?
        ORDER BY 
          CASE st.status 
            WHEN 'pending' THEN 1
            WHEN 'completed' THEN 2
            ELSE 3
          END,
          t.created_at DESC
      `;
      params = [authorizedStudentId];
    }

    // 4. Execute query
    const rows = await query<any[]>(sql, params);
    
    // 5. Format response
    const studentTasks = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      subject: row.subject,
      grade_level: row.grade_level,
      difficulty: row.difficulty,
      estimated_time_minutes: row.estimated_time_minutes,
      note_content: row.note_content,
      video_link: row.video_link,
      images: row.images ? (typeof row.images === 'string' ? JSON.parse(row.images) : row.images) : [],
      parent_visibility: row.parent_visibility ? true : false,
      created_at: row.created_at?.toISOString(),
      created_by: row.created_by,
      created_by_name: row.tutor_name,
      status: row.status || 'pending',
      score: row.score || undefined,
      time_spent: row.time_spent || undefined,
      completed_at: row.completed_at ? row.completed_at.toISOString() : undefined,
      // Note: started_at is not available in your database schema
    }));

    return NextResponse.json(taskId ? studentTasks[0] || null : studentTasks);

  } catch (error) {
    console.error('Error fetching student tasks:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate (only students can submit work)
    const authResult = await requireAuth(request, ['student']);
    if (authResult instanceof NextResponse) return authResult;
    
    const currentUser = authResult;
    
    // 2. Parse request body
    const body = await request.json();
    const { 
      taskId, 
      studentId, 
      status, 
      score, 
      timeSpent,
      answers // Array of question answers (optional)
    } = body;

    // 3. Validate required fields
    if (!taskId || !studentId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId, studentId, status' },
        { status: 400 }
      );
    }

    // 4. Verify student can only update their own tasks
    if (studentId !== currentUser.studentId) {
      return NextResponse.json(
        { error: 'You can only update your own tasks' },
        { status: 403 }
      );
    }

    // 5. Check if task exists and is assigned to student
    const taskCheckSql = `
      SELECT 1 FROM student_tasks 
      WHERE task_id = ? AND student_id = ?
    `;
    const taskExists = await query<any[]>(taskCheckSql, [taskId, studentId]);
    
    if (!taskExists.length) {
      return NextResponse.json(
        { error: 'Task not assigned to student' },
        { status: 404 }
      );
    }

    // 6. Start transaction
    const connection = await import('@/lib/db').then(m => m.default).getConnection();
    await connection.beginTransaction();

    try {
      let sql: string;
      let params: any[];

      // 7. Update student task status
      if (status === 'completed') {
        sql = `
          UPDATE student_tasks 
          SET status = ?, 
              score = ?, 
              time_spent = ?, 
              completed_at = ?
          WHERE task_id = ? AND student_id = ?
        `;
        params = [
          status,
          score || null,
          timeSpent || null,
          new Date(),
          taskId,
          studentId
        ];
      } else {
        sql = `
          UPDATE student_tasks 
          SET status = ?
          WHERE task_id = ? AND student_id = ?
        `;
        params = [status, taskId, studentId];
      }

      await connection.execute(sql, params);

      // 8. Process answers if provided (for future implementation)
      if (Array.isArray(answers) && answers.length > 0) {
        // This is where you would insert/update student answers
        console.log('Student answers received:', answers);
      }

      // 9. Commit transaction
      await connection.commit();

      // 10. Return updated record
      const updatedSql = `
        SELECT * FROM student_tasks 
        WHERE task_id = ? AND student_id = ?
      `;
      const updated = await query<any[]>(updatedSql, [taskId, studentId]);

      const result = {
        taskId: updated[0].task_id,
        studentId: updated[0].student_id,
        status: updated[0].status,
        score: updated[0].score || undefined,
        completedAt: updated[0].completed_at ? updated[0].completed_at.toISOString() : undefined,
        timeSpent: updated[0].time_spent || undefined,
      };

      return NextResponse.json(result);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating student task:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}