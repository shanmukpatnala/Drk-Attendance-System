import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';

export function StudentBrowserScreen({
  databaseBrowseYear,
  setDatabaseBrowseYear,
  databaseBrowseBranch,
  setDatabaseBrowseBranch,
  branchOptions,
  databaseBrowseResults,
  handleRejectStudent,
  handleApproveStudent,
  canApproveStudentProfile,
  showApprovalQueueOnly,
  handleBack,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-red-700" />
          <h2 className="font-bold">{showApprovalQueueOnly ? 'Students Waiting For Approval' : 'Registered Students by Year and Branch'}</h2>
        </div>

        {showApprovalQueueOnly && (
          <p className="mt-2 text-sm text-slate-500">
            Only students who still need your approval are shown here.
          </p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select className="p-3 border rounded-lg" value={databaseBrowseYear} onChange={(e) => setDatabaseBrowseYear(e.target.value)}>
            <option value="All">All Years</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
            <option value="Passed Out">Passed Out</option>
          </select>
          <select className="p-3 border rounded-lg" value={databaseBrowseBranch} onChange={(e) => setDatabaseBrowseBranch(e.target.value)}>
            <option value="All">All Branches</option>
            {branchOptions.map((branch) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
          <div className="flex items-center rounded-lg bg-slate-50 px-4 text-sm text-slate-600">
            Showing {databaseBrowseResults.length} {showApprovalQueueOnly ? 'pending approvals' : 'students'}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {databaseBrowseResults.map((student) => {
            const isPending = student?.approved === false || (student?.approvalStatus || '').toLowerCase() === 'pending';

            return (
              <div key={student.studentId} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                <div className="flex items-center gap-3 p-4">
                  <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="h-full w-full object-contain bg-slate-100 p-1"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Photo</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-bold text-slate-900">{student.name}</div>
                    <div className="text-sm text-slate-600">{student.studentId}</div>
                    <div className="text-sm text-slate-500">{student.branch} · {student.year}</div>
                    <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isPending ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {isPending ? 'Pending Approval' : 'Approved'}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 border-t border-slate-200 bg-white p-4 text-sm">
                  <div><span className="text-slate-400">Phone:</span> {student.phone || 'N/A'}</div>
                  <div className="break-all"><span className="text-slate-400">Email:</span> {student.email || 'N/A'}</div>
                  {isPending && (
                    <button onClick={() => handleRejectStudent(student)} className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100">
                      Reject Student
                    </button>
                  )}
                  {isPending && canApproveStudentProfile(student) && (
                    <button onClick={() => handleApproveStudent(student)} className="rounded-lg bg-green-600 px-3 py-2 font-medium text-white transition hover:bg-green-700">
                      Approve Student
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {databaseBrowseResults.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            {showApprovalQueueOnly ? 'No students are waiting for your approval right now.' : 'No students found for this year and branch.'}
          </p>
        )}
      </div>
    </div>
  );
}
