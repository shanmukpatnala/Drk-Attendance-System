import React from 'react';
import { ClipboardCheck, RefreshCw, CheckCircle } from 'lucide-react';

export function AttendanceScreen({
  attStep,
  setAttStep,
  videoRef,
  continuousScanActive,
  markedToday,
  students,
  handleEndSession,
}) {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full max-w-3xl bg-white p-5 rounded-2xl shadow border">
        {attStep === 'setup' && (
          <div>
            <h2 className="text-lg font-bold mb-3">Start Attendance Session</h2>
            <p className="text-slate-600 text-sm mb-4">
              Ensure all students are within camera range. The system will continuously scan for faces and mark them as present.
            </p>
          </div>
        )}

        {attStep === 'camera' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold">Attendance In Progress</h2>
                <div className="text-xs text-slate-500 mt-1">
                  {continuousScanActive ? (
                    <span className="text-green-600 font-semibold">🟢 Live Scanning</span>
                  ) : (
                    <span className="text-yellow-600">Initializing...</span>
                  )}
                </div>
              </div>
              <button onClick={handleEndSession} className="bg-red-600 text-white px-4 py-2 rounded-lg">
                End Session
              </button>
            </div>
            <div className="bg-slate-900 rounded-lg overflow-hidden border-4 border-slate-200 aspect-video flex items-center justify-center relative">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              {!continuousScanActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">Starting camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {attStep === 'camera' && (
        <div className="w-full max-w-3xl bg-white p-4 rounded-2xl shadow border">
          <h3 className="font-bold mb-3">Present Students ({markedToday.size})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {markedToday.size === 0 ? (
              <p className="text-slate-500 text-sm">Waiting for students to be detected...</p>
            ) : (
              Array.from(markedToday).map(sid => {
                const st = students.find(s => s.studentId === sid);
                return (
                  <div key={sid} className="p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{st?.name || sid}</div>
                      <div className="text-xs text-slate-500">{st?.branch} · {st?.year}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
