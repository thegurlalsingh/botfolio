// Generates 10 MCQs via LLM based on candidate skills, experience, and job description.
import dotenv from 'dotenv';
import { askJsonLLM } from '../services/llm/llm_wrapper.js';

dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

export const generateMCQs = async ({ skills = [], experienceYears = "", appliedFor = "", jd = "" }) => {
  const skillsList = Array.isArray(skills) ? skills.join(", ") : "JavaScript, React, Node.js";
  if (Array.isArray(skills)) {
    console.log("fetched from db");
  } else {
    console.log("dummy");
  }
  const prompt = `You are an expert technical interviewer.

Generate exactly 10 high-quality MCQs for a ${appliedFor} role according to Job Description given below.

Candidate has skills in: ${skillsList || "Full stack developer"}
Experience: ${experienceYears || "3-7 years"}
Job Description: ${jd}

Rules:
- Each question: medium to hard
- 4 options (A, B, C, D)
- Exactly one correct answer
- Output ONLY valid JSON object, no markdown, no explanation

Format:
{
  {
    "question": "What is the output of ...?",
    "options": ["First", "Second", "Third", "Fourth"],
    "correct": "B"
  }
}

Do not add any text outside JSON.
 Return **only** valid JSON — no explanations, no markdown, no code fences (
- Use null or empty string "" for missing values — never fabricate or guess data
`.trim();

  try {
    const parsed = await askJsonLLM(prompt, {
      temperature: 0,
      maxTokens: 8192,
    });

    console.log('MCQ parsed LLM response:', JSON.stringify(parsed, null, 2));

    let questions = [];

    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else if (parsed.question) {
      questions = [parsed];
    }

    if (questions.length === 0) {
      throw new Error('LLM did not return valid MCQs');
    }

    if (questions.length !== 10) {
      throw new Error(`Expected 10 MCQs, but received ${questions.length}`);
    }

    return questions;

  } catch (error) {
    console.error('MCQ generation failed:', error);
    throw error;
  }
};