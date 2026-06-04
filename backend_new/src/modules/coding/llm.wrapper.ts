import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { LlmService } from '../llm/llm.service'
import { jsonrepair } from "jsonrepair";

@Injectable()
export class CodingLLMService {
  constructor(private llmService: LlmService) { }

  async codingQuestionLLM(user: any): Promise<any> {

    const CODING_QUESTION_PROMPT = `
You are an expert AI technical interviewer.

Generate EXACTLY 1 Data structures and algorithms interview question.

IMPORTANT:
- Output ONLY valid JSON
- No markdown
- No explanations
- No extra text

Output MUST be valid JSON only. Format exactly like this:
{
  "question": "Problem description, constraints, and example inputs/outputs...",
  "testCases": [
    { "input": "1 2", "expectedOutput": "3" },
    { "input": "5 7", "expectedOutput": "12" },
    { "input": "-2 4", "expectedOutput": "2" }
  ]
}

CANDIDATE DETAILS:

Designation:
${user.designation}

Skills:
${JSON.stringify(user.skills)}

Experience:
${JSON.stringify(user.experienceTimeline)}

Experience Year:
${user.experienceYear}

RULES:
- Question must be from leetcode only.
- Question must have 2 shown and 2 hidden test cases.
- 2 shown test cases should also have a little bit of explaination.
- Question must be interview-like and should have proper title and description.
- Do not generate more than 1 question
`.trim();

    try {

      const rawResponse = await this.llmService.askLLM(
        CODING_QUESTION_PROMPT,
        { temperature: 0.2 }
      );

      console.log("Raw LLM output:", rawResponse);

      let cleaned = rawResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');

      if (start === -1 || end === -1) {
        throw new Error("No JSON found");
      }

      cleaned = cleaned.substring(start, end + 1);

      cleaned = jsonrepair(cleaned);

      const parsed = JSON.parse(cleaned);

      if (
        !parsed.question ||
        parsed.question.length === 0
      ) {
        throw new Error("question missing");
      }

      return parsed;

    } catch (e) {

      console.log("CODING QUESTION ERROR:", e);

      return "this is a fallback question. no question generated";
    }
  }


  async assessLlm(question: string, code: string, language: string): Promise<any> {

    const CODING_ASSESSMENT_PROMPT = `
You are an expert AI technical interviewer.

Evaluate the candidate's code.

IMPORTANT:
- Output ONLY valid JSON
- No markdown
- No extra text

OUTPUT FORMAT:
{
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(N)",
  "feedback": "string",
}

QUESTION:
${question}

CODE:
${code}

LANGUAGE:
${language}
`.trim();

    try {

      const rawResponse = await this.llmService.askLLM(
        CODING_ASSESSMENT_PROMPT,
        { temperature: 0 }
      );

      console.log("Raw Assessment Output:", rawResponse);

      let cleaned = rawResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');

      if (start === -1 || end === -1) {
        throw new Error("No JSON found");
      }

      cleaned = cleaned.substring(start, end + 1);

      cleaned = jsonrepair(cleaned);

      const parsed = JSON.parse(cleaned);

      return {
        timeComplexity: parsed.timeComplexity,
        spaceComplexity: parsed.spaceComplexity,
        feedback: parsed.feedback
      };

    } catch (e) {

      console.log("ASSESSMENT ERROR:", e);

      return {
        timeComplexity: "Failed to assess response.",
        spaceComplexity: "Failed to assess response.",
        feedback: "Failed to assess response.",
      };
    }
  }
}