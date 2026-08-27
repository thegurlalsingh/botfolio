// Scores a candidate's interview answer and returns structured feedback using the LLM
import { askJsonLLM } from "../services/llm/llm_wrapper.js";

export const assessAnswer = async (question, transcript) => {
  const prompt = `You are an expert interviewer. Score this answer from 0 to 100.

Question:
${question}

Answer:
${transcript}

Evaluate:
- Relevance to the question
- Clarity and structure
- Confidence and communication
- Technical depth, if applicable

Return ONLY valid JSON in exactly this structure:

{
  "score": 88,
  "feedback": "Strong answer with clear examples.",
  "relevance": 95,
  "clarity": 90,
  "confidence": 85
}`;

  try {
    console.log("Sending answer for assessment...");
    const parsed = await askJsonLLM(prompt, { temperature: 0, maxTokens: 8192 });
    console.log("Assessment response:", parsed);
    if (typeof parsed.score !== 'number' || typeof parsed.feedback !== 'string') {
      throw new Error(`Invalid assessment structure: ${JSON.stringify(parsed)}`);
    }
    return parsed;
  } catch (error) {
    console.error("========== ASSESSMENT ERROR ==========");
    console.error(error);
    console.error("======================================");
    throw error;
  }
};