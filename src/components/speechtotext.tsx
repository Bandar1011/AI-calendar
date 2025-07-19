"use client";

import { useState, useEffect } from "react";
import { processEventText, testGeminiConnection } from "@/lib/gemini";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechToTextProps {
  onResult?: (result: string) => void;
  onAddEvent?: (eventDetails: any) => void;
}

export default function SpeechToText({ onResult, onAddEvent }: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [geminiStatus, setGeminiStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Test Gemini connection
    const testConnection = async () => {
      try {
        console.log('Starting Gemini connection test...');
        const isConnected = await testGeminiConnection();
        console.log('Gemini connection test result:', isConnected);
        if (isConnected) {
          setGeminiStatus('ready');
          setErrorMessage("");
        } else {
          setGeminiStatus('error');
          setErrorMessage("Failed to connect to Gemini AI. Please try again.");
        }
      } catch (error) {
        console.error('Error testing Gemini connection:', error);
        setGeminiStatus('error');
        setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      }
    };

    testConnection();

    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscript(transcript);
          if (onResult) {
            onResult(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }
  }, [onResult]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
      setEventDetails(null);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
    if (onResult) {
      onResult(e.target.value);
    }
    setEventDetails(null);
  };

  const clearTranscript = () => {
    setTranscript("");
    setEventDetails(null);
    if (onResult) {
      onResult("");
    }
  };

  const processText = async () => {
    if (!transcript.trim() || geminiStatus !== 'ready') return;
    
    setIsProcessing(true);
    try {
      const details = await processEventText(transcript);
      setEventDetails(details);
    } catch (error) {
      console.error('Error processing text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCalendar = () => {
    if (eventDetails && onAddEvent) {
      onAddEvent(eventDetails);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {geminiStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          <p className="font-semibold">Error connecting to Gemini AI</p>
          <p className="text-sm mt-1">{errorMessage || "Please check your API key and try again."}</p>
          <button
            onClick={() => {
              setGeminiStatus('loading');
              testGeminiConnection()
                .then(isConnected => {
                  setGeminiStatus(isConnected ? 'ready' : 'error');
                })
                .catch(() => setGeminiStatus('error'));
            }}
            className="mt-2 px-3 py-1 bg-red-200 hover:bg-red-300 rounded-full text-sm transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!recognition}
          className={`px-4 py-2 rounded-full ${
            !recognition 
              ? 'bg-gray-400'
              : isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
          } text-white font-semibold transition-colors flex-shrink-0`}
        >
          {!recognition 
            ? "Speech Recognition Not Supported" 
            : isListening 
              ? "Stop Listening" 
              : "Start Listening"
          }
        </button>
        <button
          onClick={clearTranscript}
          className="px-4 py-2 rounded-full bg-gray-500 hover:bg-gray-600 text-white font-semibold transition-colors flex-shrink-0"
        >
          Clear Text
        </button>
        <button
          onClick={processText}
          disabled={!transcript.trim() || isProcessing || geminiStatus !== 'ready'}
          className={`px-4 py-2 rounded-full ${
            !transcript.trim() || isProcessing || geminiStatus !== 'ready'
              ? 'bg-gray-400'
              : 'bg-green-500 hover:bg-green-600'
          } text-white font-semibold transition-colors flex-shrink-0`}
        >
          {isProcessing ? "Processing..." : geminiStatus === 'loading' ? "Connecting..." : "Process Text"}
        </button>
      </div>
      <div className="mt-4">
        <p className="font-semibold mb-2">Text:</p>
        <textarea
          value={transcript}
          onChange={handleTextChange}
          className="w-full p-3 bg-gray-50 rounded-lg min-h-[100px] resize-y"
          placeholder="Start speaking or type here..."
          id="speech-input"
          name="speech-input"
        />
      </div>
      {eventDetails && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Extracted Event Details:</h3>
          <pre className="whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(eventDetails, null, 2)}
          </pre>
          <button
            onClick={handleAddToCalendar}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-colors"
          >
            Add to Calendar
          </button>
        </div>
      )}
    </div>
  );
}
