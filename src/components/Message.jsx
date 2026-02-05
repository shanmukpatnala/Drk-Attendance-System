import React from 'react';
import { AlertCircle, CheckCircle, RefreshCw, AlertTriangle, X } from 'lucide-react';

export function Message({ statusMsg, setStatusMsg }) {
  if (!statusMsg) return null;

  const bgColor = {
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-sky-100 text-sky-800',
    success: 'bg-green-100 text-green-800'
  }[statusMsg.type] || 'bg-slate-100 text-slate-800';

  const Icon = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: RefreshCw
  }[statusMsg.type] || null;

  return (
    <div className={`p-3 mb-4 rounded-lg text-sm flex items-center gap-2 ${bgColor}`}>
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{statusMsg.text}</span>
      <button onClick={() => setStatusMsg(null)} className="ml-auto flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
