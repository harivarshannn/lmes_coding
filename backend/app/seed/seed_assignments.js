const db = require('../database/session');

async function seedAssignments() {
  const database = await db.getDb();
  console.log("Seeding Assignments...");

  const topicsCol = database.collection('topics');
  const dsTopic = await topicsCol.findOne({ name: 'Data Structures' });

  const assignmentsCol = database.collection('assignments');

  const as1Id = await db.getNextSequenceValue('assignment_id');
  const as1 = {
    _id: as1Id, id: as1Id,
    title: 'Stack Implementation',
    slug: 'stack-implementation',
    description: 'Implement a Stack class in Python that supports push, pop, and peek operations.',
    topic_id: dsTopic ? dsTopic._id : 1,
    difficulty: 'Easy',
    instructions_md: '## Stack Implementation\nImplement a Python class `Stack` with the following methods:\n- `push(item)`\n- `pop()`\n- `peek()`\n- `is_empty()`',
    max_marks: 100,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    language: 'python',
    starter_code: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        # Write push logic
        pass

    def pop(self):
        # Write pop logic
        pass

    def peek(self):
        # Write peek logic
        pass

    def is_empty(self):
        # Write check logic
        pass
`,
    auto_grade_enabled: true,
    test_cases: [
      { input: 'push 5\npush 10\npop\npeek', expected_output: '10\n5', is_hidden: false }
    ],
    created_by: 1,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
  await assignmentsCol.insertOne(as1);

  console.log("Assignments seeded successfully.");
}

module.exports = seedAssignments;
