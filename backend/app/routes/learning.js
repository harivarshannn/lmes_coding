const express = require('express');
const router = express.Router();
const LearningService = require('../services/learning_service');

router.get('/questions/:id/stage', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const studentId = parseInt(req.query.student_id, 10);

    if (isNaN(studentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "student_id is required as query parameter"
        }
      });
    }

    const stageDetails = await LearningService.getRevealStage(studentId, id);
    res.json(stageDetails);
  } catch (err) {
    next(err);
  }
});

router.post('/attempts/:attempt_id/feedback', async (req, res, next) => {
  try {
    const attemptId = parseInt(req.params.attempt_id, 10);
    const studentId = parseInt(req.query.student_id, 10);

    if (isNaN(studentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "student_id is required as query parameter"
        }
      });
    }

    const feedbackText = await LearningService.generateAiFeedback(studentId, attemptId);
    res.json({
      status: "success",
      attempt_id: attemptId,
      feedback: feedbackText
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
