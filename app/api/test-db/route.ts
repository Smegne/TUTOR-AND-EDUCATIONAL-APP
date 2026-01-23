// app/api/test-db/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query, testConnection } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const connectionTest = await testConnection()
    
    // Test various tables
    const tables = ['users', 'tutors', 'students', 'courses']
    const tableStatus: Record<string, boolean> = {}
    
    for (const table of tables) {
      try {
        const [result] = await query<any[]>(`SHOW TABLES LIKE ?`, [table])
        tableStatus[table] = !!result
      } catch (error) {
        tableStatus[table] = false
      }
    }
    
    // Try to get some sample data
    let sampleData = {}
    try {
      const [courseCount] = await query<any[]>(`SELECT COUNT(*) as count FROM courses`)
      const [tutorCount] = await query<any[]>(`SELECT COUNT(*) as count FROM tutors`)
      
      sampleData = {
        courses: courseCount?.count || 0,
        tutors: tutorCount?.count || 0
      }
    } catch (error) {
      sampleData = { error: 'No sample data available' }
    }
    
    return NextResponse.json({
      success: true,
      connection: connectionTest ? 'Connected' : 'Failed',
      database: process.env.DB_NAME,
      tables: tableStatus,
      sampleData,
      environment: {
        dbHost: process.env.DB_HOST,
        dbUser: process.env.DB_USER,
        hasPassword: !!process.env.DB_PASSWORD,
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      environment: {
        dbHost: process.env.DB_HOST,
        dbName: process.env.DB_NAME,
        dbUser: process.env.DB_USER,
        hasPassword: !!process.env.DB_PASSWORD,
      }
    }, { status: 500 })
  }
}