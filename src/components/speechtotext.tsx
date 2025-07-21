"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CalendarRef } from '@/app/task/Calendar';

interface SpeechToTextProps {
  calendarRef: React.RefObject<CalendarRef | null>;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ calendarRef }) => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          setText(transcript);
        };

        recognitionRef.current.onend = () => {
          if (isListening) {
            recognitionRef.current.start();
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const clearText = () => {
    setText('');
  };

  const processText = async () => {
    if (!text.trim() || !calendarRef.current) return;

    setIsProcessing(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Extract event details from this text: "${text}". Return a JSON object with these fields:
        - title: the event title
        - date: the date in YYYY-MM-DD format (use today's date if not specified)
        - time: the time in HH:mm format (use current time if not specified)
        Example: { "title": "Team Meeting", "date": "2024-03-21", "time": "14:30" }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonStr = response.text().match(/\{.*\}/)?.[0];
      
      if (!jsonStr) throw new Error('Failed to parse event details');
      
      const eventDetails = JSON.parse(jsonStr);
      const eventDate = new Date(eventDetails.date + 'T' + eventDetails.time);
      
      await calendarRef.current.handleAddTask(eventDetails.title, eventDate);
      setShowSuccess(true);
      setText('');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error processing text:', error);
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

        <div className="w-full">
          <textarea
            value={text}
            onChange={handleTextChange}
            className="w-full p-4 border border-gray-300 rounded-lg min-h-[100px] resize-y text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Speak or type your event details here..."
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
      </div>
    </div>
  );
};

export default SpeechToText;
