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
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      // Get the start of the year
      const startDate = new Date(year, 0, 1);
      // Get the end of the year
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
        .eq('user_id', user.id); // Only allow deleting own tasks

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

                  const currentDateForCell = new Date(year, monthIndex, date);
                  const isSelected = selectedDate && isSameDay(selectedDate, currentDateForCell);
                  const isToday = isSameDay(currentDate, currentDateForCell);

                  const dayTasks = tasks.filter(task => {
                    const taskDate = new Date(task.start_time);
                    return isSameDay(taskDate, currentDateForCell);
                  });

                  return (
                    <div key={`date-${dateIndex}`} className="p-1">
                      <button
                        onClick={() => handleDayClick(date, monthIndex)}
                        className={`w-full h-7 rounded flex items-center justify-center transition-colors relative ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : isToday
                              ? 'bg-green-100 text-green-800 font-semibold'
                              : 'hover:bg-gray-100'
                        }`}
                      >
                        {date}
                        {dayTasks.length > 0 && (
                          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
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
          tasks={tasks.filter(task => isSameDay(new Date(task.start_time), selectedDate))}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
        />
      )}
    </div>
  );
});

Calendar.displayName = 'Calendar';

export default Calendar;
