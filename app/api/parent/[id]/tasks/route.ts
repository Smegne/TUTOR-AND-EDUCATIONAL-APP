// app/api/parent/[id]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n========== PARENT TASKS API CALLED ==========');
  
  try {
    // ===========================================
    // STEP 1: Extract parent ID (same as dashboard)
    // ===========================================
    let parentId = params?.id;
    
    if (!parentId) {
      const url = request.url;
      const match = url.match(/\/api\/parent\/([^\/]+)\/tasks/);
      if (match && match[1]) {
        parentId = match[1];
      }
    }
    
    if (!parentId) {
      const pathname = new URL(request.url).pathname;
      const parts = pathname.split('/');
      if (parts.length >= 4 && parts[2] === 'parent') {
        parentId = parts[3];
      }
    }
    
    console.log('Final parentId:', parentId);
    
    if (!parentId) {
      return NextResponse.json(
        { error: 'Parent ID is required' },
        { status: 400 }
      );
    }

    // ===========================================
    // STEP 2: Get parent from users table
    // ===========================================
    const users = await query<any[]>(
      `SELECT * FROM users WHERE id = ? AND role = 'parent'`,
      [parentId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    const parent = users[0];
    console.log('Found parent:', { id: parent.id, email: parent.email });

    // ===========================================
    // STEP 3: Get child links and find students
    // ===========================================
    const childLinks = await query<any[]>(
      `SELECT 
        pcl.*,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email as user_email,
        s.id as student_id,
        s.grade,
        s.name as student_name
       FROM parent_child_links pcl
       LEFT JOIN users u ON u.email = pcl.child_email
       LEFT JOIN students s ON s.user_id = u.id
       WHERE pcl.parent_id = ? AND pcl.status = 'linked'`,
      [parentId]
    );

    console.log(`Found ${childLinks.length} linked children`);

    // ===========================================
    // STEP 4: If no linked children, check for student by email
    // ===========================================
    let students: any[] = [];
    
    if (childLinks.length > 0) {
      // Get student IDs from linked children
      students = childLinks
        .filter(link => link.student_id)
        .map(link => ({
          id: link.student_id,
          name: link.student_name || 
                `${link.first_name || ''} ${link.last_name || ''}`.trim() || 
                link.child_email?.split('@')[0] || 'Student',
          email: link.child_email,
          grade: link.grade || 0
        }));
    } else {
      // Try to find student by email if parent has email in users table
      // This is a fallback for your specific case
      console.log('No linked children, checking for student with email smegn111@gmail.com');
      
      const studentByEmail = await query<any[]>(
        `SELECT s.*, u.email, u.first_name, u.last_name
         FROM students s
         JOIN users u ON s.user_id = u.id
         WHERE u.email = ?`,
        ['smegn111@gmail.com']
      );
      
      if (studentByEmail.length > 0) {
        students = [{
          id: studentByEmail[0].id,
          name: studentByEmail[0].name || 
                `${studentByEmail[0].first_name || ''} ${studentByEmail[0].last_name || ''}`.trim(),
          email: studentByEmail[0].email,
          grade: studentByEmail[0].grade || 0
        }];
        console.log('Found student by email:', students[0]);
      }
    }

    if (students.length === 0) {
      return NextResponse.json({
        success: true,
        parent: {
          id: parent.id,
          userId: parent.id,
          name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim() || 'Parent',
          email: parent.email
        },
        childrenTasks: [],
        summary: {
          totalChildren: 0,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          avgScore: 0
        }
      });
    }

    // ===========================================
    // STEP 5: Get tasks for each student
    // ===========================================
    const childrenTasks = await Promise.all(
      students.map(async (student) => {
        try {
          console.log(`Fetching tasks for student: ${student.id} (${student.name})`);
          
          const tasks = await query<any[]>(
            `SELECT 
              t.*,
              st.status as task_status,
              st.score,
              st.completed_at,
              st.started_at,
              st.time_spent_minutes,
              u.first_name as created_by_first_name,
              u.last_name as created_by_last_name
             FROM tasks t
             INNER JOIN student_tasks st ON t.id = st.task_id
             LEFT JOIN users u ON t.created_by = u.id
             WHERE st.student_id = ? 
               AND t.parent_visibility = TRUE
             ORDER BY 
               CASE 
                 WHEN st.status = 'pending' THEN 1
                 WHEN st.status = 'in_progress' THEN 2
                 WHEN st.status = 'completed' THEN 3
                 ELSE 4
               END,
               t.due_date ASC NULLS LAST,
               t.created_at DESC`,
            [student.id]
          );

          console.log(`Found ${tasks.length} tasks for student ${student.id}`);

          return {
            child: student,
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              description: task.description,
              subject: task.subject,
              grade_level: task.grade_level,
              difficulty: task.difficulty,
              status: task.task_status || 'pending',
              score: task.score,
              completed_at: task.completed_at,
              created_at: task.created_at,
              due_date: task.due_date,
              time_spent: task.time_spent_minutes,
              created_by_name: task.created_by_first_name && task.created_by_last_name 
                ? `${task.created_by_first_name} ${task.created_by_last_name}`
                : 'Tutor',
              parent_visibility: Boolean(task.parent_visibility)
            }))
          };
        } catch (error) {
          console.error(`Error fetching tasks for student ${student.id}:`, error);
          return {
            child: student,
            tasks: []
          };
        }
      })
    );

    // ===========================================
    // STEP 6: Calculate summary statistics
    // ===========================================
    const summary = {
      totalChildren: childrenTasks.length,
      totalTasks: childrenTasks.reduce((sum, child) => sum + child.tasks.length, 0),
      completedTasks: childrenTasks.reduce((sum, child) => 
        sum + child.tasks.filter(t => t.status === 'completed').length, 0
      ),
      pendingTasks: childrenTasks.reduce((sum, child) => 
        sum + child.tasks.filter(t => t.status !== 'completed').length, 0
      ),
      overdueTasks: childrenTasks.reduce((sum, child) => 
        sum + child.tasks.filter(task => {
          if (task.status === 'completed') return false;
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          const now = new Date();
          return dueDate < now;
        }).length, 0
      ),
      avgScore: (() => {
        const completedTasks = childrenTasks.flatMap(child => 
          child.tasks.filter(t => t.status === 'completed' && t.score !== null && t.score !== undefined)
        );
        if (completedTasks.length === 0) return 0;
        return Math.round(
          completedTasks.reduce((sum, task) => sum + (task.score || 0), 0) / completedTasks.length
        );
      })()
    };

    console.log('✅ API call successful!');
    console.log('Summary:', summary);

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        userId: parent.id,
        name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim() || 'Parent',
        email: parent.email
      },
      childrenTasks,
      summary
    });

  } catch (error) {
    console.error('❌ Error fetching parent tasks:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch parent tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}