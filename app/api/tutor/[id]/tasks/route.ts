import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isTutorTeachingStudent } from '@/lib/auth/middleware';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate and get current user
    const authResult = await requireAuth(request, ['tutor']);
    if (authResult instanceof NextResponse) return authResult;
    
    const currentUser = authResult;
    
    // 2. Verify the tutor can access this data (security check)
    if (params.id !== currentUser.tutorId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Access denied - you can only view your own tasks' 
        },
        { status: 403 }
      );
    }

    console.log('🎯 Fetching data for tutor:', currentUser.tutorId);

    // 3. GET TUTOR FROM DATABASE
    const [tutor] = await query<any[]>(
      `SELECT id, name, email, courses, user_id, is_active FROM tutors WHERE id = ?`,
      [currentUser.tutorId]
    );

    if (!tutor) {
      console.log('❌ Tutor not found:', currentUser.tutorId);
      return NextResponse.json({
        success: false,
        error: `Tutor not found`,
        usingMockData: false
      }, { status: 404 });
    }

    console.log('✅ Found tutor:', tutor.name);

    // 4. PARSE TUTOR COURSES
    let tutorCourses: string[] = [];
    if (tutor.courses) {
      try {
        if (typeof tutor.courses === 'string') {
          tutorCourses = JSON.parse(tutor.courses);
        } else if (Array.isArray(tutor.courses)) {
          tutorCourses = tutor.courses;
        }
      } catch (error) {
        console.error('Error parsing courses:', error);
        tutorCourses = [];
      }
    }

    // 5. GET TASKS FROM DATABASE (only tasks created by this tutor)
    console.log('📋 Querying tasks from database for tutor:', currentUser.tutorId);
    
    const tasksQuery = `SELECT 
      t.id, 
      t.title, 
      t.description, 
      t.subject, 
      t.grade_level,
      t.difficulty,
      t.estimated_time_minutes,
      t.note_content,
      t.video_link,
      t.images,
      t.parent_visibility,
      t.created_at,
      t.created_by,
      COUNT(st.task_id) as assigned_count,
      SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) as completed_count
     FROM tasks t
     LEFT JOIN student_tasks st ON t.id = st.task_id
     WHERE t.created_by = ?
     GROUP BY t.id
     ORDER BY t.created_at DESC
     LIMIT 50`;
    
    const tasks = await query<any[]>(tasksQuery, [currentUser.tutorId]);
    console.log(`📊 Found ${tasks.length} tasks in database`);

    // 6. FORMAT TASKS
    const formattedTasks = tasks.map(task => ({
      id: task.id?.toString() || `task_${Date.now()}`,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      subject: task.subject || 'general',
      grade_level: task.grade_level || 5,
      difficulty: task.difficulty || 'beginner',
      estimated_time_minutes: task.estimated_time_minutes || 30,
      note_content: task.note_content || '',
      video_link: task.video_link || null,
      images: task.images ? 
        (typeof task.images === 'string' ? 
          (() => {
            try { return JSON.parse(task.images) } 
            catch { return [] }
          })() 
          : task.images) 
        : [],
      parent_visibility: task.parent_visibility ? true : false,
      created_at: task.created_at?.toISOString() || new Date().toISOString(),
      created_by: task.created_by || currentUser.tutorId,
      created_by_name: tutor.name,
      assigned_count: task.assigned_count || 0,
      completed_count: task.completed_count || 0,
      questions: []
    }));

    // 7. GET STUDENTS ASSIGNED TO THIS TUTOR
    let students: any[] = [];
    try {
      const studentsQuery = `
        SELECT s.* FROM students s
        INNER JOIN tutor_students ts ON s.id = ts.student_id
        WHERE ts.tutor_id = ?
        ORDER BY s.name
        LIMIT 50
      `;
      students = await query<any[]>(studentsQuery, [currentUser.tutorId]);
      console.log(`👥 Found ${students.length} students assigned to tutor`);
    } catch (error) {
      console.warn('Students query failed:', error);
      students = [];
    }

    // 8. CALCULATE STATS
    const totalAssigned = formattedTasks.reduce((sum, task) => sum + task.assigned_count, 0);
    const totalCompleted = formattedTasks.reduce((sum, task) => sum + task.completed_count, 0);

    // 9. RETURN DATA
    return NextResponse.json({
      success: true,
      usingMockData: false,
      tutor: {
        id: tutor.id,
        userId: tutor.user_id || null,
        name: tutor.name || 'Unknown Tutor',
        email: tutor.email || '',
        courses: tutorCourses,
        isActive: tutor.is_active !== undefined ? Boolean(tutor.is_active) : true
      },
      tasks: formattedTasks,
      students: students.map(student => ({
        id: student.id,
        name: student.name || 'Unknown Student',
        grade: student.grade || 5,
        courses: student.courses ? 
          (typeof student.courses === 'string' ? 
            (() => {
              try { return JSON.parse(student.courses) } 
              catch { return [] }
            })() 
            : student.courses) 
          : [],
        parentId: student.parent_id || null
      })),
      stats: {
        totalTasks: formattedTasks.length,
        totalAssigned,
        totalCompleted,
        totalStudents: students.length
      },
      debug: {
        tutorId: tutor.id,
        tasksCount: tasks.length,
        studentsCount: students.length,
        databaseQuery: 'success'
      }
    });

  } catch (error) {
    console.error('🚨 API Error details:', error);
    
    return NextResponse.json({
      success: false,
      usingMockData: false,
      error: 'Database query failed',
      errorDetails: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : null,
      tutorId: params?.id || 'unknown',
      message: 'Check database connection and table structure'
    }, { status: 500 });
  }
}

