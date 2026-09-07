'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Globe,
  UserCheck,
  TrendingUp,
  FolderKanban,
  Ticket,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
  Send,
  User,
  Sparkles
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
    if (roleCookie) {
      const roleVal = roleCookie.split('=')[1] as 'admin' | 'employee';
      setUserRole(roleVal);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const adminNav = [
    { name: 'Overview', href: '/dashboard/overview', icon: BarChart3 },
    { name: 'Website Contact Form Enquiries', href: '/dashboard/website-contact-form-enquiries', icon: Globe },
    { name: 'Leads Directory', href: '/dashboard/leads', icon: UserCheck },
    { name: 'Sales Pipeline', href: '/dashboard/sales', icon: TrendingUp },
    { name: 'Projects & ERP', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Helpdesk Tickets', href: '/dashboard/tickets', icon: Ticket },
    { name: 'HR & Users', href: '/dashboard/hr', icon: Users },
    { name: 'Operations Chat', href: '/dashboard/chat', icon: MessageSquare },
  ];

  const employeeNav = [
    { name: 'My Workspace & Deliverables', href: '/dashboard/employee-portal', icon: Send },
    { name: 'Operations Chat', href: '/dashboard/chat', icon: MessageSquare },
  ];

  const navItems = userRole === 'admin' ? adminNav : employeeNav;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col antialiased selection:bg-blue-500 selection:text-white">
      {/* Ultra-Modern Glassmorphism Header */}
      <header className="bg-slate-950/80 backdrop-blur-xl text-white h-16 px-3 sm:px-6 flex items-center justify-between border-b border-slate-800/80 sticky top-0 z-40 shadow-xl">
        
        {/* Left Side: Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 sm:p-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all border border-slate-700/60 shadow-xs cursor-pointer flex items-center gap-2 group"
            aria-label="Toggle Navigation Drawer"
          >
            {menuOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5 text-blue-400 group-hover:rotate-180 transition-transform duration-300" />}
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-200">Menu</span>
          </button>

          <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-slate-800 text-xs font-medium text-slate-400">
            <span className="hidden md:inline-block">Workspace:</span>
            <span className="text-white font-bold bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-300 px-2.5 py-1 rounded-lg text-[11px] border border-blue-500/30 flex items-center gap-1.5 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              {userRole === 'admin' ? 'Administrator' : 'Employee Portal'}
            </span>
          </div>
        </div>

        {/* Right Side: Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/overview" className="flex items-center gap-2.5 group">
            <div className="relative h-8 w-28 sm:h-9 sm:w-36 flex items-center justify-end">
              <Image
                src="/logo.png"
                alt="4Biz IT CRM Logo"
                fill
                priority
                className="object-contain object-right"
              />
            </div>
          </Link>
        </div>
      </header>

      {/* Slide-out Modern Side Navigation Drawer */}
      <aside
        className={`fixed top-16 inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-950/95 backdrop-blur-2xl text-slate-300 flex flex-col justify-between transition-all duration-300 ease-in-out border-r border-slate-800/80 shadow-2xl ${
          menuOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Navigation Section */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-orange-400" /> CRM Modules
              </span>
              <span className="text-[9px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-2 py-0.5 rounded-full font-mono shadow-xs">
                {navItems.length} Apps
              </span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-600/25 font-bold border border-blue-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isActive ? (
                    <ChevronRight className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Account Profile Footer with Explicit Logout Button Text */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-3 truncate px-1">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-2.5 rounded-xl border border-slate-700/80 text-blue-400 shrink-0 shadow-inner">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-100 truncate capitalize">
                {userRole === 'admin' ? 'Administrator' : 'Employee Staff'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {userRole === 'admin' ? 'System Operator' : 'Team Workspace'}
              </div>
            </div>
          </div>

          {/* Full Logout Button with Text Label */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-red-500/10 via-red-500/15 to-rose-500/10 hover:from-red-600 hover:to-rose-600 text-red-300 hover:text-white font-semibold text-xs rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-200 shadow-sm cursor-pointer group"
          >
            <LogOut className="w-4 h-4 text-red-400 group-hover:text-white transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Backdrop Overlay for Mobile/Tablet */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 top-16 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Main Responsive Canvas Wrapper */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-[1920px] mx-auto">
        {children}
      </main>
    </div>
  );
}