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
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Task Calendar</h1>
        <UserButton afterSignOutUrl="/" />
      </div>
      <div className="max-w-2xl mx-auto mb-8">
        <SpeechToText calendarRef={calendarRef} />
      </div>
      <div className="w-full">
        <Calendar ref={calendarRef} />
      </div>
    </div>
  );
}