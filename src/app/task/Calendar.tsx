'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import TimelineModal from './TimelineModal';
import { supabaseClient } from '@/lib/supabaseClient';

export interface Task {
  id: string;
  created_at?: string;
  title: string;
  start_time: string;
  end_time: string;
  description: string;
  user_id: string;
}

export interface CalendarRef {
  handleAddTask: (description: string, date: Date) => Promise<void>;
}

const Calendar = forwardRef<CalendarRef>((props, ref) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
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
  }, [user]); // Added user to dependencies to ensure it's available

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [fetchTasks, user]); // Added user to dependencies

  useImperativeHandle(ref, () => ({
    handleAddTask
  }));

  const handleAddTask = async (taskDescription: string, date: Date) => {
    if (!user) {
      throw new Error('You must be logged in to add tasks');
    }

    try {
      if (!taskDescription) {
        throw new Error('Task description is required');
      }
      if (!date || isNaN(date.getTime())) {
        throw new Error('Invalid date provided');
      }

      const endDate = new Date(date);
      endDate.setHours(date.getHours() + 1);

      const eventData = {
        title: taskDescription,
        description: taskDescription,
        start_time: date.toISOString(),
        end_time: endDate.toISOString(),
        user_id: user.id
      };

      const { data, error } = await supabaseClient
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add event: ${error.message}`);
      }

      if (data) {
        setTasks(prevTasks => [...prevTasks, data]);
        await fetchTasks();
      } else {
        throw new Error('No data returned from Supabase after insert');
      }
    } catch (error: any) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabaseClient
        .from('events')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id); // Only allow deleting own tasks

      if (error) {
        console.error('Error deleting task:', error);
        return;
      }

      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handlePrevYear = () => {
    setYear(prevYear => prevYear - 1);
  };

  const handleNextYear = () => {
    setYear(prevYear => prevYear + 1);
  };

  const handleDayClick = (day: number, monthIndex: number) => {
    setSelectedDate(new Date(year, monthIndex, day));
    setIsModalOpen(true);
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <button onClick={handlePrevYear} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
          Previous Year
        </button>
        <h1 className="text-2xl font-bold">{year}</h1>
        <button onClick={handleNextYear} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
          Next Year
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((month, monthIndex) => {
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
          const firstDayOfMonth = new Date(year, monthIndex, 1).getDay();
          const monthDates = [];

          for (let i = 0; i < firstDayOfMonth; i++) {
            monthDates.push(null);
          }

          for (let day = 1; day <= daysInMonth; day++) {
            monthDates.push(day);
          }

          return (
            <div key={monthIndex} className="border border-gray-200 rounded-lg p-4">
              <h2 className="font-bold text-center mb-2">{month}</h2>
              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-1">
                {days.map(day => (
                  <div key={day} className="font-semibold text-gray-600">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {monthDates.map((date, dateIndex) => {
                  if (!date) {
                    return <div key={`empty-${dateIndex}`} />;
                  }

                  const isSelected = selectedDate &&
                    selectedDate.getFullYear() === year &&
                    selectedDate.getMonth() === monthIndex &&
                    selectedDate.getDate() === date;

                  const isToday = currentYear === year && 
                    currentMonth === monthIndex && 
                    currentDay === date;

                  return (
                    <div key={`date-${dateIndex}`} className="p-1">
                      <button
                        onClick={() => handleDayClick(date, monthIndex)}
                        className={`w-full h-7 rounded flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : isToday
                              ? 'bg-green-100 text-green-800 font-semibold'
                              : 'hover:bg-gray-100'
                        }`}
                      >
                        {date}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <TimelineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDate}
        tasks={tasks.filter(task => {
          if (!selectedDate || !task.start_time) return false;
          const taskDate = new Date(task.start_time);
          const selectedDateStart = new Date(selectedDate.setHours(0, 0, 0, 0));
          const selectedDateEnd = new Date(selectedDate.setHours(23, 59, 59, 999));
          return taskDate >= selectedDateStart && taskDate <= selectedDateEnd;
        })}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
});

export default Calendar;
