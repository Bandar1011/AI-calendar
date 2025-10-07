import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing GEMINI_API_KEY');
  return key;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid text' }), { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    const nowIso = new Date().toISOString();
    const prompt = `Extract exactly ONE concrete event from the user's request.
Return strictly JSON (no markdown). Schema:
{
  "title": string,
  "date": "YYYY-MM-DD",    // absolute date required
  "time": "HH:mm",         // start time 24h
  "endTime": "HH:mm"       // optional
}
Rules: Use explicit date/time in the text. If none, return {}. Current time: ${nowIso}
User: ${text}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const raw = await result.response.text();
    let data: any = {};
    try { data = JSON.parse(raw || '{}'); } catch {}

    // Basic validation
    if (data && data.title && data.date && data.time) {
      return new Response(JSON.stringify({
        title: String(data.title).slice(0, 120),
        date: String(data.date),
        time: String(data.time),
        endTime: data.endTime ? String(data.endTime) : undefined,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const status = err?.status || 500;
    return new Response(JSON.stringify({ error: err?.message || 'Internal Server Error' }), { status });
  }
}


