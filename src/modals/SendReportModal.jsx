import React from 'react';
import { X } from 'lucide-react';

export function SendReportModal({ showModal, result, onClose }) {
  if (!showModal || !result) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[160] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-auto">
        <div className="p-4 border-b flex items-start gap-3">
          <h3 className="text-lg font-bold">Report send results</h3>
          <button onClick={onClose} className="ml-auto text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-600">Uploaded: <b>{result.uploaded ? 'Yes' : 'No'}</b></p>
          {result.reportId && (
            <p className="text-sm">Report ID: <span className="font-mono">{result.reportId}</span></p>
          )}
          <div>
            <h4 className="font-semibold">HOD results</h4>
            <div className="mt-2 space-y-2 max-h-60 overflow-auto">
              {(result.hodResults || []).map((r, idx) => (
                <div key={idx} className="p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm">{r.email}</div>
                    <div className={`ml-auto text-xs font-semibold ${r.status === 'sent' ? 'text-green-700' : r.status === 'failed' ? 'text-red-700' : 'text-slate-600'}`}>
                      {r.status.toUpperCase()}
                    </div>
                  </div>
                  {r.info && <div className="text-xs text-slate-500 mt-1 break-all">{typeof r.info === 'string' ? r.info : JSON.stringify(r.info)}</div>}
                </div>
              ))}
              {(!result.hodResults || !result.hodResults.length) && (
                <p className="text-xs text-slate-500">No HODs found or no emails attempted.</p>
              )}
            </div>
          </div>
          {result.error && (
            <div className="text-sm text-red-600">
              Error: {result.error}
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border">Close</button>
        </div>
      </div>
    </div>
  );
}
