'use client'; // This is important for using state and event listeners in Next.js App Router

import React, { useState } from 'react';

export default function Calendar() {
  const [year, setYear] = useState(new Date().getFullYear());// this side of the statments get the current date and year

  const handlePrevYear = () => {
    setYear(prevYear => prevYear - 1); // Using functional update for prevYear
  };

  const handleNextYear = () => {
    setYear(prevYear => prevYear + 1); // Using functional update for prevYear
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevYear} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Previous Year
        </button>
        <h1 className="text-2xl font-bold">{year}</h1>
        <button onClick={handleNextYear} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Next Year
        </button>
      </div>

      {/* Grid for all the month boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {months.map((month, index) => { // IMPORTANT: Changed (month, index) => (...) to (month, index) => { ... return (...); }

          // 1. Calculate the day of the week for the 1st of this month
          // Example: If year=2025, index=5 (June), new Date(2025, 5, 1) is June 1st, 2025.
          // June 1st, 2025 is a Sunday, so .getDay() returns 0.
          const firstDayOfMonth = new Date(year, index, 1).getDay();

          // 2. Calculate the total number of days in this month
          // Example: If year=2025, index=5 (June), new Date(2025, 6, 0) is the "0th" day of July 2025,
          // which is June 30th, 2025. So .getDate() returns 30.
          const daysInMonth = new Date(year, index + 1, 0).getDate();

          // 3. Prepare an array that will hold all the cells for this month's grid
          const monthDates = [];

          // Add empty placeholder cells for days before the 1st of the month
          // If firstDayOfMonth is 0 (Sunday), this loop won't run.
          // If firstDayOfMonth is 3 (Wednesday), it adds 3 nulls for Sun, Mon, Tue.
          for (let i = 0; i < firstDayOfMonth; i++) {
            monthDates.push(null); // 'null' is our placeholder for a blank cell
          }

          // Add the actual day numbers (1, 2, 3... up to daysInMonth)
          for (let day = 1; day <= daysInMonth; day++) {
            monthDates.push(day);
          }

          return ( // The `return` statement now wraps the entire month box JSX
            // A single month box
            <div key={index} className="border p-2 rounded-lg">
              <h2 className="font-bold text-center mb-2">{month}</h2>
              
              {/* Grid for the days of the week header (Sun, Mon, etc.) */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold mb-1"> {/* Added mb-1 for slight spacing */}
                {days.map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              
              {/* This is the grid for the actual day numbers (1, 2, 3...) */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {/* Loop through our 'monthDates' array to render each cell */}
                {monthDates.map((date, dateIndex) => (
                  <div
                    // Unique key for React list items (month index + date index)
                    key={`${index}-${dateIndex}`}
                    // Conditional styling:
                    // If 'date' is a number (it's a real day), apply the background and rounding.
                    // If 'date' is 'null' (it's a blank placeholder), make the text transparent
                    // so it doesn't show "null", but the div still takes space for alignment.
                    className={`p-1 ${date ? 'bg-gray-100 rounded-sm' : 'text-transparent'}`}
                  >
                    {date} {/* Display the day number (or invisible 'null') */}
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
