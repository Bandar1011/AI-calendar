'use client'; // This is important for using state and event listeners in Next.js App Router

import React, { useState, useEffect } from 'react';

type Plan = {
  id: string;
  title: string;
  description?: string;
  date: string;
  color?: string;
};

export default function Calendar() {
  const [year, setYear] = useState(new Date().getFullYear());// this side of the statments get the current date and year
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => setPlans(data.plans));
  }, []);

  const handlePrevYear = () => {
    setYear(prevYear => prevYear - 1); // Using functional update for prevYear
  };

  const handleNextYear = () => {
    setYear(prevYear => prevYear + 1); // Using functional update for prevYear
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // when the date is clicked
  const handleDateClick = (monthIdx: number, day: number) => {
    const date = new Date(year, monthIdx, day);
    setSelectedDate(date);
    setShowDialog(true);
  };

  // add a plan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    const plan = {
      title,
      description,
      date: `${year}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
      color,
    };
    await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    console.log(plan.date);
    // 再取得
    const res = await fetch('/api/calendar');
    const data = await res.json();
    setPlans(data.plans);
    setShowDialog(false);
    setTitle('');
    setDescription('');
    setColor('#3B82F6');
    setSelectedDate(null);
  };

  // 指定日付の予定を取得
  const getPlansForDate = (date: Date) => {
    return plans.filter(plan => {
      const planDate = new Date(plan.date);
      return (
        planDate.getFullYear() === date.getFullYear() &&
        planDate.getMonth() === date.getMonth() &&
        planDate.getDate() === date.getDate()
      );
    });
  };

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
        {months.map((month, index) => {
          const firstDayOfMonth = new Date(year, index, 1).getDay();
          const daysInMonth = new Date(year, index + 1, 0).getDate();
          const monthDates = [];
          for (let i = 0; i < firstDayOfMonth; i++) {
            monthDates.push(null);
          }
          for (let day = 1; day <= daysInMonth; day++) {
            monthDates.push(day);
          }
          return (
            <div key={index} className="border p-2 rounded-lg">
              <h2 className="font-bold text-center mb-2">{month}</h2>
              <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold mb-1">
                {days.map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {monthDates.map((date, dateIndex) => {
                  if (!date) {
                    return <div key={`${index}-${dateIndex}`} className="p-1 text-transparent">-</div>;
                  }
                  const cellDate = new Date(year, index, date);
                  const cellPlans = getPlansForDate(cellDate);
                  return (
                    <div
                      key={`${index}-${dateIndex}`}
                      className={`p-1 bg-gray-100 rounded-sm cursor-pointer hover:bg-blue-200 relative`}
                      onClick={() => handleDateClick(index, date)}
                    >
                      {date}
                      {/* 予定があれば色付きドットを表示 */}
                      <div className="flex gap-0.5 justify-center mt-0.5">
                        {cellPlans.map((plan, i) => (
                          <span key={plan.id || i} className="inline-block w-2 h-2 rounded-full" style={{ background: plan.color || '#3B82F6' }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for adding a plan */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Modal overlay */}
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowDialog(false)} />
          {/* Modal content */}
          <div className="relative bg-white p-8 rounded-lg shadow-lg w-96 animate-fadeIn">
            <form onSubmit={handleSubmit}>
              <h2 className="font-bold mb-4 text-lg text-center">Add a Plan ({selectedDate?.toLocaleDateString()})</h2>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-2 py-1" placeholder="Title" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Description (optional)" />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Color</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 p-0 border-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowDialog(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
