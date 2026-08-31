'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Users, DollarSign, ShieldAlert } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard/sales', label: 'Sales & Pipeline', icon: DollarSign },
    { href: '/dashboard/hr', label: 'HR & Employees', icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col justify-between p-4 border-r border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-8 px-2 pt-2 text-blue-400 font-bold text-xl">
            <ShieldAlert className="w-6 h-6 text-blue-500" />
            <span>IT Ops CRM</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Section */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="px-2">
            <p className="text-xs text-slate-400 font-medium">Logged in as</p>
            <p className="text-sm font-semibold text-slate-200 truncate">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 px-3 rounded-lg text-sm font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}