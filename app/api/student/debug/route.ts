// app/api/student/debug/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG ENDPOINT START ===')
    
    // Check database connection
    let connectionTest: any
    try {
      connectionTest = await query('SELECT 1 as test')
      console.log('Connection test result:', connectionTest)
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError.message)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbError.message,
        environment: {
          dbHost: process.env.DB_HOST,
          dbUser: process.env.DB_USER,
          dbName: process.env.DB_NAME
        }
      }, { status: 500 })
    }

    // Check tables - FIXED: Handle MySQL result format
    let tables: string[] = []
    try {
      // MySQL returns [rows, fields] array
      const tablesResult = await query('SHOW TABLES') as any[]
      console.log('Tables result structure:', Array.isArray(tablesResult), tablesResult)
      
      // The result is an array of objects like { Tables_in_database_name: 'table_name' }
      if (Array.isArray(tablesResult) && tablesResult.length > 0) {
        // Get the first key (database name varies)
        const firstRow = tablesResult[0]
        const tableKey = Object.keys(firstRow)[0] // e.g., 'Tables_in_educational_app'
        
        tables = tablesResult.map((row: any) => row[tableKey])
      }
      console.log('Found tables:', tables)
    } catch (tablesError: any) {
      console.error('Error checking tables:', tablesError.message)
    }

    // Check specific student exists
    const studentId = 'student_1767718447749'
    let studentExists = false
    let studentData = null
    
    if (tables.includes('students')) {
      try {
        const studentResult = await query(
          'SELECT id, name FROM students WHERE id = ?',
          [studentId]
        ) as any[]
        
        if (Array.isArray(studentResult) && studentResult.length > 0) {
          studentExists = true
          studentData = studentResult[0]
        }
      } catch (error) {
        console.log('Error checking student:', error)
      }
    }

    // Check tasks
    let taskCount = 0
    if (tables.includes('tasks')) {
      try {
        const taskResult = await query('SELECT COUNT(*) as count FROM tasks') as any[]
        if (Array.isArray(taskResult) && taskResult.length > 0) {
          taskCount = taskResult[0].count
        }
      } catch (error) {
        console.log('Error checking tasks:', error)
      }
    }

    // Check student_tasks
    let studentTaskCount = 0
    if (tables.includes('student_tasks')) {
      try {
        const studentTaskResult = await query(
          'SELECT COUNT(*) as count FROM student_tasks WHERE student_id = ?',
          [studentId]
        ) as any[]
        
        if (Array.isArray(studentTaskResult) && studentTaskResult.length > 0) {
          studentTaskCount = studentTaskResult[0].count
        }
      } catch (error) {
        console.log('Error checking student_tasks:', error)
      }
    }

    console.log('=== DEBUG ENDPOINT END ===')

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        name: process.env.DB_NAME,
        connectionTest: connectionTest
      },
      tables: tables,
      student: {
        id: studentId,
        exists: studentExists,
        data: studentData
      },
      counts: {
        tasks: taskCount,
        student_tasks_for_this_student: studentTaskCount
      },
      environment: {
        dbHost: process.env.DB_HOST,
        dbUser: process.env.DB_USER,
        nodeEnv: process.env.NODE_ENV,
        tablesFound: tables.length
      }
    })
    
  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in debug endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      environment: {
        dbHost: process.env.DB_HOST,
        dbUser: process.env.DB_USER,
        dbName: process.env.DB_NAME,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 })
  }
}