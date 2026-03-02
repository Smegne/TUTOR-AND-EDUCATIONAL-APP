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
    // STEP 2: Define course lists based on grade
    // ===========================================
    
    // Grade 7 & 8 courses (English names)
    const grade78Courses = [
      { id: 'math', name: 'Mathematics', amharicName: 'ሂሳብ', code: 'MATH' ,'bannerImage': '/images/maths.jpg' },
      { id: 'english', name: 'English', amharicName: 'English', code: 'ENG' },
      { id: 'amharic', name: 'አማርኛ', amharicName: 'አማርኛ', code: 'AMH' },
      { id: 'general_science', name: 'General Science', amharicName: 'አጠቃላይ ሳይንስ', code: 'SCI' },
      { id: 'citizenship', name: 'Citizenship', amharicName: 'ስነምግባር', code: 'CIT' },
      { id: 'social_science', name: 'ህብረተሰብ ሳይንስ', amharicName: 'ህብረተሰብ ሳይንስ', code: 'SOC' },
      { id: 'pva', name: 'ስነ-ጥበብ', amharicName: 'ስነጥበብ', code: 'PVA' },
      { id: 'hpe', name: 'ስፖርት', amharicName: 'ስፖርት', code: 'HPE' },
      { id: 'it', name: 'IT', amharicName: 'ኢንፎርሜሽን ቴክኖሎጂ', code: 'IT' }
    ];

    // Grade 5 & 6 courses (Amharic names primary)
    const grade56Courses = [
      { id: 'math', name: 'Mathematics', amharicName: 'ሂሳብ', code: 'MATH' },
      { id: 'english', name: 'English', amharicName: 'እንግሊዝኛ', code: 'ENG' },
      { id: 'amharic', name: 'Amharic', amharicName: 'አማርኛ', code: 'AMH' },
      { id: 'environmental_science', name: 'Environmental Science', amharicName: 'አካባቢ ሳይንስ', code: 'SCI' },
      { id: 'civics', name: 'Civics', amharicName: 'ግብረ ግብ', code: 'CIV' },
      { id: 'arts', name: 'Arts', amharicName: 'ስነ ጥበብ', code: 'ART' },
      { id: 'sports', name: 'Sports', amharicName: 'ስፖርት', code: 'SPT' },
      { id: 'geez', name: 'Geez', amharicName: 'ግዕዝ', code: 'GEZ' }
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
            totalTasks: 0,
            completedTasks: 0,
            averageScore: 0,
            progress: 0,
            tasksUrl: `/dashboard/student/tasks?course=${template.id}&grade=${studentGrade}`
          };
        }
      })
    );

    // ===========================================
    // STEP 5: Calculate overall statistics
    // ===========================================
    const overallStats = {
      totalCourses: coursesWithStats.length,
      averageProgress: coursesWithStats.length > 0 
        ? Math.round(coursesWithStats.reduce((sum, course) => sum + course.progress, 0) / coursesWithStats.length)
        : 0,
      totalTasks: coursesWithStats.reduce((sum, course) => sum + course.totalTasks, 0),
      completedTasks: coursesWithStats.reduce((sum, course) => sum + course.completedTasks, 0),
      averageScore: coursesWithStats.length > 0
        ? Math.round(coursesWithStats.reduce((sum, course) => sum + (course.averageScore || 0), 0) / coursesWithStats.length)
        : 0
    };

    console.log('✅ Student courses API call successful!');
    console.log(`Returning ${coursesWithStats.length} courses for grade ${studentGrade}`);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        email: student.email,
        grade: studentGrade
      },
      courses: coursesWithStats,
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
    'social_science': {
      amharic: 'ታሪክ፣ ስነምድር እና ማህበራዊ ጥናት',
      english: 'History, geography, and social studies'
    },
    'citizenship': {
      amharic: 'የሲቪክ ትምህርት እና ስነምግባር',
      english: 'Civic education and ethical values'
    },
    'pva': {
      amharic: 'የስነጥበብ እና የሙያ ትምህርት',
      english: 'Physical and vocational arts education'
    },
    'hpe': {
      amharic: 'ጤና እና አካላዊ ትምህርት',
      english: 'Health and physical education'
    },
    'it': {
      amharic: 'የኢንፎርሜሽን ቴክኖሎጂ እና የኮምፒውተር መሰረታዊ እውቀት',
      english: 'Information technology and computer basics'
    },
    'environmental_science': {
      amharic: 'የተፈጥሮ ሳይንስ መሰረታዊ እውቀት',
      english: 'Basic knowledge of natural science'
    },
    'civics': {
      amharic: 'የሲቪክ ትምህርት እና ስነምግባር',
      english: 'Civic education and ethics'
    },
    'arts': {
      amharic: 'ስነጥበብ እና ፈጠራዊ ሥራዎች',
      english: 'Arts and creative works'
    },
    'sports': {
      amharic: 'አካላዊ ትምህርት እና የስፖርት እንቅስቃሴዎች',
      english: 'Physical education and sports activities'
    },
    'geez': {
      amharic: 'የግዕዝ ቋንቋ እና ሥነ ጽሑፍ',
      english: 'Geez language and literature'
    }
  };

  const desc = descriptions[courseId] || {
    amharic: 'የኮርስ መግለጫ አይገኝም',
    english: 'Course description not available'
  };

  return language === 'amharic' ? desc.amharic : desc.english;
}