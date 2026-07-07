const db = require('../database/session');

async function seedMcq() {
  const database = await db.getDb();
  console.log("Seeding MCQ Quizzes...");
  
  // Find topics
  const topicsCol = database.collection('topics');
  const dsTopic = await topicsCol.findOne({ name: 'Data Structures' });
  
  const quizzesCol = database.collection('mcq_quizzes');
  const questionsCol = database.collection('mcq_questions');
  
  // Quiz 1
  const qz1Id = await db.getNextSequenceValue('mcq_quiz_id');
  const qz1 = {
    _id: qz1Id, id: qz1Id,
    title: 'Data Structures Basics Quiz',
    slug: 'ds-basics-quiz',
    description: 'Test your knowledge on basic data structures like Arrays, Stacks, and Queues.',
    topic_id: dsTopic ? dsTopic._id : 1,
    difficulty: 'Easy',
    time_limit_minutes: 15,
    total_marks: 4,
    is_active: true,
    created_by: 1,
    created_at: new Date(),
    updated_at: new Date()
  };
  await quizzesCol.insertOne(qz1);
  
  // Quiz 1 Questions
  const quest1Id = await db.getNextSequenceValue('mcq_question_id');
  await questionsCol.insertOne({
    _id: quest1Id, id: quest1Id,
    quiz_id: qz1Id,
    question_text: 'Which data structure follows the LIFO (Last In First Out) principle?',
    options: [
      { key: 'A', text: 'Queue' },
      { key: 'B', text: 'Stack' },
      { key: 'C', text: 'Array' },
      { key: 'D', text: 'Linked List' }
    ],
    correct_answer: 'B',
    explanation: 'A stack is a Last In First Out (LIFO) data structure.',
    marks: 2,
    order: 1
  });
  
  const quest2Id = await db.getNextSequenceValue('mcq_question_id');
  await questionsCol.insertOne({
    _id: quest2Id, id: quest2Id,
    quiz_id: qz1Id,
    question_text: 'What is the time complexity of searching an element in a balanced binary search tree in the worst case?',
    options: [
      { key: 'A', text: 'O(1)' },
      { key: 'B', text: 'O(N)' },
      { key: 'C', text: 'O(log N)' },
      { key: 'D', text: 'O(N log N)' }
    ],
    correct_answer: 'C',
    explanation: 'A balanced BST allows searches in O(log N) time complexity.',
    marks: 2,
    order: 2
  });

  console.log("MCQ Quizzes seeded successfully.");
}

module.exports = seedMcq;
