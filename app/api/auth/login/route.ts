// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const users = await query<any[]>(
      `SELECT id, email, password_hash, role, first_name, last_name, is_active 
       FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await query(
      `INSERT INTO sessions (id, user_id, refresh_token, expires_at) 
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [`session_${Date.now()}`, user.id, refreshToken]
    );

    // Update last login
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Get additional profile info based on role
    let profile = {};
    if (user.role === 'tutor') {
      const [tutor] = await query<any[]>(
        'SELECT id as tutorId FROM tutors WHERE user_id = ?',
        [user.id]
      );
      profile = { ...profile, tutorId: tutor?.tutorId };
    } else if (user.role === 'student') {
      const [student] = await query<any[]>(
        'SELECT id as studentId FROM students WHERE user_id = ?',
        [user.id]
      );
      profile = { ...profile, studentId: student?.studentId };
    } else if (user.role === 'parent') {
      const [parent] = await query<any[]>(
        'SELECT id as parentId FROM parents WHERE user_id = ?',
        [user.id]
      );
      profile = { ...profile, parentId: parent?.parentId };
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        ...profile
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}