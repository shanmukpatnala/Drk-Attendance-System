import React from 'react';
import { PieChart, Download, Upload } from 'lucide-react';

export function ReportsScreen({
  reportDate,
  setReportDate,
  reportBranch,
  setReportBranch,
  reportYear,
  setReportYear,
  reportData,
  handleGenerateReport,
  handleDownloadReport,
  sendReportToHODs,
  loading,
  SHOW_EMAIL_BUTTON,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow border border-slate-200">
        <h2 className="text-lg font-bold flex items-center"><PieChart className="w-5 h-5 mr-2 text-blue-700" /> Class Attendance Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 mt-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
            <input type="date" className="w-full p-2 border rounded" value={reportDate} onChange={e => setReportDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Branch</label>
            <select className="w-full p-2 border rounded" value={reportBranch} onChange={e => setReportBranch(e.target.value)}>
              <option value="All">All</option>
              <option value="CSE">CSE</option><option value="CSM">CSM</option><option value="CSD">CSD</option><option value="CSC">CSC</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="MECH">MECH</option><option value="CIVIL">CIVIL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
            <select className="w-full p-2 border rounded" value={reportYear} onChange={e => setReportYear(e.target.value)}>
              <option value="All">All</option>
              <option>1st</option><option>2nd</option><option>3rd</option><option>4th</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <button onClick={handleGenerateReport} className="w-full bg-blue-600 text-white py-2 rounded font-bold">Generate</button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="bg-white p-4 rounded-xl shadow border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-lg font-bold">Report Summary</h3>
              <div className="text-xs text-slate-500">{reportBranch}-{reportYear} · {reportDate}</div>
            </div>
            <div className="flex gap-2">
              <div className="p-2 bg-green-50 rounded"><div className="font-bold text-green-700">{reportData.filter(r => r.status === 'Present').length}</div><div className="text-xs">Present</div></div>
              <div className="p-2 bg-red-50 rounded"><div className="font-bold text-red-700">{reportData.filter(r => r.status === 'Absent').length}</div><div className="text-xs">Absent</div></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr><th className="p-2">Roll No</th><th className="p-2">Name</th><th className="p-2">Time In</th><th className="p-2">Status</th><th className="p-2">Branch</th><th className="p-2">Year</th></tr>
              </thead>
              <tbody>
                {reportData.map(student => (
                  <tr key={student.id || student.studentId} className="border-b"><td className="p-2 font-mono">{student.studentId}</td><td className="p-2 font-bold">{student.name}</td><td className="p-2">{student.timeIn || '-'}</td><td className="p-2"><span className={`px-2 py-1 rounded ${student.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{student.status}</span></td><td className="p-2">{student.branch}</td><td className="p-2">{student.year}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={handleDownloadReport} className="bg-blue-600 text-white px-4 py-2 rounded font-bold"><Download className="w-4 h-4 inline mr-2" /> Download CSV</button>

            {SHOW_EMAIL_BUTTON && (
              <button onClick={() => sendReportToHODs(reportBranch, reportDate, reportData)} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded font-bold">
                <Upload className="w-4 h-4 inline mr-2" /> {loading ? 'Sending...' : 'Upload & Email HOD'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
