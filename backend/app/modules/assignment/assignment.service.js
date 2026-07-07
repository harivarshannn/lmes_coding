const AssignmentRepository = require('./assignment.repo');
const Evaluator = require('../../services/evaluator');

class AssignmentService {
  static isDeadlinePassed(assignment) {
    if (!assignment.deadline) return false;
    return new Date() > new Date(assignment.deadline);
  }

  static async submitAssignment(userId, assignmentId, code, language) {
    const assignment = await AssignmentRepository.getById(assignmentId);
    if (!assignment) return { error: 'Assignment not found' };

    // Check for existing submission
    const existing = await AssignmentRepository.getSubmissionByUserAndAssignment(userId, assignmentId);
    
    const isLate = this.isDeadlinePassed(assignment);
    const status = isLate ? 'Late' : 'Submitted';

    let submission;
    if (existing) {
      // Update existing submission
      await AssignmentRepository.updateSubmission(existing.id, {
        status: status,
        auto_grade_score: null,
        final_score: null
      });
      // Update the code directly
      const col = await require('../../database/session').collection('assignment_submissions');
      await col.updateOne({ _id: existing.id }, { $set: { code: code, language: language, submitted_at: new Date() } });
      submission = await AssignmentRepository.getSubmissionById(existing.id);
    } else {
      submission = await AssignmentRepository.createSubmission({
        assignment_id: assignmentId,
        user_id: userId,
        code: code,
        language: language || assignment.language,
        status: status
      });
    }

    // Auto-grade if enabled and test cases exist
    if (assignment.auto_grade_enabled && assignment.test_cases && assignment.test_cases.length > 0) {
      try {
        const [verdict, passed, total] = await Evaluator.evaluate(
          code,
          language || assignment.language,
          assignment.test_cases
        );
        const autoScore = total > 0 ? Math.round((passed / total) * assignment.max_marks) : 0;
        submission = await AssignmentRepository.updateSubmission(submission.id, {
          auto_grade_score: autoScore,
          final_score: autoScore,
          status: isLate ? 'Late' : 'Graded'
        });
      } catch (e) {
        console.error(`Auto-grade failed for assignment submission ${submission.id}:`, e.message);
      }
    }

    return submission;
  }

  static async manualGrade(submissionId, score, feedback) {
    const submission = await AssignmentRepository.getSubmissionById(submissionId);
    if (!submission) return null;

    return await AssignmentRepository.updateSubmission(submissionId, {
      manual_grade_score: score,
      final_score: score,
      feedback: feedback || '',
      status: 'Graded',
      graded_at: new Date()
    });
  }
}

module.exports = AssignmentService;
