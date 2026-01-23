// app/api/debug/tutors/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get all tutors
    const tutors = await query(`
      SELECT 
        t.id,
        t.name,
        t.email,
        t.courses,
        t.user_id,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM tutors t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `)
    
    // Get all tasks to see created_by values
    const tasks = await query(`
      SELECT 
        id,
        title,
        created_by,
        subject,
        created_at
      FROM tasks 
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    return NextResponse.json({
      success: true,
      tutors: tutors,
      tasks: tasks,
      tutorCount: tutors.length,
      taskCount: tasks.length
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}