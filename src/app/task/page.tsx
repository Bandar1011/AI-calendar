"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import Calendar, { CalendarRef } from './Calendar';
import Onboarding from '@/components/Onboarding';
import AIChatPanel from '@/components/AIChatPanel';

export default function TaskPage() {
  const calendarRef = useRef<CalendarRef>(null);
  const { isLoaded, isSignedIn, user } = useUser();
  const [chatWidth, setChatWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newWidth = window.innerWidth - e.clientX;
    // Ensure the chat panel stays between 300px and 800px
    const clampedWidth = Math.max(300, Math.min(800, newWidth));
    setChatWidth(clampedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0e1a] via-[#121735] to-[#1a1233]">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/[0.03] px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Task Calendar</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Onboarding overlay */}
        <Onboarding userId={user?.id ?? null} />
        {/* Calendar Section */}
        <div className="flex-1 p-4 overflow-auto min-w-0">
          <Calendar ref={calendarRef} />
        </div>

        {/* Resize Handle */}
        <div
          ref={dragHandleRef}
          className={`w-1 cursor-col-resize hover:w-2 group relative ${
            isDragging ? 'bg-fuchsia-500/50 w-2' : 'bg-white/10'
          } transition-[width,background-color] duration-150`}
          onMouseDown={handleMouseDown}
        >
          <div className={`absolute inset-y-0 -left-2 right-2 group-hover:bg-blue-500/20 ${
            isDragging ? 'bg-blue-500/20' : ''
          }`} />
        </div>

        {/* Chat Section */}
        <div 
          className="border-l border-white/10 bg-white/[0.03] flex flex-col"
          style={{ width: `${chatWidth}px`, minWidth: '300px', maxWidth: '800px' }}
        >
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-medium text-white/70">Calendar Assistant</h2>
          </div>
          <AIChatPanel calendarRef={calendarRef} />
        </div>
      </div>

      {/* Overlay when dragging */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-transparent" />
      )}
    </div>
  );
}