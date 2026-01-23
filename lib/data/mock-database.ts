// Mock Database - Structured JSON that simulates a real database
// This can easily be replaced with API calls later

export interface Tutor {
  id: string
  name: string
  email: string
  courses: string[]
}

export interface Student {
  id: string
  name: string
  grade: number
  courses: string[]
  parentId: string
}

export interface Parent {
  id: string
  name: string
  email: string
  childrenIds: string[]
}

export interface Question {
  type: "multiple_choice" | "short_answer"
  question: string
  options?: string[]
  correctAnswer?: string
  sampleAnswer?: string
}

export interface Task {
  id: string
  grade: number
  course: string
  topic: string
  instruction: string
  type: ("note" | "question")[]
  noteContent?: string
  questions?: Question[]
  assignedStudentIds: string[]
  visibleToParent: boolean
  createdBy: string
  createdAt: string
  dueDate?: string
  videoLink?: string // Support for video links
  images?: string[] // Support for multiple images
}

export interface StudentTask {
  taskId: string
  studentId: string
  status: "pending" | "completed"
  score?: number
  completedAt?: string
  timeSpent?: number // in minutes
}

export interface StudentSession {
  id: string
  studentId: string
  loginTime: string
  logoutTime?: string
  duration?: number // in minutes
  deviceInfo: string
}

// In-memory database (simulates a backend)
const tutorsDB: Tutor[] = [
  {
    id: "tutor_001",
    name: "John Doe",
    email: "john.doe@school.com",
    courses: ["math_g5", "science_g5", "math_g8"],
  },
]

const studentsDB: Student[] = [
  {
    id: "student_001",
    name: "Abel Tesfaye",
    grade: 5,
    courses: ["math_g5", "english_g5", "science_g5"],
    parentId: "parent_001",
  },
  {
    id: "student_002",
    name: "Emma Wilson",
    grade: 5,
    courses: ["math_g5", "english_g5", "science_g5", "history_g5"],
    parentId: "parent_002",
  },
  {
    id: "student_003",
    name: "Sophia Lee",
    grade: 5,
    courses: ["math_g5", "english_g5", "science_g5"],
    parentId: "parent_003",
  },
  {
    id: "student_004",
    name: "Olivia Davis",
    grade: 5,
    courses: ["math_g5", "english_g5"],
    parentId: "parent_004",
  },
  {
    id: "student_005",
    name: "James Chen",
    grade: 8,
    courses: ["math_g8", "english_g8", "science_g8", "history_g8"],
    parentId: "parent_005",
  },
  {
    id: "student_006",
    name: "Michael Brown",
    grade: 8,
    courses: ["math_g8", "english_g8", "science_g8"],
    parentId: "parent_006",
  },
  {
    id: "student_007",
    name: "Noah Johnson",
    grade: 8,
    courses: ["math_g8", "english_g8"],
    parentId: "parent_007",
  },
  {
    id: "student_008",
    name: "Liam Martinez",
    grade: 5,
    courses: ["math_g5", "science_g5"],
    parentId: "parent_008",
  },
]

const parentsDB: Parent[] = [
  {
    id: "parent_001",
    name: "Mrs. Tesfaye",
    email: "mrs.tesfaye@email.com",
    childrenIds: ["student_001"],
  },
  {
    id: "parent_002",
    name: "Sarah Wilson",
    email: "sarah.wilson@email.com",
    childrenIds: ["student_002"],
  },
  {
    id: "parent_003",
    name: "David Lee",
    email: "david.lee@email.com",
    childrenIds: ["student_003"],
  },
  {
    id: "parent_004",
    name: "Jessica Davis",
    email: "jessica.davis@email.com",
    childrenIds: ["student_004"],
  },
  {
    id: "parent_005",
    name: "Linda Chen",
    email: "linda.chen@email.com",
    childrenIds: ["student_005"],
  },
  {
    id: "parent_006",
    name: "Robert Brown",
    email: "robert.brown@email.com",
    childrenIds: ["student_006"],
  },
  {
    id: "parent_007",
    name: "Emily Johnson",
    email: "emily.johnson@email.com",
    childrenIds: ["student_007"],
  },
  {
    id: "parent_008",
    name: "Carlos Martinez",
    email: "carlos.martinez@email.com",
    childrenIds: ["student_008"],
  },
]

