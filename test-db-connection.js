// test-db-connection.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('Testing MySQL connection...\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'educational_app',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  console.log('Using configuration:');
  console.log('- Host:', config.host);
  console.log('- Port:', config.port);
  console.log('- Database:', config.database);
  console.log('- User:', config.user);
  console.log('- Password:', config.password ? '***' : '(not set)');
  
  try {
    // Test connection
    const connection = await mysql.createConnection(config);
    console.log('\n✅ SUCCESS: Connected to MySQL!');
    
    // Test query
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('✅ Query test:', rows[0].result);
    
    // Check tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('✅ Tables found:', tables.length);
    
    await connection.end();
    console.log('\n✅ All tests passed! MySQL is ready.');
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Is MySQL running? (net start mysql)');
    console.log('2. Check .env.local password');
    console.log('3. Test with: mysql -u root -p');
    console.log('4. Error code:', error.code);
    return false;
  }
}

testConnection();