const express = require('express');
const router = express.Router();
const CodingRepository = require('./coding.repo');
const CodingService = require('./coding.service');
const rateLimit = require('../../common/utils/rate_limit');
const db = require('../../database/session');
const { getLanguageId } = require('../../services/language_mapper');
const { getJudge0Service } = require('../../services/judge0_service');
const { RedisCache } = require('../../database/redis');

async function invalidateQuestionsCache() {
  await RedisCache.delete("questions:all");
  await RedisCache.clear_pattern("question:id:*");
  await RedisCache.clear_pattern("question:slug:*");
}

// ================= QUESTION ROUTINGS =================

router.post('/questions', async (req, res, next) => {
  try {
    const questionIn = req.body;
    const existing = await CodingRepository.getQuestionBySlug(questionIn.slug);
    if (existing) {
      return res.status(400).json({
        error: {
          code: "DUPLICATE_SLUG",
          message: `Question with slug '${questionIn.slug}' already exists.`
        }
      });
    }

    const newQuestion = await CodingRepository.createQuestion(questionIn);

    if (questionIn.starter_codes) {
      const langCol = await db.collection('languages');
      for (const [langName, code] of Object.entries(questionIn.starter_codes)) {
        const langDoc = await langCol.findOne({ name: { $regex: new RegExp("^" + langName + "$", "i") } });
        if (langDoc) {
          await CodingRepository.addQuestionLanguageTemplate(newQuestion.id, langDoc._id, code);
        }
      }
    }

    if (questionIn.tags) {
      for (const tagName of questionIn.tags) {
        await CodingRepository.addQuestionTag(newQuestion.id, tagName);
      }
    }

    await invalidateQuestionsCache();
    const createdQuestion = await CodingRepository.getQuestionById(newQuestion.id);
    res.status(201).json(createdQuestion);
  } catch (err) {
    next(err);
  }
});

router.get('/questions', async (req, res, next) => {
  try {
    const cached = await RedisCache.get("questions:all");
    if (cached !== null) {
      return res.json(cached);
    }

    const questions = await CodingRepository.getAllQuestions();
    await RedisCache.set("questions:all", questions, 600);
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

router.get('/questions/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const cacheKey = `question:id:${id}`;
    const cached = await RedisCache.get(cacheKey);
    if (cached !== null) {
      return res.json(cached);
    }

    const question = await CodingRepository.getQuestionById(id);
    if (!question) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    await RedisCache.set(cacheKey, question, 600);
    res.json(question);
  } catch (err) {
    next(err);
  }
});

router.put('/questions/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const questionIn = req.body;

    const existing = await CodingRepository.getQuestionById(id);
    if (!existing) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    await CodingRepository.updateQuestion(id, questionIn);

    if (questionIn.starter_codes) {
      const langCol = await db.collection('languages');
      for (const [langName, code] of Object.entries(questionIn.starter_codes)) {
        const langDoc = await langCol.findOne({ name: { $regex: new RegExp("^" + langName + "$", "i") } });
        if (langDoc) {
          await CodingRepository.addQuestionLanguageTemplate(id, langDoc._id, code);
        }
      }
    }

    if (questionIn.tags) {
      await CodingRepository.clearQuestionTags(id);
      for (const tagName of questionIn.tags) {
        await CodingRepository.addQuestionTag(id, tagName);
      }
    }

    await invalidateQuestionsCache();
    const updated = await CodingRepository.getQuestionById(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/questions/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await CodingRepository.getQuestionById(id);
    if (!existing) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    await CodingRepository.deleteQuestion(id);
    await invalidateQuestionsCache();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/questions/:id/duplicate', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await CodingRepository.getQuestionById(id);
    if (!existing) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    const dupTitle = `${existing.title} (Duplicate)`;
    const dupSlug = `${existing.slug}-duplicate-${Math.floor(Date.now() / 1000)}`;

    const dupData = {
      title: dupTitle,
      slug: dupSlug,
      description: existing.description,
      difficulty: existing.difficulty,
      estimated_time: existing.estimated_time,
      marks: existing.marks,
      topic_id: existing.topic_id,
      question_type: existing.question_type,
      memory_limit: existing.memory_limit,
      time_limit: existing.time_limit,
      status: "unpublished"
    };

    const duplicated = await CodingRepository.createQuestion(dupData);

    if (existing.templates) {
      const langCol = await db.collection('languages');
      for (const [langName, starterCode] of Object.entries(existing.templates)) {
        const langDoc = await langCol.findOne({ name: { $regex: new RegExp("^" + langName + "$", "i") } });
        if (langDoc) {
          await CodingRepository.addQuestionLanguageTemplate(duplicated.id, langDoc._id, starterCode);
        }
      }
    }

    if (existing.tags) {
      for (const tagName of existing.tags) {
        await CodingRepository.addQuestionTag(duplicated.id, tagName);
      }
    }

    await invalidateQuestionsCache();
    const finalDup = await CodingRepository.getQuestionById(duplicated.id);
    res.status(201).json(finalDup);
  } catch (err) {
    next(err);
  }
});

router.post('/questions/bulk-import', async (req, res, next) => {
  try {
    const questionsIn = req.body;
    let imported = 0;

    for (const q of questionsIn) {
      const existing = await CodingRepository.getQuestionBySlug(q.slug);
      if (existing) {
        continue;
      }

      const newQ = await CodingRepository.createQuestion(q);

      if (q.starter_codes) {
        const langCol = await db.collection('languages');
        for (const [langName, code] of Object.entries(q.starter_codes)) {
          const langDoc = await langCol.findOne({ name: { $regex: new RegExp("^" + langName + "$", "i") } });
          if (langDoc) {
            await CodingRepository.addQuestionLanguageTemplate(newQ.id, langDoc._id, code);
          }
        }
      }

      if (q.tags) {
        for (const tagName of q.tags) {
          await CodingRepository.addQuestionTag(newQ.id, tagName);
        }
      }

      imported++;
    }

    await invalidateQuestionsCache();
    res.status(201).json({ status: "success", imported });
  } catch (err) {
    next(err);
  }
});

