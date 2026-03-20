// src/services/mcq_generation.js
import dotenv from 'dotenv';
import { askLLM } from "../services/llm/llm_wrapper.js";

dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

export const generateCodingProblem = async (user) => {
  const experience = user.experience || "3-5 years";

  const prompt = `Generate ONE data structure and algorithm question for a ${experience} developer.

Difficulty: Very Easy
Include 4 test cases (2 visible, 2 hidden)
As the writing code will be under int main and user has to take input first, so please define constraints and input variables in question and test case too.

Return ONLY valid JSON.
Example of output:
{
  "title": "Two Sum Variants",
  "description": "Given an array of numbers and a target...",
  "difficulty": "Medium",
  "starterCode": "function solution(nums, target) {\\n  // your code here\\n}",
  "testCases": [
    { "input": "[2,7,11,15]\\n9", "expectedOutput": "[0,1]", "hidden": false },
    { "input": "[3,2,4]\\n6", "expectedOutput": "[1,2]", "hidden": false },
    { "input": "[1,5,5]\\n10", "expectedOutput": "[1,2]", "hidden": true },
    { "input": "[1,2,3]\\n100", "expectedOutput": "[]", "hidden": true }
  ]
}`;

  try {
    // askLLM returns a plain string (the content), not a full response object
    const rawResponse = await askLLM(prompt, {
      temperature: 0.0,
      maxTokens: 2048,
    });

    console.log('Raw LLM response:', rawResponse);

    // Clean common LLM wrappers (code blocks, extra quotes, etc.)
    let cleaned = rawResponse
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```$/g, '')
      .replace(/^response:\s*/i, '')          // if your LLM adds "response: "
      .replace(/^['"]/, '')
      .replace(/['"]$/, '');

    // Parse as JSON
    const parsed = JSON.parse(cleaned);

    // Basic validation
    if (!parsed || typeof parsed !== 'object') {
      throw new Error("LLM did not return a valid JSON object");
    }

    if (!Array.isArray(parsed.testCases) || parsed.testCases.length === 0) {
      throw new Error("No valid test cases in generated question");
    }

    console.log('Parsed coding problem:', parsed.title);
    return parsed;

  } catch (e) {
    console.error("Coding question Generation Failed:", e.message);
    console.error("Raw LLM output was:", rawResponse || '(empty)');

    // Fallback question
    return {
      title: "Two Sum",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      difficulty: "Medium",
      starterCode: "function twoSum(nums, target) {\n  // your code here\n}",
      testCases: [
        { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", hidden: false },
        { input: "[3,2,4]\n6", expectedOutput: "[1,2]", hidden: false },
        { input: "[3,3]\n6", expectedOutput: "[0,1]", hidden: true }
      ]
    };
  }
};