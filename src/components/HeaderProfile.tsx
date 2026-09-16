'use client';

import { useState } from 'react';
import { AuthUser } from '@/types/crm';

export default function HeaderProfile({ user }: { user: AuthUser }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-sm shadow">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</p>
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
            {user.role} ({user.department})
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Signed in as</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
          </div>
          <div className="px-4 py-2 space-y-1">
            <p className="text-xs text-slate-500">Department: <span className="font-semibold text-slate-700">{user.department}</span></p>
            <p className="text-xs text-slate-500">Access Level: <span className="font-semibold text-slate-700">{user.role}</span></p>
          </div>
          <div className="border-t border-slate-100 mt-2 pt-2 px-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}