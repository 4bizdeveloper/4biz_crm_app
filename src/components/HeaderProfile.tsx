'use client';

import { useState } from 'react';
import { User, LogOut, ChevronDown, Key } from 'lucide-react';

interface HeaderProfileProps {
  user: {
    name: string;
    email: string;
    role: string;
    department?: string;
  };
}

export default function HeaderProfile({ user }: HeaderProfileProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  // Helper to construct single clean user role title
  const getFormattedRole = () => {
    const roleKey = user.role?.toUpperCase();

    if (roleKey === 'ADMIN') {
      return 'Super Admin';
    }

    if (roleKey === 'MANAGER') {
      return user.department ? `${user.department} Lead` : 'Department Lead';
    }

    if (roleKey === 'EMPLOYEE') {
      return user.department ? `${user.department} Employee` : 'Department Employee';
    }

    return user.role;
  };

  const formattedRole = getFormattedRole();

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-extrabold text-xs shrink-0">
          <User className="w-5 h-5" />
        </div>
        
        {/* Top Right Single Display Text */}
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-slate-800 leading-tight">
            {formattedRole}
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs font-semibold">
          <div className="px-4 py-3 border-b border-slate-100 space-y-1">
            <p className="font-extrabold text-slate-900">{formattedRole}</p>
            <p className="text-slate-500 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold">
              Role: {formattedRole}
            </span>
          </div>

          <button
            onClick={() => alert('Update Credentials Triggered')}
            className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Key className="w-4 h-4 text-slate-400" /> Update Email / Password
          </button>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
          >
            <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}