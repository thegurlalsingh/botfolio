import axios from 'axios';
import dotenv from 'dotenv';
import { askLLM } from "../services/llm/llm_wrapper.js";


dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

export const assessAnswer = async (question, transcript) => { 
  const prompt = `You are an expert interviewer. Score this answer (0-100) and give feedback.

Question: "${question}"
Answer: "${transcript}"

Score on:
- Relevance to question
- Clarity and structure
- Confidence and communication
- Technical depth (if applicable)

Return JSON only:
{
  "score": 88,
  "feedback": "Strong answer with clear examples...",
  "relevance": 95,
  "clarity": 90,
  "confidence": 85
}`;

  try {
    const rawResponse = await askLLM(prompt, {
      temperature: 0.7,    
      maxTokens: 150,
    });

    console.log('Raw LLM response:', rawResponse);

    let cleaned = rawResponse
      .trim()
      .replace(/^["']/, '')     // remove leading quote if any
      .replace(/["']$/, '')     // remove trailing quote
      .replace(/Tell me about a time/g, 'Tell me about a time') // normalize
      .replace(/\n+/g, ' ');    // collapse newlines to spaces

    if (!cleaned || cleaned.length < 20 || !cleaned.includes('time') && !cleaned.includes('situation')) {
      throw new Error("LLM returned invalid or empty question");
    }

    console.log('Generated behavioral question:', cleaned);

    return cleaned;

  } catch (error) {
    console.error("Behavioral question generation failed:", error.message);
    return {
      score: 50,
      feedback: "Technical issue during evaluation.",
      relevance: 50,
      clarity: 50,
      confidence: 50
    };
  }
};


