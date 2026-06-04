import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class LlmService {
    async askLLM(prompt: string, options: {temperature?: number; maxTokens?: number} = {}) : Promise<string> {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(process.cwd(), 'src', 'modules', 'llm', 'llm.py');
            const pythonProcess = spawn('python3', [pythonScript, prompt, (options.temperature ?? 0.5).toString(), (options.maxTokens ?? 2048).toString()]);
            let data = '';
            let error = '';
            pythonProcess.stdout.on('data', (chunk) => { data += chunk.toString(); }) ;
            pythonProcess.stderr.on('data', (chunk) => { error += chunk.toString(); }) ;
            pythonProcess.on('close', (code) => { 
                if(code !== 0) { 
                    reject(new InternalServerErrorException(`LLM Error: ${error}`)); 
                } 
                else {
                    resolve(data.trim());
                }
            });
        });
    }
}
