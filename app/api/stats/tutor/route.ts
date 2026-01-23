import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tutorId = searchParams.get('tutorId');

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    // Get tutor's students count
    const tutorSql = 'SELECT courses FROM tutors WHERE id = ?';
    const tutorRows = await query<any[]>(tutorSql, [tutorId]);
    
    if (tutorRows.length === 0) {
      return NextResponse.json({
        totalStudents: 0,
        activeTasks: 0,
        completionRate: 0,
        avgScore: 0
      });
    }
    
    const tutorCourses = tutorRows[0].courses ? JSON.parse(tutorRows[0].courses) : [];
    
    // Count students with matching courses
    const studentsSql = 'SELECT * FROM students';
    const allStudents = await query<any[]>(studentsSql);
    
    const tutorStudents = allStudents.filter(student => {
      const studentCourses = student.courses ? JSON.parse(student.courses) : [];
      return studentCourses.some((course: string) => tutorCourses.includes(course));
    });
    
    // Count active tasks
    const tasksSql = 'SELECT COUNT(*) as count FROM tasks WHERE created_by = ?';
    const tasksRows = await query<any[]>(tasksSql, [tutorId]);
    const activeTasks = tasksRows[0]?.count || 0;
    
    // Calculate completion rate and average score
    // This is a simplified calculation - you might want to optimize this
    const statsSql = `
      SELECT 
        COUNT(DISTINCT st.student_id) as total_students,
        COUNT(*) as total_assignments,
        SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) as completed_assignments,
        AVG(st.score) as avg_score
      FROM student_tasks st
      JOIN tasks t ON st.task_id = t.id
      WHERE t.created_by = ?
    `;
    
    const statsRows = await query<any[]>(statsSql, [tutorId]);
    const stats = statsRows[0];
    
    const completionRate = stats.total_assignments > 0 
      ? Math.round((stats.completed_assignments / stats.total_assignments) * 100)
      : 0;
    
    return NextResponse.json({
      totalStudents: tutorStudents.length,
      activeTasks,
      completionRate,
      avgScore: Math.round(stats.avg_score || 0)
    });
  } catch (error) {
    console.error('Error fetching tutor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}