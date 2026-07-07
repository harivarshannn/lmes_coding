const express = require('express');
const router = express.Router();
const BugfixRepository = require('./bugfix.repo');
const BugfixService = require('./bugfix.service');
const { validateChallengeCreation, validateFixAttempt } = require('./bugfix.validator');
const { RedisCache } = require('../../database/redis');

// Create challenge (Admin)
router.post('/bugfix/challenges', async (req, res, next) => {
  try {
    const validationError = validateChallengeCreation(req.body);
    if (validationError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validationError } });
    }

    const existing = await BugfixRepository.getChallengeBySlug(req.body.slug);
    if (existing) {
      return res.status(400).json({ error: { code: 'DUPLICATE_SLUG', message: `Challenge with slug '${req.body.slug}' already exists` } });
    }

    const challenge = await BugfixRepository.createChallenge(req.body);
    await RedisCache.delete('bugfix:challenges:all');
    res.status(201).json(challenge);
  } catch (err) { next(err); }
});

// List challenges
router.get('/bugfix/challenges', async (req, res, next) => {
  try {
    const cached = await RedisCache.get('bugfix:challenges:all');
    if (cached) return res.json(cached);

    const challenges = await BugfixRepository.getAllChallenges();
    // Strip correct_code from listing
    const sanitized = challenges.map(c => {
      const { correct_code, ...rest } = c;
      return rest;
    });
    await RedisCache.set('bugfix:challenges:all', sanitized, 300);
    res.json(sanitized);
  } catch (err) { next(err); }
});

// Get challenge (student view — no correct_code)
router.get('/bugfix/challenges/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const challenge = await BugfixService.getChallengeForStudent(id);
    if (!challenge) {
      return res.status(404).json({ error: { code: 'CHALLENGE_NOT_FOUND', message: `Challenge with ID ${id} not found` } });
    }
    res.json(challenge);
  } catch (err) { next(err); }
});

// Update challenge (Admin)
router.put('/bugfix/challenges/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const challenge = await BugfixRepository.getChallengeById(id);
    if (!challenge) {
      return res.status(404).json({ error: { code: 'CHALLENGE_NOT_FOUND', message: `Challenge with ID ${id} not found` } });
    }
    const updated = await BugfixRepository.updateChallenge(id, req.body);
    await RedisCache.delete('bugfix:challenges:all');
    res.json(updated);
  } catch (err) { next(err); }
});

// Delete challenge (Admin)
router.delete('/bugfix/challenges/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const challenge = await BugfixRepository.getChallengeById(id);
    if (!challenge) {
      return res.status(404).json({ error: { code: 'CHALLENGE_NOT_FOUND', message: `Challenge with ID ${id} not found` } });
    }
    await BugfixRepository.deleteChallenge(id);
    await RedisCache.delete('bugfix:challenges:all');
    res.status(204).end();
  } catch (err) { next(err); }
});

// Submit fix attempt (Student)
router.post('/bugfix/challenges/:id/attempt', async (req, res, next) => {
  try {
    const challengeId = parseInt(req.params.id, 10);
    const validationError = validateFixAttempt(req.body);
    if (validationError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validationError } });
    }

    const result = await BugfixService.submitFix(
      parseInt(req.body.user_id, 10),
      challengeId,
      req.body.submitted_code
    );

    if (result.error) {
      const status = result.error.includes('not found') ? 404 : 400;
      return res.status(status).json({ error: { code: 'BUGFIX_ERROR', message: result.error } });
    }

    res.status(201).json(result);
  } catch (err) { next(err); }
});

// Get attempt result
router.get('/bugfix/attempts/:id/result', async (req, res, next) => {
  try {
    const attemptId = parseInt(req.params.id, 10);
    const result = await BugfixService.getAttemptResult(attemptId);
    if (!result) {
      return res.status(404).json({ error: { code: 'ATTEMPT_NOT_FOUND', message: `Attempt with ID ${attemptId} not found` } });
    }
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
