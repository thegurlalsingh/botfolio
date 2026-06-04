import dotenv from 'dotenv';
import { askLLM } from './llm_wrapper.js'


dotenv.config({ path: new URL('/Users/gurlalsingh/Desktop/hiring-assistant/backend/.env', import.meta.url).pathname });

const answer = await askLLM("President of US");
console.log(answer);