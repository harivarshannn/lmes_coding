const express = require('express');
const router = express.Router();
const TestCaseRepository = require('../repositories/testcase_repo');
const QuestionRepository = require('../repositories/question_repo');

router.post('/questions/:id/testcases', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const testcaseIn = req.body;

    const question = await QuestionRepository.getById(id);
    if (!question) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    const testcase = await TestCaseRepository.create({
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

    const question = await QuestionRepository.getById(id);
    if (!question) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${id} not found`
        }
      });
    }

    const testcases = await TestCaseRepository.getByQuestion(id);
    res.json(testcases);
  } catch (err) {
    next(err);
  }
});

router.delete('/testcases/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const testcase = await TestCaseRepository.getById(id);
    if (!testcase) {
      return res.status(404).json({
        error: {
          code: "TESTCASE_NOT_FOUND",
          message: `TestCase with ID ${id} not found`
        }
      });
    }

    await TestCaseRepository.delete(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
