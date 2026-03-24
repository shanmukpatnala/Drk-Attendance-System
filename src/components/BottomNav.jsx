import React from 'react';
import { Home, Users, PieChart, User, History, X } from 'lucide-react';

export function BottomNav({ view, setView, isOpen, setIsOpen, isAdmin }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'database', label: 'Database', icon: Users },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
    ...(isAdmin ? [{ id: 'manage_users', label: 'Manage Users', icon: User }] : [])
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
      <nav className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-4">
          <div>
            <div className="text-lg font-bold text-slate-900">Menu</div>
            <div className="text-xs text-slate-500">Navigate sections</div>
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

        <div className="flex flex-col gap-2 p-3">
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
      </nav>
    </div>
  );
}
