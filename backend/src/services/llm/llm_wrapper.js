// llm.js
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file (only once, safe to call multiple times)
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PYTHON_SCRIPT = path.join(__dirname, 'llm.py');

let pythonProcess = null;
let bridgeReady = false;

function startBridge() {
  if (pythonProcess && !pythonProcess.killed) return Promise.resolve();

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY not found in environment.\n" +
      "Make sure your .env file contains: OPENROUTER_API_KEY=sk-or-v1-...\n" +
      "and that dotenv is loaded early in your app."
    );
  }

  console.log("→ Starting LLM bridge (one-time)...");

  pythonProcess = spawn('python3', [PYTHON_SCRIPT], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env }, // passes .env variables to Python
  });

  pythonProcess.on('error', (err) => {
    console.error("Could not start Python bridge:", err.message);
  });

  pythonProcess.on('exit', (code) => {
    console.log(`Bridge stopped (code ${code})`);
    bridgeReady = false;
    pythonProcess = null;
  });

  // Wait ~2 seconds for FastAPI/uvicorn to be ready
  return new Promise((resolve) => {
    setTimeout(() => {
      bridgeReady = true;
      console.log("Bridge ready → http://127.0.0.1:8700");
      resolve();
    }, 2000);
  });
}

export async function askLLM(prompt, options = {}) {
  if (!bridgeReady) {
    await startBridge();
  }

  const {
    model = null,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const response = await fetch('http://127.0.0.1:8700/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, /* ... */ }),
  });

  console.log("Status:", response.status);           // should be 200
  console.log("OK?", response.ok);                   // true

  const text = await response.text();                // ← raw string first
  console.log("Raw response body:", text);           // ← this is key!

  let data;
  try {
    data = JSON.parse(text);
    console.log("Parsed:", data);
  } catch (e) {
    console.log("Not valid JSON:", e.message);
  }

  // Then try to get the answer
  const answer = data?.response ?? data?.answer ?? "No answer key found";
  return answer;
}

// Graceful shutdown (optional but nice)
process.on('SIGINT', () => {
  if (pythonProcess && !pythonProcess.killed) {
    pythonProcess.kill('SIGINT');
  }
  process.exit(0);
});

// Quick test when running this file directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const reply = await askLLM("Say something funny about .env files");
      console.log("→", reply);
    } catch (err) {
      console.error(err.message);
    }
  })();
}