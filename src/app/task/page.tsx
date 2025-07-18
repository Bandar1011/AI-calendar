"use client";

import Calendar from './Calendar';
import SpeechToText from '@/components/speechtotext';

export default function TaskPage() {
  const handleSpeechResult = (result: string) => {
    // Here you can handle the speech recognition result
    console.log('Speech recognition result:', result);
    // TODO: Process the speech result to create tasks or events
  };

  return (
    <main className="p-4">
      <div className="mb-4">
        <SpeechToText onResult={handleSpeechResult} />
      </div>
      <Calendar />
    </main>
  );
}