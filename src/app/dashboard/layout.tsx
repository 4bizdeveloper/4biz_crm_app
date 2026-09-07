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
  User
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
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col antialiased">
      {/* Ultra-Modern Full-Width Top Header */}
      <header className="bg-slate-900 text-white h-16 px-4 md:px-6 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 shadow-md">
        
        {/* Left Side: Toggle Menu Button & Context Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all border border-slate-700/60 shadow-xs cursor-pointer flex items-center gap-2"
            aria-label="Toggle Navigation Drawer"
          >
            {menuOpen ? <X className="w-5 h-5 text-blue-400" /> : <Menu className="w-5 h-5 text-blue-400" />}
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-200">Menu</span>
          </button>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs font-medium text-slate-400">
            <span>Workspace:</span>
            <span className="text-white font-bold bg-slate-800 px-2.5 py-1 rounded-md text-[11px] border border-slate-700">
              {userRole === 'admin' ? 'Administrator' : 'Employee Portal'}
            </span>
          </div>
        </div>

        {/* Right Side: Logo Display */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/overview" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-32 sm:w-36 flex items-center justify-end">
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

      {/* Slide-out Left Drawer Menu */}
      <aside
        className={`fixed top-16 inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-md text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800/80 shadow-2xl ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Navigation Items */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 flex items-center justify-between">
              <span>CRM Modules & Services</span>
              <span className="text-[9px] bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded font-mono">
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
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold border border-blue-500/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
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

        {/* User Account Footer & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate pr-2">
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-blue-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-200 truncate capitalize">
                {userRole === 'admin' ? 'Administrator' : 'Employee Staff'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {userRole === 'admin' ? 'System Operator' : 'Team Workspace'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 shrink-0 cursor-pointer"
            title="Sign Out of Dashboard"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </aside>

      {/* Backdrop overlay when side menu drawer is expanded */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 top-16 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Main Full-Width Content Canvas */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-[1920px] mx-auto">
        {children}
      </main>
    </div>
  );
}