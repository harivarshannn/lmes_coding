const express = require('express');
const router = express.Router();
const McqRepository = require('./mcq.repo');
const McqService = require('./mcq.service');
const { validateQuizCreation, validateQuestionCreation, validateAttemptSubmission } = require('./mcq.validator');
const { RedisCache } = require('../../database/redis');

// Create quiz (Admin)
router.post('/mcq/quizzes', async (req, res, next) => {
  try {
    const validationError = validateQuizCreation(req.body);
    if (validationError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validationError } });
    }

    const existing = await McqRepository.getQuizBySlug(req.body.slug);
    if (existing) {
      return res.status(400).json({ error: { code: 'DUPLICATE_SLUG', message: `Quiz with slug '${req.body.slug}' already exists` } });
    }

    const quiz = await McqRepository.createQuiz(req.body);
    await RedisCache.delete('mcq:quizzes:all');
    res.status(201).json(quiz);
  } catch (err) { next(err); }
});

// List quizzes
router.get('/mcq/quizzes', async (req, res, next) => {
  try {
    const cached = await RedisCache.get('mcq:quizzes:all');
    if (cached) return res.json(cached);

    const quizzes = await McqRepository.getAllQuizzes();
    await RedisCache.set('mcq:quizzes:all', quizzes, 300);
    res.json(quizzes);
  } catch (err) { next(err); }
});

// Get quiz with questions
router.get('/mcq/quizzes/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const quiz = await McqRepository.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ error: { code: 'QUIZ_NOT_FOUND', message: `Quiz with ID ${id} not found` } });
    }
    const questions = await McqRepository.getQuestionsByQuiz(id);
    res.json({ ...quiz, questions });
  } catch (err) { next(err); }
});

// Update quiz
router.put('/mcq/quizzes/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const quiz = await McqRepository.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ error: { code: 'QUIZ_NOT_FOUND', message: `Quiz with ID ${id} not found` } });
    }
    const updated = await McqRepository.updateQuiz(id, req.body);
    await RedisCache.delete('mcq:quizzes:all');
    res.json(updated);
  } catch (err) { next(err); }
});

// Delete quiz
router.delete('/mcq/quizzes/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const quiz = await McqRepository.getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ error: { code: 'QUIZ_NOT_FOUND', message: `Quiz with ID ${id} not found` } });
    }
    await McqRepository.deleteQuiz(id);
    await RedisCache.delete('mcq:quizzes:all');
    res.status(204).end();
  } catch (err) { next(err); }
});

// Add question to quiz (Admin)
router.post('/mcq/quizzes/:id/questions', async (req, res, next) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const quiz = await McqRepository.getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: { code: 'QUIZ_NOT_FOUND', message: `Quiz with ID ${quizId} not found` } });
    }

    const validationError = validateQuestionCreation(req.body);
    if (validationError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validationError } });
    }

    const question = await McqRepository.addQuestion({ ...req.body, quiz_id: quizId });
    res.status(201).json(question);
  } catch (err) { next(err); }
});

// Start quiz attempt (Student)
router.post('/mcq/quizzes/:id/attempt', async (req, res, next) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const userId = parseInt(req.body.user_id || req.query.user_id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'user_id is required' } });
    }

    const result = await McqService.startAttempt(userId, quizId);
    if (!result) {
      return res.status(404).json({ error: { code: 'QUIZ_NOT_FOUND', message: `Quiz with ID ${quizId} not found` } });
    }
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// Submit quiz attempt answers
router.post('/mcq/attempts/:id/submit', async (req, res, next) => {
  try {
    const attemptId = parseInt(req.params.id, 10);
    const validationError = validateAttemptSubmission(req.body);
    if (validationError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validationError } });
    }

    const result = await McqService.submitAttempt(
      attemptId,
      req.body.answers,
      req.body.time_taken_seconds || 0
    );
    if (!result) {
      return res.status(404).json({ error: { code: 'ATTEMPT_NOT_FOUND', message: `Attempt with ID ${attemptId} not found` } });
    }
    res.json(result);
  } catch (err) { next(err); }
});

// Get attempt result
router.get('/mcq/attempts/:id/result', async (req, res, next) => {
  try {
    const attemptId = parseInt(req.params.id, 10);
    const result = await McqService.getResult(attemptId);
    if (!result) {
      return res.status(404).json({ error: { code: 'ATTEMPT_NOT_FOUND', message: `Attempt with ID ${attemptId} not found` } });
    }
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
