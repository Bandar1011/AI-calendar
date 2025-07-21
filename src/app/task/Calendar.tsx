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
  user_id: string;
}

const Calendar = forwardRef<CalendarRef>((props, ref) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();

  // Get current date info for today's date highlight
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      const { data: events, error } = await supabaseClient
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error.message);
        return;
      }

      if (events) {
        setTasks(events);
      }
    } catch (error) {
      console.error('Error in fetchTasks:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [fetchTasks, user]);

  useImperativeHandle(ref, () => ({
    handleAddTask: async (description: string, date: Date) => {
      if (!user) throw new Error('User not authenticated');

      const event = {
        title: description,
        start_time: date.toISOString(),
        user_id: user.id
      };

      const { error } = await supabaseClient
        .from('events')
        .insert([event]);

      if (error) {
        console.error('Error adding task:', error);
        throw error;
      }

      await fetchTasks();
    }
  }));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleModalSubmit = async (description: string, date: Date) => {
    try {
      await handleAddTask(description, date);
      handleModalClose();
    } catch (error) {
      console.error('Error in handleModalSubmit:', error);
    }
  };

  const handleAddTask = async (description: string, date: Date) => {
    if (!user) return;

    try {
      const event = {
        title: description,
        start_time: date.toISOString(),
        user_id: user.id
      };

      const { error } = await supabaseClient
        .from('events')
        .insert([event]);

      if (error) {
        console.error('Error adding task:', error);
        return;
      }

      await fetchTasks();
    } catch (error) {
      console.error('Error in handleAddTask:', error);
    }
  };

  // Calendar rendering logic...
  return (
    <div className="bg-navy-800 p-6 rounded-lg shadow-lg">
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-bold text-white p-2">
            {day}
          </div>
        ))}
        {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => {
          const date = new Date(currentYear, currentMonth, i + 1);
          const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.start_time);
            return (
              taskDate.getDate() === date.getDate() &&
              taskDate.getMonth() === date.getMonth() &&
              taskDate.getFullYear() === date.getFullYear()
            );
          });

          return (
            <div
              key={i}
              onClick={() => handleDateClick(date)}
              className={`p-2 border rounded cursor-pointer ${
                i === 0 ? `col-start-${date.getDay() + 1}` : ''
              } ${
                date.getDate() === currentDay ? 'bg-blue-600 text-white' : 'bg-white'
              } hover:bg-blue-100 transition-colors`}
            >
              <div className="text-center">{date.getDate()}</div>
              {dayTasks.length > 0 && (
                <div className="mt-1">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="text-xs p-1 bg-blue-100 rounded mb-1 truncate"
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isModalOpen && (
        <TimelineModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
});

Calendar.displayName = 'Calendar';

export default Calendar;
