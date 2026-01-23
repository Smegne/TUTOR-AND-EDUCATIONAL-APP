// scripts/import-mock-data.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

// Mock data structure (simplified)
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
      instruction: "Read the note carefully and answer the multiple choice questions.",
      type: ["note", "question"],
      noteContent: "Fractions represent parts of a whole. The top number is called the numerator...",
      questions: [
        {
          type: "multiple_choice",
          question: "What is the numerator in the fraction 3/4?",
          options: ["3", "4", "7", "1"],
          correctAnswer: "3"
        }
      ],
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

async function importData() {
  console.log('=== Importing Mock Data to MySQL ===\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'educational_app'
  };

  try {
    // Connect to database
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');

    // Clear existing data (optional)
    console.log('Clearing existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM student_tasks');
    await connection.query('DELETE FROM tasks');
    await connection.query('DELETE FROM students');
    await connection.query('DELETE FROM parents');
    await connection.query('DELETE FROM tutors');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Existing data cleared\n');

    // 1. Import Tutors
    console.log('1. Importing tutors...');
    for (const tutor of mockData.tutors) {
      await connection.query(
        'INSERT INTO tutors (id, name, email, courses) VALUES (?, ?, ?, ?)',
        [tutor.id, tutor.name, tutor.email, JSON.stringify(tutor.courses)]
      );
    }
    console.log(`   ✅ Imported ${mockData.tutors.length} tutors`);

    // 2. Import Parents
    console.log('\n2. Importing parents...');
    for (const parent of mockData.parents) {
      await connection.query(
        'INSERT INTO parents (id, name, email, children_ids) VALUES (?, ?, ?, ?)',
        [parent.id, parent.name, parent.email, JSON.stringify(parent.childrenIds)]
      );
    }
    console.log(`   ✅ Imported ${mockData.parents.length} parents`);

    // 3. Import Students
    console.log('\n3. Importing students...');
    for (const student of mockData.students) {
      await connection.query(
        'INSERT INTO students (id, name, grade, courses, parent_id) VALUES (?, ?, ?, ?, ?)',
        [student.id, student.name, student.grade, JSON.stringify(student.courses), student.parentId]
      );
    }
    console.log(`   ✅ Imported ${mockData.students.length} students`);

    // 4. Import Tasks
    console.log('\n4. Importing tasks...');
    for (const task of mockData.tasks) {
      await connection.query(
        `INSERT INTO tasks 
         (id, grade, course, topic, instruction, type, note_content, questions, 
          assigned_student_ids, visible_to_parent, created_by, created_at, due_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.grade,
          task.course,
          task.topic,
          task.instruction,
          JSON.stringify(task.type),
          task.noteContent,
          JSON.stringify(task.questions),
          JSON.stringify(task.assignedStudentIds),
          task.visibleToParent ? 1 : 0,
          task.createdBy,
          new Date(task.createdAt),
          task.dueDate ? new Date(task.dueDate) : null
        ]
      );
    }
    console.log(`   ✅ Imported ${mockData.tasks.length} tasks`);

    // 5. Import Student Tasks
    console.log('\n5. Importing student tasks...');
    for (const studentTask of mockData.studentTasks) {
      await connection.query(
        `INSERT INTO student_tasks (task_id, student_id, status, score, completed_at, time_spent)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          studentTask.taskId,
          studentTask.studentId,
          studentTask.status,
          studentTask.score || null,
          studentTask.completedAt ? new Date(studentTask.completedAt) : null,
          studentTask.timeSpent || null
        ]
      );
    }
    console.log(`   ✅ Imported ${mockData.studentTasks.length} student tasks`);

    // Show counts
    console.log('\n=== IMPORT SUMMARY ===');
    const counts = await Promise.all([
      connection.query('SELECT COUNT(*) as count FROM tutors'),
      connection.query('SELECT COUNT(*) as count FROM students'),
      connection.query('SELECT COUNT(*) as count FROM parents'),
      connection.query('SELECT COUNT(*) as count FROM tasks'),
      connection.query('SELECT COUNT(*) as count FROM student_tasks')
    ]);

    console.log(`Tutors: ${counts[0][0][0].count}`);
    console.log(`Students: ${counts[1][0][0].count}`);
    console.log(`Parents: ${counts[2][0][0].count}`);
    console.log(`Tasks: ${counts[3][0][0].count}`);
    console.log(`Student Tasks: ${counts[4][0][0].count}`);

    await connection.end();
    console.log('\n✅ DATA IMPORT COMPLETE!');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.log('Error details:', error);
  }
}

importData();