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

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Extract event details from this text: "${text}". Return a JSON object with these fields:
        - title: the event title (required)
        - date: the date in YYYY-MM-DD format (use today's date if not specified)
        - time: the time in HH:mm format (use current time if not specified)
        Example: { "title": "Team Meeting", "date": "2024-03-21", "time": "14:30" }`;

      console.log('Sending prompt to Gemini:', prompt);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      console.log('Gemini response:', responseText);

      const jsonStr = responseText.match(/\{.*\}/)?.[0];
      if (!jsonStr) {
        throw new Error('Failed to extract JSON from Gemini response');
      }

      console.log('Extracted JSON:', jsonStr);
      const eventDetails = JSON.parse(jsonStr);

      // Validate the required fields
      if (!eventDetails.title) {
        throw new Error('Event title is missing from the extracted details');
      }

      if (!eventDetails.date || !eventDetails.time) {
        const now = new Date();
        if (!eventDetails.date) {
          eventDetails.date = now.toISOString().split('T')[0];
        }
        if (!eventDetails.time) {
          eventDetails.time = now.toTimeString().split(' ')[0].slice(0, 5);
        }
      }

      const eventDate = new Date(`${eventDetails.date}T${eventDetails.time}`);
      if (isNaN(eventDate.getTime())) {
        throw new Error('Invalid date or time format in the extracted details');
      }

      console.log('Adding task:', { title: eventDetails.title, date: eventDate });
      await calendarRef.current.handleAddTask(eventDetails.title, eventDate);
      
      setShowSuccess(true);
      setText('');
      setTimeout(() => setShowSuccess(false), 3000);
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
          <div className="w-full p-4 bg-red-100 text-red-700 rounded-lg text-center">
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
      </div>
    </div>
  );
};

export default SpeechToText;
