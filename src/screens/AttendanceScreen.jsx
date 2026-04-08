import React, { useState } from 'react';
import { ArrowLeft, Timer, RefreshCw, CheckCircle, ChevronUp, ChevronDown, ScanLine, Users, ShieldCheck } from 'lucide-react';

export function AttendanceScreen({
  attStep,
  videoRef,
  attendanceOverlay,
  cameraStreamActive,
  continuousScanActive,
  markedToday,
  students,
  handleEndSession,
  handleBack,
}) {
  const [showMarkedList, setShowMarkedList] = useState(false);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-full max-w-6xl">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        {attStep === 'setup' && (
          <div className="bg-gradient-to-br from-red-950 via-red-900 to-amber-900 p-6 text-white sm:p-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-100">
                <ScanLine className="h-4 w-4" />
                Fast Attendance Mode
              </div>
              <h2 className="mt-4 text-2xl font-black sm:text-3xl">Start attendance and mark faces within 5 seconds</h2>
              <p className="mt-3 text-sm text-red-100/90 sm:text-base">
                Keep the camera steady, let students cross the frame naturally, and the scanner will keep matching faces continuously without waiting for manual capture.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <Timer className="mb-2 h-5 w-5 text-amber-200" />
                <div className="text-sm font-semibold">Fast target</div>
                <div className="mt-1 text-xs text-red-100/80">Optimized for quick recognition while a student is moving.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <Users className="mb-2 h-5 w-5 text-amber-200" />
                <div className="text-sm font-semibold">Continuous scan</div>
                <div className="mt-1 text-xs text-red-100/80">No need to stop each person for a manual snapshot.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <ShieldCheck className="mb-2 h-5 w-5 text-amber-200" />
                <div className="text-sm font-semibold">Instant marking</div>
                <div className="mt-1 text-xs text-red-100/80">Recognized students appear in the present list immediately.</div>
              </div>
            </div>
          </div>
        )}

        {attStep === 'camera' && (
          <div className="p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_360px]">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Live Attendance Scanning</h2>
                    <div className="mt-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      {continuousScanActive ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500"></span>
                          Scanning active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Initializing camera
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={handleEndSession} className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-bold text-white shadow hover:bg-red-800">
                    End Session
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Present now</div>
                    <div className="mt-2 text-3xl font-black text-emerald-600">{markedToday.size}</div>
                    <div className="mt-1 text-xs text-slate-500">Marked in this session</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recognition speed</div>
                    <div className="mt-2 text-2xl font-black text-slate-900">&lt; 5 sec</div>
                    <div className="mt-1 text-xs text-slate-500">Optimized for quick pass-by capture</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Best result</div>
                    <div className="mt-2 text-sm font-bold text-slate-900">Face straight, light on</div>
                    <div className="mt-1 text-xs text-slate-500">Works while walking, but clear light helps.</div>
                  </div>
                </div>

                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-2xl">
                  <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" />
                  {!cameraStreamActive && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/92">
                      <div className="text-center text-white">
                        <p className="text-sm font-semibold">Camera is off</p>
                        <p className="mt-1 text-xs text-slate-300">Start a session to scan again.</p>
                      </div>
                    </div>
                  )}
                  {attendanceOverlay?.sourceWidth > 0 && attendanceOverlay?.sourceHeight > 0 && (
                    <svg
                      viewBox={`0 0 ${attendanceOverlay.sourceWidth} ${attendanceOverlay.sourceHeight}`}
                      preserveAspectRatio="xMidYMid slice"
                      className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
                    >
                      {attendanceOverlay.boxes.map((box) => {
                        const color =
                          box.status === 'recognized'
                            ? '#22c55e'
                            : box.status === 'already-marked'
                              ? '#f59e0b'
                              : '#ef4444';

                        const statusLabel =
                          box.status === 'recognized'
                            ? 'Recognized'
                            : box.status === 'already-marked'
                              ? 'Already marked'
                              : 'Unknown';

                        return (
                          <g key={box.id}>
                            <rect
                              x={box.x}
                              y={box.y}
                              width={box.width}
                              height={box.height}
                              rx="14"
                              fill="none"
                              stroke={color}
                              strokeWidth="6"
                            />
                            <g transform={`translate(${box.x}, ${Math.max(28, box.y - 18)}) scale(-1, 1)`}>
                              <rect
                                x={-Math.min(Math.max(box.width, 120), 220)}
                                y="-28"
                                width={Math.min(Math.max(box.width, 120), 220)}
                                height="28"
                                rx="10"
                                fill="rgba(15, 23, 42, 0.86)"
                              />
                              <text
                                x={-12}
                                y="-10"
                                textAnchor="end"
                                fill="#f8fafc"
                                fontSize="14"
                                fontWeight="700"
                              >
                                {`${statusLabel}: ${box.label}`}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                  <div className="pointer-events-none absolute inset-x-6 inset-y-5 rounded-[26px] border border-white/20"></div>
                  <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    Auto detect + auto mark
                  </div>
                  {!continuousScanActive && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55">
                      <div className="text-center">
                        <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-white" />
                        <p className="text-sm font-semibold text-white">Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <button
                  onClick={() => setShowMarkedList(!showMarkedList)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="text-left">
                    <h3 className="font-black text-slate-900">Present Students ({markedToday.size})</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {markedToday.size === 0 ? 'Waiting for first recognition...' : 'Tap to see who is already marked'}
                    </p>
                  </div>
                  {showMarkedList ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {showMarkedList && (
                  <div className="mt-3 space-y-2 overflow-y-auto pr-1 lg:max-h-[420px]">
                    {markedToday.size === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-500">Waiting for students to be detected...</p>
                    ) : (
                      Array.from(markedToday).map((sid) => {
                        const st = students.find(student => student.studentId === sid);
                        return (
                          <div key={sid} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                            <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-emerald-950">{st?.name || sid}</div>
                              <div className="text-xs text-emerald-700">{`${st?.branch || ''} | ${st?.year || ''}`}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