// POST - Create a new task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate
    const authResult = await requireAuth(request, ['tutor']);
    if (authResult instanceof NextResponse) return authResult;
    
    const currentUser = authResult;
    
    // 2. Verify tutor can create tasks here
    if (params.id !== currentUser.tutorId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const {
      title,
      description,
      subject,
      grade_level,
      difficulty = 'beginner',
      estimated_time_minutes = 30,
      note_content,
      video_link,
      images,
      parent_visibility = false,
      assigned_students = [] // Array of student IDs
    } = body;

    // 4. Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // 5. Start transaction
    const connection = await import('@/lib/db').then(m => m.default).getConnection();
    await connection.beginTransaction();

    try {
      // 6. Insert task
      const taskInsertSql = `
        INSERT INTO tasks (
          title, description, subject, grade_level, difficulty,
          estimated_time_minutes, created_by, note_content,
          video_link, images, parent_visibility
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const taskParams = [
        title,
        description || null,
        subject || null,
        grade_level || null,
        difficulty,
        estimated_time_minutes,
        currentUser.tutorId,
        note_content || null,
        video_link || null,
        images ? JSON.stringify(images) : null,
        parent_visibility ? 1 : 0
      ];

      const [taskResult] = await connection.execute(taskInsertSql, taskParams);
      const taskId = (taskResult as any).insertId;

      // 7. Assign task to students (if any)
      if (Array.isArray(assigned_students) && assigned_students.length > 0) {
        for (const studentId of assigned_students) {
          // Verify tutor teaches this student
          const isTeaching = await isTutorTeachingStudent(currentUser.tutorId!, studentId);
          if (!isTeaching) {
            console.warn(`Tutor ${currentUser.tutorId} not teaching student ${studentId}, skipping assignment`);
            continue;
          }

          const assignmentSql = `
            INSERT INTO student_tasks (task_id, student_id, status)
            VALUES (?, ?, 'pending')
            ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
          `;
          await connection.execute(assignmentSql, [taskId, studentId]);
        }
      }

      // 8. Commit transaction
      await connection.commit();

      // 9. Return created task
      const [createdTask] = await query<any[]>(
        'SELECT * FROM tasks WHERE id = ?',
        [taskId]
      );

      return NextResponse.json({
        success: true,
        task: {
          id: createdTask.id,
          title: createdTask.title,
          description: createdTask.description,
          subject: createdTask.subject,
          grade_level: createdTask.grade_level,
          difficulty: createdTask.difficulty,
          estimated_time_minutes: createdTask.estimated_time_minutes,
          created_by: createdTask.created_by,
          created_at: createdTask.created_at
        }
      }, { status: 201 });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}