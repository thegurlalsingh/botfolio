// Generates a single DSA coding problem via LLM, with validation and retry/backoff on failure.
import dotenv from 'dotenv';
import { askJsonLLM } from '../services/llm/llm_wrapper.js';

dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

const MAX_RETRIES = 3;

export const generateCodingProblem = async (user) => {
  const experience = user?.experienceYear || '3-5 years';

  const prompt = `
Generate ONE data structure and algorithm coding question for a ${experience} developer.

Difficulty: Very Easy

The candidate will write code inside an existing "int main()" function.

Therefore, the problem MUST clearly define:
- Input format
- Output format
- Input variables
- Constraints
- How the candidate should read input
- What the candidate should print

Test cases:
- Exactly 4 test cases
- Exactly 2 visible test cases
- Exactly 2 hidden test cases

The test case "input" must contain the EXACT stdin input that should be provided to the program.

The test case "expectedOutput" must contain the EXACT stdout output expected from the program.

IMPORTANT:
- Do NOT use JavaScript function syntax.
- Do NOT use function arguments such as solution(nums, target).
- The starterCode must be C++ code intended to be placed inside main().
- Keep the problem VERY EASY.
- Make sure every test case follows the input format defined in the description.
- Make sure expectedOutput exactly matches what a correct C++ program should print.
- Do not include markdown.
- Do not include code fences.
- Return ONLY valid JSON.

Return exactly this structure:

{
  "title": "string",
  "description": "string",
  "difficulty": "Very Easy",
  "starterCode": "string",
  "testCases": [
    {
      "input": "string",
      "expectedOutput": "string",
      "hidden": false
    },
    {
      "input": "string",
      "expectedOutput": "string",
      "hidden": false
    },
    {
      "input": "string",
      "expectedOutput": "string",
      "hidden": true
    },
    {
      "input": "string",
      "expectedOutput": "string",
      "hidden": true
    }
  ]
}
`;

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Coding problem generation attempt ${attempt}/${MAX_RETRIES}`);
      const parsed = await askJsonLLM(prompt, {
        temperature: 0,
        maxTokens: 8192,
      });

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('LLM did not return a valid JSON object');
      }

      if (typeof parsed.title !== 'string' || !parsed.title.trim()) {
        throw new Error('Coding problem is missing a valid title');
      }

      if (typeof parsed.description !== 'string' || !parsed.description.trim()) {
        throw new Error('Coding problem is missing a valid description');
      }

      if (typeof parsed.difficulty !== 'string' || !parsed.difficulty.trim()) {
        throw new Error('Coding problem is missing difficulty');
      }

      if (typeof parsed.starterCode !== 'string' || !parsed.starterCode.trim()) {
        throw new Error('Coding problem is missing starter code');
      }

      if (parsed.difficulty.toLowerCase() !== 'very easy') {
        throw new Error(`Expected difficulty "Very Easy", received "${parsed.difficulty}"`);
      }

      if (!Array.isArray(parsed.testCases)) {
        throw new Error('LLM returned invalid testCases');
      }

      if (parsed.testCases.length !== 4) {
        throw new Error(`Expected exactly 4 test cases, received ${parsed.testCases.length}`);
      }

      parsed.testCases.forEach((testCase, index) => {
        if (!testCase || typeof testCase !== 'object') {
          throw new Error(`Test case ${index + 1} is invalid`);
        }
        if (typeof testCase.input !== 'string') {
          throw new Error(`Test case ${index + 1} has invalid input`);
        }
        if (typeof testCase.expectedOutput !== 'string') {
          throw new Error(`Test case ${index + 1} has invalid expectedOutput`);
        }
        if (typeof testCase.hidden !== 'boolean') {
          throw new Error(`Test case ${index + 1} has invalid hidden value`);
        }
        if (!testCase.input.trim()) {
          throw new Error(`Test case ${index + 1} has empty input`);
        }
        if (!testCase.expectedOutput.trim()) {
          throw new Error(`Test case ${index + 1} has empty expectedOutput`);
        }
      });

      const visibleTests = parsed.testCases.filter(testCase => testCase.hidden === false);
      const hiddenTests = parsed.testCases.filter(testCase => testCase.hidden === true);

      if (visibleTests.length !== 2) {
        throw new Error(`Expected exactly 2 visible test cases, received ${visibleTests.length}`);
      }

      if (hiddenTests.length !== 2) {
        throw new Error(`Expected exactly 2 hidden test cases, received ${hiddenTests.length}`);
      }

      return {
        title: parsed.title.trim(),
        description: parsed.description.trim(),
        difficulty: parsed.difficulty.trim(),
        starterCode: parsed.starterCode,
        testCases: parsed.testCases.map(testCase => ({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          hidden: testCase.hidden
        }))
      };

    } catch (error) {
      lastError = error;
      console.error(`Coding problem generation attempt ${attempt} failed:`, error.message);

      if (attempt === MAX_RETRIES) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  console.error('Coding question generation failed after all retries:', lastError?.message);

  throw new Error(`Failed to generate coding problem after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`);
};