'use client';

import React, { useState } from 'react';
import { Task } from './Calendar'; // Import the Task type

// Define the shape of the props our component will receive.
// This is using TypeScript for better code quality.
interface TimelineModalProps {
  isOpen: boolean;        // Is the modal currently visible?
  onClose: () => void;    // Function to call when we want to close the modal.
  date: Date | null;      // The selected date to display in the modal.
  tasks: Task[];          // Array of tasks for the selected day
  onAddTask: (description: string, date: Date) => void; // Function to add a new task
  onDeleteTask: (taskId: string) => void; // Function to delete a task
}

/**
 * A modal component to display the timeline for a selected date.
 */
export default function TimelineModal({ isOpen, onClose, date, tasks, onAddTask, onDeleteTask }: TimelineModalProps) {
  // State to manage the inline editing form
  const [editingInfo, setEditingInfo] = useState<{ hour: number; description: string } | null>(null);
  
  // If the modal is not supposed to be open, render nothing.
  if (!isOpen || !date) {
    return null;
  }

  const handleSaveTask = () => {
    if (editingInfo && editingInfo.description.trim() !== '') {
      const taskDate = new Date(date);
      taskDate.setHours(editingInfo.hour);
      onAddTask(editingInfo.description, taskDate);
      setEditingInfo(null); // Close the input form after saving
    }
  };

  const getTasksForHour = (hour: number) => {
    return tasks.filter(task => {
      const taskStartTime = new Date(task.start_time);
      const taskEndTime = new Date(task.end_time);
      const currentHour = taskStartTime.getHours();
      return currentHour === hour;
    });
  };

  // When the modal is open, render the following JSX.
  return (
    // 1. The Modal Backdrop:
    // A fixed-position div that covers the entire screen.
    // It has a semi-transparent black background.
    // Clicking on this backdrop will close the modal.
    <div
      onClick={onClose}
      className="fixed inset-0 flex justify-center items-center z-50"
    >
      {/* 2. The Modal Content Box: */}
      {/* This is the white box in the middle.
          We use `onClick={e => e.stopPropagation()}` to prevent clicks inside this box
          from bubbling up and closing the modal. */}
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl" // Increased width
      >
        {/* 3. The Modal Header: */}
        {/* Contains the date and the close button. */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Timeline for {date.toDateString()}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">
            &times; {/* This is the 'X' character */}
          </button>
        </div>

        {/* 4. The Modal Body: */}
        {/* This is where the actual tasks and timeline details will go. */}
        <div className="mt-4 relative max-h-[60vh] overflow-y-auto">
          {/* Generate an array of hours from 0 to 23 */}
          {Array.from({ length: 24 }).map((_, hour) => {
            const tasksForHour = getTasksForHour(hour);

            return (
              <div key={hour} className="flex border-t border-gray-200">
                {/* Time Label Column */}
                <div className="w-20 text-xs text-gray-500 pr-2 text-right pt-1">
                  {/* Format the hour for display, e.g., 9 AM, 12 PM */}
                  <span>
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </span>
                </div>
                {/* Event Area Column */}
                <div className="flex-1 min-h-[50px] p-1" onClick={() => !editingInfo && setEditingInfo({ hour, description: '' })}>
                  {/* Display existing tasks for the hour */}
                  {tasksForHour.map(task => (
                    <div key={task.id} className="bg-blue-100 text-blue-800 text-sm rounded-md px-2 py-1 mb-1 flex justify-between items-center">
                      <span>{task.title}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent the click from opening the edit form
                          onDeleteTask(task.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-bold text-lg ml-2"
                      >
                        &times;
                      </button>
                    </div>
                  ))}

                  {/* Display the inline input form if this hour is being edited */}
                  {editingInfo && editingInfo.hour === hour && (
                    <div className="mt-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingInfo.description}
                        onChange={(e) => setEditingInfo({ ...editingInfo, description: e.target.value })}
                        className="w-full border-gray-300 rounded-md shadow-sm text-sm p-1"
                        placeholder="Add a task..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()}
                      />
                      <div className="flex justify-end mt-1">
                        <button onClick={() => setEditingInfo(null)} className="text-xs text-gray-500 mr-2">Cancel</button>
                        <button onClick={handleSaveTask} className="text-xs bg-blue-500 text-white px-2 py-1 rounded-md">Save</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <CurrentTimeIndicator date={date} />
        </div>
      </div>
    </div>
  );
}

/**
 * A component to display the red "current time" indicator line.
 */
function CurrentTimeIndicator({ date }: { date: Date }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the current time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 seconds
    return () => clearInterval(timer);
  }, []);

  const isToday = date.toDateString() === new Date().toDateString();
  if (!isToday) {
    return null; // Don't show the indicator if it's not today
  }

  // Calculate the position of the line based on the current time
  const totalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const topPosition = (totalMinutes / (24 * 60)) * (24 * 50); // 24 hours * 50px height per hour

  return (
    <div
      className="absolute right-0 left-20 h-0.5 bg-red-500"
      style={{ top: `${topPosition}px` }}
    >
      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
    </div>
  );
} 