const tasksDB: Task[] = [
  {
    id: "task_001",
    grade: 5,
    course: "math_g5",
    topic: "Fractions - Introduction",
    instruction: "Read the note carefully and answer the multiple choice questions.",
    type: ["note", "question"],
    noteContent:
      "Fractions represent parts of a whole. The top number is called the numerator and shows how many parts we have. The bottom number is called the denominator and shows how many equal parts the whole is divided into. For example, 1/2 means we have 1 part out of 2 equal parts.",
    questions: [
      {
        type: "multiple_choice",
        question: "What is the numerator in the fraction 3/4?",
        options: ["3", "4", "7", "1"],
        correctAnswer: "3",
      },
      {
        type: "multiple_choice",
        question: "What does 1/2 represent?",
        options: ["One part of two equal parts", "Two parts of one", "Half of nothing", "A whole number"],
        correctAnswer: "One part of two equal parts",
      },
    ],
    assignedStudentIds: ["student_001", "student_002", "student_003", "student_004", "student_008"],
    visibleToParent: true,
    createdBy: "tutor_001",
    createdAt: "2025-01-15T09:00:00Z",
    dueDate: "2025-01-20T17:00:00Z",
  },
  {
    id: "task_002",
    grade: 5,
    course: "english_g5",
    topic: "Reading Comprehension - Short Story",
    instruction: "Read the passage and answer the questions in your own words.",
    type: ["note", "question"],
    noteContent:
      "The Little Garden\n\nSarah loved her grandmother's garden. Every summer, she would visit and help plant flowers. The roses were her favorite because they smelled so sweet. One day, her grandmother gave her a small pot with rose seeds. 'Plant these at home,' she said with a smile. Sarah was so excited! She planted the seeds carefully and watered them every day. After many weeks, a tiny green shoot appeared. Sarah couldn't wait to see her first rose bloom.",
    questions: [
      {
        type: "short_answer",
        question: "Why did Sarah love her grandmother's garden?",
        sampleAnswer: "She loved helping plant flowers and especially loved the sweet-smelling roses.",
      },
      {
        type: "short_answer",
        question: "What did Sarah's grandmother give her?",
        sampleAnswer: "A small pot with rose seeds.",
      },
    ],
    assignedStudentIds: ["student_001", "student_002", "student_003", "student_004"],
    visibleToParent: true,
    createdBy: "tutor_001",
    createdAt: "2025-01-16T10:30:00Z",
    dueDate: "2025-01-21T17:00:00Z",
  },
  {
    id: "task_003",
    grade: 5,
    course: "science_g5",
    topic: "Parts of a Plant",
    instruction: "Study the diagram and answer the questions.",
    type: ["note", "question"],
    noteContent:
      "Plants have different parts, each with a special job:\n\n1. ROOTS - Hold the plant in the ground and absorb water and nutrients from soil\n2. STEM - Supports the plant and carries water from roots to leaves\n3. LEAVES - Make food for the plant using sunlight (photosynthesis)\n4. FLOWERS - Produce seeds for new plants\n5. FRUITS - Protect seeds and help them spread",
    questions: [
      {
        type: "multiple_choice",
        question: "Which part of the plant absorbs water from the soil?",
        options: ["Leaves", "Roots", "Stem", "Flowers"],
        correctAnswer: "Roots",
      },
      {
        type: "multiple_choice",
        question: "What process do leaves use to make food?",
        options: ["Respiration", "Digestion", "Photosynthesis", "Absorption"],
        correctAnswer: "Photosynthesis",
      },
    ],
    assignedStudentIds: ["student_001", "student_002", "student_003", "student_008"],
    visibleToParent: true,
    createdBy: "tutor_001",
    createdAt: "2025-01-17T14:00:00Z",
    dueDate: "2025-01-22T17:00:00Z",
  },
  {
    id: "task_004",
    grade: 8,
    course: "math_g8",
    topic: "Algebraic Equations",
    instruction: "Solve the following equations and show your work.",
    type: ["note", "question"],
    noteContent:
      "To solve algebraic equations:\n1. Isolate the variable on one side\n2. Perform the same operation on both sides\n3. Simplify step by step\n\nExample: 2x + 5 = 13\n2x = 13 - 5\n2x = 8\nx = 4",
    questions: [
      {
        type: "short_answer",
        question: "Solve for x: 3x - 7 = 14",
        sampleAnswer: "x = 7 (Add 7 to both sides to get 3x = 21, then divide by 3)",
      },
    ],
    assignedStudentIds: ["student_005", "student_006", "student_007"],
    visibleToParent: false,
    createdBy: "tutor_001",
    createdAt: "2025-01-18T11:00:00Z",
    dueDate: "2025-01-23T17:00:00Z",
  },
  {
    id: "task_005",
    grade: 5,
    course: "history_g5",
    topic: "Ancient Egypt",
    instruction: "Read about Ancient Egypt and answer the questions.",
    type: ["note", "question"],
    noteContent:
      "Ancient Egypt was one of the greatest civilizations in history. It lasted for over 3,000 years! The Egyptians built amazing pyramids as tombs for their pharaohs (kings). They invented a writing system called hieroglyphics using pictures and symbols. The River Nile was very important because it provided water for farming in the desert.",
    questions: [
      {
        type: "multiple_choice",
        question: "What were the pyramids used for?",
        options: ["Homes for people", "Tombs for pharaohs", "Storage buildings", "Temples for prayer"],
        correctAnswer: "Tombs for pharaohs",
      },
      {
        type: "short_answer",
        question: "Why was the River Nile important to Ancient Egyptians?",
        sampleAnswer: "It provided water for farming in the desert.",
      },
    ],
    assignedStudentIds: ["student_002"],
    visibleToParent: true,
    createdBy: "tutor_001",
    createdAt: "2025-01-19T09:30:00Z",
    dueDate: "2025-01-24T17:00:00Z",
  },
]

