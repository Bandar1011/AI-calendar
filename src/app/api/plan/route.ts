import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLastNMessages, Message } from '@/lib/chatMemory';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY');
  }
  return key;
}

function buildPlanningPrompt(history: Message[], nowIso: string): string {
  const formatted = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
  return `You are an expert life planner assistant.
Current datetime (ISO): ${nowIso}

Conversation summary below (user goals, constraints, preferences):
${formatted}

Task:
- Produce a 7-day plan starting from the current date, with concrete events that fit the user's routine and constraints (work hours, commute, sleep, workout, social time, etc.).
- Prefer evening times if the user is busy during the day and arrives home at 18:00.
- Ensure events are all in the future.
- Keep reasonable durations (default 60 minutes unless stated otherwise).
- Include workouts, social calls, and any priorities mentioned by the user.

Output strictly JSON (no markdown), an array where each element is:
{
  "title": string,
  "date": "YYYY-MM-DD",
  "time": "HH:mm"
}
Return [] if there is not enough information to schedule anything.
`;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid sessionId' }), { status: 400 });
    }

    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const history = getLastNMessages(sessionId, 20); // more context for planning
    const nowIso = new Date().toISOString();
    const prompt = buildPlanningPrompt(history, nowIso);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const response = await result.response;
    const text = await response.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Failed to parse JSON from model' }), { status: 502 });
    }

    if (!Array.isArray(data)) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Basic validation and future-date filtering on server side as well
    const now = new Date();
    const events = (data as any[]).filter(ev => {
      if (!ev?.title || !ev?.date || !ev?.time) return false;
      const dt = new Date(`${ev.date}T${ev.time}`);
      return !isNaN(dt.getTime()) && dt > now;
    });

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const status = error?.status || 500;
    const message = error?.message || 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), { status });
  }
}


