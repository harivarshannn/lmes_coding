const express = require('express');
const router = express.Router();
const AssignmentRepository = require('./assignment.repo');
const AssignmentService = require('./assignment.service');
const { validateAssignmentCreation, validateSubmission, validateGrading } = require('./assignment.validator');
const { RedisCache } = require('../../database/redis');

// Create assignment (Admin/Instructor)
router.post('/assignments', async (req, res, next) => {
  try {
    const validationError = validateAssignmentCreation(req.body);
    if (validationError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validationError } });
    }

    const existing = await AssignmentRepository.getBySlug(req.body.slug);
    if (existing) {
      return res.status(400).json({ error: { code: 'DUPLICATE_SLUG', message: `Assignment with slug '${req.body.slug}' already exists` } });
    }

    const assignment = await AssignmentRepository.create(req.body);
    await RedisCache.delete('assignments:all');
    res.status(201).json(assignment);
  } catch (err) { next(err); }
});

// List assignments
router.get('/assignments', async (req, res, next) => {
  try {
    const cached = await RedisCache.get('assignments:all');
    if (cached) return res.json(cached);

    const assignments = await AssignmentRepository.getAll();
    await RedisCache.set('assignments:all', assignments, 300);
    res.json(assignments);
  } catch (err) { next(err); }
});

// Get assignment detail
router.get('/assignments/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const assignment = await AssignmentRepository.getById(id);
    if (!assignment) {
      return res.status(404).json({ error: { code: 'ASSIGNMENT_NOT_FOUND', message: `Assignment with ID ${id} not found` } });
    }
    res.json(assignment);
  } catch (err) { next(err); }
});

// Update assignment
router.put('/assignments/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const assignment = await AssignmentRepository.getById(id);
    if (!assignment) {
      return res.status(404).json({ error: { code: 'ASSIGNMENT_NOT_FOUND', message: `Assignment with ID ${id} not found` } });
    }
    const updated = await AssignmentRepository.update(id, req.body);
    await RedisCache.delete('assignments:all');
    res.json(updated);
  } catch (err) { next(err); }
});

// Submit solution (Student)
router.post('/assignments/:id/submit', async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const validationError = validateSubmission(req.body);
    if (validationError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validationError } });
    }

    const result = await AssignmentService.submitAssignment(
      parseInt(req.body.user_id, 10),
      assignmentId,
      req.body.code,
      req.body.language
    );

    if (result.error) {
      return res.status(404).json({ error: { code: 'ASSIGNMENT_NOT_FOUND', message: result.error } });
    }

    res.status(201).json(result);
  } catch (err) { next(err); }
});

// View submissions for an assignment (Instructor)
router.get('/assignments/:id/submissions', async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const assignment = await AssignmentRepository.getById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: { code: 'ASSIGNMENT_NOT_FOUND', message: `Assignment with ID ${assignmentId} not found` } });
    }
    const submissions = await AssignmentRepository.getSubmissionsByAssignment(assignmentId);
    res.json(submissions);
  } catch (err) { next(err); }
});

// Manual grade (Instructor)
router.put('/assignments/submissions/:id/grade', async (req, res, next) => {
  try {
    const submissionId = parseInt(req.params.id, 10);
    const validationError = validateGrading(req.body);
    if (validationError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validationError } });
    }

    const result = await AssignmentService.manualGrade(
      submissionId,
      req.body.score,
      req.body.feedback
    );

    if (!result) {
      return res.status(404).json({ error: { code: 'SUBMISSION_NOT_FOUND', message: `Submission with ID ${submissionId} not found` } });
    }

    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
