import React from 'react';

export function StudentDashboardScreen({
  student,
  attendanceSummary,
  loading,
  onOpenHistory,
  onOpenIdCard,
  onEditProfile,
  onLogout,
}) {
  const percentage = attendanceSummary?.attendancePercentage ?? 0;
  const totalDays = attendanceSummary?.totalDays ?? 0;
  const totalPresent = attendanceSummary?.totalPresent ?? 0;
  const totalAbsent = attendanceSummary?.totalAbsent ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-red-900 via-red-800 to-orange-700 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-red-100/80">Student Portal</div>
            <h2 className="mt-2 text-3xl font-extrabold">{student?.name || 'Student'}</h2>
            <div className="mt-2 text-sm text-red-100/90">
              {(student?.studentId || 'N/A')} · {(student?.branch || 'N/A')} · {(student?.year || 'N/A')}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <div className="text-xs uppercase tracking-wide text-red-100/80">Attendance</div>
            <div className="mt-2 text-3xl font-black">{loading ? '...' : `${percentage}%`}</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <div className="text-xs uppercase tracking-wide text-red-100/80">Present</div>
            <div className="mt-2 text-3xl font-black">{loading ? '...' : totalPresent}</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <div className="text-xs uppercase tracking-wide text-red-100/80">Working Days</div>
            <div className="mt-2 text-3xl font-black">{loading ? '...' : totalDays}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow">
          <h3 className="text-lg font-bold text-slate-900">Attendance Overview</h3>
          <p className="mt-1 text-sm text-slate-500">Only your own attendance data is shown here.</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-green-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-green-700">Present</div>
              <div className="mt-2 text-2xl font-extrabold text-green-800">{loading ? '...' : totalPresent}</div>
            </div>
            <div className="rounded-2xl bg-red-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Absent</div>
              <div className="mt-2 text-2xl font-extrabold text-red-800">{loading ? '...' : totalAbsent}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow">
          <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
          <p className="mt-1 text-sm text-slate-500">Open your history, ID card, or update your details.</p>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={onOpenHistory}
              className="rounded-2xl bg-slate-900 px-4 py-4 text-left text-white transition hover:bg-slate-800"
            >
              <div className="font-bold">Check Attendance History</div>
              <div className="mt-1 text-sm text-slate-300">See only your daily attendance timeline.</div>
            </button>
            <button
              type="button"
              onClick={onOpenIdCard}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-slate-800 transition hover:border-red-200 hover:text-red-700"
            >
              <div className="font-bold">Download ID Card</div>
              <div className="mt-1 text-sm text-slate-500">Open printable student ID card.</div>
            </button>
            <button
              type="button"
              onClick={onEditProfile}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-slate-800 transition hover:border-red-200 hover:text-red-700"
            >
              <div className="font-bold">Edit Profile</div>
              <div className="mt-1 text-sm text-slate-500">Change your own registration details here.</div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
