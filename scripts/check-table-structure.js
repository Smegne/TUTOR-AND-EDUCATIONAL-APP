// scripts/check-table-structure.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkStructure() {
  console.log('=== Checking Table Structure ===\n');
  
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

    // Check all tables
    const tables = ['tutors', 'students', 'parents', 'tasks', 'student_tasks', 'student_sessions'];
    
    for (const tableName of tables) {
      console.log(`📋 ${tableName.toUpperCase()} TABLE:`);
      try {
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        if (columns.length > 0) {
          columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
          });
        } else {
          console.log(`  Table doesn't exist`);
        }
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
      console.log('');
    }

    await connection.end();
    console.log('✅ Structure check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStructure();