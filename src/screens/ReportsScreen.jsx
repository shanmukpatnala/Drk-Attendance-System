import React, { useMemo, useState } from 'react';
import { ArrowLeft, PieChart, Download, X } from 'lucide-react';

const REPORT_YEAR_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: '1st', label: '1st Year' },
  { value: '2nd', label: '2nd Year' },
  { value: '3rd', label: '3rd Year' },
  { value: '4th', label: '4th Year' },
  { value: 'Passed Out', label: 'Passout Batch' }
];

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
  loading,
  handleBack,
}) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const canViewPhoto = (student) => student?.status === 'Present' && Boolean(student?.photo);

  const reportCounts = useMemo(() => ({
    present: (reportData || []).filter(r => r.status === 'Present').length,
    absent: (reportData || []).filter(r => r.status === 'Absent').length
  }), [reportData]);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

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
              {REPORT_YEAR_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <button onClick={handleGenerateReport} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-bold disabled:opacity-60">
              {loading ? 'Generating...' : 'Generate'}
            </button>
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
              <div className="p-2 bg-green-50 rounded"><div className="font-bold text-green-700">{reportCounts.present}</div><div className="text-xs">Present</div></div>
              <div className="p-2 bg-red-50 rounded"><div className="font-bold text-red-700">{reportCounts.absent}</div><div className="text-xs">Absent</div></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr><th className="p-2">Roll No</th><th className="p-2">Name</th><th className="p-2">Time In</th><th className="p-2">Status</th><th className="p-2">Branch</th><th className="p-2">Year</th></tr>
              </thead>
              <tbody>
                {reportData.map(student => (
                  <tr
                    key={student.id || student.studentId}
                    className={`border-b ${canViewPhoto(student) ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                    onClick={() => {
                      if (canViewPhoto(student)) setSelectedStudent(student);
                    }}
                  >
                    <td className="p-2 font-mono">{student.studentId}</td>
                    <td className="p-2 font-bold">
                      <div>{student.name}</div>
                      {canViewPhoto(student) ? (
                        <div className="text-xs font-normal text-blue-700">Click to view photo</div>
                      ) : (
                        <div className="text-xs font-normal text-slate-400">Photo available only for present students</div>
                      )}
                    </td>
                    <td className="p-2">{student.timeIn || '-'}</td>
                    <td className="p-2"><span className={`px-2 py-1 rounded ${student.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{student.status}</span></td>
                    <td className="p-2">{student.branch}</td>
                    <td className="p-2">{student.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={handleDownloadReport} className="bg-blue-600 text-white px-4 py-2 rounded font-bold"><Download className="w-4 h-4 inline mr-2" /> Download CSV</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Student photo is shown only for present students in the popup view. CSV download contains text fields only.</p>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b p-4">
              <div>
                <h3 className="text-lg font-bold">{selectedStudent.name}</h3>
                <p className="text-sm text-slate-500">{selectedStudent.studentId} · {selectedStudent.branch} · {selectedStudent.year}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="ml-auto text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-xl border bg-slate-50">
                {selectedStudent.photo ? (
                  <img src={selectedStudent.photo} alt={selectedStudent.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-64 items-center justify-center px-4 text-center text-sm text-slate-500">
                    No live attendance photo available for this student.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs font-bold uppercase text-slate-500">Recognition Details</div>
                  <div className="mt-2 text-sm text-slate-700">Attendance Date: <span className="font-semibold">{selectedStudent.date || reportDate}</span></div>
                  <div className="mt-1 text-sm text-slate-700">Recognized Status: <span className="font-semibold">{selectedStudent.status}</span></div>
                  <div className="mt-1 text-sm text-slate-700">Time In: <span className="font-semibold">{selectedStudent.timeIn || 'N/A'}</span></div>
                </div>

                <div className="rounded-xl bg-blue-50 p-3 text-sm text-slate-700">
                  This photo is the live face image captured during attendance for students marked present.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
