'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  GripVertical,
  Settings,
  Check
} from 'lucide-react';

interface ColorTheme {
  id: string;
  name: string;
  circleColors: string[];
  bgStyle: string;
  sidebarBg: string;
  activeItemBg: string;
  accentText: string;
  accentBorder: string;
}

const THEMES: ColorTheme[] = [
  {
    id: 'emerald-dark',
    name: 'Ultra Modern Dark Emerald',
    circleColors: ['#04110d', '#0b2620', '#134037', '#2dd4bf'],
    bgStyle: 'radial-gradient(ellipse at top, #0d2a23 0%, #051410 50%, #020806 100%)',
    sidebarBg: 'bg-[#04110d]/95 backdrop-blur-xl',
    activeItemBg: 'bg-gradient-to-r from-[#113a30] to-[#0c2a23] text-white shadow-md border-teal-400/40',
    accentText: 'text-cyan-300',
    accentBorder: 'border-emerald-800/60',
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Cyber Violet',
    circleColors: ['#0d081a', '#220f3d', '#421a73', '#c084fc'],
    bgStyle: 'radial-gradient(ellipse at top, #1d0d36 0%, #090412 50%, #04010a 100%)',
    sidebarBg: 'bg-[#0d081a]/95 backdrop-blur-xl',
    activeItemBg: 'bg-gradient-to-r from-[#2a134d] to-[#1e0d38] text-white shadow-md border-purple-400/40',
    accentText: 'text-purple-300',
    accentBorder: 'border-purple-800/60',
  },
  {
    id: 'deep-blue',
    name: 'Deep Space Navy',
    circleColors: ['#040f1c', '#082342', '#0e3d70', '#38bdf8'],
    bgStyle: 'radial-gradient(ellipse at top, #0b294d 0%, #030e1a 50%, #01060d 100%)',
    sidebarBg: 'bg-[#040f1c]/95 backdrop-blur-xl',
    activeItemBg: 'bg-gradient-to-r from-[#0d3461] to-[#092647] text-white shadow-md border-sky-400/40',
    accentText: 'text-sky-300',
    accentBorder: 'border-sky-800/60',
  },
  {
    id: 'obsidian-gold',
    name: 'Obsidian Warm Amber',
    circleColors: ['#120902', '#2f1807', '#542a0b', '#fbbf24'],
    bgStyle: 'radial-gradient(ellipse at top, #381c06 0%, #0f0701 50%, #050200 100%)',
    sidebarBg: 'bg-[#120902]/95 backdrop-blur-xl',
    activeItemBg: 'bg-gradient-to-r from-[#422007] to-[#2e1604] text-white shadow-md border-amber-400/40',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-800/60',
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(THEMES[0]);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');

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
      const role = roleCookie.split('=')[1] as 'admin' | 'employee';
      setUserRole(role);
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

  const menuItems = [
    { name: 'Overview', path: '/dashboard/overview', icon: LayoutDashboard },
    { name: 'Leads Management', path: '/dashboard/leads', icon: Target },
    { name: 'IT Projects', path: '/dashboard/projects', icon: FolderKanban },
    { name: 'Service Tickets', path: '/dashboard/tickets', icon: Ticket },
  ];

  const currentSidebarWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

  return (
    <div 
      style={{ background: selectedTheme.bgStyle }}
      className="min-h-screen text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-cyan-500 selection:text-white transition-all duration-500"
    >
      {/* Mobile Top Header */}
      <header className={`lg:hidden sticky top-0 z-40 ${selectedTheme.sidebarBg} border-b ${selectedTheme.accentBorder} px-4 py-3 flex items-center justify-between shadow-lg`}>
        <div className="flex items-center space-x-3">
          <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-xl">
            <Image src="/logo.png" alt="Company Logo" width={36} height={36} className="object-contain w-full h-full" priority />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200 text-base leading-tight tracking-tight">
              4Biz CRM
            </span>
            <span className={`text-[10px] ${selectedTheme.accentText} font-semibold tracking-wider uppercase`}>
              IT Operations Hub
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`p-2 rounded-xl bg-black/40 text-slate-100 hover:text-white transition-all border ${selectedTheme.accentBorder} focus:outline-none`}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Desktop / Drawer Mobile Sidebar */}
      <aside
        style={{
          width: isMounted && window.innerWidth >= 1024 ? `${currentSidebarWidth}px` : undefined,
        }}
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen ${selectedTheme.sidebarBg} text-slate-100 flex flex-col justify-between border-r ${selectedTheme.accentBorder} shadow-2xl shrink-0 group/sidebar ${
          isResizing ? 'select-none transition-none' : 'transition-all duration-300 ease-in-out'
        } ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Resize Handlebar */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            className="hidden lg:flex absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-cyan-500/40 transition-all z-30 items-center justify-center group/handle"
            title="Drag to resize sidebar width"
          >
            <GripVertical className="w-3 h-3 text-slate-400 group-hover/handle:text-white transition-colors" />
          </div>
        )}

        {/* Top Section */}
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className={`p-4 border-b ${selectedTheme.accentBorder} flex items-center justify-between ${isCollapsed ? 'px-3 justify-center' : 'p-6'}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-2xl">
                <Image src="/logo.png" alt="Company Logo" width={40} height={40} className="object-contain w-full h-full" priority />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 text-lg tracking-tight leading-none truncate">
                    4Biz <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200">CRM</span>
                  </span>
                  <span className={`text-[10px] ${selectedTheme.accentText} font-extrabold uppercase tracking-widest mt-1 truncate`}>
                    Enterprise Suite
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`hidden lg:flex p-1.5 rounded-lg text-slate-200 hover:text-white bg-black/40 border border-transparent hover:${selectedTheme.accentBorder} transition-all`}
              title={isCollapsed ? "Expand Sidebar" : "Hide Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className={`w-5 h-5 ${selectedTheme.accentText}`} /> : <PanelLeftClose className="w-5 h-5 text-slate-200" />}
            </button>

            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Card */}
          <div className={`px-4 pt-5 pb-2 ${isCollapsed ? 'px-2' : ''}`}>
            <div className={`p-3 rounded-2xl bg-black/50 border ${selectedTheme.accentBorder} flex items-center ${isCollapsed ? 'justify-center p-2' : 'space-x-3'}`}>
              <div className="relative shrink-0">
                <div className={`w-9 h-9 rounded-xl bg-slate-900/80 border ${selectedTheme.accentBorder} flex items-center justify-center ${selectedTheme.accentText} font-bold shadow-sm`}>
                  {userRole === 'admin' ? <Shield className="w-4 h-4 text-cyan-300" /> : <User className="w-4 h-4 text-cyan-300" />}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-black shadow-sm" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-white truncate capitalize">
                    {userRole === 'admin' ? 'Administrator' : 'IT Specialist'}
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium truncate">
                    {userRole === 'admin' ? 'System Manager' : 'Employee Access'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 flex-1">
            {!isCollapsed && (
              <div className={`px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 opacity-90 truncate`}>
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
                      ? `${selectedTheme.activeItemBg} font-bold border`
                      : 'text-slate-200 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : `text-slate-300 group-hover:text-white`
                      }`}
                    />
                    {!isCollapsed && <span className="truncate text-slate-100 group-hover:text-white">{item.name}</span>}
                  </div>

                  {!isCollapsed && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'text-white opacity-100 translate-x-0'
                          : 'text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-white'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t ${selectedTheme.accentBorder} bg-black/50 space-y-2 ${isCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={() => setIsThemeModalOpen(true)}
            title={isCollapsed ? "Theme Settings" : undefined}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-black/40 hover:bg-black/70 text-slate-100 hover:text-white border ${selectedTheme.accentBorder} text-xs font-bold transition-all duration-300 cursor-pointer group ${
              isCollapsed ? 'px-0 justify-center' : ''
            }`}
          >
            <Settings className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-90 text-cyan-300`} />
            {!isCollapsed && <span>Theme Settings</span>}
          </button>

          <button
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out Workspace" : undefined}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-black/40 hover:bg-rose-950/60 text-slate-200 hover:text-rose-200 border border-slate-700/50 hover:border-rose-500/50 text-xs font-bold transition-all duration-300 shadow-sm cursor-pointer group ${
              isCollapsed ? 'px-0 justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform text-rose-300 group-hover:text-rose-200" />
            {!isCollapsed && <span>Sign Out Workspace</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto text-slate-100">
          {children}
        </main>
      </div>

      {/* Theme Selection Modal */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`relative w-full max-w-md p-6 rounded-2xl bg-[#091815] border ${selectedTheme.accentBorder} shadow-2xl space-y-5 text-slate-100`}>
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Switch Theme Color</h3>
                <p className="text-xs text-slate-300">Select a color theme for your entire dashboard</p>
              </div>
              <button
                onClick={() => setIsThemeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-black/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {THEMES.map((theme) => {
                const isSelected = selectedTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setSelectedTheme(theme);
                      setIsThemeModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group ${
                      isSelected
                        ? `bg-[#0d2a23] border-cyan-400/80 ring-1 ring-cyan-400/50 shadow-lg`
                        : `bg-black/40 border-slate-800 hover:bg-[#0d2a23]/60 hover:border-slate-600`
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className="w-8 h-8 rounded-full border border-white/30 shadow-inner shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${theme.circleColors.join(', ')})`,
                        }}
                      />
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {theme.name}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}