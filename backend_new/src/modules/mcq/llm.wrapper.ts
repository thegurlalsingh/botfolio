import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { jsonrepair } from "jsonrepair";
import { LlmService } from "../llm/llm.service";

@Injectable()
export class mcqLLMService {
  constructor(private llmService: LlmService) { }

  async mcqLLM(user: any): Promise<any> {
    const SYSTEM_PROMPT = `
You are a senior technical interviewer.

Generate EXACTLY 5 highly personalized technical MCQs.

The MCQs MUST be based on:
- candidate's projects
- technologies used
- past experience
- years of experience
- practical engineering work

-----------------------------------
CANDIDATE DETAILS
-----------------------------------

Designation:
${user.designation}

Experience:
${user.experienceYear}

Skills:
${JSON.stringify(user.skills)}

Past Experience:
${JSON.stringify(user.experienceTimeline, null, 2)}


-----------------------------------
IMPORTANT RULES
-----------------------------------

1. Questions MUST feel personalized.
2. Avoid generic textbook questions.
3. Ask practical and scenario-based questions.
4. Focus on technologies mentioned in skills/projects.
5. Questions should test real engineering understanding.
6. Avoid repeating concepts.
7. Difficulty should match candidate experience.

IMPORTANT:
Generate questions ONLY from the technologies, projects,
skills, and experience explicitly mentioned below.

DO NOT invent:
- frameworks
- tools
- cloud services
- databases
- libraries
- programming languages
- architectures

If information is missing, skip that topic.
Every question MUST directly reference at least one
technology or experience explicitly present in candidate data.

-----------------------------------
OUTPUT FORMAT
-----------------------------------

Return ONLY valid JSON array.
JSON should start with question not with options or any wrap.

Each object MUST contain:

{
  "question": "string",
  "options": [
    "A) option",
    "B) option",
    "C) option",
    "D) option"
  ],
  "correct": "A"
}

DO NOT:
- add markdown
- add explanations
- add headings
- add text before JSON
- add text after JSON
`;

    try {
      const rawResponse = await this.llmService.askLLM(SYSTEM_PROMPT, {
        temperature: 0.2,
      });

      console.log("Raw LLM output:", rawResponse);

      // cleanup markdown if model adds it
      let cleaned = rawResponse
        .trim()
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

      // find JSON array
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");

      if (start === -1 || end === -1) {
        throw new Error("No JSON array found in response");
      }

      cleaned = cleaned.substring(start, end + 1);

      // repair malformed json
      const repaired = jsonrepair(cleaned);

      // parse json
      const parsed = JSON.parse(repaired);

      // validation
      if (!Array.isArray(parsed)) {
        throw new Error("Expected array response");
      }

      // validate MCQ structure
      for (const mcq of parsed) {
        if (
          !mcq.question ||
          !Array.isArray(mcq.options) ||
          mcq.options.length !== 4 ||
          !["A", "B", "C", "D"].includes(mcq.correct)
        ) {
          throw new Error("Invalid MCQ structure");
        }
      }
      const validMcqs = parsed.filter((mcq: any) => {
        return (
          mcq &&
          typeof mcq.question === "string" &&
          Array.isArray(mcq.options) &&
          mcq.options.length === 4 &&
          ["A", "B", "C", "D"].includes(mcq.correct)
        );
      });

      if (validMcqs.length < 5) {
        throw new Error("Too few valid MCQs generated");
      }

      return validMcqs.slice(0, 10);
    }



    catch (e) {
      console.log("MCQ Generation Error:", e);

      throw new InternalServerErrorException(
        "Failed to generate MCQs",
      );
    }


  }
}