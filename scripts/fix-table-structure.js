// scripts/fix-table-structure.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fixTables() {
  console.log('=== Fixing Table Structure ===\n');
  
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

    // List of required columns for each table
    const tableFixes = {
      tasks: [
        'ADD COLUMN IF NOT EXISTS grade INT NOT NULL AFTER id',
        'ADD COLUMN IF NOT EXISTS course VARCHAR(100) NOT NULL AFTER grade',
        'ADD COLUMN IF NOT EXISTS topic VARCHAR(255) NOT NULL AFTER course',
        'ADD COLUMN IF NOT EXISTS instruction TEXT AFTER topic',
        'ADD COLUMN IF NOT EXISTS type JSON AFTER instruction',
        'ADD COLUMN IF NOT EXISTS note_content TEXT AFTER type',
        'ADD COLUMN IF NOT EXISTS questions JSON AFTER note_content',
        'ADD COLUMN IF NOT EXISTS assigned_student_ids JSON AFTER questions',
        'ADD COLUMN IF NOT EXISTS visible_to_parent BOOLEAN DEFAULT FALSE AFTER assigned_student_ids',
        'ADD COLUMN IF NOT EXISTS created_by VARCHAR(50) NOT NULL AFTER visible_to_parent',
        'ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER created_by',
        'ADD COLUMN IF NOT EXISTS due_date DATETIME AFTER created_at',
        'ADD COLUMN IF NOT EXISTS video_link VARCHAR(500) AFTER due_date',
        'ADD COLUMN IF NOT EXISTS images JSON AFTER video_link'
      ],
      
      students: [
        'ADD COLUMN IF NOT EXISTS grade INT NOT NULL AFTER name',
        'ADD COLUMN IF NOT EXISTS courses JSON AFTER grade',
        'ADD COLUMN IF NOT EXISTS parent_id VARCHAR(50) AFTER courses',
        'ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER parent_id'
      ],
      
      tutors: [
        'ADD COLUMN IF NOT EXISTS courses JSON AFTER email',
        'ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER courses'
      ],
      
      parents: [
        'ADD COLUMN IF NOT EXISTS children_ids JSON AFTER email',
        'ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER children_ids'
      ],
      
      student_tasks: [
        'MODIFY COLUMN IF NOT EXISTS status ENUM(\'pending\', \'completed\') DEFAULT \'pending\'',
        'ADD COLUMN IF NOT EXISTS score INT AFTER status',
        'ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL AFTER score',
        'ADD COLUMN IF NOT EXISTS time_spent INT COMMENT \'in minutes\' AFTER completed_at',
        'ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER time_spent',
        'ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
        'ADD UNIQUE INDEX IF NOT EXISTS unique_task_student (task_id, student_id)'
      ]
    };

    // Apply fixes for each table
    for (const [tableName, fixes] of Object.entries(tableFixes)) {
      console.log(`🔧 Fixing ${tableName} table...`);
      
      // Check if table exists
      try {
        const [exists] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
        if (exists.length === 0) {
          console.log(`   ⚠️ Table ${tableName} doesn't exist, skipping`);
          continue;
        }

        let appliedFixes = 0;
        for (const fix of fixes) {
          try {
            await connection.query(`ALTER TABLE ${tableName} ${fix}`);
            appliedFixes++;
          } catch (error) {
            if (!error.message.includes('duplicate') && !error.message.includes('already exists')) {
              console.log(`   ⚠️ Could not apply fix "${fix}": ${error.message}`);
            }
          }
        }
        
        console.log(`   ✅ Applied ${appliedFixes} fixes to ${tableName}`);
        
      } catch (error) {
        console.log(`   ❌ Error with ${tableName}: ${error.message}`);
      }
    }

    // Show final structure
    console.log('\n📊 FINAL STRUCTURE:');
    const tables = ['tasks', 'students', 'tutors', 'parents', 'student_tasks'];
    
    for (const tableName of tables) {
      console.log(`\n${tableName}:`);
      try {
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        columns.forEach(col => {
          console.log(`  - ${col.Field} (${col.Type})`);
        });
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }

    await connection.end();
    console.log('\n✅ Table structure fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixTables();