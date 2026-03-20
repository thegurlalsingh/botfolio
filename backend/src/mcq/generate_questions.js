// src/services/mcq_generation.js
import dotenv from 'dotenv';
import { askLLM } from "../services/llm/llm_wrapper.js";

dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

export const generateMCQs = async ({ skills = [], experienceYears = "", appliedFor = "" }) => {
  const skillsList = Array.isArray(skills) ? skills.join(", ") : "JavaScript, React, Node.js";
  if(Array.isArray(skills)){
    console.log("fetched from db");
  }
  else{
    console.log("dummy");
  }
  const prompt = `You are an expert technical interviewer.

Generate exactly 10 high-quality MCQs for a ${appliedFor} role.

Candidate has skills in: ${skillsList || "Full stack developer"}
Experience: ${experienceYears || "3-7 years"}

Rules:
- Each question: medium to hard
- 4 options (A, B, C, D)
- Exactly one correct answer
- Output ONLY valid JSON array, no markdown, no explanation

Format:
[
  {
    "question": "What is the output of ...?",
    "options": ["A) First", "B) Second", "C) Third", "D) Fourth"],
    "correct": "B"
  }
]

Start with [ and end with ]. Do not add any text outside JSON.
 Return **only** valid JSON — no explanations, no markdown, no code fences (
- Use null or empty string "" for missing values — never fabricate or guess data
`.trim();

  try {
    const rawAnswer = await askLLM(prompt, {
      temperature: 0.0,          
      maxTokens: 2048,
    });

    let cleaned = rawAnswer
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```$/g, '')
      .replace(/^\s*{\s*/, '{')
      .replace(/\s*}\s*$/, '}');

    // Parse and validate
    const parsed = JSON.parse(cleaned);

    // Optional: basic validation
    if (!parsed || typeof parsed !== 'object') {
      throw new Error("LLM did not return a valid JSON object");
    }
    console.log(parsed);
    return parsed;


    let questions; let answers;

    questions = JSON.parse(jsonMatch[0]);

    return questions.map((q, i) => ({
      question: String(q.question || `Question ${i + 1}`),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ["A) Error", "B) Error", "C) Error", "D) Error"],
      correct: Math.min(Math.max(Number(q.correct) || 0, 0), 3)
    })).slice(0, 8);
    


  } catch (error) {
    console.error("MCQ Generation Failed:", error.message);
    return [
      { question: "What is a closure in JavaScript?", options: ["A) A function with state", "B) A CSS rule", "C) A DOM method", "D) A database query"], correct: 0 },
      { question: "Which React hook is used for side effects?", options: ["A) useState", "B) useEffect", "C) useContext", "D) useReducer"], correct: 1 },
      { question: "What is the time complexity of binary search?", options: ["A) O(n)", "B) O(log n)", "C) O(n²)", "D) O(1)"], correct: 1 },
      { question: "In Node.js, what does 'process.nextTick()' do?", options: ["A) Set timeout", "B) Defer execution to next loop", "C) Read file", "D) Make HTTP request"], correct: 1 },
      { question: "What is the virtual DOM in React?", options: ["A) Real DOM copy", "B) Lightweight in-memory representation", "C) Browser storage", "D) Server-side rendering"], correct: 1 },
      { question: "What is Promise.all() used for?", options: ["A) Run promises sequentially", "B) Run promises in parallel", "C) Catch errors", "D) Create promise"], correct: 1 },
      { question: "What is 'this' in an arrow function?", options: ["A) Global object", "B) Parent scope", "C) undefined", "D) Dynamic"], correct: 1 },
      { question: "What is memoization?", options: ["A) Caching function results", "B) Memory allocation", "C) DOM manipulation", "D) Event handling"], correct: 0 }
    ];
  }
};

