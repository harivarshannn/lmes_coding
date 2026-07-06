const express = require('express');
const router = express.Router();
const QuestionRepository = require('../repositories/question_repo');
const { RedisCache } = require('../database/redis');
const db = require('../database/session');

async function invalidateQuestionsCache() {
  await RedisCache.delete("questions:all");
  await RedisCache.clear_pattern("question:id:*");
  await RedisCache.clear_pattern("question:slug:*");
}

router.post('/questions', async (req, res, next) => {
  try {
    const questionIn = req.body;
    const existing = await QuestionRepository.getBySlug(questionIn.slug);
    if (existing) {
      return res.status(400).json({
        error: {
          code: "DUPLICATE_SLUG",
          message: `Question with slug '${questionIn.slug}' already exists.`
        }
      });
    }

    const newQuestion = await QuestionRepository.create(questionIn);

    if (questionIn.starter_codes) {
      const langCol = await db.collection('languages');
      for (const [langName, code] of Object.entries(questionIn.starter_codes)) {
        const langDoc = await langCol.findOne({ name: { $regex: new RegExp("^" + langName + "$", "i") } });
        if (langDoc) {
          await QuestionRepository.addLanguageTemplate(newQuestion.id, langDoc._id, code);
        }
      }
    }

    if (questionIn.tags) {
      for (const tagName of questionIn.tags) {
        await QuestionRepository.addTag(newQuestion.id, tagName);
      }
    }

    await invalidateQuestionsCache();
    const createdQuestion = await QuestionRepository.getById(newQuestion.id);
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

    const questions = await QuestionRepository.getAll();
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

    const question = await QuestionRepository.getById(id);
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

    const existing = await QuestionRepository.getById(id);
    if (!existing) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    await QuestionRepository.update(id, questionIn);

    if (questionIn.starter_codes) {
      const langCol = await db.collection('languages');
      for (const [langName, code] of Object.entries(questionIn.starter_codes)) {
        const langDoc = await langCol.findOne({ name: { $regex: new RegExp("^" + langName + "$", "i") } });
        if (langDoc) {
          await QuestionRepository.addLanguageTemplate(id, langDoc._id, code);
        }
      }
    }

    if (questionIn.tags) {
      await QuestionRepository.clearTags(id);
      for (const tagName of questionIn.tags) {
        await QuestionRepository.addTag(id, tagName);
      }
    }

    await invalidateQuestionsCache();
    const updated = await QuestionRepository.getById(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/questions/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await QuestionRepository.getById(id);
    if (!existing) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    await QuestionRepository.delete(id);
    await invalidateQuestionsCache();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/questions/:id/duplicate', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await QuestionRepository.getById(id);
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

    const duplicated = await QuestionRepository.create(dupData);

    // Copy templates
    if (existing.templates) {
      const langCol = await db.collection('languages');
      for (const [langName, starterCode] of Object.entries(existing.templates)) {
        const langDoc = await langCol.findOne({ name: { $regex: new RegExp("^" + langName + "$", "i") } });
        if (langDoc) {
          await QuestionRepository.addLanguageTemplate(duplicated.id, langDoc._id, starterCode);
        }
      }
    }

    // Copy tags
    if (existing.tags) {
      for (const tagName of existing.tags) {
        await QuestionRepository.addTag(duplicated.id, tagName);
      }
    }

    await invalidateQuestionsCache();
    const finalDup = await QuestionRepository.getById(duplicated.id);
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
      const existing = await QuestionRepository.getBySlug(q.slug);
      if (existing) {
        continue;
      }

      const newQ = await QuestionRepository.create(q);

      if (q.starter_codes) {
        const langCol = await db.collection('languages');
        for (const [langName, code] of Object.entries(q.starter_codes)) {
          const langDoc = await langCol.findOne({ name: { $regex: new RegExp("^" + langName + "$", "i") } });
          if (langDoc) {
            await QuestionRepository.addLanguageTemplate(newQ.id, langDoc._id, code);
          }
        }
      }

      if (q.tags) {
        for (const tagName of q.tags) {
          await QuestionRepository.addTag(newQ.id, tagName);
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

    const question = await QuestionRepository.getById(id);
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

    const question = await QuestionRepository.getById(id);
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

module.exports = router;
