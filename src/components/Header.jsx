import React from 'react';

export function Header({ appUser, todayCount }) {
  return (
    <header className="bg-red-900 text-white p-3 shadow-lg sticky top-0 z-50 border-b-4 border-red-700">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-md border-2 border-red-700">
            <img src="/logos/header-logo.png" alt="Header Logo" className="w-10 h-10 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold tracking-wide uppercase leading-tight">
              DRK Institute Of Science & Technology
            </h1>
            <div className="text-xs text-red-200 mt-0.5">
              (Approved by AICTE & Affiliated to JNTUH)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-sm text-red-200">{appUser?.name || ''}</div>
          <div
            title="Students marked present today (database)"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-sm"
          >
            <svg className="w-4 h-4 text-white opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="font-semibold">{typeof todayCount === 'number' ? todayCount : 0}</span>
            <span className="text-xs text-red-200">Present</span>
          </div>
        </div>
      </div>
    </header>
  );
}
