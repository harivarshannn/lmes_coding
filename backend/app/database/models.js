const mongoose = require('mongoose');

const schemaOptions = { strict: false, versionKey: false };

const TopicSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  name: { type: String, required: true },
  description: String,
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const LanguageSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  name: { type: String, required: true },
  judge0_language_id: { type: Number, required: true }
}, schemaOptions);

const BadgeSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  name: { type: String, required: true },
  description: String,
  icon_url: String
}, schemaOptions);

const AchievementSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  user_id: { type: Number, required: true },
  badge_id: { type: Number, required: true },
  earned_at: { type: Date, default: Date.now }
}, schemaOptions);

const DailyStreakSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  user_id: { type: Number, required: true },
  current_streak: { type: Number, default: 0 },
  longest_streak: { type: Number, default: 0 },
  last_activity_date: String
}, schemaOptions);

const LeaderboardSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  user_id: { type: Number, required: true },
  username: { type: String, required: true },
  xp: { type: Number, default: 0 },
  rank: { type: Number, default: 0 }
}, schemaOptions);

const UserAttemptSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  user_id: { type: Number, required: true },
  question_id: { type: Number, required: true },
  language_id: Number,
  status: String,
  runtime: Number,
  memory: Number,
  attempt_number: Number,
  submitted_code: String,
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const ProgressSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  user_id: { type: Number, required: true },
  question_id: { type: Number, required: true },
  status: String,
  updated_at: { type: Date, default: Date.now }
}, schemaOptions);

const BookmarkSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  user_id: { type: Number, required: true },
  question_id: { type: Number, required: true }
}, schemaOptions);

const FavoriteSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  user_id: { type: Number, required: true },
  question_id: { type: Number, required: true }
}, schemaOptions);

const QuestionSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  title: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  difficulty: String,
  estimated_time: Number,
  marks: Number,
  topic_id: Number,
  question_type: String,
  memory_limit: Number,
  time_limit: Number,
  status: String,
  templates: { type: mongoose.Schema.Types.Mixed, default: {} },
  tags: [String],
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const TestcaseSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  question_id: { type: Number, required: true },
  input: String,
  expected_output: String,
  is_hidden: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const HintSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  question_id: { type: Number, required: true },
  attempt_number: Number,
  hint: String
}, schemaOptions);

const SolutionSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  question_id: { type: Number, required: true },
  language_id: Number,
  code: String,
  explanation: String,
  complexity: String
}, schemaOptions);

const SubmissionSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  judge0_token: String,
  student_id: { type: Number, required: true },
  question_id: { type: Number, required: true },
  language_id: Number,
  code: String,
  status: String,
  passed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  stdout: String,
  stderr: String,
  compile_output: String,
  execution_time: Number,
  memory: Number,
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const McqQuizSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  title: String,
  slug: { type: String, required: true },
  description: String,
  topic_id: Number,
  time_limit: Number,
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const McqQuestionSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  quiz_id: { type: Number, required: true },
  question_text: String,
  options: mongoose.Schema.Types.Mixed,
  correct_option_index: Number,
  marks: Number,
  order: Number
}, schemaOptions);

const McqAttemptSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  user_id: { type: Number, required: true },
  quiz_id: { type: Number, required: true },
  score: Number,
  total_marks: Number,
  answers: mongoose.Schema.Types.Mixed,
  started_at: { type: Date, default: Date.now },
  completed_at: Date
}, schemaOptions);

const AssignmentSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  title: String,
  slug: { type: String, required: true },
  description: String,
  topic_id: Number,
  due_date: Date,
  starter_code: String,
  language_id: Number,
  test_cases: mongoose.Schema.Types.Mixed,
  max_marks: Number,
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const AssignmentSubmissionSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  assignment_id: { type: Number, required: true },
  user_id: { type: Number, required: true },
  submitted_code: String,
  status: String,
  grade: Number,
  feedback: String,
  graded_by: Number,
  graded_at: Date,
  submitted_at: { type: Date, default: Date.now }
}, schemaOptions);

const BugfixChallengeSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  title: String,
  slug: { type: String, required: true },
  description: String,
  topic_id: Number,
  starter_code: String,
  buggy_code: String,
  language_id: Number,
  test_cases: mongoose.Schema.Types.Mixed,
  max_marks: Number,
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const BugfixAttemptSchema = new mongoose.Schema({
  _id: Number,
  id: Number,
  user_id: { type: Number, required: true },
  challenge_id: { type: Number, required: true },
  submitted_code: String,
  status: String,
  passed_test_cases: Number,
  total_test_cases: Number,
  attempt_number: Number,
  xp_awarded: Number,
  submitted_at: { type: Date, default: Date.now }
}, schemaOptions);

const CounterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 0 }
}, schemaOptions);

const Topic = mongoose.model('Topic', TopicSchema, 'topics');
const Language = mongoose.model('Language', LanguageSchema, 'languages');
const Badge = mongoose.model('Badge', BadgeSchema, 'badges');
const Achievement = mongoose.model('Achievement', AchievementSchema, 'achievements');
const DailyStreak = mongoose.model('DailyStreak', DailyStreakSchema, 'daily_streaks');
const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema, 'leaderboard');
const UserAttempt = mongoose.model('UserAttempt', UserAttemptSchema, 'user_attempts');
const Progress = mongoose.model('Progress', ProgressSchema, 'progress');
const Bookmark = mongoose.model('Bookmark', BookmarkSchema, 'bookmarks');
const Favorite = mongoose.model('Favorite', FavoriteSchema, 'favorites');
const Question = mongoose.model('Question', QuestionSchema, 'questions');
const Testcase = mongoose.model('Testcase', TestcaseSchema, 'testcases');
const Hint = mongoose.model('Hint', HintSchema, 'hints');
const Solution = mongoose.model('Solution', SolutionSchema, 'solutions');
const Submission = mongoose.model('Submission', SubmissionSchema, 'submissions');
const McqQuiz = mongoose.model('McqQuiz', McqQuizSchema, 'mcq_quizzes');
const McqQuestion = mongoose.model('McqQuestion', McqQuestionSchema, 'mcq_questions');
const McqAttempt = mongoose.model('McqAttempt', McqAttemptSchema, 'mcq_attempts');
const Assignment = mongoose.model('Assignment', AssignmentSchema, 'assignments');
const AssignmentSubmission = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema, 'assignment_submissions');
const BugfixChallenge = mongoose.model('BugfixChallenge', BugfixChallengeSchema, 'bugfix_challenges');
const BugfixAttempt = mongoose.model('BugfixAttempt', BugfixAttemptSchema, 'bugfix_attempts');
const Counter = mongoose.model('Counter', CounterSchema, 'counters');

const modelsMap = {
  topics: Topic,
  languages: Language,
  badges: Badge,
  achievements: Achievement,
  daily_streaks: DailyStreak,
  leaderboard: Leaderboard,
  user_attempts: UserAttempt,
  progress: Progress,
  bookmarks: Bookmark,
  favorites: Favorite,
  questions: Question,
  testcases: Testcase,
  hints: Hint,
  solutions: Solution,
  submissions: Submission,
  mcq_quizzes: McqQuiz,
  mcq_questions: McqQuestion,
  mcq_attempts: McqAttempt,
  assignments: Assignment,
  assignment_submissions: AssignmentSubmission,
  bugfix_challenges: BugfixChallenge,
  bugfix_attempts: BugfixAttempt,
  counters: Counter
};

module.exports = {
  Topic,
  Language,
  Badge,
  Achievement,
  DailyStreak,
  Leaderboard,
  UserAttempt,
  Progress,
  Bookmark,
  Favorite,
  Question,
  Testcase,
  Hint,
  Solution,
  Submission,
  McqQuiz,
  McqQuestion,
  McqAttempt,
  Assignment,
  AssignmentSubmission,
  BugfixChallenge,
  BugfixAttempt,
  Counter,
  modelsMap
};
