// Generates the first or follow-up behavioral interview question via the LLM
import dotenv from 'dotenv';
import { askLLM } from '../services/llm/llm_wrapper.js';

dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

export const generateBehavioralQuestion = async (user, jd = '', attempt = null) => {
  try {
    const steps = Array.isArray(attempt?.steps) ? attempt.steps : [];
    const currentStep = steps.find(step => step.stepNumber === attempt?.currentStep);
    const isFirstQuestion = !attempt || !currentStep;

    const previousQuestion = !isFirstQuestion ? String(currentStep.question || '').trim() : '';
    const previousTranscript = !isFirstQuestion ? String(currentStep.transcript || '').trim() : '';

    const previousAssessment = !isFirstQuestion
      ? {
          score: Number(currentStep.score ?? 0),
          relevance: Number(currentStep.relevance ?? 0),
          clarity: Number(currentStep.clarity ?? 0),
          confidence: Number(currentStep.confidence ?? 0),
          feedback: String(currentStep.feedback || '').trim()
        }
      : null;

    const skills = Array.isArray(user?.skills)
      ? user.skills.filter(Boolean).join(', ')
      : String(user?.skills || '').trim();

    const experience = String(user?.experienceYear ?? '').trim();
    const designation = String(user?.designation ?? '').trim();

    const candidateSkills = skills || 'software development';
    const candidateExperience = experience || 'not specified';
    const candidateDesignation = designation || 'not specified';
    const jobDescription = String(jd || '').trim() || 'Not provided';

    const prompt = `
You are conducting a professional technical and behavioral interview.

Your task is to generate exactly ONE interview question for the candidate.

Candidate information:
- Designation: ${candidateDesignation}
- Skills: ${candidateSkills}
- Experience: ${candidateExperience}

Job Description:
${jobDescription}

Interview context:
- This is ${isFirstQuestion ? "the candidate's FIRST question." : "a FOLLOW-UP question."}

${
  isFirstQuestion
    ? `
There is no previous interview response.

Generate an initial interview question that:
- Is relevant to the candidate's role, skills, and job description.
- Encourages the candidate to describe a real project, experience, challenge, or technical decision.
- Allows the candidate to demonstrate technical depth and personal ownership.
- Is suitable for a professional video interview.
`
    : `
Previous question:
${previousQuestion}

Candidate's previous response:
${previousTranscript || 'No usable transcript was available.'}

Previous assessment:
${JSON.stringify(previousAssessment, null, 2)}

Generate a meaningful follow-up question.

The follow-up question MUST:
- Directly build on the candidate's previous response.
- Explore the previous response more deeply.
- Probe vague, unclear, incomplete, or unsupported claims.
- Explore the candidate's specific actions and ownership.
- Explore technical decisions and reasoning where relevant.
- Explore challenges, trade-offs, failures, or problem-solving where relevant.
- Ask for concrete evidence when the candidate makes a strong claim.
- Explore the candidate's specific contribution when they describe a project.
- Explore outcomes when the candidate describes an implementation.
- Avoid repeating the previous question.
- Feel like a natural continuation of the interview.

Do not invent facts about the candidate.
Base the follow-up primarily on the information actually present in the previous response.
`
}

General rules:
- Ask exactly ONE question.
- The question must be concise and professional.
- Do not ask multiple questions joined together.
- Do not use numbering.
- Do not provide explanations.
- Do not provide an introduction such as "Sure" or "Here is your question".
- Do not return JSON.
- Do not return Markdown.
- Do not use quotation marks around the question.
- Return ONLY the question text.
`.trim();

    console.log(`Generating behavioral question for ${isFirstQuestion ? 'step 1' : `step ${attempt.currentStep + 1}`}`);

    const rawResponse = await askLLM(prompt, { temperature: 0.7, maxTokens: 300 });

    if (rawResponse === null || rawResponse === undefined) {
      throw new Error('LLM returned an empty response while generating behavioral question');
    }

    if (typeof rawResponse !== 'string') {
      throw new Error(`LLM returned invalid response type: ${typeof rawResponse}`);
    }

    let question = rawResponse
      .trim()
      .replace(/^```(?:text|txt)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .replace(/^["']([\s\S]*)["']$/, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!question) {
      throw new Error('LLM returned an empty behavioral question');
    }

    if (question.length < 20) {
      throw new Error(`LLM returned an unusually short behavioral question: "${question}"`);
    }

    if (question.length > 1000) {
      throw new Error('LLM returned an excessively long behavioral question');
    }

    if (!question.includes('?')) {
      throw new Error(`LLM response does not appear to be a question: "${question}"`);
    }

    if ((question.startsWith('{') && question.endsWith('}')) || (question.startsWith('[') && question.endsWith(']'))) {
      throw new Error('LLM returned JSON instead of a behavioral question');
    }

    const questionMarks = (question.match(/\?/g) || []).length;

    if (questionMarks !== 1) {
      throw new Error(`LLM returned ${questionMarks} questions instead of exactly one`);
    }

    console.log('Behavioral question generated successfully:', question);

    return question;

  } catch (error) {
    console.error('Behavioral question generation failed:', error.message);
    throw error;
  }
};