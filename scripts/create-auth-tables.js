// scripts/create-auth-tables.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createAuthTables() {
  console.log('=== Creating Authentication Tables ===\n');
  
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

    // 1. Create users table (for authentication)
    console.log('1. Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('student', 'tutor', 'parent') NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB
    `);
    console.log('   ✅ Users table created');

    // 2. Create password_reset_tokens table
    console.log('\n2. Creating password reset tokens table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(50) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('   ✅ Password reset tokens table created');

    // 3. Create sessions table (for JWT/refresh tokens)
    console.log('\n3. Creating sessions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        refresh_token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_refresh_token (refresh_token),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('   ✅ Sessions table created');

    // 4. Link existing tables to users
    console.log('\n4. Updating existing tables with user references...');
    
    // Add user_id to tutors if not exists
    try {
      await connection.query(`
        ALTER TABLE tutors 
        ADD COLUMN IF NOT EXISTS user_id VARCHAR(50),
        ADD CONSTRAINT fk_tutor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('   ✅ Updated tutors table');
    } catch (error) {
      console.log('   ⚠️ Tutors table already has user_id or error:', error.message);
    }

    // Add user_id to students if not exists
    try {
      await connection.query(`
        ALTER TABLE students 
        ADD COLUMN IF NOT EXISTS user_id VARCHAR(50),
        ADD CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('   ✅ Updated students table');
    } catch (error) {
      console.log('   ⚠️ Students table already has user_id or error:', error.message);
    }

    // Add user_id to parents if not exists
    try {
      await connection.query(`
        ALTER TABLE parents 
        ADD COLUMN IF NOT EXISTS user_id VARCHAR(50),
        ADD CONSTRAINT fk_parent_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('   ✅ Updated parents table');
    } catch (error) {
      console.log('   ⚠️ Parents table already has user_id or error:', error.message);
    }

    // Show tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📊 All tables in database:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });

    await connection.end();
    console.log('\n✅ Authentication tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAuthTables();