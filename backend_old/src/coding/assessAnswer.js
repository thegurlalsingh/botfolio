import dotenv from "dotenv";
import { askLLM } from "../services/llm/llm_wrapper.js";

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
        const response = await askLLM(prompt, {
            temperature: 0.0,
            maxTokens: 2048,
        });

        let res = response
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/```$/g, '')
            .replace(/^\s*{\s*/, '{')
            .replace(/\s*}\s*$/, '}');

        const content = (res.data?.choices?.[0]?.message?.content ?? res.choices?.[0]?.message?.content ?? "").trim();
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object') {
            throw new Error("LLM did not return a valid JSON object");
        }
        console.log(parsed);
        return parsed;
     }
    catch (error) {
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
