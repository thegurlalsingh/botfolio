// src/services/mcq_generation.js
import dotenv from 'dotenv';
import { askLLM } from "../services/llm/llm_wrapper.js";

dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

export const generateBehavioralQuestion = async (user) => {
  const skills = user.skills?.join(", ") || "software development";
  const experience = user.experience || "a few years";

  const prompt = `Generate ONE behavioral interview question for a candidate with skills in ${skills} and ${experience} of experience.

Rules:
- Focus on real-world scenarios (leadership, teamwork, problem-solving, handling pressure, conflict, failure, etc.)
- Make it open-ended (starts with "Tell me about a time..." or "Describe a situation...")
- Keep it concise and professional
- Return ONLY the question text itself — no quotes, no numbering, no extra explanation, no JSON, nothing else`;

  try {
    const rawResponse = await askLLM(prompt, {
      temperature: 0.7,    // a bit of creativity is fine for behavioral questions
      maxTokens: 150,
    });

    console.log('Raw LLM response:', rawResponse);

    // Clean up common LLM artifacts
    let cleaned = rawResponse
      .trim()
      .replace(/^["']/, '')     // remove leading quote if any
      .replace(/["']$/, '')     // remove trailing quote
      .replace(/Tell me about a time/g, 'Tell me about a time') // normalize
      .replace(/\n+/g, ' ');    // collapse newlines to spaces

    // Very basic sanity check
    if (!cleaned || cleaned.length < 20 || !cleaned.includes('time') && !cleaned.includes('situation')) {
      throw new Error("LLM returned invalid or empty question");
    }

    console.log('Generated behavioral question:', cleaned);

    return cleaned;

  } catch (e) {
    console.error("Behavioral question generation failed:", e.message);

    // Fallback question
    return "Tell me about a time when you had to resolve a conflict within your team. What was the situation, what actions did you take, and what was the outcome?";
  }
};