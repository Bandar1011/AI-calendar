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
      content: 'Hi! I\'m your calendar assistant. I can help you with:\n• Creating events and tasks\n• Planning your schedule\n• Organizing your calendar\n\nTry asking me something like:\n"Plan my workout schedule for next month" or\n"Schedule a team meeting every Tuesday at 10 AM"'
    }
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Get current date info for context
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      // Helper function to format date as YYYY-MM-DD
      const formatDate = (date: Date) => {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      // Calculate next 7 days for examples
      const nextWeekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        return formatDate(date);
      });

      const prompt = `You are an advanced calendar assistant that helps users plan and schedule events. Your task is to understand the user's request and create appropriate calendar events.

Current date: ${currentDate}
Current time: ${currentTime}

User request: "${message}"

Instructions:
1. For recurring events:
   - "every day for a week" = create 7 events starting today
   - "every day" = create 7 events starting today
   - "daily" = create 7 events starting today
   - "for a week" = create 7 events starting today
   - "next week" = create events for next 7 days
   - "this week" = create events starting today until end of week

2. For each event, I need:
   - title: descriptive title including context
   - date: YYYY-MM-DD format
   - time: HH:mm in 24-hour format

3. Always return a JSON array for recurring events, even if it's just one event.

Here are the next 7 days for reference:
${nextWeekDates.map((date, i) => `Day ${i + 1}: ${date}`).join('\n')}

Example responses:

For: "Add a meeting at 2pm every day starting today for a week"
[
  {
    "title": "Daily Meeting",
    "date": "${nextWeekDates[0]}",
    "time": "14:00"
  },
  {
    "title": "Daily Meeting",
    "date": "${nextWeekDates[1]}",
    "time": "14:00"
  },
  {
    "title": "Daily Meeting",
    "date": "${nextWeekDates[2]}",
    "time": "14:00"
  },
  {
    "title": "Daily Meeting",
    "date": "${nextWeekDates[3]}",
    "time": "14:00"
  },
  {
    "title": "Daily Meeting",
    "date": "${nextWeekDates[4]}",
    "time": "14:00"
  },
  {
    "title": "Daily Meeting",
    "date": "${nextWeekDates[5]}",
    "time": "14:00"
  },
  {
    "title": "Daily Meeting",
    "date": "${nextWeekDates[6]}",
    "time": "14:00"
  }
]

For: "Schedule a daily standup at 10am for the next 5 days"
[
  {
    "title": "Daily Standup",
    "date": "${nextWeekDates[0]}",
    "time": "10:00"
  },
  {
    "title": "Daily Standup",
    "date": "${nextWeekDates[1]}",
    "time": "10:00"
  },
  {
    "title": "Daily Standup",
    "date": "${nextWeekDates[2]}",
    "time": "10:00"
  },
  {
    "title": "Daily Standup",
    "date": "${nextWeekDates[3]}",
    "time": "10:00"
  },
  {
    "title": "Daily Standup",
    "date": "${nextWeekDates[4]}",
    "time": "10:00"
  }
]

For: "Add a dentist appointment tomorrow at 2:30pm"
[
  {
    "title": "Dentist Appointment",
    "date": "${nextWeekDates[1]}",
    "time": "14:30"
  }
]

Time formats to understand:
- "2pm", "2 pm", "2PM", "2 PM" → "14:00"
- "2:30pm", "2:30 PM" → "14:30"
- "morning" → "09:00"
- "afternoon" → "14:00"
- "evening" → "18:00"
- "night" → "20:00"

Date keywords to understand:
- "today" = ${nextWeekDates[0]}
- "tomorrow" = ${nextWeekDates[1]}
- "day after tomorrow" = ${nextWeekDates[2]}
- "next week" = create events for next 7 days
- "this week" = create events from today until end of week
- "for a week" = create 7 events starting today
- "for X days" = create X events starting today

IMPORTANT: Return ONLY the JSON array of events, with no additional text or formatting.`;

      console.log('Sending prompt to Gemini:', prompt);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      console.log('Raw Gemini response:', responseText);
      
      try {
        const parsedResponse = JSON.parse(responseText);
        
        if (Array.isArray(parsedResponse)) {
          // Handle event creation
          for (const event of parsedResponse) {
            const eventDate = new Date(`${event.date}T${event.time}`);
            await calendarRef.current.handleAddTask(
              event.description ? `${event.title} - ${event.description}` : event.title,
              eventDate
            );
          }
          
          setMessages(prev => [
            ...prev,
            { role: 'user', content: message },
            { 
              role: 'assistant', 
              content: `I've added ${parsedResponse.length} event${parsedResponse.length > 1 ? 's' : ''} to your calendar:\n${parsedResponse.map(event => `• ${event.title} on ${new Date(event.date).toLocaleDateString()} at ${event.time}`).join('\n')}`
            }
          ]);
        } else if (parsedResponse.type === 'message') {
          // Handle conversation messages
          setMessages(prev => [
            ...prev,
            { role: 'user', content: message },
            { role: 'assistant', content: parsedResponse.content }
          ]);
        }
      } catch (error) {
        console.error('Error parsing Gemini response:', error);
        console.error('Raw response:', responseText);
        setMessages(prev => [
          ...prev,
          { role: 'user', content: message },
          { 
            role: 'assistant', 
            content: 'I had trouble understanding that. Try using one of these formats:\n• "Add a meeting at 2pm every day starting today for a week"\n• "Schedule a daily standup at 10am for the next 5 days"\n• "Create a workout reminder at 6pm every day this week"\n\nMake sure to include:\n1. What the event is\n2. What time it should be\n3. How often it should repeat (daily, weekly, etc.)\n4. How long it should repeat for (a week, 5 days, etc.)'
          }
        ]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'user', content: message },
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        }
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
      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[85%] ${
                msg.role === 'assistant'
                  ? 'bg-gray-800 text-white'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
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