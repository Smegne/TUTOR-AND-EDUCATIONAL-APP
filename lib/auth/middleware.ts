import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../auth';
import { query } from '../db';

export interface AuthUser {
  userId: string;
  role: 'student' | 'tutor' | 'parent';
  email: string;
  studentId?: string;
  tutorId?: string;
  parentId?: string;
  firstName?: string;
  lastName?: string;
}

export async function authenticate(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === 'string') {
      return null;
    }

    // Get user from database
    const user = await getUserFromDatabase(decoded.userId);
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: ('student' | 'tutor' | 'parent')[]
): Promise<AuthUser | NextResponse> {
  const user = await authenticate(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return user;
}

async function getUserFromDatabase(userId: string): Promise<AuthUser | null> {
  try {
    const sql = `
      SELECT 
        u.id as userId,
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
    
    const [user] = await query<any[]>(sql, [userId]);
    
    if (!user) {
      return null;
    }

    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      studentId: user.studentId,
      tutorId: user.tutorId,
      parentId: user.parentId
    };
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return null;
  }
}

// Helper function to check tutor-student relationship
export async function isTutorTeachingStudent(
  tutorId: string, 
  studentId: string
): Promise<boolean> {
  try {
    const sql = `
      SELECT 1 FROM tutor_students 
      WHERE tutor_id = ? AND student_id = ?
    `;
    
    const [result] = await query<any[]>(sql, [tutorId, studentId]);
    return !!result;
  } catch (error) {
    console.error('Error checking tutor-student relationship:', error);
    return false;
  }
}

// Helper function to check parent-child relationship
export async function isParentOfStudent(
  parentId: string, 
  studentId: string
): Promise<boolean> {
  try {
    // Check direct relationship via students.parent_id
    const sql = `
      SELECT 1 FROM students s
      WHERE s.id = ? AND s.parent_id = ?
    `;
    
    const [result] = await query<any[]>(sql, [studentId, parentId]);
    return !!result;
  } catch (error) {
    console.error('Error checking parent-child relationship:', error);
    return false;
  }
}