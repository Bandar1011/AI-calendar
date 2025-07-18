"use client";

import { useState, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechToTextProps {
  onResult?: (result: string) => void;
}

export default function SpeechToText({ onResult }: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
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

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
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
      </div>
      <div className="mt-4">
        <p className="font-semibold mb-2">Text:</p>
        <textarea
          value={transcript}
          onChange={handleTextChange}
          className="w-full p-3 bg-gray-50 rounded-lg min-h-[100px] resize-y"
          placeholder="Start speaking or type here..."
        />
      </div>
    </div>
  );
}
