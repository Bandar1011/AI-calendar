'use client';

import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  tasks: Task[];
  onAddTask: (description: string, date: Date) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export default function TimelineModal({
  isOpen,
  onClose,
  date,
  tasks,
  onAddTask,
  onDeleteTask,
}: TimelineModalProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());

  if (!isOpen) return null;

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim()) return;

    const taskDate = new Date(date);
    taskDate.setHours(selectedHour);
    taskDate.setMinutes(0);

    await onAddTask(newTaskTitle, taskDate);
    setNewTaskTitle('');
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] w-full max-w-2xl rounded-lg shadow-xl">
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">
              {date.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title"
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-600"
            />
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(parseInt(e.target.value))}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-600"
            >
              {hours.map(hour => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <button
              onClick={handleSaveTask}
              disabled={!newTaskTitle.trim()}
              className={`px-4 py-2 rounded-lg transition-colors ${
                newTaskTitle.trim()
                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  : 'bg-gray-700 text-gray-500'
              }`}
            >
              Add
            </button>
          </div>

          <div className="space-y-4">
            {hours.map(hour => {
              const tasksForHour = tasks.filter(task => {
                const taskDate = new Date(task.start_time);
                return taskDate.getHours() === hour;
              });

              if (tasksForHour.length === 0) return null;

              return (
                <div key={hour} className="relative">
                  <div className="text-sm text-gray-400 mb-2">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="space-y-2">
                    {tasksForHour.map(task => {
                      const startTime = new Date(task.start_time);
                      const endTime = new Date(task.end_time);
                      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                      const height = Math.max(50, (duration / 60) * 50);

                      return (
                        <div
                          key={task.id}
                          className="bg-blue-500/10 text-blue-300 rounded-lg px-3 py-2 flex justify-between items-start"
                          style={{ minHeight: `${height}px` }}
                        >
                          <div>
                            <div>{task.title}</div>
                            <div className="text-xs text-blue-400">
                              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 