"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CalendarRef } from '@/app/task/Calendar';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechToTextProps {
  calendarRef: React.RefObject<CalendarRef | null>;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ calendarRef }) => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
          return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          setError(null);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Error: ${event.error}. Please check your microphone permissions.`);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          if (isListening) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Error restarting recognition:', error);
              setIsListening(false);
            }
          }
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          setText(transcript);
        };
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setError('Failed to initialize speech recognition. Please check your browser permissions.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }
    };
  }, [isListening]);

  const startListening = async () => {
    setError(null);
    try {
      if (!recognitionRef.current) {
        setError('Speech recognition is not initialized. Please refresh the page.');
        return;
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream after permission check

      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recognition:', error);
      setError('Failed to access microphone. Please check your browser permissions.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setError(null); // Clear any previous errors when text changes
  };

  const clearText = () => {
    setText('');
    setError(null);
  };

  const extractJsonFromResponse = (text: string): string => {
    // Remove markdown code block formatting
    const cleanText = text
      .replace(/```json\n/g, '') // Remove ```json
      .replace(/```\n/g, '')     // Remove ```
      .replace(/```/g, '')       // Remove any remaining ```
      .trim();                   // Remove extra whitespace

    // Try to find JSON object in the cleaned text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }

    return jsonMatch[0];
  };

  const processText = async () => {
    if (!text.trim()) {
      setError('Please enter some text to process.');
      return;
    }

    if (!calendarRef.current) {
      setError('Calendar reference is not available. Please refresh the page.');
      return;
    }

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      setError('Gemini API key is not configured. Please check your environment variables.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDebugInfo(null);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Get current date in local timezone
      const now = new Date();
      const userTimezoneOffset = now.getTimezoneOffset() * 60000; // Convert offset to milliseconds
      const localDate = new Date(now.getTime() - userTimezoneOffset);
      
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      const currentDate = localDate.toISOString().split('T')[0];

      // Calculate tomorrow's date in local timezone
      const tomorrow = new Date(now.getTime() - userTimezoneOffset + 24 * 60 * 60 * 1000);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      // Calculate next Friday's date in local timezone
      const nextFriday = new Date(now.getTime() - userTimezoneOffset);
      nextFriday.setDate(nextFriday.getDate() + ((7 - nextFriday.getDay() + 5) % 7 || 7));
      const nextFridayDate = nextFriday.toISOString().split('T')[0];

      const prompt = `You are an advanced calendar event parser. Your task is to extract event details from natural language text and format them consistently.

Input text: "${text}"

Current date: ${currentDate}
Current time: ${currentTime}

Context:
- You must extract: event title (what), date (when), time (what time), and optionally people/location
- Always return a valid JSON object
- Never include any explanatory text or markdown formatting
- If date/time is missing, use current date/time
- For "today", use current date (${currentDate})
- For "tomorrow", use tomorrow's date (${tomorrowDate})
- For "next Friday", use next Friday's date (${nextFridayDate})
- For relative dates, calculate from current date
- All times should be in 24-hour format

Example inputs and outputs:

Input: "Meeting with John today at 3pm"
{
  "title": "Meeting with John",
  "date": "${currentDate}",
  "time": "15:00"
}

Input: "Lunch with Sarah tomorrow at 12:30"
{
  "title": "Lunch with Sarah",
  "date": "${tomorrowDate}",
  "time": "12:30"
}

Input: "Doctor appointment next Friday at 10am"
{
  "title": "Doctor appointment",
  "date": "${nextFridayDate}",
  "time": "10:00"
}

Input: "Team meeting at 3pm"
{
  "title": "Team meeting",
  "date": "${currentDate}",
  "time": "15:00"
}

Rules for processing:
1. Title must include all context (people, location, purpose)
2. Convert relative dates (tomorrow, next week, etc.) to YYYY-MM-DD
3. Convert all times to 24-hour HH:mm format
4. Default times if not specified:
   - morning = 09:00
   - afternoon = 14:00
   - evening = 18:00
   - night = 20:00
5. Use current date if no date specified
6. Use current time if no time specified
7. Handle informal language (w/, @, tmrw, etc.)
8. Include location in title if mentioned
9. Keep all relevant context in title

IMPORTANT: Return ONLY the JSON object without any markdown formatting or code blocks. Just the raw JSON object like this:
{
  "title": "descriptive title with all context",
  "date": "YYYY-MM-DD",
  "time": "HH:mm"
}`;

      console.log('Processing text:', text);
      console.log('Current date:', currentDate);
      console.log('Current time:', currentTime);
      console.log('Tomorrow date:', tomorrowDate);
      console.log('Next Friday date:', nextFridayDate);
      console.log('Sending prompt to Gemini:', prompt);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text().trim();
      console.log('Gemini response:', responseText);

      setDebugInfo(`Processing response:\n${responseText}`);

      // Try to parse the response
      try {
        const jsonText = extractJsonFromResponse(responseText);
        console.log('Extracted JSON:', jsonText);
        setDebugInfo(`Extracted JSON:\n${jsonText}`);
        
        const eventDetails = JSON.parse(jsonText);
        
        // Validate the required fields
        if (!eventDetails.title || !eventDetails.title.trim()) {
          throw new Error('Could not determine what the event is about. Please include a clear event description.');
        }

        if (!eventDetails.date || !eventDetails.time) {
          if (!eventDetails.date) {
            eventDetails.date = currentDate;
          }
          if (!eventDetails.time) {
            eventDetails.time = currentTime;
          }
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDetails.date)) {
          throw new Error('Invalid date format. Please specify the date more clearly.');
        }

        // Validate time format
        if (!/^\d{2}:\d{2}$/.test(eventDetails.time)) {
          throw new Error('Invalid time format. Please specify the time more clearly.');
        }

        // Create date in local timezone
        const [year, month, day] = eventDetails.date.split('-').map(Number);
        const [hours, minutes] = eventDetails.time.split(':').map(Number);
        const eventDate = new Date(year, month - 1, day, hours, minutes);

        if (isNaN(eventDate.getTime())) {
          throw new Error('Invalid date or time. Please specify when the event should occur.');
        }

        setDebugInfo(`Adding task to calendar:\nTitle: ${eventDetails.title}\nDate: ${eventDate.toLocaleString()}`);

        try {
          await calendarRef.current.handleAddTask(eventDetails.title, eventDate);
          console.log('Task added successfully');
          setShowSuccess(true);
          setText('');
          setDebugInfo(null);
          setTimeout(() => setShowSuccess(false), 3000);
        } catch (addError: any) {
          console.error('Error adding task to calendar:', addError);
          throw new Error(`Failed to add task to calendar: ${addError.message}`);
        }
      } catch (jsonError: any) {
        console.error('JSON parsing error:', jsonError);
        setDebugInfo(`Error processing response:\n${jsonError.message}\n\nResponse:\n${responseText}`);
        throw new Error(`Could not understand: "${text}"\n\nPlease include:\n1. What: the event description\n2. When: the date (e.g., today, tomorrow, next Friday)\n3. Time: when it occurs (e.g., 3pm, morning)`);
      }
    } catch (error: any) {
      console.error('Error processing text:', error);
      setError(error.message || 'Failed to process text. Please try again with clearer event details.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`px-6 py-3 rounded-full font-semibold flex items-center ${
              isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            {isListening ? (
              <>
                <span className="mr-2 animate-pulse">⚫</span>
                Stop Recording
              </>
            ) : (
              'Start Recording'
            )}
          </button>
          <button
            onClick={clearText}
            className="px-6 py-3 rounded-full bg-gray-500 hover:bg-gray-600 text-white font-semibold transition-colors"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="w-full p-4 bg-red-100 text-red-700 rounded-lg text-center whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="w-full">
          <textarea
            value={text}
            onChange={handleTextChange}
            className="w-full p-4 border border-gray-300 rounded-lg min-h-[100px] resize-y text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Speak or type your event details here... (e.g., 'Team meeting tomorrow at 2:30 PM')"
          />
        </div>

        <button
          onClick={processText}
          disabled={!text.trim() || isProcessing}
          className={`px-6 py-3 rounded-full font-semibold transition-colors ${
            !text.trim() || isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {isProcessing ? 'Processing...' : 'Process Text'}
        </button>

        {showSuccess && (
          <div className="w-full p-4 bg-green-100 text-green-700 rounded-lg text-center">
            Event added successfully!
          </div>
        )}

        {debugInfo && (
          <div className="w-full p-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono whitespace-pre-wrap">
            {debugInfo}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechToText;
