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

      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => '');
        throw new Error(err || `Chat HTTP ${res.status}`);
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

      // After assistant finishes speaking, ask planner to build 7-day schedule from history
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!planRes.ok) {
        // Do not throw; we still showed the assistant message. Just append a soft warning.
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Note: could not generate a weekly plan right now.' },
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
      for (const e of valid) {
        const when = new Date(`${e.date}T${e.time}`);
        await calendarRef.current.handleAddTask(e.title, when);
      }
      if (valid.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              `🗓️ Scheduled ${valid.length} item(s):\n` +
              valid
                .map((e) => `• ${e.title} on ${new Date(`${e.date}T${e.time}`).toLocaleString()}`)
                .join('\n'),
          },
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
        for (const e of valid) {
          await calendarRef.current!.handleAddTask(e.title, new Date(`${e.date}T${e.time}`));
        }
        if (valid.length > 0) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `✅ Added ${valid.length} event(s) (fallback).` },
          ]);
          return;
        }
        // No valid fallback — surface error details
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ Unable to schedule. Details: ${(err as any)?.message ?? 'Unknown error'}` },
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
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`rounded-lg px-4 py-2 max-w-[85%] ${
                msg.role === 'assistant' ? 'bg-gray-800 text-white' : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
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
            className="w-full resize-none bg-gray-800 text-white rounded-lg pl-4 pr-24 py-3 min-h-[44px] max-h-[200px] focus:outline-none focus:ring-1 focus:ring-gray-600"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
              input.trim() && !isProcessing
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-gray-700 text-gray-500'
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