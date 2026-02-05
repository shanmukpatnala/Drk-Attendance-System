import React from 'react';
import { LayoutDashboard, Users, PieChart, User } from 'lucide-react';

export function BottomNav({ view, setView }) {
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'database', label: 'Database', icon: Users },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex flex-col items-center text-xs gap-1 ${
              view === id ? 'text-red-700' : 'text-slate-400'
            } hover:text-red-600 transition`}
          >
            <Icon className="w-6 h-6" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
