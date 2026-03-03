import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n========== PARENT CHILDREN COURSES API CALLED ==========');
  
  try {
    // Get parent ID from params or URL
    let parentId = params?.id;
    
    if (!parentId) {
      const url = request.url;
      const match = url.match(/\/api\/parent-direct\/([^\/]+)\/children-courses/);
      if (match && match[1]) {
        parentId = match[1];
      }
    }

    console.log('Parent ID:', parentId);

    if (!parentId) {
      return NextResponse.json(
        { error: 'Parent ID is required' },
        { status: 400 }
      );
    }

    // ===========================================
    // STEP 1: Get parent info
    // ===========================================
    const parents = await query<any[]>(
      `SELECT * FROM users WHERE id = ? AND role = 'parent'`,
      [parentId]
    );

    if (parents.length === 0) {
      console.log('No parent found with ID:', parentId);
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    const parent = parents[0];
    console.log('Found parent:', { id: parent.id, email: parent.email });

    // ===========================================
    // STEP 2: Get all linked children for this parent
    // ===========================================
    const childLinks = await query<any[]>(
      `SELECT 
        pcl.*,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email as user_email,
        s.id as student_id,
        s.name as student_name,
        s.grade,
        s.courses as student_courses
       FROM parent_child_links pcl
       LEFT JOIN users u ON u.email = pcl.child_email
       LEFT JOIN students s ON s.user_id = u.id
       WHERE pcl.parent_id = ? AND pcl.status = 'linked'`,
      [parentId]
    );

    console.log(`Found ${childLinks.length} linked children`);

    if (childLinks.length === 0) {
      return NextResponse.json({
        success: true,
        parent: {
          id: parent.id,
          name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim(),
          email: parent.email
        },
        children: []
      });
    }

    // ===========================================
    // STEP 3: Define course templates by grade with banner images
    // ===========================================
    
    // Grade 7 & 8 courses (English names) with banner images
    const grade78Courses = [
      { 
        id: 'math', 
        name: 'Mathematics', 
        amharicName: 'ሂሳብ', 
        code: 'MATH',
        bannerImage: '/images/courses/maths.jpg',
        icon: '/images/courses/maths.jpg'
      },
      { 
        id: 'english', 
        name: 'English', 
        amharicName: 'እንግሊዝኛ', 
        code: 'ENG',
        bannerImage: 'https://kehulum.com/up_asset/b/285/kehulum1700050832544c4fb402.png',
        icon: '/images/courses/english-icon.png'
      },
      { 
        id: 'amharic', 
        name: 'አማርኛ', 
        amharicName: 'አማርኛ', 
        code: 'AMH',
        bannerImage: 'https://kehulum.com/up_asset/b/287/kehulum1700053349f0ac4ef524.png',
        icon: '/images/courses/amharic-icon.png'
      },
      { 
        id: 'general_science', 
        name: 'General Science', 
        amharicName: 'አጠቃላይ ሳይንስ', 
        code: 'SCI',
        bannerImage: 'https://imgv2-1-f.scribdassets.com/img/document/891427239/original/b5a77a6bcc/1?v=1',
        icon: '/images/courses/science-icon.png'
      },
      { 
        id: 'citizenship', 
        name: 'Citizenship', 
        amharicName: 'ስነምግባር', 
        code: 'CIT',
        bannerImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnGk4VcKxPJ7wCo6yCQjaFI_YQ6PDPCJpW3g&s',
        icon: '/images/courses/citizenship-icon.png'
      },
      { 
        id: 'social_science', 
        name: 'ህብረተሰብ ሳይንስ', 
        amharicName: 'ህብረተሰብ ሳይንስ', 
        code: 'SOC',
        bannerImage: 'https://imgv2-1-f.scribdassets.com/img/document/661461933/original/579e4d31c1/1?v=1',
        icon: '/images/courses/social-icon.png'
      },
      { 
        id: 'pva', 
        name: 'ስነ-ጥበብ', 
        amharicName: 'ስነጥበብ', 
        code: 'PVA',
        bannerImage: 'https://imgv2-2-f.scribdassets.com/img/document/749328809/original/0d2d825e58/1?v=1',
        icon: 'https://play-lh.googleusercontent.com/20rotv-koVlxZ50xekvOFwWBWnQhhQVfwv-V-v5fOdV8y40qgW_kiPm3Hl7WJLz8JQ=w526-h296-rw'
      },
      { 
        id: 'hpe', 
        name: 'ስፖርት', 
        amharicName: 'ስፖርት', 
        code: 'HPE',
        bannerImage: 'https://imgv2-1-f.scribdassets.com/img/document/797941887/original/b7f1586a7a/1?v=1',
        icon: '/images/courses/sports-icon.png'
      },
      { 
        id: 'it', 
        name: 'IT', 
        amharicName: 'ኢንፎርሜሽን ቴክኖሎጂ', 
        code: 'IT',
        bannerImage: 'https://kehulum.com/up_asset/b/288/kehulum170005382994f94396d8.png',
        icon: '/images/courses/it-icon.png'
      }
    ];

    // Grade 5 & 6 courses (Amharic names primary) with banner images
    const grade56Courses = [
      { 
        id: 'math', 
        name: 'Mathematics', 
        amharicName: 'ሂሳብ', 
        code: 'MATH',
        bannerImage: 'https://play-lh.googleusercontent.com/g5zKtPFHgCV5n2P2sYMryVV6939fEbbXKb71xMMDPCQSO1GcJtWH-wQZKy28DZJe-w=rw-w512-h320',
        icon: '/images/courses/mathematics-icon.png'
      },
      { 
        id: 'english', 
        name: 'English', 
        amharicName: 'እንግሊዝኛ', 
        code: 'ENG',
        bannerImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuaqWRnNj9c9qnKgvGUyOTgL57awU7P1kElA&s',
        icon: '/images/courses/english-icon.png'
      },
      { 
        id: 'amharic', 
        name: 'Amharic', 
        amharicName: 'አማርኛ', 
        code: 'AMH',
        bannerImage: 'https://dirzon.com//file/telegram/Ethiopian%20Education2/Grade%205%20amharic.png',
        icon: '/images/courses/amharic-icon.png'
      },
      { 
        id: 'environmental_science', 
        name: 'Environmental Science', 
        amharicName: 'አካባቢ ሳይንስ', 
        code: 'SCI',
        bannerImage: 'https://imgv2-1-f.scribdassets.com/img/document/781878099/original/9d44e8c0c1/1?v=1',
        icon: '/images/courses/environmental-icon.png'
      },
      { 
        id: 'civics', 
        name: 'Civics', 
        amharicName: 'ግብረ ግብ', 
        code: 'CIV',
        bannerImage: '/images/courses/civics-banner.jpg',
        icon: '/images/courses/civics-icon.png'
      },
      { 
        id: 'arts', 
        name: 'Arts', 
        amharicName: 'ስነ ጥበብ', 
        code: 'ART',
        bannerImage: '/images/courses/arts-banner.jpg',
        icon: '/images/courses/arts-icon.png'
      },
      { 
        id: 'sports', 
        name: 'Sports', 
        amharicName: 'ስፖርት', 
        code: 'SPT',
        bannerImage: '/images/courses/sports-banner.jpg',
        icon: '/images/courses/sports-icon.png'
      },
      { 
        id: 'geez', 
        name: 'Geez', 
        amharicName: 'ግዕዝ', 
        code: 'GEZ',
        bannerImage: '/images/courses/geez-banner.jpg',
        icon: '/images/courses/geez-icon.png'
      }
    ];

    // ===========================================
    // STEP 4: Process each child and get their courses with real data
    // ===========================================
    const childrenWithCourses = await Promise.all(
      childLinks.map(async (link) => {
        try {
          const studentId = link.student_id;
          const studentGrade = link.grade || 5; // Default to grade 5 if not set
          
          console.log(`Processing child: ${link.student_name || link.child_email}, Grade: ${studentGrade}`);

          // Select course template based on grade
          let courseTemplates;
          let displayLanguage: 'amharic' | 'english';
          
          if (studentGrade >= 7 && studentGrade <= 8) {
            courseTemplates = grade78Courses;
            displayLanguage = 'english';
          } else if (studentGrade >= 5 && studentGrade <= 6) {
            courseTemplates = grade56Courses;
            displayLanguage = 'amharic';
          } else {
            // Default to grade 5-6 for other grades
            courseTemplates = grade56Courses;
            displayLanguage = 'amharic';
          }

          // Get real course data from database if student exists
          let courses = [];
          
          if (studentId) {
            // Get all tasks for this student grouped by subject
            const taskData = await query<any[]>(
              `SELECT 
                t.subject,
                COUNT(*) as total_tasks,
                SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                AVG(CASE WHEN st.status = 'completed' THEN st.score ELSE NULL END) as avg_score
               FROM student_tasks st
               JOIN tasks t ON st.task_id = t.id
               WHERE st.student_id = ?
               GROUP BY t.subject`,
              [studentId]
            );

            // Create a map of subject to task data
            const taskMap = new Map();
            taskData.forEach(item => {
              taskMap.set(item.subject, {
                totalTasks: Number(item.total_tasks) || 0,
                completedTasks: Number(item.completed_tasks) || 0,
                avgScore: Math.round(Number(item.avg_score) || 0)
              });
            });

            // Build courses with real data where available
            courses = courseTemplates.map(template => {
              const taskInfo = taskMap.get(template.id) || {
                totalTasks: 0,
                completedTasks: 0,
                avgScore: 0
              };

              const completionRate = taskInfo.totalTasks > 0 
                ? Math.round((taskInfo.completedTasks / taskInfo.totalTasks) * 100) 
                : 0;

              // Determine course name based on display language
              let courseName;
              if (displayLanguage === 'amharic') {
                courseName = (template as any).amharicName || template.name;
              } else {
                courseName = template.name;
              }

              return {
                id: `${template.id}_g${studentGrade}`,
                name: courseName,
                englishName: template.englishName || template.name,
                amharicName: template.amharicName || template.name,
                code: `${template.code}-G${studentGrade}`,
                grade: studentGrade,
                description: template.description,
                bannerImage: template.bannerImage,
                icon: template.icon,
                completionRate,
                avgScore: taskInfo.avgScore,
                totalTasks: taskInfo.totalTasks,
                completedTasks: taskInfo.completedTasks,
                pendingTasks: taskInfo.totalTasks - taskInfo.completedTasks,
                color: getCourseColor(template.code),
                bgColor: getCourseBgColor(template.code)
              };
            });
          } else {
            // If no student ID, return courses with zero stats but with banner images
            courses = courseTemplates.map(template => ({
              id: `${template.id}_g${studentGrade}`,
              name: displayLanguage === 'amharic' ? (template as any).amharicName || template.name : template.name,
              englishName: template.englishName || template.name,
              amharicName: template.amharicName || template.name,
              code: `${template.code}-G${studentGrade}`,
              grade: studentGrade,
              description: template.description,
              bannerImage: template.bannerImage,
              icon: template.icon,
              completionRate: 0,
              avgScore: 0,
              totalTasks: 0,
              completedTasks: 0,
              pendingTasks: 0,
              color: getCourseColor(template.code),
              bgColor: getCourseBgColor(template.code)
            }));
          }

          // Calculate child statistics
          const stats = calculateChildStats(courses);

          return {
            id: studentId || link.id,
            name: link.student_name || 
                   `${link.first_name || ''} ${link.last_name || ''}`.trim() || 
                   link.child_email?.split('@')[0] || 'Child',
            email: link.child_email,
            grade: studentGrade,
            courses: courses.filter(c => c.totalTasks > 0 || true), // Show all courses even with 0 tasks
            stats,
            displayLanguage
          };

        } catch (error) {
          console.warn(`Error processing child:`, error);
          return null;
        }
      })
    );

    // Filter out any failed children
    const validChildren = childrenWithCourses.filter(child => child !== null);

    console.log(`✅ Successfully processed ${validChildren.length} children`);

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim(),
        email: parent.email
      },
      children: validChildren
    });

  } catch (error) {
    console.error('❌ Error in parent children courses API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch children courses',
        message: error instanceof Error ? error.message : 'Unknown error',
        parent: null,
        children: []
      },
      { status: 500 }
    );
  }
}

