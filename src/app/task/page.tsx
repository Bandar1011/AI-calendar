"use client";

import { useRef } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import Calendar, { CalendarRef } from './Calendar';
import SpeechToText from '@/components/speechtotext';

export default function TaskPage() {
  const calendarRef = useRef<CalendarRef>(null);
  const { isLoaded, isSignedIn } = useUser();

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
      <div className="container mx-auto flex h-[calc(100vh-64px)]">
        {/* Calendar Section */}
        <div className="flex-1 p-4 overflow-auto">
          <Calendar ref={calendarRef} />
        </div>

        {/* Chat Section */}
        <div className="w-[400px] border-l border-gray-800 bg-[#1a1a1a] flex flex-col">
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
    </div>
  );
}