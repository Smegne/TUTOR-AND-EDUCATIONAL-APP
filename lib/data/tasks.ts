import { query } from '@/lib/db';
import type { Task, Question } from './mock-database';

// Convert MySQL rows to Task objects
function rowToTask(row: any): Task {
  return {
    id: row.id,
    grade: row.grade,
    course: row.course,
    topic: row.topic,
    instruction: row.instruction || '',
    type: JSON.parse(row.type || '[]'),
    noteContent: row.note_content || '',
    questions: row.questions ? JSON.parse(row.questions) : [],
    assignedStudentIds: row.assigned_student_ids ? JSON.parse(row.assigned_student_ids) : [],
    visibleToParent: Boolean(row.visible_to_parent),
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    dueDate: row.due_date ? row.due_date.toISOString() : undefined,
    videoLink: row.video_link || undefined,
    images: row.images ? JSON.parse(row.images) : undefined,
  };
}

// Data access functions
export async function getTaskById(id: string): Promise<Task | null> {
  const sql = 'SELECT * FROM tasks WHERE id = ?';
  const rows = await query<any[]>(sql, [id]);
  
  if (rows.length === 0) return null;
  return rowToTask(rows[0]);
}

export async function getTasksByTutor(tutorId: string): Promise<Task[]> {
  const sql = 'SELECT * FROM tasks WHERE created_by = ? ORDER BY created_at DESC';
  const rows = await query<any[]>(sql, [tutorId]);
  
  return rows.map(rowToTask);
}

export async function getTasksByStudent(studentId: string): Promise<Task[]> {
  const sql = `
    SELECT t.* 
    FROM tasks t
    WHERE JSON_CONTAINS(t.assigned_student_ids, JSON_QUOTE(?))
    ORDER BY t.due_date IS NULL, t.due_date ASC, t.created_at DESC
  `;
  const rows = await query<any[]>(sql, [studentId]);
  
  return rows.map(rowToTask);
}

export async function getTasksByParent(parentId: string): Promise<Task[]> {
  const sql = `
    SELECT t.* 
    FROM tasks t
    JOIN students s ON JSON_CONTAINS(t.assigned_student_ids, JSON_QUOTE(s.id))
    WHERE s.parent_id = ? AND t.visible_to_parent = TRUE
    ORDER BY t.due_date IS NULL, t.due_date ASC, t.created_at DESC
  `;
  const rows = await query<any[]>(sql, [parentId]);
  
  return rows.map(rowToTask);
}

export async function createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  // Generate ID (you might want to use UUID in production)
  const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const sql = `
    INSERT INTO tasks (
      id, grade, course, topic, instruction, type, note_content,
      questions, assigned_student_ids, visible_to_parent, created_by,
      due_date, video_link, images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id,
    taskData.grade,
    taskData.course,
    taskData.topic,
    taskData.instruction || null,
    JSON.stringify(taskData.type || []),
    taskData.noteContent || null,
    taskData.questions ? JSON.stringify(taskData.questions) : null,
    JSON.stringify(taskData.assignedStudentIds || []),
    taskData.visibleToParent ? 1 : 0,
    taskData.createdBy,
    taskData.dueDate ? new Date(taskData.dueDate) : null,
    taskData.videoLink || null,
    taskData.images ? JSON.stringify(taskData.images) : null,
  ];
  
  await query(sql, params);
  
  // Create student task entries
  if (taskData.assignedStudentIds && taskData.assignedStudentIds.length > 0) {
    const studentTasksSql = `
      INSERT INTO student_tasks (task_id, student_id, status)
      VALUES ${taskData.assignedStudentIds.map(() => '(?, ?, "pending")').join(', ')}
    `;
    
    const studentTaskParams = taskData.assignedStudentIds.flatMap(studentId => [id, studentId]);
    await query(studentTasksSql, studentTaskParams);
  }
  
  // Return the created task
  return getTaskById(id) as Promise<Task>;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
  const allowedFields = [
    'grade', 'course', 'topic', 'instruction', 'type', 'note_content',
    'questions', 'assigned_student_ids', 'visible_to_parent', 'due_date',
    'video_link', 'images'
  ];
  
  const updateFields: string[] = [];
  const params: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    if (allowedFields.includes(dbKey)) {
      updateFields.push(`${dbKey} = ?`);
      
      // Handle JSON fields
      if (['type', 'questions', 'assignedStudentIds', 'images'].includes(key)) {
        params.push(JSON.stringify(value));
      } else {
        params.push(value);
      }
    }
  });
  
  if (updateFields.length === 0) return false;
  
  params.push(id);
  const sql = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`;
  
  const result = await query(sql, params);
  return true;
}

export async function deleteTask(id: string): Promise<boolean> {
  const sql = 'DELETE FROM tasks WHERE id = ?';
  const result = await query(sql, [id]);
  return true;
}

// Statistics functions
export async function getTaskStats(taskId: string) {
  const sql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      AVG(score) as avg_score
    FROM student_tasks 
    WHERE task_id = ?
  `;
  
  const rows = await query<any[]>(sql, [taskId]);
  return rows[0] || { total: 0, completed: 0, avg_score: 0 };
}