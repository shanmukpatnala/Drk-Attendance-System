import React from 'react';
import { X } from 'lucide-react';

export function HistoryScreen({
  historyDate,
  setHistoryDate,
  historyBranch,
  setHistoryBranch,
  historyYear,
  setHistoryYear,
  historyLoading,
  historyList,
  fetchHistoryByDate,
  setView,
  fetchHistoryList,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow border">
        <div className="flex justify-between items-center">
          <h2 className="font-bold">Attendance History (Student)</h2>
          <div className="flex items-center gap-2">
            <button onClick={fetchHistoryList} className="px-3 py-2 border rounded">Refresh Dates</button>
            <button onClick={() => setView('home')} className="px-3 py-2 border rounded">Back</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500">Select Date</label>
            <input type="date" className="w-full p-2 border rounded" value={historyDate} onChange={e => setHistoryDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-slate-500">Branch (optional)</label>
            <select className="w-full p-2 border rounded" value={historyBranch} onChange={e => setHistoryBranch(e.target.value)}>
              <option value=''>All</option>
              <option value="CSE">CSE</option><option value="CSM">CSM</option><option value="CSD">CSD</option><option value="CSC">CSC</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="MECH">MECH</option><option value="CIVIL">CIVIL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500">Year (optional)</label>
            <select className="w-full p-2 border rounded" value={historyYear} onChange={e => setHistoryYear(e.target.value)}>
              <option value=''>All</option>
              <option value="1st">1st</option><option value="2nd">2nd</option><option value="3rd">3rd</option><option value="4th">4th</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={() => fetchHistoryByDate(historyDate, historyBranch, historyYear)} className="px-4 py-2 bg-blue-600 text-white rounded">Show</button>
            <button onClick={() => { setHistoryDate(new Date().toISOString().split('T')[0]); fetchHistoryByDate(new Date().toISOString().split('T')[0], historyBranch, historyYear); }} className="px-4 py-2 border rounded">Today</button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Available Dates</h3>
          {historyLoading && <div className="text-sm text-slate-500">Loading...</div>}
          {!historyLoading && !historyList.length && <div className="text-sm text-slate-500">No history found.</div>}
          {!historyLoading && historyList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {historyList.map(h => (
                <div key={h.dateId} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm">{h.dateId}</div>
                    <div className="text-xs text-slate-500">{h.count} present</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => fetchHistoryByDate(h.dateId, historyBranch, historyYear)} className="px-3 py-2 bg-blue-600 text-white rounded">View</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
