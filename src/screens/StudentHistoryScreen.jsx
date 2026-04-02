import React, { useState } from 'react';
import { formatDateIdForDisplay } from '../utils/helpers';

export function StudentHistoryScreen({ student, attendanceSummary, loading, onBack }) {
  const [expandedDateId, setExpandedDateId] = useState('');
  const timeline = attendanceSummary?.timeline || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Attendance History</h2>
          <p className="text-sm text-slate-500">{student?.name || 'Student'} · {student?.studentId || 'N/A'}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700"
        >
          Back
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow">
        {loading && <div className="text-sm text-slate-500">Loading your attendance history...</div>}

        {!loading && timeline.length === 0 && (
          <div className="text-sm text-slate-500">No attendance history is available yet.</div>
        )}

        {!loading && timeline.length > 0 && (
          <div className="space-y-3">
            {timeline.map((record, index) => (
              <button
                key={`${record.dateId}-${record.timeIn || index}`}
                type="button"
                onClick={() => setExpandedDateId(current => current === record.dateId ? '' : record.dateId)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-red-200"
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
                  <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {record.photo ? (
                        <img
                          src={record.photo}
                          alt={`${student?.studentId || 'Student'} on ${record.dateId}`}
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center text-sm text-slate-400">No photo</div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <div><span className="font-semibold text-slate-900">Date:</span> {formatDateIdForDisplay(record.dateId)}</div>
                      <div><span className="font-semibold text-slate-900">Status:</span> {record.isPresent ? 'Present' : 'Absent'}</div>
                      <div><span className="font-semibold text-slate-900">Time In:</span> {record.timeIn || '-'}</div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
