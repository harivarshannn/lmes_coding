const MODULE_TYPES = {
  CODING: 'coding',
  MCQ: 'mcq',
  ASSIGNMENT: 'assignment',
  BUGFIX: 'bugfix'
};

const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
};

const SUBMISSION_STATUS = {
  IN_QUEUE: 'In Queue',
  PROCESSING: 'Processing',
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILATION_ERROR: 'Compilation Error',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
  INTERNAL_ERROR: 'Internal Error'
};

const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student'
};

const MCQ_ATTEMPT_STATUS = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  TIMED_OUT: 'Timed Out'
};

const ASSIGNMENT_STATUS = {
  SUBMITTED: 'Submitted',
  GRADING: 'Grading',
  GRADED: 'Graded',
  LATE: 'Late'
};

module.exports = {
  MODULE_TYPES,
  DIFFICULTY_LEVELS,
  SUBMISSION_STATUS,
  USER_ROLES,
  MCQ_ATTEMPT_STATUS,
  ASSIGNMENT_STATUS
};
