import CodingAttempt from './coding.js';
import { generateCodingProblem } from './generate_questions.js';
import  { executeCode }  from './jDoodle.js';
import { assessSolution } from './assessAnswer.js';
import User from '../login/User.js';

export const startCodingRound = async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  try {
    const problem = await generateCodingProblem(user);

    const attempt = await CodingAttempt.create({
      userId,
      problem,
      completed: false
    });

    res.json({
      success: true,
      problem,
      attemptId: attempt._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitCodingSolution = async (req, res) => {
  const { attemptId, code : solution } = req.body;
  const userId = req.user.id;

  try {
    const attempt = await CodingAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(400).json({ success: false, message: "Invalid attempt" });
    }
    if (!solution || !Array.isArray(attempt.problem.testCases)) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    console.log("test cases: ", attempt.problem.testCases);
    const execResult = await executeCode(solution, attempt.problem.testCases, 'cpp');
    const aiAssessment = await assessSolution(attempt.problem, solution, execResult);

    attempt.solution = solution;
    attempt.passedTests = execResult.passed;
    attempt.totalTests = execResult.total;
    attempt.score = aiAssessment.score;
    attempt.feedback = aiAssessment.feedback;
    attempt.completed = true;
    await attempt.save();

    await User.findByIdAndUpdate(userId, { currentStep: 'completed' });

    res.json({
      success: true,
      score: aiAssessment.score,
      passed: execResult.passed,
      total: execResult.total,
      feedback: aiAssessment.feedback
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const runCodingSolution = async (req, res) => {
  const { code, attemptId } = req.body;
  const userId = req.user.id;

  if (!code || !attemptId) {
    return res.status(400).json({ success: false, message: "code and attemptId required" });
  }

  try {
    // Verify attempt belongs to user
    const attempt = await CodingAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(404).json({ success: false, message: "Attempt not found" });
    }
    if (attempt.completed) {
      return res.status(400).json({ success: false, message: "Cannot run on completed attempt" });
    }

    // Execute code against test cases
    const execResult = await executeCode(code, attempt.problem.testCases);

    res.json({
      success: true,
      passed: execResult.passed,
      total: execResult.total,
      results: execResult.results, // optional: detailed per-test feedback
      message: "Test run complete"
    });

  } catch (error) {
    console.error("Code run failed:", error);
    res.status(500).json({ 
      success: false, 
      message: "Execution failed: " + error.message 
    });
  }
};