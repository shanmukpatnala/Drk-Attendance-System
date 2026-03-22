import React, { useEffect, useState } from 'react';
import { formatIndiaDate, getGreetingByIndiaTime } from '../utils/helpers';

const PROMOTION_YEAR_OPTIONS = ['All', '1st', '2nd', '3rd', '4th'];

export function DashboardScreen({
  appUser,
  students,
  setView,
  handleDashboardStartAttendance,
  promoteYear,
  setPromoteYear,
  handlePromoteYears
}) {
  const isAdmin = (appUser?.role || '').toLowerCase() === 'admin';
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const greeting = getGreetingByIndiaTime(now);
  const todayLabel = formatIndiaDate(now, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-2xl p-4 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{greeting},</h2>
            <h3 className="text-2xl font-extrabold">{appUser?.name}</h3>
          </div>
          <div className="text-sm bg-white/10 px-3 py-2 rounded-lg">
            <div className="font-bold text-right">{todayLabel}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="col-span-1 bg-white/8 p-3 rounded-lg">
            <div className="font-bold text-lg">{students.length}</div>
            <div className="text-xs">Students Registered</div>
          </div>
          <div className="col-span-2 bg-white/8 p-3 rounded-lg flex items-center justify-center text-xs text-slate-100"></div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        <button onClick={() => setView('register')} className="bg-white p-4 rounded-xl shadow text-left hover:shadow-lg transition">
          <div className="font-bold">Register Student</div>
          <div className="text-xs text-slate-500">Add new student profile</div>
        </button>
        <button onClick={handleDashboardStartAttendance} className="bg-white p-4 rounded-xl shadow text-left hover:shadow-lg transition">
          <div className="font-bold">Take Attendance</div>
          <div className="text-xs text-slate-500">Start live scan</div>
        </button>
        {isAdmin && (
          <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
            <div className="font-bold">Upgrade Year</div>
            <div className="text-xs text-slate-500">Select a single year to promote that batch only</div>
            <div className="mt-3 flex flex-col gap-3">
              <select
                className="w-full p-3 border rounded-lg text-sm"
                value={promoteYear}
                onChange={e => setPromoteYear(e.target.value)}
              >
                {PROMOTION_YEAR_OPTIONS.map(year => (
                  <option key={year} value={year}>
                    {year === 'All' ? 'All Years' : `${year} Year`}
                  </option>
                ))}
              </select>
              <button
                onClick={handlePromoteYears}
                className="bg-red-800 text-white py-3 rounded-lg font-bold"
              >
                {promoteYear === 'All' ? 'Promote All Years' : `Promote ${promoteYear} Year`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
