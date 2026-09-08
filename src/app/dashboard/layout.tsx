// src/app/dashboard/layout.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Globe,
  FolderKanban,
  Ticket,
  UserCheck,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  Shield,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Hydration safety flag
  const [isMounted, setIsMounted] = useState(false);

  // Responsive / Drawer states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');

  // Sidebar dynamic resize & toggle state
  const [sidebarWidth, setSidebarWidth] = useState<number>(288); // Default 288px (w-72)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Constants for min/max width constraints
  const MIN_WIDTH = 220;
  const MAX_WIDTH = 450;
  const COLLAPSED_WIDTH = 80;

  useEffect(() => {
    setIsMounted(true);
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
    if (roleCookie) {
      const role = roleCookie.split('=')[1] as 'admin' | 'employee';
      setUserRole(role);
    }
  }, []);

  // Handle Drag / Resize mechanics
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isCollapsed) return;
    setIsResizing(true);
  }, [isCollapsed]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        let newWidth = mouseMoveEvent.clientX;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    {
      name: 'Overview',
      path: '/dashboard/overview',
      icon: LayoutDashboard,
      badge: null,
    },
      {
      name: 'Website Enquiries',
      path: '/dashboard/website-contact-form-enquiries',
      icon: Globe,
      badge: null,
    },
    {
      name: 'Leads Management',
      path: '/dashboard/leads',
      icon: Target,
      badge: null,
    },
    {
      name: 'IT Projects',
      path: '/dashboard/projects',
      icon: FolderKanban,
      badge: null,
    },
    {
      name: 'Service Tickets',
      path: '/dashboard/tickets',
      icon: Ticket,
      badge: null,
    },
    {
      name: 'HR & Users',
      path: '/dashboard/hr',
      icon: UserCheck,
      badge: null,
    },
    {
      name: 'Employee Workspace',
      path: '/dashboard/employee-portal',
      icon: Briefcase,
      badge: null,
    },
    {
      name: 'ERP Chat',
      path: '/dashboard/chat',
      icon: MessageSquare,
      badge: null,
    },
  ];

  const currentSidebarWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased selection:bg-purple-500 selection:text-white">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border-b border-indigo-500/20 px-4 py-3 flex items-center justify-between shadow-lg shadow-indigo-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/30">
            4B
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 text-base leading-tight tracking-tight">
              4Biz CRM
            </span>
            <span className="text-[10px] text-cyan-400/80 font-medium tracking-wider uppercase">
              IT Operations Hub
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-gradient-to-r from-slate-800 to-indigo-950 text-indigo-200 hover:text-white hover:from-indigo-900 hover:to-violet-900 transition-all border border-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Slide-over Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation Container */}
      <aside
        style={{
          width: isMounted && window.innerWidth >= 1024 ? `${currentSidebarWidth}px` : undefined,
        }}
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-300 flex flex-col justify-between border-r border-indigo-500/20 shadow-2xl shadow-indigo-950/50 shrink-0 group/sidebar ${
          isResizing ? 'select-none transition-none' : 'transition-all duration-300 ease-in-out'
        } ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Resize Handle Handlebar (Desktop Only) */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            className="hidden lg:flex absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-gradient-to-b hover:from-cyan-500 hover:to-purple-500 transition-all z-30 items-center justify-center group/handle"
            title="Drag to resize sidebar width"
          >
            <GripVertical className="w-3 h-3 text-slate-500 group-hover/handle:text-white transition-colors" />
          </div>
        )}

        {/* Upper Sidebar: Branding & Navigation */}
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* Company Branding & Collapse Toggle */}
          <div className={`p-4 border-b border-indigo-500/15 flex items-center justify-between ${isCollapsed ? 'px-3 justify-center' : 'p-6'}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30 shrink-0 ring-1 ring-white/20">
                4B
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 text-lg tracking-tight leading-none truncate">
                    4Biz <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">CRM</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mt-1 truncate">
                    Enterprise Suite
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Hide/Show Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900/50 hover:bg-indigo-900/50 border border-transparent hover:border-indigo-500/30 transition-all"
              title={isCollapsed ? "Expand Sidebar" : "Hide Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5 text-cyan-400" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Card */}
          <div className={`px-4 pt-5 pb-2 ${isCollapsed ? 'px-2' : ''}`}>
            <div className={`p-3 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/20 shadow-inner flex items-center ${isCollapsed ? 'justify-center p-2' : 'space-x-3'}`}>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-900/80 to-indigo-900/80 border border-indigo-500/30 flex items-center justify-center text-cyan-400 font-bold shadow-sm">
                  {userRole === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-sm shadow-emerald-400" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-slate-100 truncate capitalize">
                    {userRole === 'admin' ? 'Administrator' : 'IT Specialist'}
                  </span>
                  <span className="text-[10px] text-indigo-300/70 font-medium truncate">
                    {userRole === 'admin' ? 'System Manager' : 'Employee Access'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400/70 truncate">
                Main Operations
              </div>
            )}
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isCollapsed ? item.name : undefined}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    isCollapsed ? 'justify-center px-2' : ''
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 font-bold border border-cyan-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/80 hover:to-indigo-950/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-cyan-200' : 'text-slate-400 group-hover:text-cyan-400'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </div>

                  {!isCollapsed && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'text-cyan-200 opacity-100 translate-x-0'
                          : 'text-slate-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-cyan-400'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Lower Sidebar: System Action Footer */}
        <div className={`p-4 border-t border-indigo-500/15 bg-slate-950/60 ${isCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out Workspace" : undefined}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-rose-950 hover:to-pink-950 text-slate-300 hover:text-rose-300 border border-slate-700/50 hover:border-rose-500/40 text-xs font-bold transition-all duration-300 shadow-sm hover:shadow-rose-950/50 cursor-pointer group ${
              isCollapsed ? 'px-0 justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform text-rose-400/80 group-hover:text-rose-300" />
            {!isCollapsed && <span>Sign Out Workspace</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}