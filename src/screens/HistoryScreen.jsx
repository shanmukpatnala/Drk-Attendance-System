import React from 'react';

export function HistoryScreen({
  historyDate,
  setHistoryDate,
  historyLoading,
  historyRollNo,
  setHistoryRollNo,
  historyStudentResult,
  handleHistoryStudentSearch,
  setView,
  fetchHistoryList,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Attendance History (Student)</h2>
          <div className="flex items-center gap-2">
            <button onClick={fetchHistoryList} className="rounded border px-3 py-2">Refresh Dates</button>
            <button onClick={() => setView('home')} className="rounded border px-3 py-2">Back</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(220px,0.8fr)_auto]">
          <div>
            <label className="block text-xs text-slate-500">Roll No</label>
            <input
              type="text"
              maxLength={10}
              value={historyRollNo}
              onChange={e => setHistoryRollNo(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 10))}
              className="w-full rounded border p-3 font-mono"
              placeholder="22N71A6655"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500">Select Date</label>
            <input
              type="date"
              className="w-full rounded border p-3"
              value={historyDate}
              onChange={e => setHistoryDate(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <button onClick={handleHistoryStudentSearch} className="w-full rounded bg-red-700 px-5 py-3 text-white lg:w-auto">
              Check
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-slate-50 p-4">
          <h3 className="font-semibold">Student Status</h3>

          {historyLoading && <div className="mt-4 text-sm text-slate-500">Checking...</div>}

          {!historyLoading && historyStudentResult && (
            <div className="mt-4 rounded-xl border bg-white p-4">
              <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-xl border bg-slate-50">
                  {historyStudentResult.status === 'Present' && historyStudentResult.photo ? (
                    <img
                      src={historyStudentResult.photo}
                      alt={historyStudentResult.name || historyStudentResult.studentId}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center px-4 text-center text-sm text-slate-500">
                      Photo available only for present students.
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{historyStudentResult.name || 'Student'}</div>
                      <div className="mt-1 text-xs text-slate-500">Date: {historyStudentResult.dateId}</div>
                      <div className="text-xs text-slate-500">Roll No: {historyStudentResult.studentId}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      historyStudentResult.status === 'Present'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {historyStudentResult.status}
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-slate-600">
                    Time In: <b>{historyStudentResult.timeIn || '-'}</b>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!historyLoading && !historyStudentResult && (
            <div className="mt-4 text-sm text-slate-500">No student checked yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