const studentTasksDB: StudentTask[] = [
  // student_001 (Abel) - completed some tasks
  {
    taskId: "task_001",
    studentId: "student_001",
    status: "completed",
    score: 95,
    completedAt: "2025-01-16T09:15:00Z",
    timeSpent: 15,
  },
  {
    taskId: "task_002",
    studentId: "student_001",
    status: "completed",
    score: 88,
    completedAt: "2025-01-17T10:30:00Z",
    timeSpent: 20,
  },
  {
    taskId: "task_003",
    studentId: "student_001",
    status: "completed",
    score: 92,
    completedAt: "2025-01-18T14:15:00Z",
    timeSpent: 10,
  },
  // student_002 (Emma) - top performer
  {
    taskId: "task_001",
    studentId: "student_002",
    status: "completed",
    score: 100,
    completedAt: "2025-01-15T15:00:00Z",
    timeSpent: 12,
  },
  {
    taskId: "task_002",
    studentId: "student_002",
    status: "completed",
    score: 95,
    completedAt: "2025-01-16T16:00:00Z",
    timeSpent: 18,
  },
  {
    taskId: "task_003",
    studentId: "student_002",
    status: "completed",
    score: 100,
    completedAt: "2025-01-17T11:00:00Z",
    timeSpent: 9,
  },
  {
    taskId: "task_005",
    studentId: "student_002",
    status: "pending",
  },
  // student_003 (Sophia) - good performer
  {
    taskId: "task_001",
    studentId: "student_003",
    status: "completed",
    score: 90,
    completedAt: "2025-01-16T10:00:00Z",
    timeSpent: 14,
  },
  {
    taskId: "task_002",
    studentId: "student_003",
    status: "completed",
    score: 85,
    completedAt: "2025-01-17T14:00:00Z",
    timeSpent: 22,
  },
  {
    taskId: "task_003",
    studentId: "student_003",
    status: "pending",
  },
  // student_004 (Olivia) - needs attention
  {
    taskId: "task_001",
    studentId: "student_004",
    status: "completed",
    score: 70,
    completedAt: "2025-01-17T16:00:00Z",
    timeSpent: 25,
  },
  {
    taskId: "task_002",
    studentId: "student_004",
    status: "pending",
  },
  {
    taskId: "task_003",
    studentId: "student_004",
    status: "pending",
  },
  // student_005 (James) - grade 8 top performer
  {
    taskId: "task_004",
    studentId: "student_005",
    status: "completed",
    score: 95,
    completedAt: "2025-01-19T11:30:00Z",
    timeSpent: 30,
  },
  // student_006 (Michael) - needs attention
  {
    taskId: "task_004",
    studentId: "student_006",
    status: "pending",
  },
  // student_007 (Noah) - needs attention
  {
    taskId: "task_004",
    studentId: "student_007",
    status: "pending",
  },
  // student_008 (Liam)
  {
    taskId: "task_001",
    studentId: "student_008",
    status: "completed",
    score: 78,
    completedAt: "2025-01-16T13:00:00Z",
    timeSpent: 18,
  },
  {
    taskId: "task_003",
    studentId: "student_008",
    status: "pending",
  },
]

