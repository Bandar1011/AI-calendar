"use client";

import React, { useRef } from 'react';
import Calendar, { CalendarRef } from './Calendar';
import SpeechToText from '@/components/speechtotext';
import { useUser } from '@clerk/nextjs';

type CalendarRefType = {
  handleAddTask: (description: string, date: Date) => Promise<void>;
};

export default function TaskPage() {
  const calendarRef = useRef<CalendarRefType>(null);
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-center mb-8">Task Calendar</h1>
      <div className="max-w-2xl mx-auto mb-8">
        <SpeechToText calendarRef={calendarRef} />
      </div>
      <div className="w-full">
        <Calendar ref={calendarRef} />
      </div>
    </div>
  );
}