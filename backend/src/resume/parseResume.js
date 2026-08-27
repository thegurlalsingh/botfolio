// Sends extracted resume text to the LLM and parses the structured JSON profile it returns.
import dotenv from 'dotenv';
import { askJsonLLM } from '../services/llm/llm_wrapper.js';

dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

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
You are an expert resume parser. Your ONLY job is to extract information from the provided resume text 
and return it in **valid JSON** that exactly matches this schema (do NOT add extra fields, do NOT explain anything):

${JSON.stringify(outputSchemaExample, null, 2)}

Rules you MUST follow:
- Return **only** valid JSON — no explanations, no markdown, no code fences (
- Use null or empty string "" for missing values — never fabricate or guess data
- Keep original formatting for dates, durations, etc. (do NOT normalize unless obviously broken)
- If multiple similar entries exist, include all of them in the timeline arrays
- Skills should be an array of clean strings (no duplicates, trim whitespace)
- Current designation = most recent / current role only
- Total experience = rough estimate in years (e.g. "5+ years", "3 years") — calculate from timelines if possible
- Do NOT include education years if not present
Critical grounding rules:
- Extract only information explicitly present in the resume text.
- Never use example values from this prompt as candidate data.
- Never invent companies, roles, dates, education, skills, or total years of experience.
- If total experience is not explicitly stated and cannot be reliably derived from explicit dates, return null.
- If there is no employment history, return "experienceTimeline": [].
- If there is no education history, return "degree": [].

Resume text:
`.trim();

export const parseResumeText = async (resumeText) => {
  if (!resumeText?.trim()) {
    throw new Error("No resume text provided");
  }

  let rawAnswer = '';

  try {
    const fullPrompt = SYSTEM_PROMPT + "\n" + resumeText.trim() + "\n\nReturn ONLY the JSON object.";

    const parsed = await askJsonLLM(fullPrompt, {
      temperature: 0,
      maxTokens: 8192,
    });

    return parsed;

  } catch (err) {
    console.error("Resume parsing failed:", err.message);
    console.error("Raw LLM output was:", rawAnswer || "(no output)");
    throw new Error(`Failed to parse resume: ${err.message}`);
  }
};