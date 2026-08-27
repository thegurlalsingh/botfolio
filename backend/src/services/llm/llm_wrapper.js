// Wrapper around the OpenRouter chat completions API, with a JSON-mode extraction helper.
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const extractJson = (text) => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  const firstObject = cleaned.indexOf('{');
  const firstArray = cleaned.indexOf('[');

  const start = firstObject === -1
    ? firstArray
    : firstArray === -1
      ? firstObject
      : Math.min(firstObject, firstArray);

  const end = cleaned.lastIndexOf(cleaned[start] === '[' ? ']' : '}');

  if (start === -1 || end === -1) {
    throw new Error('LLM did not return JSON');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
};

export const askLLM = async (prompt, options = {}) => {
  const {
    model = process.env.OPENROUTER_MODEL,
    temperature = 0.2,
    maxTokens = 4096,
    systemPrompt,
    jsonMode = false,
  } = options;

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }

  if (!model) {
    throw new Error('OPENROUTER_MODEL is missing');
  }

  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: prompt,
  });

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
      'X-OpenRouter-Title': 'Hiring Assistant Backend',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      reasoning: {
        effort: 'minimal',
        exclude: true,
      },
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenRouter request failed with status ${response.status}`);
  }

  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    console.error('OpenRouter empty completion:', {
      model: data.model,
      finishReason: data?.choices?.[0]?.finish_reason,
      hasReasoning: Boolean(data?.choices?.[0]?.message?.reasoning),
    });

    throw new Error('OpenRouter returned an empty response');
  }

  return content.trim();
};

export const askJsonLLM = async (prompt, options = {}) => {
  const content = await askLLM(prompt, { ...options, jsonMode: true });
  return extractJson(content);
};