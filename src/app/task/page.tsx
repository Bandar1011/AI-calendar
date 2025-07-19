"use client";

import { useState, useRef } from 'react';
import Calendar from './Calendar';
import SpeechToText from '@/components/speechtotext';
import { Task } from './Calendar';

export default function TaskPage() {
  const calendarRef = useRef<{ handleAddTask?: (description: string, date: Date) => void }>({});
  const [error, setError] = useState<string | null>(null);

  const handleSpeechResult = (result: string) => {
    console.log('Speech recognition result:', result);
    setError(null);
  };

  const handleAddEventFromSpeech = async (eventDetails: any) => {
    try {
      if (!eventDetails) {
        throw new Error('No event details provided');
      }
      if (!calendarRef.current.handleAddTask) {
        throw new Error('Calendar reference not initialized');
      }

      // Convert date string to Date object
      let eventDate: Date;
      if (eventDetails.date === 'tomorrow') {
        eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + 1);
      } else {
        eventDate = eventDetails.date ? new Date(eventDetails.date) : new Date();
      }

      // Set the time if provided
      if (eventDetails.time) {
        const [hours, minutes] = eventDetails.time.split(':');
        eventDate.setHours(parseInt(hours, 10));
        eventDate.setMinutes(parseInt(minutes, 10) || 0);
      }

      // Create a descriptive title
      let title = 'Meeting';
      if (eventDetails.participants && eventDetails.participants.length > 0) {
        title = `Meeting with ${eventDetails.participants.join(', ')}`;
      }
      if (eventDetails.title) {
        title = eventDetails.title;
      }

      // Add the event to the calendar
      await calendarRef.current.handleAddTask(title, eventDate);
      setError(null);
    } catch (err: any) {
      console.error('Error adding event:', err);
      setError(err?.message || 'Failed to add event to calendar. Please check your Supabase configuration.');
    }
  };

  return (
    <main className="p-4">
      <div className="mb-4">
        <SpeechToText 
          onResult={handleSpeechResult}
          onAddEvent={handleAddEventFromSpeech}
        />
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>
      <Calendar 
        ref={(calendar: any) => {
          if (calendar) {
            calendarRef.current = calendar;
          }
        }}
      />
    </main>
  );
}