'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CalendarRef } from '@/app/task/Calendar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPanelProps {
  calendarRef: React.RefObject<CalendarRef | null>;
}

export default function AIChatPanel({ calendarRef }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your calendar assistant. I can help you with:\n• Creating events and tasks\n• Planning your schedule\n• Organizing your calendar\n\nTry asking me something like:\n'Plan my workout schedule for next month' or\n'Schedule a team meeting every Tuesday at 10 AM'",
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    // Initialize or restore a sessionId for chat memory
    try {
      let id = localStorage.getItem('chatSessionId');
      if (!id) {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        id = Array.from(arr).map(x => x.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('chatSessionId', id);
      }
      setSessionId(id);
    } catch {
      // Fallback if localStorage or crypto not available
      setSessionId(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    }
  }, []);

  const processMessage = async (message: string) => {
    if (!calendarRef.current) return;
    if (!sessionId) return;

    try {
      setIsProcessing(true);
      // Push user message to UI
      setMessages((prev) => [...prev, { role: 'user', content: message }]);

      // Stream assistant reply from server (memory-aware)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userText: message }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !res.body || /text\/html/i.test(contentType)) {
        const errText = await res.text().catch(() => '');
        const brief = errText && /<html|<!DOCTYPE/i.test(errText)
          ? 'Server returned an HTML error page.'
          : (errText || `Chat HTTP ${res.status}`);
        throw new Error(brief);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      // Add an empty assistant message to accumulate stream
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
            next[lastIdx] = { role: 'assistant', content: next[lastIdx].content + chunk };
          }
          return next;
        });
      }

      // Quick path: if the user asked for a single explicit event with a concrete date/time,
      // extract exactly one event and add it, skipping the weekly planner.
      const isDirectEventRequest = (() => {
        const m = message.toLowerCase();
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const hasMonth = monthNames.some((mn) => m.includes(mn));
        const hasDateNumeric = /\b\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?\b/.test(m) || /\b\d{1,2}(st|nd|rd|th)\b/.test(m);
        const hasTime = /\b\d{1,2}(:\d{2})?\s?(am|pm)\b/.test(m) || /\b\d{1,2}\s?(am|pm)\b/.test(m) || /\b\d{1,2}:\d{2}\b/.test(m);
        return (m.includes(' on ') || hasMonth || hasDateNumeric) && hasTime;
      })();

      if (isDirectEventRequest) {
        try {
          const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
          if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY');
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash' });
          const nowIso = new Date().toISOString();
          const prompt = `Extract exactly ONE concrete event from the user's request.
Return strictly JSON (no markdown). Schema:
{
  "title": string,
  "date": "YYYY-MM-DD",    // absolute calendar date required
  "time": "HH:mm",         // start time 24h
  "endTime": "HH:mm"       // optional, if user gave an end time or duration
}
Rules:
- Use the explicit date/time mentioned by the user (e.g., "December 2nd 1-2pm").
- If the request lacks a concrete date, return {}.
- Do not invent multiple events.
Current time: ${nowIso}
User: ${message}`;
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          });
          const text = await result.response.text();
          let one: any = {};
          try { one = JSON.parse(text || '{}'); } catch {}
          if (one?.date && one?.time && one?.title) {
            const when = new Date(`${one.date}T${one.time}`);
            await calendarRef.current.handleAddTask(one.title, when);
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `✅ Added 1 event: ${one.title} on ${when.toLocaleString()}.` },
            ]);
            return; // Skip weekly planner
          }
        } catch (directErr: any) {
          // Fall through to weekly planner if direct extraction fails
          console.warn('Direct single-event extraction failed:', directErr?.message || directErr);
        }
      }

      // After assistant finishes speaking, ask planner to build 7-day schedule from history
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!planRes.ok) {
        const text = await planRes.text().catch(() => '');
        // Avoid dumping HTML into chat; show a concise error instead
        const brief = text && /<html|<!DOCTYPE/i.test(text) ? 'Server returned an HTML error page.' : (text || `HTTP ${planRes.status}`);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Note: could not generate a weekly plan. ${brief}` },
        ]);
        return;
      }
      const events = (await planRes.json()) as Array<{ title: string; date: string; time: string }>;
      const now = new Date();
      const valid = events.filter((e) => {
        if (!e?.title || !e?.date || !e?.time) return false;
        const dt = new Date(`${e.date}T${e.time}`);
        return !isNaN(dt.getTime()) && dt > now;
      });
      let addedCount = 0;
      const failedAdds: string[] = [];
      for (const e of valid) {
        const when = new Date(`${e.date}T${e.time}`);
        try {
          await calendarRef.current.handleAddTask(e.title, when);
          addedCount += 1;
        } catch (addErr: any) {
          failedAdds.push(`${e.title} (${addErr?.message || 'add failed'})`);
        }
      }
      if (addedCount > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              `🗓️ Scheduled ${addedCount} item(s):\n` +
              valid.slice(0, addedCount)
                .map((e) => `• ${e.title} on ${new Date(`${e.date}T${e.time}`).toLocaleString()}`)
                .join('\n'),
          },
        ]);
      }
      if (failedAdds.length > 0) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Note: ${failedAdds.length} add(s) failed. ${failedAdds.some(m => /Unauthorized/i.test(m)) ? 'Please sign in and try again.' : ''} ${failedAdds.join('; ')}` },
        ]);
      }
    } catch (err) {
      console.error('Chat/Plan error:', err);
      // Fallback: single-turn JSON planning directly on client to avoid blocking user
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash' });

        const nowIso = new Date().toISOString();
        const prompt = `You are a scheduling assistant. Current ISO time: ${nowIso}.
Return strictly JSON array (no markdown). Each item: {"title": string, "date": "YYYY-MM-DD", "time": "HH:mm"}.
User request: "${message}"`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        const text = await result.response.text();
        let data: any;
        try { data = JSON.parse(text); } catch { throw new Error('Fallback JSON parse failed'); }
        const now = new Date();
        const valid = Array.isArray(data) ? data.filter((e: any) => {
          if (!e?.title || !e?.date || !e?.time) return false;
          const dt = new Date(`${e.date}T${e.time}`);
          return !isNaN(dt.getTime()) && dt > now;
        }) : [];
        let added = 0;
        const failed: string[] = [];
        for (const e of valid) {
          const when = new Date(`${e.date}T${e.time}`);
          try {
            await calendarRef.current!.handleAddTask(e.title, when);
            added += 1;
          } catch (addErr: any) {
            failed.push(`${e.title} (${addErr?.message || 'add failed'})`);
          }
        }
        if (added > 0) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `✅ Added ${added} event(s).` },
          ]);
          if (failed.length > 0) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `Some adds failed. Are you signed in? ${failed.join('; ')}` },
            ]);
          }
          return;
        }
        // No valid fallback — surface error details
        const details = (() => {
          const raw = (err as any)?.message ?? 'Unknown error';
          return /<html|<!DOCTYPE/i.test(String(raw)) ? 'Server error (HTML response).' : String(raw);
        })();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ Unable to schedule. Details: ${details}` },
        ]);
      } catch (fallbackErr: any) {
        console.error('Fallback scheduling failed:', fallbackErr);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ Scheduling failed. ${fallbackErr?.message || 'Unknown error'}` },
        ]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;
    const userMessage = input.trim();
    setInput('');
    await processMessage(userMessage);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-br from-[#0b0e1a] via-[#121735] to-[#1a1233]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`rounded-xl px-4 py-3 max-w-[85%] border ${
                msg.role === 'assistant'
                  ? 'bg-white/10 text-white border-white/10'
                  : 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/20'
              } shadow-[0_0_20px_rgba(168,85,247,0.15)]`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-white/[0.03]">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type your request... (e.g., 'Plan my workout schedule for next month')"
            className="w-full resize-none bg-white/10 text-white rounded-xl pl-4 pr-24 py-3 min-h-[44px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-violet-500/60 border border-white/10"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors border ${
              input.trim() && !isProcessing
                ? 'bg-gradient-to-r from-violet-600/70 to-fuchsia-600/70 text-white hover:from-violet-500 hover:to-fuchsia-500 border-white/10'
                : 'bg-white/5 text-white/40 border-white/10'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}