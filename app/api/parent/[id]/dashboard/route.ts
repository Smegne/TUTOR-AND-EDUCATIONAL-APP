// app/api/parent/[id]/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n========== PARENT DASHBOARD API ==========');
  
  try {
    // METHOD 1: Try to get from params (sometimes works)
    let parentId = params?.id;
    
    // METHOD 2: If params is empty, extract from URL
    if (!parentId) {
      const url = request.url;
      console.log('Params empty, extracting from URL:', url);
      
      // Extract ID from URL pattern: /api/parent/[id]/dashboard
      const match = url.match(/\/api\/parent\/([^\/]+)\/dashboard/);
      if (match && match[1]) {
        parentId = match[1];
        console.log('Extracted ID from URL:', parentId);
      }
    }
    
    // METHOD 3: Try to get from pathname
    if (!parentId) {
      const pathname = new URL(request.url).pathname;
      const parts = pathname.split('/');
      // /api/parent/[id]/dashboard -> index of [id] is 3
      if (parts.length >= 4 && parts[2] === 'parent') {
        parentId = parts[3];
        console.log('Extracted ID from pathname:', parentId);
      }
    }
    
    console.log('Final parentId:', parentId);
    
    if (!parentId) {
      console.log('❌ Could not extract parentId from anywhere!');
      return NextResponse.json(
        { 
          error: 'Parent ID is required',
          debug: {
            params,
            url: request.url,
            pathname: new URL(request.url).pathname
          }
        },
        { status: 400 }
      );
    }
    
    // ===========================================
    // Now proceed with your database queries
    // ===========================================
    console.log('Looking up parent with ID:', parentId);
    
    // Get the parent from users table
    const users = await query<any[]>(
      `SELECT * FROM users WHERE id = ? AND role = 'parent'`,
      [parentId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    const parent = users[0];
    
    // Get child links
    const childLinks = await query<any[]>(
      `SELECT 
        pcl.*,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email as user_email,
        s.id as student_id,
        s.grade,
        s.courses,
        s.name as student_name
       FROM parent_child_links pcl
       LEFT JOIN users u ON u.email = pcl.child_email
       LEFT JOIN students s ON s.user_id = u.id
       WHERE pcl.parent_id = ?`,
      [parentId]
    );

    // Process children data
    const children = childLinks.map(link => {
      const childId = link.student_id || link.user_id || `pending_${link.id}`;
      
      return {
        id: childId,
        userId: link.user_id || null,
        name: link.student_name || 
              link.child_name ||
              (link.first_name && link.last_name ? `${link.first_name} ${link.last_name}`.trim() : 
              link.child_email?.split('@')[0] || 'Child'),
        email: link.child_email || null,
        grade: link.grade || 0,
        courses: Array.isArray(link.courses) ? link.courses : [],
        parentId: parent.id,
        status: link.status || 'pending',
        linkedAt: link.linked_at || null,
        invitationSentAt: link.invitation_sent_at || null,
        createdAt: link.created_at || null
      };
    });

    // Calculate stats
    const stats = {
      todaysCompleted: 0,
      todaysTotal: 0,
      todaysProgress: 0,
      weeklyStreak: 0,
      weeklyCompleted: 0,
      weeklyTotal: 0,
      weeklyProgress: 0,
      avgScore: 0,
      totalChildren: children.length,
      linkedChildren: children.filter(c => c.status === 'linked').length,
      pendingChildren: children.filter(c => c.status === 'pending' || c.status === 'invited').length
    };

    console.log('✅ API call successful!');
    console.log(`Returning ${children.length} children`);

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        userId: parent.id,
        name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim() || 'Parent',
        email: parent.email || ''
      },
      children: children,
      tasks: [],
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch parent dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}