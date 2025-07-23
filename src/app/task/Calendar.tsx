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
  const [year, setYear] = useState(new Date().getFullYear());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
    const date = new Date(dateStr);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  };

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      // Get the start of the year in local timezone
      const startDate = new Date(year, 0, 1);
      // Get the end of the year in local timezone
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      const { data: events, error } = await supabaseClient
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error.message);
        return;
      }

      if (events) {
        console.log('Fetched events:', events);
        setTasks(events);
      }
    } catch (error) {
      console.error('Error in fetchTasks:', error);
    }
  }, [user, year]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [fetchTasks, user]);

  const handleAddTask = async (description: string, date: Date) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Adding task:', { description, date });
      
      // Create end time 1 hour after start time
      const endDate = new Date(date);
      endDate.setHours(endDate.getHours() + 1);

      const event = {
        title: description,
        start_time: date.toISOString(),
        end_time: endDate.toISOString(),
        user_id: user.id
      };

      console.log('Inserting event:', event);

      const { data, error } = await supabaseClient
        .from('events')
        .insert([event])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        throw error;
      }

      console.log('Task added successfully:', data);
      await fetchTasks(); // Refresh the tasks list
      return;
    } catch (error) {
      console.error('Error in handleAddTask:', error);
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
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting task:', error);
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
    <div className="bg-[#1a1a1a] text-white">
      <div className="flex justify-between items-center mb-8">
        <button onClick={handlePrevYear} className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
          Previous Year
        </button>
        <h1 className="text-2xl font-bold">{year}</h1>
        <button onClick={handleNextYear} className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
          Next Year
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div key={monthIndex} className="border border-gray-800 rounded-lg p-6 bg-[#242424]">
              <h2 className="font-bold text-center mb-4 text-gray-400 text-lg">{month}</h2>
              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {days.map(day => (
                  <div key={day} className="font-medium text-gray-500 text-sm py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {monthDates.map((date, dateIndex) => {
                  if (!date) {
                    return <div key={`empty-${dateIndex}`} className="aspect-square" />;
                  }

                  const currentDateForCell = new Date(year, monthIndex, date);
                  const isSelected = selectedDate && isSameDay(selectedDate, currentDateForCell);
                  const isToday = isSameDay(currentDate, currentDateForCell);

                  const dayTasks = tasks.filter(task => {
                    const taskDate = toLocalDate(task.start_time);
                    return isSameDay(taskDate, currentDateForCell);
                  });

                  return (
                    <div key={`date-${dateIndex}`} className="aspect-square p-1">
                      <button
                        onClick={() => handleDayClick(date, monthIndex)}
                        className={`w-full h-full rounded-lg flex items-center justify-center transition-colors relative text-sm ${
                          isSelected
                            ? 'bg-gray-700 text-white'
                            : isToday
                              ? 'bg-gray-800 text-white font-medium'
                              : 'hover:bg-gray-700'
                        }`}
                      >
                        {date}
                        {dayTasks.length > 0 && (
                          <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
