import React from 'react';

export function HistoryScreen({
  historyLoading,
  historyRollNo,
  setHistoryRollNo,
  historyStudentResult,
  handleHistoryStudentSearch,
  setView,
}) {
  const records = historyStudentResult?.records || [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Attendance History (Student)</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('home')} className="rounded border px-3 py-2">Back</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_auto]">
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

          <div className="flex items-end gap-2">
            <button onClick={handleHistoryStudentSearch} className="w-full rounded bg-red-700 px-5 py-3 text-white lg:w-auto">
              Check
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-slate-50 p-4">
          <h3 className="font-semibold">Student Status</h3>

          {historyLoading && <div className="mt-4 text-sm text-slate-500">Loading full attendance history...</div>}

          {!historyLoading && historyStudentResult && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-bold">{historyStudentResult.name || 'Student'}</div>
                    <div className="mt-1 text-xs text-slate-500">Roll No: {historyStudentResult.studentId}</div>
                    <div className="text-xs text-slate-500">Total Present: {records.length}</div>
                    {historyStudentResult.latestDate && (
                      <div className="text-xs text-slate-500">Latest Attendance: {historyStudentResult.latestDate}</div>
                    )}
                  </div>
                  <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {records.length ? 'Present Records Found' : 'No Records Found'}
                  </div>
                </div>
              </div>

              {records.length > 0 ? (
                <div className="space-y-3">
                  {records.map((record, index) => (
                    <div key={`${record.dateId}-${record.timeIn || index}`} className="rounded-xl border bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{record.dateId}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            Time In: <b>{record.timeIn || '-'}</b>
                          </div>
                        </div>
                        <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Present
                        </div>
                      </div>

                      {record.photo && (
                        <div className="mt-3 overflow-hidden rounded-xl border bg-slate-50 sm:max-w-[220px]">
                          <img
                            src={record.photo}
                            alt={`${historyStudentResult.name || historyStudentResult.studentId} on ${record.dateId}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border bg-white p-4 text-sm text-slate-500">
                  No attendance history found for this student.
                </div>
              )}
            </div>
          )}

          {!historyLoading && !historyStudentResult && (
            <div className="mt-4 text-sm text-slate-500">Enter a roll number to see the complete attendance history.</div>
          )}
        </div>
      </div>
    </div>
  );
}
