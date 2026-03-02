// app/api/tutor-direct/[id]/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n========== TUTOR COURSES API CALLED ==========');
  
  try {
    // Get tutor ID from params or URL
    let tutorId = params?.id;
    
    if (!tutorId) {
      const url = request.url;
      const match = url.match(/\/api\/tutor-direct\/([^\/]+)\/courses/);
      if (match && match[1]) {
        tutorId = match[1];
      }
    }

    console.log('Tutor ID:', tutorId);

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required' },
        { status: 400 }
      );
    }

    // ===========================================
    // STEP 1: Get tutor info
    // ===========================================
    const tutors = await query<any[]>(
      `SELECT 
        t.*,
        u.first_name,
        u.last_name,
        u.email
       FROM tutors t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ? OR t.user_id = ?`,
      [tutorId, tutorId]
    );

    if (tutors.length === 0) {
      console.log('No tutor found with ID:', tutorId);
      
      // Try to find in users table as fallback
      const users = await query<any[]>(
        `SELECT * FROM users WHERE id = ? AND role = 'tutor'`,
        [tutorId]
      );
      
      if (users.length === 0) {
        return NextResponse.json(
          { error: 'Tutor not found' },
          { status: 404 }
        );
      }
      
      // Create a temporary tutor object from user
      const user = users[0];
      return NextResponse.json({
        success: true,
        tutor: {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email
        },
        courses: [],
        stats: {}
      });
    }

    const tutor = tutors[0];
    console.log('Found tutor:', { 
      id: tutor.id, 
      name: tutor.name,
      email: tutor.email 
    });

    // ===========================================
    // STEP 2: Check if tutor_courses table exists
    // ===========================================
    let tutorCourses = [];
    try {
      tutorCourses = await query<any[]>(
        `SELECT 
          tc.*,
          c.id as course_id,
          c.name as course_name,
          c.subject,
          c.grade_level,
          c.description
         FROM tutor_courses tc
         JOIN courses c ON tc.course_id = c.id
         WHERE tc.tutor_id = ?`,
        [tutor.id]
      );
    } catch (tableError) {
      console.log('tutor_courses table might not exist:', tableError.message);
      // Return empty if table doesn't exist
      return NextResponse.json({
        success: true,
        tutor: {
          id: tutor.id,
          name: tutor.name || `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim(),
          email: tutor.email
        },
        courses: [],
        stats: {}
      });
    }

    console.log(`Found ${tutorCourses.length} courses for tutor`);

    if (tutorCourses.length === 0) {
      return NextResponse.json({
        success: true,
        tutor: {
          id: tutor.id,
          name: tutor.name || `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim(),
          email: tutor.email
        },
        courses: [],
        stats: {}
      });
    }

    // ===========================================
    // STEP 3: Get students enrolled in these courses
    // ===========================================
    const courseIds = tutorCourses.map(c => c.course_id);
    const placeholders = courseIds.map(() => '?').join(',');
    
    let courseEnrollments = [];
    try {
      courseEnrollments = await query<any[]>(
        `SELECT 
          course_id,
          COUNT(*) as student_count
         FROM student_courses
         WHERE course_id IN (${placeholders})
         GROUP BY course_id`,
        courseIds
      );
    } catch (error) {
      console.log('student_courses table might not exist:', error.message);
      courseEnrollments = [];
    }

    // Create map of course_id -> student_count
    const enrollmentMap = new Map();
    courseEnrollments.forEach(item => {
      enrollmentMap.set(item.course_id, Number(item.student_count));
    });

    // ===========================================
    // STEP 4: Get task statistics for each course
    // ===========================================
    let courseStats = [];
    try {
      courseStats = await query<any[]>(
        `SELECT 
          t.course_id,
          COUNT(DISTINCT t.id) as total_tasks,
          COUNT(DISTINCT CASE WHEN st.status = 'completed' THEN st.id END) as completed_tasks,
          AVG(CASE WHEN st.status = 'completed' THEN st.score ELSE NULL END) as avg_score,
          COUNT(DISTINCT st.student_id) as students_with_tasks
         FROM tasks t
         LEFT JOIN student_tasks st ON t.id = st.task_id
         WHERE t.course_id IN (${placeholders})
         GROUP BY t.course_id`,
        courseIds
      );
    } catch (error) {
      console.log('tasks or student_tasks table might not exist:', error.message);
      courseStats = [];
    }

    // Create map of course_id -> task stats
    const taskStatsMap = new Map();
    courseStats.forEach(stat => {
      taskStatsMap.set(stat.course_id, {
        totalTasks: Number(stat.total_tasks) || 0,
        completedTasks: Number(stat.completed_tasks) || 0,
        avgScore: Math.round(Number(stat.avg_score) || 0),
        studentsWithTasks: Number(stat.students_with_tasks) || 0
      });
    });

    // ===========================================
    // STEP 5: Build course objects with statistics
    // ===========================================
    const courses = await Promise.all(tutorCourses.map(async (tc) => {
      const courseId = tc.course_id;
      const studentCount = enrollmentMap.get(courseId) || 0;
      const taskStats = taskStatsMap.get(courseId) || {
        totalTasks: 0,
        completedTasks: 0,
        avgScore: 0,
        studentsWithTasks: 0
      };

      // Calculate total possible completions
      const totalPossibleCompletions = studentCount * taskStats.totalTasks;
      
      // Calculate completion rate
      const completionRate = totalPossibleCompletions > 0 
        ? Math.round((taskStats.completedTasks / totalPossibleCompletions) * 100)
        : 0;

      // Get grade from course
      const grade = tc.grade_level || 5;
      
      // Generate course code from name and grade
      const courseCode = generateCourseCode(tc.course_name || tc.subject, grade);
      
      // Get course display based on subject and grade
      const courseDisplay = getCourseDisplay(tc.subject || tc.course_name, grade);

      return {
        id: courseId,
        name: courseDisplay.name,
        englishName: courseDisplay.englishName,
        amharicName: courseDisplay.amharicName,
        code: courseCode,
        grade: grade,
        description: tc.description || courseDisplay.description,
        studentCount,
        taskCount: taskStats.totalTasks,
        completedTasks: taskStats.completedTasks,
        avgScore: taskStats.avgScore,
        totalPossibleCompletions,
        completionRate,
        color: getCourseColor(getCourseCode(tc.subject || tc.course_name)),
        bgColor: getCourseBgColor(getCourseCode(tc.subject || tc.course_name)),
        borderColor: getCourseBorderColor(getCourseCode(tc.subject || tc.course_name))
      };
    }));

    // ===========================================
    // STEP 6: Calculate overall statistics
    // ===========================================
    const stats: { [key: string]: any } = {};
    courses.forEach(course => {
      stats[course.id] = {
        students: course.studentCount,
        tasks: course.taskCount,
        completedTasks: course.completedTasks,
        avgScore: course.avgScore,
        totalPossibleCompletions: course.totalPossibleCompletions
      };
    });

    console.log('✅ Tutor courses API call successful!');
    console.log(`Returning ${courses.length} courses`);

    return NextResponse.json({
      success: true,
      tutor: {
        id: tutor.id,
        name: tutor.name || `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim(),
        email: tutor.email
      },
      courses,
      stats
    });

  } catch (error) {
    console.error('❌ Error in tutor courses API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch tutor courses',
        message: error instanceof Error ? error.message : 'Unknown error',
        tutor: null,
        courses: [],
        stats: {}
      },
      { status: 500 }
    );
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function generateCourseCode(name: string, grade: number): string {
  // Extract first word or use subject
  const firstWord = name?.split(' ')[0] || 'CRS';
  const prefix = firstWord.substring(0, 3).toUpperCase();
  return `${prefix}-G${grade}`;
}

function getCourseCode(subject: string): string {
  const codeMap: Record<string, string> = {
    'math': 'MATH',
    'mathematics': 'MATH',
    'english': 'ENG',
    'amharic': 'AMH',
    'general_science': 'SCI',
    'science': 'SCI',
    'citizenship': 'CIT',
    'social_science': 'SOC',
    'social': 'SOC',
    'pva': 'PVA',
    'hpe': 'HPE',
    'it': 'IT',
    'environmental_science': 'SCI',
    'civics': 'CIV',
    'arts': 'ART',
    'sports': 'SPT',
    'geez': 'GEZ',
    'ሂሳብ': 'MATH',
    'እንግሊዝኛ': 'ENG',
    'አማርኛ': 'AMH',
    'አካባቢ_ሳይንስ': 'SCI',
    'ግብረ_ግብ': 'CIV',
    'ስነ_ጥበብ': 'ART',
    'ስፖርት': 'SPT',
    'ግዕዝ': 'GEZ'
  };
  
  const lowerSubject = subject?.toLowerCase() || '';
  for (const [key, value] of Object.entries(codeMap)) {
    if (lowerSubject.includes(key)) {
      return value;
    }
  }
  return 'CRS';
}

function getCourseDisplay(subject: string, grade: number): {
  name: string;
  englishName: string;
  amharicName: string;
  description: string;
} {
  // Grade 7-8 courses (English)
  const grade78Map: Record<string, { name: string; amharic: string; desc: string }> = {
    'math': { 
      name: 'Mathematics', 
      amharic: 'ሂሳብ',
      desc: 'Basic arithmetic, geometry, and problem solving'
    },
    'english': { 
      name: 'English', 
      amharic: 'እንግሊዝኛ',
      desc: 'Reading, writing, and communication skills'
    },
    'amharic': { 
      name: 'Amharic', 
      amharic: 'አማርኛ',
      desc: 'Amharic language and literature'
    },
    'general_science': { 
      name: 'General Science', 
      amharic: 'አጠቃላይ ሳይንስ',
      desc: 'Introduction to biology, physics, and chemistry'
    },
    'citizenship': { 
      name: 'Citizenship', 
      amharic: 'ስነምግባር',
      desc: 'Civic education and ethical values'
    },
    'social_science': { 
      name: 'Social Science', 
      amharic: 'ህብረተሰብ ሳይንስ',
      desc: 'History, geography, and social studies'
    },
    'pva': { 
      name: 'PVA', 
      amharic: 'ስነጥበብ',
      desc: 'Physical and vocational arts education'
    },
    'hpe': { 
      name: 'HPE', 
      amharic: 'ስፖርት',
      desc: 'Health and physical education'
    },
    'it': { 
      name: 'IT', 
      amharic: 'ኢንፎርሜሽን ቴክኖሎጂ',
      desc: 'Information technology and computer basics'
    }
  };

  // Grade 5-6 courses (Amharic)
  const grade56Map: Record<string, { name: string; english: string; desc: string }> = {
    'math': { 
      name: 'ሂሳብ', 
      english: 'Mathematics',
      desc: 'መሰረታዊ ሒሳብ፣ ጂኦሜትሪ እና ችግር መፍታት'
    },
    'english': { 
      name: 'እንግሊዝኛ', 
      english: 'English',
      desc: 'ማንበብ፣ መጻፍ እና የንግግር ክህሎቶች'
    },
    'amharic': { 
      name: 'አማርኛ', 
      english: 'Amharic',
      desc: 'የአማርኛ ቋንቋ እና ስነጽሁፍ'
    },
    'environmental_science': { 
      name: 'አካባቢ ሳይንስ', 
      english: 'Environmental Science',
      desc: 'የተፈጥሮ ሳይንስ መሰረታዊ እውቀት'
    },
    'civics': { 
      name: 'ግብረ ግብ', 
      english: 'Civics',
      desc: 'የሲቪክ ትምህርት እና ስነምግባር'
    },
    'arts': { 
      name: 'ስነ ጥበብ', 
      english: 'Arts',
      desc: 'ስነጥበብ እና ፈጠራዊ ሥራዎች'
    },
    'sports': { 
      name: 'ስፖርት', 
      english: 'Sports',
      desc: 'አካላዊ ትምህርት እና የስፖርት እንቅስቃሴዎች'
    },
    'geez': { 
      name: 'ግዕዝ', 
      english: 'Geez',
      desc: 'የግዕዝ ቋንቋ እና ሥነ ጽሑፍ'
    }
  };

  const lowerSubject = subject?.toLowerCase() || '';
  
  if (grade >= 7 && grade <= 8) {
    // Find matching course in grade78Map
    for (const [key, value] of Object.entries(grade78Map)) {
      if (lowerSubject.includes(key)) {
        return {
          name: value.name,
          englishName: value.name,
          amharicName: value.amharic,
          description: value.desc
        };
      }
    }
    // Default fallback
    return {
      name: subject,
      englishName: subject,
      amharicName: subject,
      description: 'Course description not available'
    };
  } else {
    // Find matching course in grade56Map
    for (const [key, value] of Object.entries(grade56Map)) {
      if (lowerSubject.includes(key)) {
        return {
          name: value.name,
          englishName: value.english,
          amharicName: value.name,
          description: value.desc
        };
      }
    }
    // Default fallback
    return {
      name: subject,
      englishName: subject,
      amharicName: subject,
      description: 'የኮርስ መግለጫ አይገኝም'
    };
  }
}

function getCourseColor(code: string): string {
  const colorMap: Record<string, string> = {
    'MATH': 'text-blue-600',
    'ENG': 'text-green-600',
    'AMH': 'text-red-600',
    'SCI': 'text-purple-600',
    'CIT': 'text-orange-600',
    'SOC': 'text-indigo-600',
    'PVA': 'text-teal-600',
    'HPE': 'text-cyan-600',
    'IT': 'text-amber-600',
    'CIV': 'text-orange-600',
    'ART': 'text-pink-600',
    'SPT': 'text-emerald-600',
    'GEZ': 'text-violet-600'
  };
  return colorMap[code] || 'text-primary';
}

function getCourseBgColor(code: string): string {
  const colorMap: Record<string, string> = {
    'MATH': 'bg-blue-50',
    'ENG': 'bg-green-50',
    'AMH': 'bg-red-50',
    'SCI': 'bg-purple-50',
    'CIT': 'bg-orange-50',
    'SOC': 'bg-indigo-50',
    'PVA': 'bg-teal-50',
    'HPE': 'bg-cyan-50',
    'IT': 'bg-amber-50',
    'CIV': 'bg-orange-50',
    'ART': 'bg-pink-50',
    'SPT': 'bg-emerald-50',
    'GEZ': 'bg-violet-50'
  };
  return colorMap[code] || 'bg-primary/5';
}

function getCourseBorderColor(code: string): string {
  const colorMap: Record<string, string> = {
    'MATH': 'border-blue-200',
    'ENG': 'border-green-200',
    'AMH': 'border-red-200',
    'SCI': 'border-purple-200',
    'CIT': 'border-orange-200',
    'SOC': 'border-indigo-200',
    'PVA': 'border-teal-200',
    'HPE': 'border-cyan-200',
    'IT': 'border-amber-200',
    'CIV': 'border-orange-200',
    'ART': 'border-pink-200',
    'SPT': 'border-emerald-200',
    'GEZ': 'border-violet-200'
  };
  return colorMap[code] || 'border-border';
}