const sessionsDB: StudentSession[] = [
  {
    id: "session_001",
    studentId: "student_001",
    loginTime: "2025-01-22T08:00:00Z",
    logoutTime: "2025-01-22T09:30:00Z",
    duration: 90,
    deviceInfo: "Chrome on Windows",
  },
  {
    id: "session_002",
    studentId: "student_001",
    loginTime: "2025-01-23T14:00:00Z",
    logoutTime: "2025-01-23T15:45:00Z",
    duration: 105,
    deviceInfo: "Chrome on Windows",
  },
  {
    id: "session_003",
    studentId: "student_001",
    loginTime: "2025-01-24T09:00:00Z",
    logoutTime: "2025-01-24T10:30:00Z",
    duration: 90,
    deviceInfo: "Chrome on Windows",
  },
]

// CRUD Operations for Tasks
export const createTask = (task: Omit<Task, "id" | "createdAt">): Task => {
  const newTask: Task = {
    ...task,
    id: `task_${String(tasksDB.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  }
  tasksDB.push(newTask)

  // Create student task entries
  task.assignedStudentIds.forEach((studentId) => {
    studentTasksDB.push({
      taskId: newTask.id,
      studentId,
      status: "pending",
    })
  })

  return newTask
}

export const getTaskById = (taskId: string): Task | undefined => {
  return tasksDB.find((task) => task.id === taskId)
}

export const getTasksByTutor = (tutorId: string): Task[] => {
  return tasksDB.filter((task) => task.createdBy === tutorId)
}

export const getTasksByStudent = (studentId: string): Task[] => {
  const studentTaskIds = studentTasksDB.filter((st) => st.studentId === studentId).map((st) => st.taskId)
  return tasksDB.filter((task) => studentTaskIds.includes(task.id))
}

export const getTasksByParent = (parentId: string): Task[] => {
  const parent = parentsDB.find((p) => p.id === parentId)
  if (!parent) return []

  const childrenIds = parent.childrenIds
  const relevantTaskIds = new Set<string>()

  studentTasksDB
    .filter((st) => childrenIds.includes(st.studentId))
    .forEach((st) => {
      const task = tasksDB.find((t) => t.id === st.taskId)
      if (task && task.visibleToParent) {
        relevantTaskIds.add(st.taskId)
      }
    })

  return tasksDB.filter((task) => relevantTaskIds.has(task.id))
}

// Student Operations
export const getStudentsByTutor = (tutorId: string): Student[] => {
  const tutor = tutorsDB.find((t) => t.id === tutorId)
  if (!tutor) return []

  return studentsDB.filter((student) => student.courses.some((course) => tutor.courses.includes(course)))
}

export const getStudentsByGradeAndCourse = (grade: number, course: string): Student[] => {
  return studentsDB.filter((student) => student.grade === grade && student.courses.includes(course))
}

export const getStudentById = (studentId: string): Student | undefined => {
  return studentsDB.find((s) => s.id === studentId)
}

// Parent Operations
export const getParentById = (parentId: string): Parent | undefined => {
  return parentsDB.find((p) => p.id === parentId)
}

export const getParentByChildId = (childId: string): Parent | undefined => {
  const student = studentsDB.find((s) => s.id === childId)
  if (!student) return undefined
  return parentsDB.find((p) => p.id === student.parentId)
}

// Student Task Operations
export const getStudentTaskStatus = (taskId: string, studentId: string): StudentTask | undefined => {
  return studentTasksDB.find((st) => st.taskId === taskId && st.studentId === studentId)
}

export const updateStudentTaskStatus = (
  taskId: string,
  studentId: string,
  updates: Partial<StudentTask>,
): StudentTask | undefined => {
  const index = studentTasksDB.findIndex((st) => st.taskId === taskId && st.studentId === studentId)
  if (index === -1) return undefined

  studentTasksDB[index] = { ...studentTasksDB[index], ...updates }
  return studentTasksDB[index]
}

export const getStudentTasksByStudent = (studentId: string): StudentTask[] => {
  return studentTasksDB.filter((st) => st.studentId === studentId)
}

// Helper function to complete a student task
export const completeStudentTask = (
  taskId: string,
  studentId: string,
  score?: number,
  timeSpent?: number,
): StudentTask | undefined => {
  return updateStudentTaskStatus(taskId, studentId, {
    status: "completed",
    score,
    timeSpent,
    completedAt: new Date().toISOString(),
  })
}

// Statistics
export const getTutorStats = (tutorId: string) => {
  const tutorTasks = getTasksByTutor(tutorId)
  const tutorStudents = getStudentsByTutor(tutorId)

  const totalTasks = tutorTasks.length
  const totalStudents = tutorStudents.length

  const allStudentTasks = studentTasksDB.filter((st) => tutorTasks.some((t) => t.id === st.taskId))

  const completedTasks = allStudentTasks.filter((st) => st.status === "completed").length
  const totalAssignedTasks = allStudentTasks.length

  const completionRate = totalAssignedTasks > 0 ? Math.round((completedTasks / totalAssignedTasks) * 100) : 0

  const scores = allStudentTasks.filter((st) => st.score !== undefined).map((st) => st.score!)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  return {
    totalStudents,
    activeTasks: totalTasks,
    completionRate,
    avgScore,
  }
}

export const getStudentStats = (studentId: string) => {
  const studentTasks = getStudentTasksByStudent(studentId)

  const totalTasks = studentTasks.length
  const completedTasks = studentTasks.filter((st) => st.status === "completed").length
  const pendingTasks = totalTasks - completedTasks

  const scores = studentTasks.filter((st) => st.score !== undefined).map((st) => st.score!)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  // Calculate streak (simplified - consecutive days with completed tasks)
  const recentCompletions = studentTasks
    .filter((st) => st.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())

  let streak = 0
  if (recentCompletions.length > 0) {
    streak = 7 // Simplified for demo
  }

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    avgScore,
    streak,
    points: completedTasks * 10 + scores.reduce((a, b) => a + b, 0), // Simple points calculation
  }
}

export const createSession = (studentId: string, deviceInfo: string): StudentSession => {
  const newSession: StudentSession = {
    id: `session_${String(sessionsDB.length + 1).padStart(3, "0")}`,
    studentId,
    loginTime: new Date().toISOString(),
    deviceInfo,
  }
  sessionsDB.push(newSession)
  return newSession
}

export const endSession = (sessionId: string): StudentSession | undefined => {
  const session = sessionsDB.find((s) => s.id === sessionId)
  if (!session || session.logoutTime) return undefined

  const loginTime = new Date(session.loginTime)
  const logoutTime = new Date()
  const duration = Math.round((logoutTime.getTime() - loginTime.getTime()) / (1000 * 60))

  session.logoutTime = logoutTime.toISOString()
  session.duration = duration

  return session
}

export const getSessionsByStudent = (studentId: string): StudentSession[] => {
  return sessionsDB
    .filter((s) => s.studentId === studentId)
    .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime())
}

export const getActiveSession = (studentId: string): StudentSession | undefined => {
  return sessionsDB.find((s) => s.studentId === studentId && !s.logoutTime)
}

export const getTotalStudyTime = (studentId: string, days = 7): number => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return sessionsDB
    .filter((s) => s.studentId === studentId && s.duration && new Date(s.loginTime) > cutoffDate)
    .reduce((total, s) => total + (s.duration || 0), 0)
}

// Get all data (for debugging)
export const getAllData = () => ({
  tutors: tutorsDB,
  students: studentsDB,
  parents: parentsDB,
  tasks: tasksDB,
  studentTasks: studentTasksDB,
  sessions: sessionsDB,
})

// Add these functions for frontend compatibility
export const getTutorById = (tutorId: string) => {
  const tutor = tutorsDB.find(t => t.id === tutorId)
  return tutor ? {
    ...tutor,
    isActive: true
  } : {
    id: tutorId,
    name: "Demo Tutor",
    email: "demo@tutor.com",
    courses: ["math_g5", "english_g5", "science_g5"],
    isActive: true
  }
}

// Aliases for compatibility
export const getTutorTasks = getTasksByTutor
export const getTutorStudents = getStudentsByTutor