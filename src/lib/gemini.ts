import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Server-only factory helpers for Gemini access. These functions do not run at
// module import time and do not expose client-visible keys.

export function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenerativeAI(key);
}

export function getGeminiModel(model: string = process.env.GEMINI_MODEL || 'gemini-2.0-flash') {
  const genAI = getGeminiClient();
  return genAI.getGenerativeModel({ model });
}

// Optional: a thin helper to parse a single event using server-side Gemini.
// Prefer using /api/parse, but this remains available for server routes.
export async function parseSingleEventServer(text: string): Promise<{
  title?: string;
  date?: string;
  time?: string;
  endTime?: string;
}> {
  const model = getGeminiModel();
  const nowIso = new Date().toISOString();
  const prompt = `Extract exactly ONE concrete event from the user's request.\n` +
    `Return JSON only: {\n  "title": string,\n  "date": "YYYY-MM-DD",\n  "time": "HH:mm",\n  "endTime": "HH:mm"\n}\n` +
    `If no explicit date/time, return {}. Current time: ${nowIso}\nUser: ${text}`;
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  const raw = await result.response.text();
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}