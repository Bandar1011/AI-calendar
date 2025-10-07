'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import TimelineModal from './TimelineModal';
import { supabaseClient } from '@/lib/supabaseClient';

export interface CalendarRef {
  handleAddTask: (description: string, date: Date) => Promise<void>;
}

interface Task {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  user_id: string;
}

const Calendar = forwardRef<CalendarRef | null>((props, ref) => {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();

  // Get current date info for today's date highlight
  const currentDate = new Date();

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const toLocalDate = (dateStr: string) => {
    // Incoming timestamps are ISO strings (UTC); new Date(iso) yields the
    // correct local-time representation. Do NOT manually add timezone offset
    // or it will shift the date incorrectly.
    return new Date(dateStr);
  };

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/event', { method: 'GET' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Error fetching events via API:', text || res.status);
        return;
      }
      const events = await res.json();
      console.log('Fetched events (API):', events);
      setTasks(events);
    } catch (error) {
      console.error('Error in fetchTasks:', error);
    }
  }, [user, viewYear, viewMonth]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [fetchTasks, user]);

  const handleAddTask = async (description: string, date: Date) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Adding task via API:', { description, date });
      const endDate = new Date(date);
      endDate.setHours(endDate.getHours() + 1);

      const res = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: description,
          start_time: date.toISOString(),
          end_time: endDate.toISOString(),
          description: ''
        })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed to create event (${res.status})`);
      }
      await fetchTasks();
      return;
    } catch (error) {
      console.error('Error in handleAddTask:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const res = await fetch('/api/event', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Error deleting task via API:', text || res.status);
        return;
      }
      await fetchTasks();
    } catch (error) {
      console.error('Error in handleDeleteTask:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    handleAddTask
  }));

  const handlePrevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  };

  const handleNextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth, day));
    setIsModalOpen(true);
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-gradient-to-br from-[#0b0e1a] via-[#121735] to-[#1a1233] text-white">
      <div className="flex items-center justify-between mb-6">
        <button onClick={handlePrevMonth} className="px-4 py-2 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors">Prev</button>
        <h1 className="text-2xl font-bold tracking-wide">
          <span className="text-cyan-300">{months[viewMonth]}</span> {viewYear}
        </h1>
        <button onClick={handleNextMonth} className="px-4 py-2 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors">Next</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left day detail panel */}
        <div className="lg:col-span-1 rounded-xl border border-white/10 p-4 bg-white/[0.03]">
          <div className="text-sm text-gray-400">Selected</div>
          <div className="mt-1 text-xl font-semibold text-cyan-300">
            {selectedDate?.toLocaleDateString()}
          </div>
          <div className="mt-4 space-y-2 max-h-[40vh] overflow-auto pr-1">
            {tasks.filter(t => selectedDate && isSameDay(toLocalDate(t.start_time), selectedDate)).length === 0 && (
              <div className="text-gray-500 text-sm">No events.</div>
            )}
            {tasks.filter(t => selectedDate && isSameDay(toLocalDate(t.start_time), selectedDate)).map(t => (
              <div key={t.id} className="rounded-lg border border-cyan-500/10 bg-[#101826] p-3">
                <div className="font-medium text-white/90">{t.title}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(t.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <button onClick={() => handleDeleteTask(t.id)} className="mt-2 text-xs text-red-400 hover:text-red-300">Delete</button>
              </div>
            ))}
          </div>
        </div>

        {/* Month grid */}
        <div className="lg:col-span-3 rounded-xl border border-white/10 p-6 bg-white/[0.04]">
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {days.map(day => (
              <div key={day} className="font-medium text-white/70 text-sm py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {(() => {
              const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
              const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
              const monthDates: (number | null)[] = [];
              for (let i = 0; i < firstDayOfMonth; i++) monthDates.push(null);
              for (let d = 1; d <= daysInMonth; d++) monthDates.push(d);
              return monthDates.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
                const cellDate = new Date(viewYear, viewMonth, date);
                const isSel = selectedDate && isSameDay(selectedDate, cellDate);
                const isToday = isSameDay(currentDate, cellDate);
                const dayTasks = tasks.filter(task => isSameDay(toLocalDate(task.start_time), cellDate));
                return (
                  <div key={`date-${idx}`} className="aspect-square p-1">
                    <button
                      onClick={() => setSelectedDate(cellDate)}
                      className={`w-full h-full rounded-lg flex items-center justify-center transition-colors relative text-sm ${
                        isSel ? 'bg-violet-600/30 text-white ring-1 ring-violet-400' : isToday ? 'bg-fuchsia-500/10 text-white' : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      {date}
                      {dayTasks.length > 0 && (
                        <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fuchsia-400 rounded-full" />
                      )}
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {isModalOpen && selectedDate && (
        <TimelineModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          date={selectedDate}
          tasks={tasks.filter(task => isSameDay(toLocalDate(task.start_time), selectedDate))}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
        />
      )}
    </div>
  );
});

Calendar.displayName = 'Calendar';

export default Calendar;
