import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export function AlreadyPresentModal({ detail, onClose }) {
  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-[175] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Student Already Present</h3>
            <p className="text-sm text-slate-500">This student was already marked for today.</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 transition hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-[170px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {detail.facePhoto ? (
              <img src={detail.facePhoto} alt={detail.name || 'Student'} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center text-sm text-slate-400">No photo</div>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xl font-black text-slate-900">{detail.name || 'Student'}</div>
            <div className="mt-1 text-sm text-slate-600">{detail.studentId || 'N/A'} · {detail.branch || 'N/A'} · {detail.year || 'N/A'}</div>
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <div><span className="font-semibold">Status:</span> Present</div>
              <div className="mt-1"><span className="font-semibold">Time In:</span> {detail.timeIn || 'Already marked'}</div>
              <div className="mt-1"><span className="font-semibold">Date:</span> {detail.dateId}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-5 py-4">
          <button onClick={onClose} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
