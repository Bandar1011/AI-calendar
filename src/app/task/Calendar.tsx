'use client'; // This is important for using state and event listeners in Next.js App Router

import React, { useState, useEffect } from 'react';
import TimelineModal from './TimelineModal'; // Import the new modal component

/**
 * Define the structure of a single Task object using TypeScript.
 * This ensures that every task we create has a consistent shape.
 */
export interface Task {
  id: number;
  date: Date;
  description: string;
}

/**
 * The main Calendar component.
 * This component is responsible for displaying the entire calendar,
 * including the year navigation, all 12 month views, and the timeline for a selected day.
 */
export default function Calendar() {
  // === STATE MANAGEMENT ===
  // State is like a component's memory. When state changes, React automatically
  // re-renders the component to show the latest updates. We use the `useState` hook for this.

  /**
   * State for the currently displayed year.
   * `useState(new Date().getFullYear())` does two things:
   * 1. It gets the current year (e.g., 2024) and sets it as the *initial* value for our state.
   * 2. It gives us back two things in an array:
   *    - `year`: A variable to read the current year's value.
   *    - `setYear`: A special function to *update* the year's value.
   */
  const [year, setYear] = useState(new Date().getFullYear());

  /**
   * State for the currently selected date.
   * We initialize it to `null` because, at first, no date is selected.
   * When a user clicks on a day, we will update this state to hold a `Date` object
   * representing the clicked day.
   * The `<Date | null>` part is TypeScript, defining that this state can either be a Date object or null.
   */
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  /**
   * State to hold the master list of all tasks.
   * Initialized as an empty array.
   */
  const [tasks, setTasks] = useState<Task[]>([]);

  /**
   * State to control whether the timeline modal is open or closed.
   * Initialized to `false` so the modal is hidden by default.
   */
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch('/api/event');
      const data = await response.json();
      // Convert date strings from the API back into Date objects
      // ... existing code ...
    };
    fetchTasks();
  }, []);

  // === EVENT HANDLERS ===
  // These are functions that run in response to user actions, like button clicks.

  /**
   * Adds a new task to the master `tasks` list.
   * This function will be passed down to the modal.
   */
  const handleAddTask = async (taskDescription: string, date: Date) => {
    const response = await fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const newTask: Task = {
      id: Date.now(), // Use timestamp for a simple unique ID
      date: date,
      description: taskDescription,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  /**
   * Deletes a task from the master `tasks` list based on its ID.
   */
  const handleDeleteTask = async (taskId: number) => {
    await fetch('/api/event', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  /**
   * This function is called when the "Previous Year" button is clicked.
   * It uses the `setYear` function to decrease the current year value by 1.
   * Calling `setYear` tells React that the state has changed, triggering a re-render
   * of the calendar for the new year.
   */
  const handlePrevYear = () => {
    setYear(prevYear => prevYear - 1);
  };

  /**
   * This function is called when the "Next Year" button is clicked.
   * It uses the `setYear` function to increase the current year value by 1,
   * which also triggers a re-render.
   */
  const handleNextYear = () => {
    setYear(prevYear => prevYear + 1);
  };

  // === DATA ARRAYS ===
  // Static data we need for rendering the calendar structure.

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // === COMPONENT RENDER ===
  // The `return` statement contains the JSX that defines the UI of the component.
  return (
    <div className="container mx-auto p-4">
      {/* --- Header Section --- */}
      {/* This section contains the navigation buttons and the current year display. */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevYear} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Previous Year
        </button>
        <h1 className="text-2xl font-bold">{year}</h1>
        <button onClick={handleNextYear} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Next Year
        </button>
      </div>

      {/* --- Main Calendar Grid --- */}
      {/* This grid will hold all 12 of our month boxes. */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        
        {/* We loop over our `months` array. For each month name, we create a month box.
            This is the "outer loop". It will run 12 times. */}
        {months.map((month, index) => {
          
          // --- LOGIC FOR A SINGLE MONTH ---
          // This logic is executed for EACH of the 12 months.

          // 1. Calculate how many days are in this specific month.
          // `new Date(year, index + 1, 0)` is a clever trick. It asks for the "0th" day of the *next* month,
          // which JavaScript correctly interprets as the *last day* of the current month.
          // .getDate() then gives us that day's number (e.g., 30 or 31).
          const daysInMonth = new Date(year, index + 1, 0).getDate();

          // 2. Calculate which day of the week the month starts on.
          // `new Date(year, index, 1)` creates a date for the 1st of the current month.
          // `.getDay()` returns a number where 0=Sunday, 1=Monday, ..., 6=Saturday.
          const firstDayOfMonth = new Date(year, index, 1).getDay();

          // 3. Prepare an array to hold all the cells for this month's grid.
          // This includes empty cells at the start and the actual day numbers.
          const monthDates = [];

          // Add empty placeholder cells for the days before the 1st of the month.
          // If a month starts on Wednesday (day 3), this loop runs 3 times (for i=0, 1, 2),
          // adding placeholders for Sunday, Monday, and Tuesday.
          for (let i = 0; i < firstDayOfMonth; i++) {
            monthDates.push(null); // `null` represents a blank cell.
          }

          // Add the actual day numbers (1, 2, 3... up to `daysInMonth`).
          for (let day = 1; day <= daysInMonth; day++) {
            monthDates.push(day);
          }

          /**
           * Handles the click event for a day button.
           * It updates the `selectedDate` state with the full date of the clicked day.
           */
          const handleDayClick = (day: number) => {
            setSelectedDate(new Date(year, index, day));
            setIsModalOpen(true); // Open the modal when a day is clicked
          };


          // --- RENDER A SINGLE MONTH BOX ---
          // This JSX is returned for each month in the loop.
          return (
            <div key={index} className="border p-2 rounded-lg">
              {/* Month name header, e.g., "Jan" */}
              <h2 className="font-bold text-center mb-2">{month}</h2>
              
              {/* Days of the week header (Sun, Mon, Tue...) */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold mb-1">
                {days.map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              
              {/* The grid for the actual day numbers. */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                
                {/* Loop through our `monthDates` array, which now contains both
                    `null` placeholders and actual day numbers (e.g., [null, null, 1, 2, 3...]). */}
                {monthDates.map((date, dateIndex) => {

                  // If the 'date' is null, it's a placeholder. Just render an empty div
                  // to maintain the grid structure.
                  if (!date) {
                    return <div key={`${index}-${dateIndex}`} />;
                  }

                  // Check if the current date being rendered is the `selectedDate` from our state.
                  // This will be true only if all conditions match: year, month, and day.
                  const isSelected = selectedDate &&
                                     selectedDate.getFullYear() === year &&
                                     selectedDate.getMonth() === index &&
                                     selectedDate.getDate() === date;
                  
                  // For each valid date, render a clickable button.
                  return (
                    <div key={`${index}-${dateIndex}`} className="p-0.5">
                      <button
                        onClick={() => handleDayClick(date)}
                        // This `className` uses template literals and a ternary operator for conditional styling.
                        // - If `isSelected` is true, it applies 'bg-blue-500 text-white'.
                        // - Otherwise (if it's not selected), it applies 'bg-gray-100 hover:bg-blue-200'.
                        className={`w-full h-full rounded-sm flex items-center justify-center ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-blue-200'
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

      {/* --- Timeline Modal --- */}
      {/* We render the modal component here. It will only be visible when `isModalOpen` is true. */}
      <TimelineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // Pass a function to close the modal
        date={selectedDate}
        tasks={tasks.filter(task => 
          selectedDate && task.date.toDateString() === selectedDate.toDateString()
        )}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