router.post('/questions/:id/hints', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { attempt_number, hint_text } = req.body;

    const question = await CodingRepository.getQuestionById(id);
    if (!question) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    const hintsCol = await db.collection('hints');
    const hintId = await db.getNextSequenceValue('hint_id');
    await hintsCol.insertOne({
      _id: hintId,
      id: hintId,
      question_id: id,
      attempt_number: attempt_number,
      hint: hint_text
    });

    res.status(201).json({ status: "success", hint_id: hintId });
  } catch (err) {
    next(err);
  }
});

router.post('/questions/:id/solutions', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { language_name, code, explanation, complexity } = req.body;

    const question = await CodingRepository.getQuestionById(id);
    if (!question) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    const langCol = await db.collection('languages');
    const langDoc = await langCol.findOne({ name: { $regex: new RegExp("^" + language_name + "$", "i") } });
    if (!langDoc) {
      return res.status(400).json({
        error: {
          code: "INVALID_LANGUAGE",
          message: `Language '${language_name}' not supported.`
        }
      });
    }

    const solutionsCol = await db.collection('solutions');
    const solutionId = await db.getNextSequenceValue('solution_id');
    await solutionsCol.insertOne({
      _id: solutionId,
      id: solutionId,
      question_id: id,
      language_id: langDoc._id,
      code: code,
      explanation: explanation,
      complexity: complexity || "O(N)"
    });

    res.status(201).json({ status: "success", solution_id: solutionId });
  } catch (err) {
    next(err);
  }
});

// ================= TESTCASES ROUTINGS =================

router.post('/questions/:id/testcases', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const testcaseIn = req.body;

    const question = await CodingRepository.getQuestionById(id);
    if (!question) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    const testcase = await CodingRepository.createTestCase({
      question_id: id,
      input: testcaseIn.input,
      expected_output: testcaseIn.expected_output,
      is_hidden: testcaseIn.is_hidden
    });

    res.status(201).json(testcase);
  } catch (err) {
    next(err);
  }
});

router.get('/questions/:id/testcases', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const question = await CodingRepository.getQuestionById(id);
    if (!question) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    const testcases = await CodingRepository.getTestCasesByQuestion(id);
    res.json(testcases);
  } catch (err) {
    next(err);
  }
});

router.delete('/testcases/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const testcase = await CodingRepository.getTestCaseById(id);
    if (!testcase) {
      return res.status(404).json({
        error: {
          code: "TESTCASE_NOT_FOUND",
          message: `TestCase with ID ${id} not found`
        }
      });
    }

    await CodingRepository.deleteTestCase(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ================= RUN ROUTINGS =================

router.post('/run', rateLimit(5, 60), async (req, res, next) => {
  try {
    const { language, code, input } = req.body;

    const languageId = getLanguageId(language);
    const judge0 = getJudge0Service();

    let execCode = code;
    let stdinData = input;

    if (language.trim().toLowerCase() === "sql") {
      execCode = (input || "") + "\n" + code;
      stdinData = "";
    }

    const result = await judge0.executeCode(execCode, languageId, stdinData);

    const statusDesc = result.status.description;

    let combinedErr = "";
    if (result.stderr) {
      combinedErr = result.stderr;
    } else if (result.compile_output) {
      combinedErr = result.compile_output;
    }

    res.json({
      status: statusDesc,
      stdout: result.stdout,
      stderr: combinedErr,
      execution_time: String(result.time),
      memory: parseInt(result.memory, 10)
    });
  } catch (err) {
    next(err);
  }
});

// ================= SUBMISSIONS ROUTINGS =================

router.post('/submit', rateLimit(5, 60), async (req, res, next) => {
  try {
    const { student_id, question_id, language, code } = req.body;

    const question = await CodingRepository.getQuestionById(question_id);
    if (!question) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${question_id} not found`
        }
      });
    }

    const dbSub = await CodingService.enqueueSubmission(
      student_id,
      question_id,
      language,
      code
    );

    res.status(201).json({
      submission_id: dbSub.id,
      status: dbSub.status,
      verdict: dbSub.status,
      passed: dbSub.passed,
      total: dbSub.total
    });
  } catch (err) {
    next(err);
  }
});

router.get('/submissions', async (req, res, next) => {
  try {
    const submissions = await CodingRepository.getAllSubmissions();
    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

router.get('/submissions/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const submission = await CodingRepository.getSubmissionById(id);
    if (!submission) {
      return res.status(404).json({
        error: {
          code: "SUBMISSION_NOT_FOUND",
          message: `Submission with ID ${id} not found`
        }
      });
    }
    res.json(submission);
  } catch (err) {
    next(err);
  }
});

router.get('/submissions/:id/status', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const submission = await CodingRepository.getSubmissionById(id);
    if (!submission) {
      return res.status(404).json({
        error: {
          code: "SUBMISSION_NOT_FOUND",
          message: `Submission with ID ${id} not found`
        }
      });
    }
    res.json({
      submission_id: submission.id,
      status: submission.status,
      passed: submission.passed,
      total: submission.total
    });
  } catch (err) {
    next(err);
  }
});

router.get('/students/:student_id/submissions', async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.student_id, 10);
    const submissions = await CodingRepository.getSubmissionsByStudent(studentId);
    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
