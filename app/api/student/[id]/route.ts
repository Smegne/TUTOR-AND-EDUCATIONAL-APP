import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // IMPORTANT: In Next.js 15, params is a Promise
    const { id } = await params;
    
    console.log(`🎯 Fetching student data for ID: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    // Try multiple approaches to find the student
    let student: any = null;
    
    // Approach 1: Try by student ID (UUID format)
    try {
      const [studentResult] = await query<any[]>(
        `SELECT * FROM students WHERE id = ?`,
        [id]
      );
      student = studentResult;
    } catch (error) {
      console.log('Approach 1 failed, trying alternative...');
    }
    
    // Approach 2: Try by user_id
    if (!student) {
      try {
        const [studentResult] = await query<any[]>(
          `SELECT * FROM students WHERE user_id = ?`,
          [id]
        );
        student = studentResult;
      } catch (error) {
        console.log('Approach 2 failed, trying alternative...');
      }
    }
    
    // Approach 3: Try by email or other identifier
    if (!student) {
      try {
        const [studentResult] = await query<any[]>(
          `SELECT * FROM students WHERE email = ? OR student_code = ?`,
          [id, id]
        );
        student = studentResult;
      } catch (error) {
        console.log('Approach 3 failed...');
      }
    }
    
    // Approach 4: Check if it's a user ID
    if (!student) {
      try {
        const [userResult] = await query<any[]>(
          `SELECT * FROM users WHERE id = ?`,
          [id]
        );
        
        if (userResult) {
          // Create a student object from user data
          student = {
            id: userResult.id,
            user_id: userResult.id,
            name: `${userResult.first_name || ''} ${userResult.last_name || ''}`.trim(),
            email: userResult.email,
            grade: userResult.grade || 7,
            age: userResult.age,
            school: userResult.school,
            points: userResult.points || 0,
            created_at: userResult.created_at,
          };
        }
      } catch (error) {
        console.log('Approach 4 failed...');
      }
    }
    
    if (!student) {
      return NextResponse.json(
        { 
          error: 'Student not found',
          searched_id: id,
          suggestion: 'Check if the student exists in the database'
        },
        { status: 404 }
      );
    }
    
    // Get student's grade (with fallback)
    const studentGrade = student.grade || student.grade_level || 7;
    
    // Get student's tasks with multiple fallback approaches
    let tasks: any[] = [];
    
    try {
      // Try to get tasks from student_tasks table first
      tasks = await query<any[]>(
        `SELECT 
          t.id,
          t.title as topic,
          t.description,
          t.course,
          t.subject,
          t.grade_level as grade,
          t.duration_minutes,
          t.difficulty,
          st.status,
          st.score,
          st.time_spent_minutes as timeSpent,
          st.started_at,
          st.completed_at,
          st.student_id
         FROM tasks t
         LEFT JOIN student_tasks st ON t.id = st.task_id 
           AND (st.student_id = ? OR st.student_id = ?)
         WHERE (t.grade_level = ? OR t.grade_level = ? OR t.grade_level IS NULL)
         ORDER BY t.priority DESC, t.created_at DESC
         LIMIT 20`,
        [student.id, student.user_id, studentGrade, studentGrade + 1]
      );
    } catch (error) {
      console.log('Error joining with student_tasks, trying tasks only...');
      
      // Fallback: Just get tasks for the grade
      try {
        tasks = await query<any[]>(
          `SELECT 
            id,
            title as topic,
            description,
            course,
            subject,
            grade_level as grade,
            duration_minutes,
            difficulty,
            'pending' as status
           FROM tasks
           WHERE grade_level = ? OR grade_level = ? OR grade_level IS NULL
           ORDER BY priority DESC, created_at DESC
           LIMIT 15`,
          [studentGrade, studentGrade + 1]
        );
      } catch (fallbackError) {
        console.error('Failed to get tasks:', fallbackError);
        tasks = [];
      }
    }
    
    // Calculate statistics
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const completedTasksWithScores = tasks.filter(t => t.status === 'completed' && t.score != null);
    const avgScore = completedTasksWithScores.length > 0 
      ? Math.round(completedTasksWithScores.reduce((sum, t) => sum + (t.score || 0), 0) / completedTasksWithScores.length)
      : 0;
    
    // Get streak
    let streak = 0;
    try {
      const [streakData] = await query<any[]>(
        `SELECT COUNT(DISTINCT DATE(completed_at)) as streak
         FROM student_tasks
         WHERE student_id = ? 
           AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
           AND status = 'completed'`,
        [student.id || student.user_id]
      );
      streak = streakData?.streak || 0;
    } catch (error) {
      console.log('Could not calculate streak:', error);
    }
    
    const stats = {
      completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      avgScore,
      streak,
      points: student.points || 0,
      level: Math.floor((student.points || 0) / 100) + 1 // Example level calculation
    };
    
    // Prepare clean student data
    const studentData = {
      id: student.id || student.user_id,
      userId: student.user_id,
      name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      email: student.email,
      grade: studentGrade,
      age: student.age,
      school: student.school,
      subjects: student.subjects ? 
        (typeof student.subjects === 'string' ? JSON.parse(student.subjects) : student.subjects) : 
        [],
      points: student.points || 0,
      avatar: student.avatar || student.profile_picture,
      joinedDate: student.created_at || student.joined_at
    };
    
    return NextResponse.json({
      success: true,
      student: studentData,
      tasks: tasks.map(task => ({
        ...task,
        // Ensure consistent field names
        id: task.id,
        topic: task.topic || task.title,
        status: task.status || 'pending',
        score: task.score || null,
        timeSpent: task.timeSpent || task.time_spent_minutes || 0,
        startedAt: task.started_at,
        completedAt: task.completed_at,
        isCompleted: task.status === 'completed'
      })),
      stats,
      meta: {
        tasksCount: tasks.length,
        fetchedAt: new Date().toISOString(),
        studentIdUsed: id,
        actualStudentId: student.id || student.user_id
      }
    });

  } catch (error: any) {
    console.error('Error fetching student data:', {
      error: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch student data',
        details: error.message,
        suggestion: 'Check database connection and student ID format'
      },
      { status: 500 }
    );
  }
}