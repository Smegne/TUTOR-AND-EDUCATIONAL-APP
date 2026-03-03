// app/api/student-direct/[id]/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n========== STUDENT COURSES API CALLED ==========');
  
  try {
    // Get student ID from params or URL
    let studentId = params?.id;
    
    if (!studentId) {
      const url = request.url;
      const match = url.match(/\/api\/student-direct\/([^\/]+)\/courses/);
      if (match && match[1]) {
        studentId = match[1];
      }
    }

    console.log('Student ID:', studentId);

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // ===========================================
    // STEP 1: Get student info from database
    // ===========================================
    const students = await query<any[]>(
      `SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ? OR s.user_id = ?`,
      [studentId, studentId]
    );

    if (students.length === 0) {
      console.log('No student found with ID:', studentId);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const student = students[0];
    const studentGrade = student.grade || 5; // Default to grade 5 if not set
    
    console.log('Found student:', { 
      id: student.id, 
      name: student.name,
      grade: studentGrade 
    });

    // ===========================================
    // STEP 2: Define course lists based on grade with banner images
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

    // Select course list based on grade
    let courseTemplates;
    let displayLanguage: 'amharic' | 'english' = 'english';
    
    if (studentGrade >= 7 && studentGrade <= 8) {
      courseTemplates = grade78Courses;
      displayLanguage = 'english';
    } else if (studentGrade >= 5 && studentGrade <= 6) {
      courseTemplates = grade56Courses;
      displayLanguage = 'amharic';
    } else {
      // Default to grade 5-6 courses for other grades
      courseTemplates = grade56Courses;
      displayLanguage = 'amharic';
    }

    // ===========================================
    // STEP 3: Build full course IDs with grade
    // ===========================================
    const courseIds = courseTemplates.map(template => 
      `${template.id}_g${studentGrade}`
    );

    // ===========================================
    // STEP 4: Get task statistics for each course
    // ===========================================
    const coursesWithStats = await Promise.all(
      courseIds.map(async (courseId, index) => {
        const template = courseTemplates[index];
        
        try {
          // Get tasks for this specific course and student
          const tasks = await query<any[]>(
            `SELECT 
              COUNT(*) as total_tasks,
              SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
              AVG(CASE WHEN st.status = 'completed' THEN st.score ELSE NULL END) as average_score
             FROM tasks t
             LEFT JOIN student_tasks st ON t.id = st.task_id AND st.student_id = ?
             WHERE t.subject = ? 
               AND t.grade_level = ?`,
            [student.id, template.id, studentGrade]
          );

          const totalTasks = Number(tasks[0]?.total_tasks) || 0;
          const completedTasks = Number(tasks[0]?.completed_tasks) || 0;
          const averageScore = Math.round(Number(tasks[0]?.average_score) || 0);
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return {
            id: courseId,
            name: displayLanguage === 'amharic' ? template.amharicName : template.name,
            englishName: template.name,
            amharicName: template.amharicName,
            code: `${template.code}-G${studentGrade}`,
            grade: studentGrade,
            description: getCourseDescription(template.id, studentGrade, displayLanguage),
            bannerImage: template.bannerImage,
            icon: template.icon,
            totalTasks,
            completedTasks,
            averageScore,
            progress,
            tasksUrl: `/dashboard/student/tasks?course=${template.id}&grade=${studentGrade}`
          };
        } catch (error) {
          console.warn(`Could not fetch stats for course ${courseId}:`, error);
          return {
            id: courseId,
            name: displayLanguage === 'amharic' ? template.amharicName : template.name,
            englishName: template.name,
            amharicName: template.amharicName,
            code: `${template.code}-G${studentGrade}`,
            grade: studentGrade,
            description: getCourseDescription(template.id, studentGrade, displayLanguage),
            bannerImage: template.bannerImage,
            icon: template.icon,
            totalTasks: 0,
            completedTasks: 0,
            averageScore: 0,
            progress: 0,
            tasksUrl: `/dashboard/student/tasks?course=${template.id}&grade=${studentGrade}`
          };
        }
      })
    );

    // Filter out courses with no tasks (optional - remove if you want to show all courses)
    // const coursesWithContent = coursesWithStats.filter(course => course.totalTasks > 0);
    const coursesWithContent = coursesWithStats; // Keep all courses even if no tasks

    // ===========================================
    // STEP 5: Calculate overall statistics
    // ===========================================
    const overallStats = {
      totalCourses: coursesWithContent.length,
      averageProgress: coursesWithContent.length > 0 
        ? Math.round(coursesWithContent.reduce((sum, course) => sum + course.progress, 0) / coursesWithContent.length)
        : 0,
      totalTasks: coursesWithContent.reduce((sum, course) => sum + course.totalTasks, 0),
      completedTasks: coursesWithContent.reduce((sum, course) => sum + course.completedTasks, 0),
      averageScore: coursesWithContent.length > 0
        ? Math.round(coursesWithContent.reduce((sum, course) => sum + (course.averageScore || 0), 0) / coursesWithContent.length)
        : 0
    };

    console.log('✅ Student courses API call successful!');
    console.log(`Returning ${coursesWithContent.length} courses for grade ${studentGrade}`);
    console.log('Sample course with banner:', coursesWithContent[0]?.bannerImage);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        email: student.email,
        grade: studentGrade
      },
      courses: coursesWithContent,
      stats: overallStats,
      displayLanguage
    });

  } catch (error) {
    console.error('❌ Error in student courses API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch student courses',
        message: error instanceof Error ? error.message : 'Unknown error',
        student: null,
        courses: [],
        stats: {
          totalCourses: 0,
          averageProgress: 0,
          totalTasks: 0,
          completedTasks: 0,
          averageScore: 0
        }
      },
      { status: 500 }
    );
  }
}

