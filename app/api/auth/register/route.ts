// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { 
  hashPassword, 
  generateUserId, 
  validateEmail, 
  validatePassword,
  generateAccessToken,
  generateRefreshToken 
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role, grade, childrenEmails } = body;

    // Validation - Updated to include conditional requirements
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format for user
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Updated role validation - removed 'tutor'
    if (!['student', 'parent'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Role-specific validation
    if (role === 'student' && !grade) {
      return NextResponse.json(
        { error: 'Grade is required for student accounts' },
        { status: 400 }
      );
    }

    if (role === 'parent') {
      // Validate children emails if provided
      if (childrenEmails && Array.isArray(childrenEmails)) {
        // Check at least one email is provided
        const nonEmptyEmails = childrenEmails.filter(email => email && email.trim() !== '');
        if (nonEmptyEmails.length === 0) {
          return NextResponse.json(
            { error: 'At least one child email is required for parent accounts' },
            { status: 400 }
          );
        }

        // Validate each child email format
        for (const childEmail of nonEmptyEmails) {
          if (!validateEmail(childEmail)) {
            return NextResponse.json(
              { error: `Invalid email format for child: ${childEmail}` },
              { status: 400 }
            );
          }
        }
      } else {
        // Parents must provide childrenEmails array
        return NextResponse.json(
          { error: 'Children emails are required for parent accounts' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await query<any[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check for existing child accounts if parent is registering
    if (role === 'parent' && childrenEmails) {
      const nonEmptyEmails = childrenEmails.filter(email => email && email.trim() !== '');
      if (nonEmptyEmails.length > 0) {
        const placeholders = nonEmptyEmails.map(() => '?').join(',');
        const existingChildren = await query<any[]>(
          `SELECT email FROM users WHERE email IN (${placeholders}) AND role = 'student'`,
          nonEmptyEmails
        );
        
        // Note: We don't block registration here, just log for future linking
        // You might want to notify the parent about existing accounts
        console.log(`Found ${existingChildren.length} existing student accounts for parent ${email}`);
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = generateUserId(role);

    // Start transaction
    const connection = await (await import('@/lib/db')).default.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      await connection.query(
        `INSERT INTO users (id, email, password_hash, role, first_name, last_name) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, passwordHash, role, firstName, lastName]
      );

      // Create profile based on role - UPDATED
      if (role === 'student') {
        // Parse grade from the frontend value (e.g., "grade_5" -> 5)
        let gradeLevel = 5; // Default
        if (grade && typeof grade === 'string') {
          const gradeMatch = grade.match(/grade_(\d+)/);
          if (gradeMatch) {
            gradeLevel = parseInt(gradeMatch[1], 10);
          } else if (grade === 'grade_college') {
            gradeLevel = 13; // Represent college as 13
          } else if (grade === 'grade_other') {
            gradeLevel = 0; // Represent "other"
          }
        }
        
        await connection.query(
          `INSERT INTO students (id, name, grade, user_id) 
           VALUES (?, ?, ?, ?)`,
          [`student_${Date.now()}`, `${firstName} ${lastName}`, gradeLevel, userId]
        );
      } else if (role === 'parent') {
        await connection.query(
          `INSERT INTO parents (id, name, email, user_id) 
           VALUES (?, ?, ?, ?)`,
          [`parent_${Date.now()}`, `${firstName} ${lastName}`, email, userId]
        );

        // Store children emails for future linking
        if (childrenEmails && Array.isArray(childrenEmails)) {
          const nonEmptyEmails = childrenEmails.filter(email => email && email.trim() !== '');
          
          for (const childEmail of nonEmptyEmails) {
            await connection.query(
              `INSERT INTO parent_child_links (id, parent_id, child_email, status, created_at) 
               VALUES (?, ?, ?, ?, NOW())`,
              [`link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
               userId, 
               childEmail.trim(), 
               'pending'] // pending, linked, invited, etc.
            );
          }
        }
      }
      // Note: Removed tutor creation logic since tutor role is hidden

      // Generate tokens
      const accessToken = generateAccessToken(userId, role);
      const refreshToken = generateRefreshToken();

      // Store refresh token
      await connection.query(
        `INSERT INTO sessions (id, user_id, refresh_token, expires_at) 
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
        [`session_${Date.now()}`, userId, refreshToken]
      );

      await connection.commit();

      // Update last login
      await query(
        'UPDATE users SET last_login_at = NOW() WHERE id = ?',
        [userId]
      );

      // Return response
      return NextResponse.json({
        success: true,
        message: 'Registration successful',
        user: {
          id: userId,
          email,
          role,
          firstName,
          lastName,
          ...(role === 'student' && { grade }),
          ...(role === 'parent' && { 
            childrenEmails: childrenEmails.filter(email => email && email.trim() !== '')
          })
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }, { status: 201 });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}