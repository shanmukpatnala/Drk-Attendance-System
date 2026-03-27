import React, { useState } from 'react';
import { formatDateIdForDisplay, sanitizeRollNoInput } from '../utils/helpers';

export function HistoryScreen({
  historyLoading,
  historyRollNo,
  setHistoryRollNo,
  historyStudentResult,
  handleHistoryStudentSearch,
  setView,
}) {
  const [expandedDateId, setExpandedDateId] = useState('');
  const timeline = historyStudentResult?.timeline || [];
  const totalPresent = historyStudentResult?.totalPresent || 0;
  const totalAbsent = historyStudentResult?.totalAbsent || 0;
  const toggleExpandedDate = (dateId) => {
    setExpandedDateId((current) => current === dateId ? '' : dateId);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Attendance History (Student)</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('home')} className="rounded border px-3 py-2">Back</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end">
          <div>
            <label className="block text-xs text-slate-500">Roll No</label>
            <input
              type="text"
              maxLength={10}
              value={historyRollNo}
              onChange={e => setHistoryRollNo(sanitizeRollNoInput(e.target.value))}
              className="w-full rounded border p-3 font-mono"
              placeholder="22N71A6655"
            />
          </div>

          <div className="flex items-stretch gap-2 lg:self-end">
            <button onClick={handleHistoryStudentSearch} className="w-full rounded bg-red-700 px-5 py-3 text-white lg:min-w-[96px]">
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
                <div className="flex flex-wrap gap-3">
                    <div className="min-w-[88px] rounded-lg bg-green-50 px-4 py-3 text-center">
                      <div className="text-xl font-bold text-green-700">{totalPresent}</div>
                      <div className="text-sm text-slate-700">Present</div>
                    </div>
                    <div className="min-w-[88px] rounded-lg bg-red-50 px-4 py-3 text-center">
                      <div className="text-xl font-bold text-red-700">{totalAbsent}</div>
                      <div className="text-sm text-slate-700">Absent</div>
                    </div>
                </div>
              </div>

              {timeline.length > 0 ? (
                <div className="space-y-3">
                  {timeline.map((record, index) => (
                    <button
                      key={`${record.dateId}-${record.timeIn || index}`}
                      type="button"
                      onClick={() => toggleExpandedDate(record.dateId)}
                      className="w-full rounded-xl border bg-white px-4 py-3 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-slate-900">{formatDateIdForDisplay(record.dateId)}</div>
                        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          record.isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {record.isPresent ? 'Present' : 'Absent'}
                        </div>
                      </div>

                      {expandedDateId === record.dateId && (
                        <div className="mt-4 border-t border-slate-200 pt-4">
                          <div className={`grid gap-4 ${record.isPresent && record.photo ? 'md:grid-cols-[180px_minmax(0,1fr)]' : 'grid-cols-1'}`}>
                            {record.isPresent && record.photo && (
                              <div className="overflow-hidden rounded-xl border bg-slate-50">
                                <img
                                  src={record.photo}
                                  alt={`${historyStudentResult.name || historyStudentResult.studentId} on ${record.dateId}`}
                                  className="h-44 w-full object-cover"
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <div className="font-semibold text-slate-900">{historyStudentResult.name || 'Student'}</div>
                              <div className="text-sm text-slate-600">Roll No: {historyStudentResult.studentId}</div>
                              <div className="text-sm text-slate-600">Date: {formatDateIdForDisplay(record.dateId)}</div>
                              <div className="text-sm text-slate-600">Status: {record.isPresent ? 'Present' : 'Absent'}</div>
                              {record.isPresent && (
                                <div className="text-sm text-slate-600">Time In: {record.timeIn || '-'}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
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
