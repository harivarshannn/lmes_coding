const express = require('express');
const router = express.Router();
const GamificationRepository = require('./gamification.repo');
const GamificationService = require('./gamification.service');
const { RedisCache } = require('../../database/redis');

// Leaderboard route
router.get('/leaderboard', async (req, res, next) => {
  try {
    const cacheKey = "leaderboard:top50";
    const cached = await RedisCache.get(cacheKey);
    if (cached !== null) {
      return res.json(cached);
    }

    const leaders = await GamificationRepository.getLeaderboard(50);
    await RedisCache.set(cacheKey, leaders, 60);
    res.json(leaders);
  } catch (err) {
    next(err);
  }
});

// Reveal hints/solutions stage route
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

    const stageDetails = await GamificationService.getRevealStage(studentId, id);
    res.json(stageDetails);
  } catch (err) {
    next(err);
  }
});

// AI Feedback route
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

    const feedbackText = await GamificationService.generateAiFeedback(studentId, attemptId);
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
