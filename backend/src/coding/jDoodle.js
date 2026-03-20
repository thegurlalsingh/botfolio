// src/coding/execute_code.js
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // npm install node-fetch@2 if using CommonJS or Node <18
// dotenv.config({ path: new URL('./.env', import.meta.url).pathname });
dotenv.config();


const GLOT_API = 'https://glot.io/api/run';

/**
 * Language to Glot.io slug mapping
 */
const LANGUAGE_MAP = {
  cpp: 'cpp',
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  go: 'go',
  rust: 'rust',
  c: 'c',
  // Add more languages as needed: https://glot.io/api
};

/**
 * Execute user code against multiple test cases using Glot.io
 * @param {string} code - User-submitted code
 * @param {Array<{input: string, expectedOutput: string}>} testCases
 * @param {string} language - e.g. 'cpp', 'python', 'javascript'
 * @returns {Promise<{ passed: number, total: number, results: Array<{passed: boolean, output: string, expected: string, stderr?: string}> }>}
 */
export async function executeCode(code, testCases, language = 'cpp') {
  const results = [];
  let passed = 0;

  const langMap = {
    cpp: 'cpp17',
    python: 'python3',
    javascript: 'nodejs',
    // add more
  };

  const jdLang = langMap[language.toLowerCase()];
  if (!jdLang) throw new Error(`JDoodle unsupported: ${language}`);

  // console.log('Sending to JDoodle:', {
    
  //   clientId: process.env.JDOODLE_CLIENT_ID?.slice(0, 8) + '...', // partial for safety
    
  // });

  for (const test of testCases) {
    try {
      const res = await fetch('https://api.jdoodle.com/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: "c7b528f1a89ce2d2e208825e1cbb72cf",
          clientSecret: "56f96ece814d6f69cbda5afc00ac6ba161d2289b08f04ec5c1bda3603567d37f",
          script: code,
          language: jdLang,
          versionIndex: '0',
          stdin: test.input || ''
        })
      });

      if (!res.ok) throw new Error(`JDoodle ${res.status}`);

      const data = await res.json();

      const output = (data.output || '').trim();
      const expected = (test.expectedOutput || '').trim();
      const isPassed = output === expected;

      if (isPassed) passed++;

      results.push({
        passed: isPassed,
        output,
        expected,
        stderr: data.error || undefined
      });
    } catch (err) {
      results.push({
        passed: false,
        output: 'Execution failed',
        expected: test.expectedOutput || 'N/A',
        stderr: err.message
      });
    }
  }

  return { passed, total: testCases.length, results };
}