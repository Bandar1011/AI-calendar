"use client";

import React, { useRef } from 'react';
import Calendar, { CalendarRef } from './Calendar';
import SpeechToText from '@/components/speechtotext';
import { useUser } from '@clerk/nextjs';

export default function TaskPage() {
  const calendarRef = useRef<CalendarRef>(null);
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Task Calendar</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SpeechToText calendarRef={calendarRef} />
        </div>
        <div>
          <Calendar ref={calendarRef} />
        </div>
      </div>
    </div>
  );
}