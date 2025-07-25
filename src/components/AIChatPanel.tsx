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

  const processMessage = async (message: string) => {
    if (!calendarRef.current) return;

    try {
      setIsProcessing(true);
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are a smart calendar assistant. Return only a JSON array of events based on user requests. Each event should include a title, date (YYYY-MM-DD), and time (HH:mm in 24-hour format).

User request: "${message}"

Example:
[
  { "title": "Workout", "date": "2025-07-26", "time": "17:00" }
]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      console.log('Gemini raw response:', text);

      const match = text.match(/\[.*\]/s);
      if (!match) throw new Error('No JSON array found');
      const parsed = JSON.parse(match[0]);

      if (Array.isArray(parsed)) {
        for (const event of parsed) {
          if (!event.title || !event.date || !event.time) continue;
          const date = new Date(`${event.date}T${event.time}`);
          await calendarRef.current.handleAddTask(event.title, date);
        }

        setMessages((prev) => [
          ...prev,
          { role: 'user', content: message },
          {
            role: 'assistant',
            content:
              `✅ Added ${parsed.length} event(s):\n` +
              parsed
                .map(
                  (e) => `• ${e.title} on ${new Date(e.date).toLocaleDateString()} at ${e.time}`
                )
                .join('\n'),
          },
        ]);
      }
    } catch (err) {
      console.error('Gemini error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: message },
        {
          role: 'assistant',
          content:
            '⚠️ Sorry, I couldn\'t understand that. Try something like:\n"Add a meeting at 2pm every day for a week" or\n"Schedule a dentist appointment tomorrow at 3:30pm".',
        },
      ]);
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