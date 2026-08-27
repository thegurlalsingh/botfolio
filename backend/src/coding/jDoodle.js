// Executes candidate code against test cases via the JDoodle API and compares actual vs expected output.
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function executeCode(code, testCases, language = 'cpp') {
  console.log('\n[JDoodle AUTH CHECK]');
  console.log('CLIENT ID:', process.env.JDOODLE_CLIENT_ID ? `${process.env.JDOODLE_CLIENT_ID.slice(0, 8)}...` : 'MISSING');
  console.log('CLIENT SECRET:', process.env.JDOODLE_CLIENT_SECRET ? 'PRESENT' : 'MISSING');

  const results = [];
  let passed = 0;

  const langMap = {
    cpp: 'cpp17',
    python: 'python3',
    javascript: 'nodejs',
  };

  const jdLang = langMap[language.toLowerCase()];

  if (!jdLang) {
    throw new Error(`JDoodle unsupported: ${language}`);
  }

  console.log('\n');
  console.log('======================================================');
  console.log('                 CODE EXECUTION START                 ');
  console.log('======================================================');

  console.log('\n[1] LANGUAGE');
  console.log('Frontend language:', language);
  console.log('JDoodle language:', jdLang);

  console.log('\n[2] TEST CASE COUNT');
  console.log('Number of test cases:', testCases?.length);

  console.log('\n[3] USER CODE');
  console.log('------------------------------------------------------');
  console.log(code);
  console.log('------------------------------------------------------');

  console.log('\n[4] RAW TEST CASES RECEIVED');
  console.log(JSON.stringify(testCases, null, 2));

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];

    console.log('\n');
    console.log('======================================================');
    console.log(`                 TEST CASE ${i + 1}`);
    console.log('======================================================');

    try {
      console.log('\n[INPUT FROM TEST CASE]');
      console.log('Raw input:');
      console.log(JSON.stringify(test.input));

      console.log('\n[EXPECTED OUTPUT FROM TEST CASE]');
      console.log('Raw expected:');
      console.log(JSON.stringify(test.expectedOutput));

      console.log('\n[HIDDEN]');
      console.log(test.hidden);

      const stdin = test.input || '';

      const requestBody = {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: code,
        language: jdLang,
        versionIndex: '0',
        stdin
      };

      console.log('\n[JDOODLE REQUEST]');
      console.log('Language:', requestBody.language);
      console.log('stdin RAW:');
      console.log(JSON.stringify(requestBody.stdin));
      console.log('stdin LENGTH:', requestBody.stdin.length);
      console.log('script length:', requestBody.script.length);
      console.log('\nFull stdin visually:');
      console.log('------------------------------------------------------');
      console.log(requestBody.stdin);
      console.log('------------------------------------------------------');

      console.log('\n[CALLING JDOODLE...]');

      const res = await fetch('https://api.jdoodle.com/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('\n[JDoodle HTTP STATUS]');
      console.log(res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('\n[JDoodle HTTP ERROR]');
        console.error(errorText);
        throw new Error(`JDoodle ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      console.log('\n[RAW JDOODLE RESPONSE]');
      console.log(JSON.stringify(data, null, 2));

      console.log('\n[JDoodle OUTPUT]');
      console.log('Raw output:');
      console.log(JSON.stringify(data.output));

      console.log('\n[JDoodle ERROR]');
      console.log(JSON.stringify(data.error));

      const output = (data.output || '').trim();
      const expected = (test.expectedOutput || '').trim();

      console.log('\n[AFTER .trim()]');
      console.log('Actual output:');
      console.log(JSON.stringify(output));
      console.log('Expected output:');
      console.log(JSON.stringify(expected));
      console.log('Actual length:', output.length);
      console.log('Expected length:', expected.length);

      console.log('\n[CHARACTER DEBUG]');
      console.log('Actual:', [...output].map((char, index) => ({ index, char, code: char.charCodeAt(0) })));
      console.log('Expected:', [...expected].map((char, index) => ({ index, char, code: char.charCodeAt(0) })));

      const isPassed = output === expected;

      console.log('\n[COMPARISON]');
      console.log('Actual   =', JSON.stringify(output));
      console.log('Expected =', JSON.stringify(expected));
      console.log('PASSED   =', isPassed);

      if (isPassed) {
        passed++;
      }

      results.push({
        passed: isPassed,
        output,
        expected,
        stderr: data.error || undefined
      });

    } catch (err) {
      console.error('\n[EXECUTION ERROR]');
      console.error(err);

      results.push({
        passed: false,
        output: 'Execution failed',
        expected: test.expectedOutput || 'N/A',
        stderr: err.message
      });
    }
  }

  console.log('\n');
  console.log('======================================================');
  console.log('                 CODE EXECUTION END                   ');
  console.log('======================================================');

  console.log('\nFINAL RESULT:');
  console.log('Passed:', passed);
  console.log('Total:', testCases.length);

  console.log('\nRESULTS:');
  console.log(JSON.stringify(results, null, 2));

  console.log('======================================================');
  console.log('\n');

  return {
    passed,
    total: testCases.length,
    results
  };
}