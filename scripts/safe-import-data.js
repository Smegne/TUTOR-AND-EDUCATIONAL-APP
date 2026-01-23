// scripts/safe-import-data.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const mockData = {
  tutors: [
    {
      id: "tutor_001",
      name: "John Doe",
      email: "john.doe@school.com",
      courses: ["math_g5", "science_g5", "math_g8"]
    }
  ],
  
  students: [
    {
      id: "student_001",
      name: "Abel Tesfaye",
      grade: 5,
      courses: ["math_g5", "english_g5", "science_g5"],
      parentId: "parent_001"
    },
    {
      id: "student_002",
      name: "Emma Wilson",
      grade: 5,
      courses: ["math_g5", "english_g5", "science_g5", "history_g5"],
      parentId: "parent_002"
    }
  ],
  
  parents: [
    {
      id: "parent_001",
      name: "Mrs. Tesfaye",
      email: "mrs.tesfaye@email.com",
      childrenIds: ["student_001"]
    },
    {
      id: "parent_002",
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      childrenIds: ["student_002"]
    }
  ],
  
  tasks: [
    {
      id: "task_001",
      grade: 5,
      course: "math_g5",
      topic: "Fractions - Introduction",
      instruction: "Read the note carefully.",
      type: ["note", "question"],
      noteContent: "Fractions represent parts of a whole.",
      questions: [{"type": "multiple_choice", "question": "What is 3/4?", "options": ["3", "4"], "correctAnswer": "3"}],
      assignedStudentIds: ["student_001", "student_002"],
      visibleToParent: true,
      createdBy: "tutor_001",
      createdAt: "2025-01-15T09:00:00Z",
      dueDate: "2025-01-20T17:00:00Z"
    }
  ],
  
  studentTasks: [
    {
      taskId: "task_001",
      studentId: "student_001",
      status: "completed",
      score: 95,
      completedAt: "2025-01-16T09:15:00Z",
      timeSpent: 15
    },
    {
      taskId: "task_001",
      studentId: "student_002",
      status: "pending"
    }
  ]
};

