import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded || typeof decoded === 'string' || decoded.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Check if refresh token exists in database
    const sessions = await query<any[]>(
      `SELECT s.*, u.id as user_id, u.role, u.first_name, u.last_name 
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.refresh_token = ? AND s.expires_at > NOW() AND u.is_active = 1`,
      [refreshToken]
    );

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'Refresh token expired or invalid' },
        { status: 401 }
      );
    }

    const session = sessions[0];

    // Generate new tokens
    const newAccessToken = generateAccessToken(session.user_id, session.role);
    const newRefreshToken = generateRefreshToken();

    // Update session with new refresh token
    await query(
      `UPDATE sessions 
       SET refresh_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
       WHERE id = ?`,
      [newRefreshToken, session.id]
    );

    // Get role-specific ID
    let profile = {};
    if (session.role === 'tutor') {
      const [tutor] = await query<any[]>(
        'SELECT id as tutorId FROM tutors WHERE user_id = ?',
        [session.user_id]
      );
      profile = { ...profile, tutorId: tutor?.tutorId };
    } else if (session.role === 'student') {
      const [student] = await query<any[]>(
        'SELECT id as studentId FROM students WHERE user_id = ?',
        [session.user_id]
      );
      profile = { ...profile, studentId: student?.studentId };
    } else if (session.role === 'parent') {
      const [parent] = await query<any[]>(
        'SELECT id as parentId FROM parents WHERE user_id = ?',
        [session.user_id]
      );
      profile = { ...profile, parentId: parent?.parentId };
    }

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: session.user_id,
        email: session.email,
        role: session.role,
        firstName: session.first_name,
        lastName: session.last_name,
        ...profile
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}