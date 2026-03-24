import React from 'react';
import { X } from 'lucide-react';

export function HistoryDetailModal({ showModal, detail, onClose }) {
  if (!showModal || !detail) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-2xl w-full overflow-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b p-4">
          <h3 className="text-lg font-bold">Present List - {detail.dateId}</h3>
          <button onClick={onClose} className="ml-auto text-slate-500">
            <X />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-3 text-sm text-slate-600">
            Total present: <b>{(detail.rows || []).length}</b>
          </div>
          <div className="max-h-96 space-y-2 overflow-auto">
            {(detail.rows || []).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="font-bold">{r.name}</div>
                  <div className="text-xs text-slate-500">Date: {detail.dateId} | Roll No: {r.studentId}</div>
                </div>
                <div className="text-xs text-slate-500">{r.timeIn || '-'}</div>
              </div>
            ))}
            {!(detail.rows || []).length && (
              <div className="text-sm text-slate-500">No records for this date.</div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t p-4">
          <button onClick={onClose} className="rounded border px-4 py-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
