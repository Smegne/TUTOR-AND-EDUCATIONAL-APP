-- 1. Create tutor_students table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS tutor_students (
  tutor_id VARCHAR(50) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tutor_id, student_id),
  FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_tutor_id (tutor_id),
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Add foreign key from tasks to tutors (if missing)
-- Check if foreign key exists, if not add it
ALTER TABLE tasks 
  ADD CONSTRAINT fk_tasks_created_by 
  FOREIGN KEY (created_by) REFERENCES tutors(id) 
  ON DELETE CASCADE;

-- 3. Add foreign key from student_tasks to tasks (if missing)
ALTER TABLE student_tasks 
  ADD CONSTRAINT fk_student_tasks_task_id 
  FOREIGN KEY (task_id) REFERENCES tasks(id) 
  ON DELETE CASCADE;

-- 4. Add foreign key from student_tasks to students (if missing)
ALTER TABLE student_tasks 
  ADD CONSTRAINT fk_student_tasks_student_id 
  FOREIGN KEY (student_id) REFERENCES students(id) 
  ON DELETE CASCADE;

-- 5. Add index for performance
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_student_tasks_composite ON student_tasks(task_id, student_id);
CREATE INDEX idx_student_tasks_student_status ON student_tasks(student_id, status);