async function safeImport() {
  console.log('=== Safe Data Import ===\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3309,
    user: process.env.DB_USER || 'smegn',
    password: process.env.DB_PASSWORD || '',
    database: 'educational_app'
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');

    // Function to check if column exists
    async function columnExists(table, column) {
      try {
        const [columns] = await connection.query(`DESCRIBE ${table}`);
        return columns.some(col => col.Field === column);
      } catch {
        return false;
      }
    }

    // Import with column checks
    console.log('1. Importing tutors...');
    for (const tutor of mockData.tutors) {
      const hasCourses = await columnExists('tutors', 'courses');
      const query = hasCourses 
        ? 'INSERT IGNORE INTO tutors (id, name, email, courses) VALUES (?, ?, ?, ?)'
        : 'INSERT IGNORE INTO tutors (id, name, email) VALUES (?, ?, ?)';
      
      const params = hasCourses 
        ? [tutor.id, tutor.name, tutor.email, JSON.stringify(tutor.courses)]
        : [tutor.id, tutor.name, tutor.email];
      
      await connection.query(query, params);
    }
    console.log('   ✅ Tutors imported');

    console.log('\n2. Importing parents...');
    for (const parent of mockData.parents) {
      const hasChildrenIds = await columnExists('parents', 'children_ids');
      const query = hasChildrenIds
        ? 'INSERT IGNORE INTO parents (id, name, email, children_ids) VALUES (?, ?, ?, ?)'
        : 'INSERT IGNORE INTO parents (id, name, email) VALUES (?, ?, ?)';
      
      const params = hasChildrenIds
        ? [parent.id, parent.name, parent.email, JSON.stringify(parent.childrenIds)]
        : [parent.id, parent.name, parent.email];
      
      await connection.query(query, params);
    }
    console.log('   ✅ Parents imported');

    console.log('\n3. Importing students...');
    for (const student of mockData.students) {
      const hasGrade = await columnExists('students', 'grade');
      const hasCourses = await columnExists('students', 'courses');
      const hasParentId = await columnExists('students', 'parent_id');
      
      let columns = ['id', 'name'];
      let values = [student.id, student.name];
      let placeholders = ['?', '?'];
      
      if (hasGrade) {
        columns.push('grade');
        values.push(student.grade);
        placeholders.push('?');
      }
      
      if (hasCourses) {
        columns.push('courses');
        values.push(JSON.stringify(student.courses));
        placeholders.push('?');
      }
      
      if (hasParentId) {
        columns.push('parent_id');
        values.push(student.parentId);
        placeholders.push('?');
      }
      
      const query = `INSERT IGNORE INTO students (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await connection.query(query, values);
    }
    console.log('   ✅ Students imported');

    console.log('\n4. Importing tasks...');
    for (const task of mockData.tasks) {
      // Check which columns exist
      const columnsToCheck = [
        'grade', 'course', 'topic', 'instruction', 'type', 
        'note_content', 'questions', 'assigned_student_ids',
        'visible_to_parent', 'created_by', 'created_at', 'due_date'
      ];
      
      const existingColumns = [];
      const values = [];
      
      // Always include id
      existingColumns.push('id');
      values.push(task.id);
      
      // Check each column
      for (const col of columnsToCheck) {
        if (await columnExists('tasks', col)) {
          existingColumns.push(col);
          
          // Handle special column names and values
          if (col === 'grade') values.push(task.grade);
          else if (col === 'course') values.push(task.course);
          else if (col === 'topic') values.push(task.topic);
          else if (col === 'instruction') values.push(task.instruction);
          else if (col === 'type') values.push(JSON.stringify(task.type));
          else if (col === 'note_content') values.push(task.noteContent);
          else if (col === 'questions') values.push(JSON.stringify(task.questions));
          else if (col === 'assigned_student_ids') values.push(JSON.stringify(task.assignedStudentIds));
          else if (col === 'visible_to_parent') values.push(task.visibleToParent ? 1 : 0);
          else if (col === 'created_by') values.push(task.createdBy);
          else if (col === 'created_at') values.push(new Date(task.createdAt));
          else if (col === 'due_date') values.push(task.dueDate ? new Date(task.dueDate) : null);
        }
      }
      
      if (existingColumns.length > 1) { // More than just id
        const placeholders = existingColumns.map(() => '?').join(', ');
        const query = `INSERT IGNORE INTO tasks (${existingColumns.join(', ')}) VALUES (${placeholders})`;
        await connection.query(query, values);
      }
    }
    console.log('   ✅ Tasks imported');

    console.log('\n5. Importing student tasks...');
    for (const st of mockData.studentTasks) {
      const hasScore = await columnExists('student_tasks', 'score');
      const hasCompletedAt = await columnExists('student_tasks', 'completed_at');
      const hasTimeSpent = await columnExists('student_tasks', 'time_spent');
      
      let columns = ['task_id', 'student_id', 'status'];
      let values = [st.taskId, st.studentId, st.status];
      
      if (hasScore && st.score) {
        columns.push('score');
        values.push(st.score);
      }
      
      if (hasCompletedAt && st.completedAt) {
        columns.push('completed_at');
        values.push(new Date(st.completedAt));
      }
      
      if (hasTimeSpent && st.timeSpent) {
        columns.push('time_spent');
        values.push(st.timeSpent);
      }
      
      const placeholders = columns.map(() => '?').join(', ');
      const query = `INSERT IGNORE INTO student_tasks (${columns.join(', ')}) VALUES (${placeholders})`;
      await connection.query(query, values);
    }
    console.log('   ✅ Student tasks imported');

    // Show summary
    console.log('\n=== IMPORT SUMMARY ===');
    const tables = ['tutors', 'students', 'parents', 'tasks', 'student_tasks'];
    for (const table of tables) {
      try {
        const [result] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${result[0].count} records`);
      } catch (error) {
        console.log(`${table}: Error - ${error.message}`);
      }
    }

    await connection.end();
    console.log('\n✅ Safe import complete!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

safeImport();