// Helper function to get course descriptions
function getCourseDescription(courseId: string, grade: number, language: 'amharic' | 'english'): string {
  const descriptions: Record<string, { amharic: string, english: string }> = {
    'math': {
      amharic: 'መሰረታዊ ሒሳብ፣ ጂኦሜትሪ እና ችግር መፍታት',
      english: 'Basic arithmetic, geometry, and problem solving'
    },
    'english': {
      amharic: 'ማንበብ፣ መጻፍ እና የንግግር ክህሎቶች',
      english: 'Reading, writing, and communication skills'
    },
    'amharic': {
      amharic: 'የአማርኛ ቋንቋ እና ስነጽሁፍ',
      english: 'Amharic language and literature'
    },
    'general_science': {
      amharic: 'የባዮሎጂ፣ ፊዚክስ እና ኬሚስትሪ መሰረታዊ ትውውቅ',
      english: 'Introduction to biology, physics, and chemistry'
    },
    'environmental_science': {
      amharic: 'የአካባቢ ሳይንስ፣ የተፈጥሮ ሀብት እና ስነ-ምህዳር',
      english: 'Environmental science, natural resources, and ecology'
    },
    'social_science': {
      amharic: 'ታሪክ፣ ስነምድር እና ማህበራዊ ጥናት',
      english: 'History, geography, and social studies'
    },
    'citizenship': {
      amharic: 'የሲቪክ ትምህርት እና ስነምግባር',
      english: 'Civic education and ethical values'
    },
    'civics': {
      amharic: 'የሲቪክ ትምህርት፣ ዴሞክራሲ እና ዜግነት',
      english: 'Civic education, democracy, and citizenship'
    },
    'pva': {
      amharic: 'የስነጥበብ እና የሙያ ትምህርት',
      english: 'Physical and vocational arts education'
    },
    'arts': {
      amharic: 'ስነጥበብ፣ ሥዕል እና የእጅ ሥራዎች',
      english: 'Arts, painting, and handicrafts'
    },
    'hpe': {
      amharic: 'ጤና እና አካላዊ ትምህርት',
      english: 'Health and physical education'
    },
    'sports': {
      amharic: 'አካላዊ ትምህርት፣ ስፖርት እና የጤና እንክብካቤ',
      english: 'Physical education, sports, and health care'
    },
    'it': {
      amharic: 'የኢንፎርሜሽን ቴክኖሎጂ እና የኮምፒውተር መሰረታዊ እውቀት',
      english: 'Information technology and computer basics'
    },
    'geez': {
      amharic: 'የግዕዝ ቋንቋ፣ ፊደል እና ጥንታዊ ጽሑፎች',
      english: 'Geez language, alphabet, and ancient literature'
    }
  };

  const desc = descriptions[courseId] || {
    amharic: 'የኮርስ መግለጫ አይገኝም',
    english: 'Course description not available'
  };

  return language === 'amharic' ? desc.amharic : desc.english;
}

// Optional: Helper function to get banner images by subject
export function getSubjectBannerImage(subjectId: string): string {
  const bannerMap: Record<string, string> = {
    'math': '/images/courses/mathematics-banner.jpg',
    'english': '/images/courses/english-banner.jpg',
    'amharic': '/images/courses/amharic-banner.jpg',
    'general_science': '/images/courses/science-banner.jpg',
    'environmental_science': '/images/courses/environmental-banner.jpg',
    'social_science': '/images/courses/social-banner.jpg',
    'citizenship': '/images/courses/citizenship-banner.jpg',
    'civics': '/images/courses/civics-banner.jpg',
    'pva': '/images/courses/arts-banner.jpg',
    'arts': '/images/courses/arts-banner.jpg',
    'hpe': '/images/courses/sports-banner.jpg',
    'sports': '/images/courses/sports-banner.jpg',
    'it': '/images/courses/it-banner.jpg',
    'geez': '/images/courses/geez-banner.jpg'
  };
  
  return bannerMap[subjectId] || '/images/courses/default-banner.jpg';
}

// Optional: Helper function to get icon images by subject
export function getSubjectIcon(subjectId: string): string {
  const iconMap: Record<string, string> = {
    'math': '/images/courses/mathematics-icon.png',
    'english': '/images/courses/english-icon.png',
    'amharic': '/images/courses/amharic-icon.png',
    'general_science': '/images/courses/science-icon.png',
    'environmental_science': '/images/courses/environmental-icon.png',
    'social_science': '/images/courses/social-icon.png',
    'citizenship': '/images/courses/citizenship-icon.png',
    'civics': '/images/courses/civics-icon.png',
    'pva': '/images/courses/arts-icon.png',
    'arts': '/images/courses/arts-icon.png',
    'hpe': '/images/courses/sports-icon.png',
    'sports': '/images/courses/sports-icon.png',
    'it': '/images/courses/it-icon.png',
    'geez': '/images/courses/geez-icon.png'
  };
  
  return iconMap[subjectId] || '/images/courses/default-icon.png';
}