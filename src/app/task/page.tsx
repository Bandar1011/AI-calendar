"use client";

import { useRef, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import Calendar, { CalendarRef } from './Calendar';
import SpeechToText from '@/components/speechtotext';

export default function TaskPage() {
  const calendarRef = useRef<CalendarRef>(null);
  const { isLoaded, isSignedIn } = useUser();
  const [chatWidth, setChatWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newWidth = window.innerWidth - e.clientX;
      setChatWidth(Math.max(300, Math.min(800, newWidth)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#1a1a1a] px-4 py-3">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Task Calendar</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Calendar Section */}
        <div className="flex-1 p-4 overflow-auto min-w-0">
          <Calendar ref={calendarRef} />
        </div>

        {/* Resize Handle */}
        <div
          className={`w-1 hover:bg-blue-500/50 cursor-col-resize transition-colors ${
            isDragging ? 'bg-blue-500/50' : 'bg-gray-800'
          }`}
          onMouseDown={handleMouseDown}
        />

        {/* Chat Section */}
        <div 
          className="border-l border-gray-800 bg-[#1a1a1a] flex flex-col"
          style={{ width: `${chatWidth}px` }}
        >
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-400">Calendar Assistant</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {/* Chat messages would go here */}
          </div>
          <div className="p-4 border-t border-gray-800">
            <SpeechToText calendarRef={calendarRef} />
          </div>
        </div>
      </div>

      {/* Overlay when dragging */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
}