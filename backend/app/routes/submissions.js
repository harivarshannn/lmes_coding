const express = require('express');
const router = express.Router();
const rateLimit = require('../utils/rate_limit');
const QuestionRepository = require('../repositories/question_repo');
const SubmissionRepository = require('../repositories/submission_repo');
const { SubmissionService } = require('../services/submission_service');

router.post('/submit', rateLimit(5, 60), async (req, res, next) => {
  try {
    const { student_id, question_id, language, code } = req.body;

    const question = await QuestionRepository.getById(question_id);
    if (!question) {
      return res.status(404).json({
        error: {
          code: "QUESTION_NOT_FOUND",
          message: `Question with ID ${question_id} not found`
        }
      });
    }

    const dbSub = await SubmissionService.enqueueSubmission(
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
    const submissions = await SubmissionRepository.getAll();
    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

router.get('/submissions/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const submission = await SubmissionRepository.getById(id);
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

// Lightweight status-only endpoint for fast polling (no code/stdout payload)
router.get('/submissions/:id/status', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const submission = await SubmissionRepository.getById(id);
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
    const submissions = await SubmissionRepository.getByStudent(studentId);
    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
