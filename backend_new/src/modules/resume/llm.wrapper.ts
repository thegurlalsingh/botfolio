import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { LlmService } from '../llm/llm.service'
import { jsonrepair } from "jsonrepair";

const outputSchemaExample = {
  name: "John Doe",
  phone: "+91 98765 43210",
  location: "Bangalore, Karnataka",
  resumeUrl: "https://...",
  currentStep: "info",
  skills: ["React", "Node.js", "MongoDB"],
  designation: "Senior Full Stack Developer",
  experience: "5 years",
  experienceTimeline: [
    { title: "Senior Developer", company: "Google", duration: "2020 - Present" },
    { title: "Software Engineer", company: "Amazon", duration: "2018 - 2020" }
  ],
  degree: [
    { college: "IIT Bombay", degree_name: "B.Tech Computer Science", from_to: "2014 - 2018" }
  ]
};

const SYSTEM_PROMPT = `
You are an AI resume parser.

Your task is to extract structured data from a resume.

-------------------------
STRICT RULES (VERY IMPORTANT)
-------------------------
- Extract ONLY information explicitly present in the resume
- DO NOT guess or infer missing data
- DO NOT generate fake names like "John Doe"
- DO NOT generate fake companies like "Google", "Amazon", etc.
- If any field is missing → return null
- If any list is missing → return []
- Do NOT add extra fields
- Do NOT rename fields
- Output MUST be valid JSON only (no explanation, no text)

-------------------------
OUTPUT FORMAT (MATCH EXACTLY)
-------------------------
{
  "name": string,
  "phone": string | null,
  "location": string | null,
  "designation": string | null,
  "skills": string[],
  "experienceYear": string | null,
  "experienceTimeline": [
    {
      "title": string | null,
      "company": string | null,
      "duration": string | null
    }
  ],
  "educationTimeLine": [
    {
      "college": string | null,
      "degree_name": string | null,
      "from_to": string | null
    }
  ]
}

-------------------------
EXTRA INSTRUCTIONS
-------------------------
- skills must be a clean array of individual strings (no commas inside one string)
- college = university/institution name
- degree_name = degree (e.g., B.Tech Computer Science)
- Do NOT confuse degree with college
- Lists (skills, experienceTimeline, educationTimeLine) MUST always be arrays, never null
- remove duplicates from skills
- For each experience, extract company/organization if mentioned
- Always extract phone number if present anywhere in resume
- designation = most recent role/job title mentioned in experience
- trim all strings
- experienceYear = total experience if explicitly mentioned (else null)
- duration should be exactly as written in resume (e.g., "Jan 2022 - Mar 2024")
- DO NOT summarize
- DO NOT explain

-------------------------
RESUME TEXT
-------------------------

`.trim();

@Injectable()
export class resumeLLMService {
    constructor(private llmService : LlmService) {}
    async resumeLLM(text: string) : Promise<any> {
        const fullPrompt = SYSTEM_PROMPT + "\n" + text.trim() + "\n\nReturn ONLY the JSON object.";
        const rawResponse = await this.llmService.askLLM(fullPrompt, { temperature: 0 });
        try {
            const start = rawResponse.indexOf('{');
            const end = rawResponse.lastIndexOf('}');
            if(start === -1 || end === -1){
              throw new Error("No JSON object found in LLM response.");
            }
            let jsonString = rawResponse.substring(start, end + 1);
            let repaired;
            // .trim()
            // .replace(/^```json\s*/i, '')
            // .replace(/```$/g, '')
            // .replace(/^\s*{\s*/, '{')
            // .replace(/\s*}\s*$/, '}');

            try {
              return JSON.parse(jsonString);
            }
            catch (e){
              const firstObjectEnd = jsonString.indexOf('}\n{');
              if(firstObjectEnd === -1){
                jsonString = jsonString.substring(0, firstObjectEnd + 1);
              }
              else{
                const firstEnd = jsonString.indexOf('}');
                jsonString = jsonString.substring(0, firstEnd + 1);
                repaired = jsonrepair(jsonString);
              }
              return JSON.parse(repaired);
            }
        }
        catch (e) {
          console.log("Raw LLM output: ", rawResponse);
            throw new InternalServerErrorException('Failed to parse LLM response as JSON');
        }
    }
}