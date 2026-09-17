'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Role, RoleType } from '@/types/crm';
import HeaderProfile from '@/components/HeaderProfile';
import {
  LayoutDashboard,
  Target,
  FolderKanban,
  Ticket,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  Shield,
  Briefcase,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
  Bell,
  Search,
} from 'lucide-react';

interface ActiveUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  department: 'HR' | 'Finance' | 'Marketing' | 'Sales' | 'Operations';
  avatar_url?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User State
  const [user, setUser] = useState<ActiveUser>({
    id: 'usr-1',
    name: 'Super Admin',
    email: 'admin@4biz.crm',
    role: Role.ADMIN,
    department: 'Sales',
  });

  const [sidebarWidth, setSidebarWidth] = useState<number>(288);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const MIN_WIDTH = 220;
  const MAX_WIDTH = 450;
  const COLLAPSED_WIDTH = 80;

  useEffect(() => {
    setIsMounted(true);
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
    if (roleCookie) {
      const roleVal = roleCookie.split('=')[1]?.toUpperCase() as keyof typeof Role;
      if (Role[roleVal]) {
        setUser((prev) => ({ ...prev, role: Role[roleVal] }));
      }
    }
  }, []);

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

  // Nav Items Setup
  const menuItems = [
    { name: 'Overview', path: '/dashboard/overview', icon: LayoutDashboard, roles: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.USER] },
    { name: 'Leads Management', path: '/dashboard/leads', icon: Target, roles: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE] },
    { name: 'IT Projects', path: '/dashboard/projects', icon: FolderKanban, roles: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE] },
    { name: 'Service Tickets', path: '/dashboard/tickets', icon: Ticket, roles: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.USER] },
    { name: 'User Management', path: '/dashboard/users', icon: Users, roles: [Role.ADMIN, Role.MANAGER] },
  ];

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user.role));

  const getRoleBadge = (role: RoleType) => {
    switch (role) {
      case Role.ADMIN:
        return {
          label: 'Super Admin',
          sub: 'Full System Control',
          icon: Shield,
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case Role.MANAGER:
        return {
          label: `${user.department} Lead`,
          sub: 'Department Head',
          icon: Briefcase,
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
        };
      case Role.EMPLOYEE:
        return {
          label: `${user.department} Employee`,
          sub: `${user.department} Staff`,
          icon: User,
          bg: 'bg-teal-100 text-teal-800 border-teal-300',
        };
      default:
        return {
          label: 'Standard User',
          sub: 'Limited Access',
          icon: Users,
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
        };
    }
  };

  const roleInfo = getRoleBadge(user.role);
  const RoleIcon = roleInfo.icon;
  const currentSidebarWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col lg:flex-row antialiased selection:bg-teal-600 selection:text-white transition-all duration-300">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-xl">
            <Image src="/logo.png" alt="Company Logo" width={36} height={36} className="object-contain w-full h-full" priority />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 text-base leading-tight tracking-tight">
              4Biz CRM
            </span>
            <span className="text-[10px] text-teal-700 font-bold tracking-wider uppercase">
              {user.department} Dept
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Resizable Sidebar */}
      <aside
        style={{
          width: isMounted && window.innerWidth >= 1024 ? `${currentSidebarWidth}px` : undefined,
        }}
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white text-slate-800 flex flex-col justify-between border-r border-slate-200 shadow-md shrink-0 group/sidebar ${
          isResizing ? 'select-none transition-none' : 'transition-all duration-300 ease-in-out'
        } ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}`}
      >
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            className="hidden lg:flex absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-teal-500/30 transition-all z-30 items-center justify-center group/handle"
            title="Drag to resize sidebar width"
          >
            <GripVertical className="w-3 h-3 text-slate-400 group-hover/handle:text-teal-700 transition-colors" />
          </div>
        )}

        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* Logo Header */}
          <div className={`p-4 border-b border-slate-200 flex items-center justify-between ${isCollapsed ? 'px-3 justify-center' : 'p-6'}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-2xl">
                <Image src="/logo.png" alt="Company Logo" width={40} height={40} className="object-contain w-full h-full" priority />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-none truncate">
                    4Biz <span className="text-teal-600">CRM</span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-extrabold uppercase tracking-widest mt-1 truncate">
                    Enterprise Suite
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
              title={isCollapsed ? 'Expand Sidebar' : 'Hide Sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5 text-teal-600" /> : <PanelLeftClose className="w-5 h-5 text-slate-600" />}
            </button>
          </div>

          {/* User Role Card inside Sidebar */}
          <div className={`px-4 pt-5 pb-2 ${isCollapsed ? 'px-2' : ''}`}>
            <div className={`p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center ${isCollapsed ? 'justify-center p-2' : 'space-x-3'}`}>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-teal-600 font-bold shadow-sm">
                  <RoleIcon className="w-4 h-4 text-teal-600" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {roleInfo.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate">
                    {roleInfo.sub}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5 flex-1">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-teal-700 opacity-90 truncate">
                Operations
              </div>
            )}
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isCollapsed ? item.name : undefined}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isCollapsed ? 'justify-center px-2' : ''
                  } ${
                    isActive
                      ? 'bg-teal-600 text-white font-bold shadow-sm border border-teal-700'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </div>

                  {!isCollapsed && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'text-white opacity-100 translate-x-0'
                          : 'text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-slate-700'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Logout */}
        <div className={`p-4 border-t border-slate-200 bg-slate-50 space-y-2 ${isCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Sign Out Workspace' : undefined}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer group ${
              isCollapsed ? 'px-0 justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform text-rose-600" />
            {!isCollapsed && <span>Sign Out Workspace</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
          
          {/* Search */}
          <div className="hidden sm:flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 w-64 md:w-80 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search leads, departments, employees..."
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full"
            />
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center space-x-4 ml-auto">
            
            {/* Bell Icon */}
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
            </button>

            <div className="h-6 w-px bg-slate-200" />

            {/* HeaderProfile Component */}
            <HeaderProfile user={user} />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto text-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}