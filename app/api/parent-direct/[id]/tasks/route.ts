// app/api/parent-direct/[id]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n========== PARENT TASKS API CALLED ==========');
  
  try {
    // Get parent ID from params or URL
    let parentId = params?.id;
    
    // If params empty, extract from URL
    if (!parentId) {
      const url = request.url;
      const match = url.match(/\/api\/parent-direct\/([^\/]+)\/tasks/);
      if (match && match[1]) {
        parentId = match[1];
      }
    }

    console.log('Parent ID:', parentId);

    if (!parentId) {
      return NextResponse.json(
        { error: 'Parent ID is required' },
        { status: 400 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'completed', 'pending', 'all'
    const childId = searchParams.get('childId');
    const days = parseInt(searchParams.get('days') || '30'); // Last 30 days default

    console.log('Query params:', { status, childId, days });

    // ===========================================
    // STEP 1: Get all children for this parent
    // ===========================================
    const childLinks = await query<any[]>(
      `SELECT 
        pcl.*,
        s.id as student_id,
        s.name as student_name,
        s.grade as student_grade,
        u.first_name,
        u.last_name
       FROM parent_child_links pcl
       LEFT JOIN users u ON u.email = pcl.child_email
       LEFT JOIN students s ON s.user_id = u.id
       WHERE pcl.parent_id = ? AND pcl.status = 'linked'`,
      [parentId]
    );

    console.log(`Found ${childLinks.length} linked children`);

    if (childLinks.length === 0) {
      return NextResponse.json({
        success: true,
        tasks: [],
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          averageScore: 0
        },
        message: 'No linked children found'
      });
    }

    // ===========================================
    // STEP 2: Get student IDs for tasks query
    // ===========================================
    const studentIds = childLinks
      .map(link => link.student_id)
      .filter(id => id && !id.startsWith('pending_'));

    console.log('Student IDs:', studentIds);

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        tasks: [],
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          averageScore: 0
        },
        children: childLinks.map(link => ({
          id: link.student_id || link.id,
          name: link.student_name || link.child_email?.split('@')[0] || 'Child',
          email: link.child_email
        }))
      });
    }

    // ===========================================
    // STEP 3: Build the tasks query with filters
    // ===========================================
    const placeholders = studentIds.map(() => '?').join(',');
    let queryParams: any[] = [...studentIds];
    
    // Date filter
    const dateFilter = days > 0 ? ` AND st.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)` : '';
    if (days > 0) {
      queryParams.push(days);
    }
    
    // Child filter
    const childFilter = childId && childId !== 'all' ? ` AND st.student_id = ?` : '';
    if (childId && childId !== 'all') {
      queryParams.push(childId);
    }

    const tasksQuery = `
      SELECT 
        t.*,
        st.id as student_task_id,
        st.status as task_status,
        st.score,
        st.time_spent_minutes as time_spent,
        st.started_at,
        st.completed_at,
        st.student_id,
        st.created_at as assigned_at,
        s.name as student_name,
        s.grade as student_grade,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.email as student_email
      FROM tasks t
      INNER JOIN student_tasks st ON t.id = st.task_id
      INNER JOIN students s ON st.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE st.student_id IN (${placeholders})
        AND t.parent_visibility = TRUE
        ${dateFilter}
        ${childFilter}
      ORDER BY st.created_at DESC
    `;

    console.log('Executing tasks query...');
    const tasks = await query<any[]>(tasksQuery, queryParams);

    console.log(`Found ${tasks.length} tasks`);

    // ===========================================
    // STEP 4: Calculate statistics
    // ===========================================
    
    // Get all tasks for stats (without date filter)
    const allTasksQuery = `
      SELECT 
        st.status,
        st.score,
        st.student_id
      FROM student_tasks st
      WHERE st.student_id IN (${placeholders})
    `;
    
    const allTasksStats = await query<any[]>(allTasksQuery, studentIds);

    // Calculate stats
    const totalTasks = allTasksStats.length;
    const completedTasks = allTasksStats.filter(t => t.status === 'completed');
    const pendingTasks = allTasksStats.filter(t => t.status === 'pending');
    const inProgressTasks = allTasksStats.filter(t => t.status === 'in_progress');
    
    const totalScore = completedTasks.reduce((sum, t) => sum + (t.score || 0), 0);
    const averageScore = completedTasks.length > 0 
      ? Math.round(totalScore / completedTasks.length) 
      : 0;

    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysTasks = tasks.filter(task => {
      const taskDate = new Date(task.completed_at || task.created_at);
      return taskDate >= today;
    });

    // Get weekly tasks
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyTasks = tasks.filter(task => {
      const taskDate = new Date(task.completed_at || task.created_at);
      return taskDate >= weekAgo;
    });

    // ===========================================
    // STEP 5: Format tasks for response
    // ===========================================
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      subject: task.subject,
      grade_level: task.grade_level || task.student_grade,
      difficulty: task.difficulty,
      estimated_time: task.estimated_time_minutes,
      time_spent: task.time_spent,
      status: task.task_status,
      score: task.score,
      created_at: task.created_at,
      started_at: task.started_at,
      completed_at: task.completed_at,
      assigned_at: task.assigned_at,
      student: {
        id: task.student_id,
        name: task.student_name || 
              `${task.student_first_name || ''} ${task.student_last_name || ''}`.trim() || 
              'Student',
        email: task.student_email,
        grade: task.student_grade
      },
      // Add relative time for display
      time_ago: getTimeAgo(task.completed_at || task.created_at)
    }));

    // ===========================================
    // STEP 6: Prepare response
    // ===========================================
    const response = {
      success: true,
      tasks: formattedTasks,
      stats: {
        total: totalTasks,
        completed: completedTasks.length,
        pending: pendingTasks.length,
        inProgress: inProgressTasks.length,
        averageScore: averageScore,
        todaysCompleted: todaysTasks.filter(t => t.task_status === 'completed').length,
        todaysTotal: todaysTasks.length,
        weeklyCompleted: weeklyTasks.filter(t => t.task_status === 'completed').length,
        weeklyTotal: weeklyTasks.length
      },
      filters: {
        status: status || 'all',
        childId: childId || 'all',
        days: days
      },
      children: childLinks.map(link => ({
        id: link.student_id || link.id,
        name: link.student_name || 
              link.child_name ||
              `${link.first_name || ''} ${link.last_name || ''}`.trim() || 
              link.child_email?.split('@')[0] || 'Child',
        email: link.child_email,
        grade: link.grade || link.student_grade || 0,
        status: link.status
      }))
    };

    console.log('✅ Tasks API response prepared');
    console.log('Stats:', response.stats);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in parent tasks API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
        tasks: [],
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          averageScore: 0,
          todaysCompleted: 0,
          todaysTotal: 0,
          weeklyCompleted: 0,
          weeklyTotal: 0
        },
        children: []
      },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function getTimeAgo(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}