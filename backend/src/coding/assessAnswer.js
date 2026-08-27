// Sends a coding solution to the LLM for scoring and returns a fallback score on failure.
import dotenv from "dotenv";
import { askJsonLLM } from '../services/llm/llm_wrapper.js';

dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

export const assessSolution = async (problem, solution, results) => {
  const prompt = `You are a senior engineer. Evaluate this coding solution.

Problem: ${problem.title}
${problem.description}

Solution:
\`\`\`js
${solution}
\`\`\`

Test Results: ${results.passed}/${results.total} passed

Score (0-100) based on:
- Correctness
- Efficiency (time/space)
- Code style & readability
- Edge case handling

Return JSON:
{
  "score": 88,
  "feedback": "Excellent use of hash map..."
}`;

  try {
    const parsed = await askJsonLLM(prompt, {
      temperature: 0,
      maxTokens: 8192,
    });
    if (typeof parsed.score !== 'number' || !parsed.feedback) {
      throw new Error('Invalid coding assessment response');
    }
    return parsed;
  } catch (error) {
    console.error("Assessment failed:", error.message);
    return {
      score: 50,
      feedback: "Technical issue during evaluation.",
      relevance: 50,
      clarity: 50,
      confidence: 50
    };
  }
};