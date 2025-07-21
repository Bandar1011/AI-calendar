'use client';

import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  user_id: string;
}

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  tasks: Task[];
  onAddTask: (description: string, date: Date) => Promise<void>;
  onDeleteTask: (taskId: string) => void;
}

export default function TimelineModal({ isOpen, onClose, date, tasks, onAddTask, onDeleteTask }: TimelineModalProps) {
  const [editingInfo, setEditingInfo] = useState<{ hour: number; description: string } | null>(null);
  
  if (!isOpen || !date) {
    return null;
  }

  const handleSaveTask = () => {
    if (editingInfo && editingInfo.description.trim() !== '') {
      const taskDate = new Date(date);
      taskDate.setHours(editingInfo.hour);
      taskDate.setMinutes(0);
      onAddTask(editingInfo.description, taskDate);
      setEditingInfo(null); // Close the input form after saving
    }
  };

  const getTasksForHour = (hour: number) => {
    return tasks.filter(task => {
      const taskStartTime = new Date(task.start_time);
      const currentHour = taskStartTime.getHours();
      return currentHour === hour;
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex justify-center items-center z-50"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Timeline for {date.toDateString()}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">
            &times;
          </button>
        </div>

        <div className="mt-4 relative max-h-[60vh] overflow-y-auto">
          {Array.from({ length: 24 }).map((_, hour) => {
            const tasksForHour = getTasksForHour(hour);

            return (
              <div key={hour} className="flex border-t border-gray-200">
                <div className="w-20 text-xs text-gray-500 pr-2 text-right pt-1">
                  <span>
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </span>
                </div>
                <div className="flex-1 min-h-[50px] p-1" onClick={() => !editingInfo && setEditingInfo({ hour, description: '' })}>
                  {tasksForHour.map(task => {
                    const startTime = new Date(task.start_time);
                    const endTime = new Date(task.end_time);
                    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // Duration in minutes
                    const height = Math.max(50, (duration / 60) * 50); // 50px per hour

                    return (
                      <div
                        key={task.id}
                        className="bg-blue-100 text-blue-800 text-sm rounded-md px-2 py-1 mb-1 flex justify-between items-start"
                        style={{ minHeight: `${height}px` }}
                      >
                        <div>
                          <div>{task.title}</div>
                          <div className="text-xs text-blue-600">
                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                          }}
                          className="text-blue-600 hover:text-blue-900 font-bold text-lg ml-2"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}

                  {editingInfo && editingInfo.hour === hour && (
                    <div className="mt-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingInfo.description}
                        onChange={(e) => setEditingInfo({ ...editingInfo, description: e.target.value })}
                        className="w-full border-gray-300 rounded-md shadow-sm text-sm p-1"
                        placeholder="Add a task..."
                        id={`task-input-${editingInfo.hour}`}
                        name={`task-input-${editingInfo.hour}`}
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

function CurrentTimeIndicator({ date }: { date: Date }) {
  const [currentTime, setCurrentTime] = useState(new Date());

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