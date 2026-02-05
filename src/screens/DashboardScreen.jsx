import React from 'react';

export function DashboardScreen({ appUser, students, setView, handleDashboardStartAttendance }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-2xl p-4 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Good Evening,</h2>
            <h3 className="text-2xl font-extrabold">{appUser?.name}</h3>
          </div>
          <div className="text-sm bg-white/10 px-3 py-2 rounded-lg">
            <div className="font-bold text-right">{new Date().toLocaleDateString()}</div>
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

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setView('register')} className="bg-white p-4 rounded-xl shadow text-left hover:shadow-lg transition">
          <div className="font-bold">Register Student</div>
          <div className="text-xs text-slate-500">Add new student profile</div>
        </button>
        <button onClick={handleDashboardStartAttendance} className="bg-white p-4 rounded-xl shadow text-left hover:shadow-lg transition">
          <div className="font-bold">Take Attendance</div>
          <div className="text-xs text-slate-500">Start live scan</div>
        </button>
        <button onClick={() => setView('reports')} className="bg-white p-4 rounded-xl shadow text-left hover:shadow-lg transition">
          <div className="font-bold">View Reports</div>
          <div className="text-xs text-slate-500">Generate attendance reports</div>
        </button>
        <button onClick={() => setView('database')} className="bg-white p-4 rounded-xl shadow text-left hover:shadow-lg transition">
          <div className="font-bold">Search Database</div>
          <div className="text-xs text-slate-500">Find students</div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setView('history')} className="bg-white p-4 rounded-xl shadow text-left hover:shadow-lg transition">
          <div className="font-bold">Attendance History</div>
          <div className="text-xs text-slate-500">View past records</div>
        </button>
      </div>
    </div>
  );
}
