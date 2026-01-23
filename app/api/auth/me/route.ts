import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get user from database
    const sql = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.first_name,
        u.last_name,
        s.id as studentId,
        t.id as tutorId,
        p.id as parentId
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN tutors t ON u.id = t.user_id
      LEFT JOIN parents p ON u.id = p.user_id
      WHERE u.id = ? AND u.is_active = 1
    `;
    
    const [user] = await query<any[]>(sql, [decoded.userId]);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      studentId: user.studentId,
      tutorId: user.tutorId,
      parentId: user.parentId
    });
    
  } catch (error) {
    console.error('Error in auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}