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
  const [geminiStatus, setGeminiStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Test Gemini connection
    const testConnection = async () => {
      try {
        const isConnected = await testGeminiConnection();
        if (isConnected) {
          setGeminiStatus('ready');
          setErrorMessage("");
        } else {
          setGeminiStatus('error');
          setErrorMessage("Failed to connect to Gemini AI. Please try again.");
        }
      } catch (error) {
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
          // Only update the transcript, don't call onResult
          setTranscript(prev => {
            // If this is a new result (not interim), append it
            if (event.results[current].isFinal) {
              return prev + ' ' + transcript;
            }
            return prev;
          });
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          if (isListening) {
            recognition.start();
          }
        };

        setRecognition(recognition);
      }
    }
  }, [onResult]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
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
  };

  const clearTranscript = () => {
    setTranscript("");
    if (onResult) {
      onResult("");
    }
  };

  const processText = async () => {
    if (!transcript.trim() || geminiStatus !== 'ready') return;
    
    setIsProcessing(true);
    try {
      const details = await processEventText(transcript);
      if (details && onAddEvent) {
        await onAddEvent(details);
        setShowSuccess(true);
        setTranscript(""); // Clear the input after successful processing
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing text:', error);
      setErrorMessage("Failed to process the text. Please try again.");
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 bg-navy-800 rounded-lg shadow-md">
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
          className={`relative px-4 py-2 rounded-full ${
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
          {isListening && (
            <div className="absolute top-1/2 -translate-y-1/2 right-2 w-3 h-3 bg-white rounded-sm animate-pulse"/>
          )}
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
        <p className="font-semibold mb-2 text-white">Text:</p>
        <textarea
          value={transcript}
          onChange={handleTextChange}
          className="w-full p-3 bg-white rounded-lg min-h-[100px] resize-y text-black"
          placeholder="Type or speak to add events to your calendar (e.g., 'Meeting with John tomorrow at 3 PM')"
          id="speech-input"
          name="speech-input"
        />
      </div>
      {showSuccess && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg transition-opacity duration-300">
          <p className="font-semibold">Success!</p>
          <p>Event has been added to your calendar.</p>
        </div>
      )}
      {errorMessage && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg transition-opacity duration-300">
          <p className="font-semibold">Error</p>
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
