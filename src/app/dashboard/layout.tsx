'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, TrendingUp, FolderKanban, Ticket, Target, ShieldCheck, BarChart3, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { href: '/dashboard/overview', label: 'Operations Overview', icon: BarChart3 },
    { href: '/dashboard/leads', label: 'Leads Directory', icon: Target },
    { href: '/dashboard/sales', label: 'Sales Operations', icon: TrendingUp },
    { href: '/dashboard/projects', label: 'Projects & Ops', icon: FolderKanban },
    { href: '/dashboard/tickets', label: 'IT Desk Tickets', icon: Ticket },
    { href: '/dashboard/hr', label: 'HR Directory', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white flex flex-col p-4 border-r border-slate-800 shrink-0">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-xl mb-8 px-2">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
          <span>4Biz IT CRM</span>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard/overview' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar with Logout Button */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-end shadow-2xs">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-red-600 transition-colors border border-slate-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}