// extractAudio.js (Node side)

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const extractAudio = (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'video_to_audio.py');
    
    console.log('Calling Python:', pythonScript);
    console.log('Input video:', videoPath);
    console.log('Output audio:', audioPath);

    const process = spawn('python3', [pythonScript, videoPath, audioPath]);

    let stdoutData = '';
    let stderrData = '';

    process.stdout.on('data', (chunk) => {
      stdoutData += chunk;
    });

    process.stderr.on('data', (chunk) => {
      stderrData += chunk;
      console.error('Python stderr:', chunk.toString());
    });

    process.on('close', (code) => {
      console.log('Python process exited with code', code);
      console.log('stdout:', stdoutData);
      if (code === 0) {
        resolve(audioPath);
      } else {
        reject(new Error(`Audio extraction failed (code ${code}):\n${stderrData}`));
      }
    });

    process.on('error', (err) => {
      reject(new Error(`Failed to spawn Python: ${err.message}`));
    });
  });
};