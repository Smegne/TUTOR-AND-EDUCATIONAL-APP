// scripts/create-missing-tables.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createMissingTables() {
  console.log('=== Creating Missing Tables ===\n');
  
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

    // List of required tables
    const requiredTables = [
      'tutors',
      'students', 
      'parents',
      'tasks',
      'student_tasks',
      'student_sessions'
    ];

    // Check which tables exist
    const [existingTables] = await connection.query('SHOW TABLES');
    const existingTableNames = existingTables.map(t => Object.values(t)[0]);
    
    console.log('📊 Existing tables:', existingTableNames.join(', '));
    
    const missingTables = requiredTables.filter(table => 
      !existingTableNames.includes(table)
    );
    
    console.log('🔍 Missing tables:', missingTables.length > 0 ? missingTables.join(', ') : 'None');

    // Create missing tables
    const tableDefinitions = {
      tutors: `
        CREATE TABLE IF NOT EXISTS tutors (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          courses JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `,
      
      students: `
        CREATE TABLE IF NOT EXISTS students (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          grade INT NOT NULL,
          courses JSON,
          parent_id VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `,
      
      parents: `
        CREATE TABLE IF NOT EXISTS parents (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          children_ids JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `,
      
      tasks: `
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(50) PRIMARY KEY,
          grade INT NOT NULL,
          course VARCHAR(100) NOT NULL,
          topic VARCHAR(255) NOT NULL,
          instruction TEXT,
          type JSON,
          note_content TEXT,
          questions JSON,
          assigned_student_ids JSON,
          visible_to_parent BOOLEAN DEFAULT FALSE,
          created_by VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          due_date DATETIME,
          video_link VARCHAR(500),
          images JSON
        ) ENGINE=InnoDB
      `,
      
      student_tasks: `
        CREATE TABLE IF NOT EXISTS student_tasks (
          id INT PRIMARY KEY AUTO_INCREMENT,
          task_id VARCHAR(50) NOT NULL,
          student_id VARCHAR(50) NOT NULL,
          status ENUM('pending', 'completed') DEFAULT 'pending',
          score INT,
          completed_at TIMESTAMP NULL,
          time_spent INT COMMENT 'in minutes',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_task_student (task_id, student_id),
          INDEX idx_student_status (student_id, status),
          INDEX idx_task_id (task_id)
        ) ENGINE=InnoDB
      `,
      
      student_sessions: `
        CREATE TABLE IF NOT EXISTS student_sessions (
          id VARCHAR(50) PRIMARY KEY,
          student_id VARCHAR(50) NOT NULL,
          login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          logout_time TIMESTAMP NULL,
          duration INT COMMENT 'in minutes',
          device_info VARCHAR(255)
        ) ENGINE=InnoDB
      `
    };

    // Create missing tables
    for (const tableName of missingTables) {
      if (tableDefinitions[tableName]) {
        console.log(`\n📝 Creating ${tableName} table...`);
        await connection.query(tableDefinitions[tableName]);
        console.log(`   ✅ ${tableName} table created`);
      }
    }

    // Show final table list
    const [finalTables] = await connection.query('SHOW TABLES');
    console.log('\n🎉 Final tables:');
    finalTables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });

    await connection.end();
    console.log('\n✅ Missing tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createMissingTables();