// Helper function to get course color
function getCourseColor(code: string): string {
  const colorMap: Record<string, string> = {
    'MATH': 'text-blue-500',
    'ENG': 'text-green-500',
    'AMH': 'text-red-500',
    'SCI': 'text-purple-500',
    'CIT': 'text-orange-500',
    'SOC': 'text-yellow-500',
    'PVA': 'text-pink-500',
    'HPE': 'text-teal-500',
    'IT': 'text-indigo-500',
    'CIV': 'text-orange-500',
    'ART': 'text-pink-500',
    'SPT': 'text-teal-500',
    'GEZ': 'text-indigo-500'
  };
  return colorMap[code] || 'text-primary';
}

// Helper function to get course background color
function getCourseBgColor(code: string): string {
  const colorMap: Record<string, string> = {
    'MATH': 'bg-blue-500/10',
    'ENG': 'bg-green-500/10',
    'AMH': 'bg-red-500/10',
    'SCI': 'bg-purple-500/10',
    'CIT': 'bg-orange-500/10',
    'SOC': 'bg-yellow-500/10',
    'PVA': 'bg-pink-500/10',
    'HPE': 'bg-teal-500/10',
    'IT': 'bg-indigo-500/10',
    'CIV': 'bg-orange-500/10',
    'ART': 'bg-pink-500/10',
    'SPT': 'bg-teal-500/10',
    'GEZ': 'bg-indigo-500/10'
  };
  return colorMap[code] || 'bg-primary/10';
}

// Helper function to calculate child statistics
function calculateChildStats(courses: any[]) {
  const totalTasks = courses.reduce((sum, c) => sum + c.totalTasks, 0);
  const completedTasks = courses.reduce((sum, c) => sum + c.completedTasks, 0);
  const totalScore = courses.reduce((sum, c) => sum + (c.avgScore * c.totalTasks), 0);
  
  // Sort courses for insights
  const sortedByScore = [...courses].sort((a, b) => b.avgScore - a.avgScore);
  const sortedByCompletion = [...courses].sort((a, b) => a.completionRate - b.completionRate);

  return {
    overallCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    averageScore: totalTasks > 0 ? Math.round(totalScore / totalTasks) : 0,
    totalCourses: courses.length,
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
    topPerformingCourse: sortedByScore[0],
    needsAttentionCourse: sortedByCompletion[0]
  };
}