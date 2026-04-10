import React, { useEffect, useState } from 'react';
import { formatIndiaDate, getGreetingByIndiaTime } from '../utils/helpers';

const PROMOTION_YEAR_OPTIONS = ['All', '1st', '2nd', '3rd', '4th'];
const YEAR_DISPLAY_ORDER = ['1st', '2nd', '3rd', '4th', 'Passed Out'];
const BRANCH_DISPLAY_ORDER = ['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL'];

export function DashboardScreen({
  appUser,
  students,
  setView,
  handleDashboardStartAttendance,
  promoteYear,
  setPromoteYear,
  handlePromoteYears,
  handleOpenBranchStudents,
  handleOpenApprovalQueue,
  pendingApprovalCount
}) {
  const role = (appUser?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isHod = role === 'hod';
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
  const yearWiseStats = YEAR_DISPLAY_ORDER.map((year) => {
    const yearStudents = students.filter(student => (student?.year || '').trim() === year);
    const branchCounts = yearStudents.reduce((acc, student) => {
      const branch = (student?.branch || '').trim().toUpperCase();
      if (!branch) return acc;
      acc[branch] = (acc[branch] || 0) + 1;
      return acc;
    }, {});

    const branchOrder = [
      ...BRANCH_DISPLAY_ORDER,
      ...Object.keys(branchCounts)
        .filter(branch => !BRANCH_DISPLAY_ORDER.includes(branch))
        .sort()
    ];

    return {
      year,
      total: yearStudents.length,
      branches: branchOrder.map(branch => ({
        branch,
        count: branchCounts[branch]
      }))
    };
  });

  return (
    <div className="space-y-6">
      <div className="dashboard-brand-title text-center text-xl font-bold text-slate-900 sm:text-2xl">
        Attendance Management System
      </div>
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

      <div className={`grid grid-cols-1 ${(isAdmin || isHod) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        <button onClick={handleDashboardStartAttendance} className="bg-white p-4 rounded-xl shadow text-left hover:shadow-lg transition">
          <div className="font-bold">Take Attendance</div>
          <div className="text-xs text-slate-500">Start live scan</div>
        </button>
        {isHod && (
          <button onClick={handleOpenApprovalQueue} className="bg-white p-4 rounded-xl shadow text-left hover:shadow-lg transition">
            <div className="font-bold">Student Approvals</div>
            <div className="text-xs text-slate-500">
              {pendingApprovalCount > 0 ? `${pendingApprovalCount} students waiting for approval` : 'No pending approvals'}
            </div>
          </button>
        )}
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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Registered Students by Year</h3>
            <p className="text-xs text-slate-500">Year-wise total with branch-wise student count</p>
          </div>
          <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            Total {students.length}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {yearWiseStats.map(({ year, total, branches }) => (
            <div key={year} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{year === 'Passed Out' ? 'Passed Out' : `${year} Year`}</h4>
                  <p className="text-xs text-slate-500">Registered students</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                  <div className="text-lg font-extrabold text-red-800">{total}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">Total</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {branches.map(({ branch, count }) => (
                  <button
                    key={`${year}-${branch}`}
                    type="button"
                    onClick={() => handleOpenBranchStudents(year, branch)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-red-300 hover:text-red-700"
                  >
                    <span className="font-semibold">{branch}</span>: {count || 0}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
