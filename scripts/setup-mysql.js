// scripts/setup-mysql.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('=== MySQL Database Setup ===\n');
  
  // Get database credentials
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  console.log('Configuration:');
  console.log(`- Host: ${config.host}`);
  console.log(`- Port: ${config.port}`);
  console.log(`- User: ${config.user}`);
  console.log(`- Password: ${config.password ? '*** (set)' : 'NOT SET'}\n`);

  try {
    // 1. Connect to MySQL server
    console.log('1. Connecting to MySQL server...');
    const connection = await mysql.createConnection(config);
    console.log('   ✅ Connected to MySQL server\n');

    // 2. Create database
    console.log('2. Creating database...');
    await connection.query('CREATE DATABASE IF NOT EXISTS educational_app');
    await connection.query('USE educational_app');
    console.log('   ✅ Database "educational_app" created/selected\n');

    // 3. Create tables
    console.log('3. Creating tables...');
    
    const tables = [
      `CREATE TABLE IF NOT EXISTS tutors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        courses JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      
      `CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        grade INT NOT NULL,
        courses JSON,
        parent_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_grade (grade),
        INDEX idx_parent (parent_id)
      ) ENGINE=InnoDB`,
      
      `CREATE TABLE IF NOT EXISTS parents (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        children_ids JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
      
      `CREATE TABLE IF NOT EXISTS tasks (
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
        images JSON,
        INDEX idx_grade_course (grade, course),
        INDEX idx_created_by (created_by),
        INDEX idx_due_date (due_date)
      ) ENGINE=InnoDB`,
      
      `CREATE TABLE IF NOT EXISTS student_tasks (
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
        INDEX idx_task_id (task_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      
      `CREATE TABLE IF NOT EXISTS student_sessions (
        id VARCHAR(50) PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logout_time TIMESTAMP NULL,
        duration INT COMMENT 'in minutes',
        device_info VARCHAR(255),
        INDEX idx_student_login (student_id, login_time),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`
    ];

    for (let i = 0; i < tables.length; i++) {
      await connection.query(tables[i]);
      console.log(`   ✅ Table ${i + 1} created`);
    }
    
    console.log('\n   ✅ All tables created successfully\n');

    // 4. Show table status
    console.log('4. Database status:');
    const [tablesList] = await connection.query('SHOW TABLES');
    console.log('   Tables in database:', tablesList.map(t => Object.values(t)[0]).join(', '));

    // 5. Close connection
    await connection.end();
    console.log('\n   ✅ Connection closed');
    console.log('\n=== SETUP COMPLETE ===');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/import-mock-data.js');
    console.log('2. Update lib/api.ts (set USE_MOCK_DATA = false)');
    console.log('3. Restart dev server: npm run dev');
    
  } catch (error) {
    console.error('\n❌ SETUP FAILED:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Is MySQL running? (net start mysql)');
    console.log('2. Check password in .env.local');
    console.log('3. Try: mysql -u root -p (to test connection)');
    console.log('4. Error details:', error.code);
  }
}

setupDatabase();