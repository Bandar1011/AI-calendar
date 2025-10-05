import { NextRequest } from 'next/server';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { appendMessage, clearSession, getLastNMessages, Message } from '@/lib/chatMemory';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY');
  }
  return key;
}

function toGeminiContents(history: Message[], userText: string): Content[] {
  const messages: Message[] = [...history, { role: 'user', text: userText }];
  // Limit last 10 messages total (history + new)
  const limited = messages.slice(-10);

  // Map to Gemini Content format
  return limited.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userText } = await req.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid sessionId' }), { status: 400 });
    }
    if (!userText || typeof userText !== 'string' || userText.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 });
    }

    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const history = getLastNMessages(sessionId, 10);
    // Append user message to history (trim inside)
    appendMessage(sessionId, { role: 'user', text: userText }, 10);

    const contents = toGeminiContents(history, userText);

    const { stream } = await model.generateContentStream({ contents });

    const encoder = new TextEncoder();
    let accumulated = '';

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.text();
            if (delta) {
              accumulated += delta;
              controller.enqueue(encoder.encode(delta));
            }
          }
          // Append model reply to memory after complete
          const reply = accumulated.trim();
          if (reply.length > 0) {
            appendMessage(sessionId, { role: 'model', text: reply }, 10);
          }
          controller.close();
        } catch (err: any) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    const status = error?.status || 500;
    const message =
      error?.message ||
      (status === 429
        ? 'Rate limit exceeded. Please try again later.'
        : 'Internal Server Error');
    return new Response(JSON.stringify({ error: message }), { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid sessionId' }), { status: 400 });
    }
    clearSession(sessionId);
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}


