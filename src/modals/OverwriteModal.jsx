import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function OverwriteModal({ showModal, data, onConfirm, onCancel }) {
  if (!showModal || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[170] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
        <div className="p-4 border-b flex items-center gap-3">
          <AlertTriangle className="text-amber-500" size={20} />
          <h3 className="text-lg font-bold">Duplicate Entry</h3>
          <button onClick={onCancel} className="ml-auto text-slate-500"><X /></button>
        </div>

        <div className="p-6">
          <p className="text-slate-700 mb-4">
            Student <b>{data.name}</b> already exists in the database. Do you want to overwrite the existing record?
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900 mb-4">
            <div className="font-semibold mb-1">Existing Record:</div>
            <div>ID: {data.id}</div>
            <div>Name: {data.name}</div>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Clicking "Overwrite" will replace the existing record with new data. This action cannot be undone.
          </p>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 border rounded hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(data)} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
            Overwrite
          </button>
        </div>
      </div>
    </div>
  );
}
