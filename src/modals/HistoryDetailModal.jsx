import React from 'react';
import { X } from 'lucide-react';

export function HistoryDetailModal({ showModal, detail, onClose }) {
  if (!showModal || !detail) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[170] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-auto">
        <div className="p-4 border-b flex items-center gap-3">
          <h3 className="text-lg font-bold">Present List — {detail.dateId} {detail.branch ? `· ${detail.branch}` : ''} {detail.year ? `· ${detail.year}` : ''}</h3>
          <button onClick={onClose} className="ml-auto text-slate-500"><X /></button>
        </div>
        <div className="p-4">
          <div className="text-sm text-slate-600 mb-3">Total present: <b>{(detail.rows || []).length}</b></div>
          <div className="space-y-2 max-h-96 overflow-auto">
            {(detail.rows || []).map(r => (
              <div key={r.id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <div className="font-bold">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.studentId} · {r.branch} · {r.year}</div>
                </div>
                <div className="text-xs text-slate-500">{r.timeIn || '-'}</div>
              </div>
            ))}
            {(!(detail.rows || []).length) && <div className="text-sm text-slate-500">No records for this date.</div>}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Close</button>
        </div>
      </div>
    </div>
  );
}
