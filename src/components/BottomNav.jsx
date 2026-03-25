import React from 'react';
import { Home, Users, PieChart, User, History, UserPlus, LogOut, X } from 'lucide-react';

export function BottomNav({ view, setView, isOpen, setIsOpen, canManageUsers, appUser, handleLogout }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'history', label: 'History', icon: History },
    { id: 'database', label: 'Database', icon: Users },
    { id: 'student_browser', label: 'Browse Students', icon: Users },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'profile', label: 'Profile', icon: User },
    ...(canManageUsers ? [{ id: 'manage_users', label: 'Add Staff', icon: UserPlus }] : [])
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => setIsOpen(false)}
        aria-label="Close navigation menu"
      />
      <nav className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-red-100 text-sm font-bold text-red-700">
              {appUser?.photo ? (
                <img src={appUser.photo} alt={appUser?.name || 'Profile'} className="h-full w-full object-cover" />
              ) : (
                <span>{(appUser?.name || 'U').trim().charAt(0)}</span>
              )}
            </div>
            <div className="text-base font-bold text-slate-900">{appUser?.name || 'User'}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setView(id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                view === id
                  ? 'bg-red-50 text-red-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-red-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="border-t p-3">
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
