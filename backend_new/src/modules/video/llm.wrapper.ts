import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { LlmService } from '../llm/llm.service'
import { jsonrepair } from "jsonrepair";

@Injectable()
export class videoLLMService {
  constructor(private llmService: LlmService) { }

  async videoQuestionLLM(user: any): Promise<string> {

    const VIDEO_QUESTION_PROMPT = `
You are an expert AI technical interviewer.

Generate EXACTLY 1 personalized video interview question.

IMPORTANT:
- Output ONLY valid JSON
- No markdown
- No explanations
- No extra text

OUTPUT FORMAT:
{
  "questions": [
    {
      "question": "string"
    }
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
- Question must be practical
- Question must test real understanding
- Question must be interview-like
- Question must encourage long spoken response
- Do not ask generic theory questions
- Do not generate more than 1 question
`.trim();

    try {

      const rawResponse = await this.llmService.askLLM(
        VIDEO_QUESTION_PROMPT,
        { temperature: 0 }
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
        !parsed.questions ||
        !Array.isArray(parsed.questions) ||
        parsed.questions.length === 0
      ) {
        throw new Error("questions array missing");
      }

      const question = parsed.questions[0]?.question;

      if (!question || typeof question !== 'string') {
        throw new Error("question string missing");
      }

      return question.trim();

    } catch (e) {

      console.log("VIDEO QUESTION ERROR:", e);

      return "this is a fallback question. no question generated";
    }
  }


  async assessLlm(question: string, transcript: string): Promise<any> {

    const VIDEO_ASSESSMENT_PROMPT = `
You are an expert AI technical interviewer.

Evaluate the candidate's video interview transcript.

IMPORTANT:
- Output ONLY valid JSON
- No markdown
- No extra text

OUTPUT FORMAT:
{
  "score": 8.5,
  "feedback": "Good answer with strong practical understanding.",
  "confidence": 0.9,
  "relevance": 0.95,
  "clarity": 0.8
}

QUESTION:
${question}

TRANSCRIPT:
${transcript}
`.trim();

    try {

      const rawResponse = await this.llmService.askLLM(
        VIDEO_ASSESSMENT_PROMPT,
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
        score: Number(parsed.score) || 0,
        feedback: parsed.feedback || "No feedback generated",
        confidence: Number(parsed.confidence) || 0,
        relevance: Number(parsed.relevance) || 0,
        clarity: Number(parsed.clarity) || 0,
      };

    } catch (e) {

      console.log("ASSESSMENT ERROR:", e);

      return {
        score: 0,
        feedback: "Failed to assess response.",
        confidence: 0,
        relevance: 0,
        clarity: 0,
      };
    }
  }
}