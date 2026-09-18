'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Role, RoleType } from '@/types/crm';
import { LayoutDashboard, Target, FolderKanban, Ticket, LogOut, Menu, X, User, Shield, Briefcase, Users, PanelLeftClose, PanelLeftOpen, Bell, Search, Megaphone, DollarSign, Cog, ListTodo, Building2 } from 'lucide-react';

interface ActiveUser { id:string; name:string; email:string; role:RoleType; department:'HR'|'Finance'|'Marketing'|'Sales'|'Operations'|null; }

export default function DashboardLayout({children}:{children:React.ReactNode}){
 const pathname=usePathname(); const router=useRouter();
 const [isMounted,setIsMounted]=useState(false),[mobileMenuOpen,setMobileMenuOpen]=useState(false),[loadingUser,setLoadingUser]=useState(true);
 const [user,setUser]=useState<ActiveUser>({id:'',name:'',email:'',role:Role.EMPLOYEE,department:null});
 const [sidebarWidth,setSidebarWidth]=useState(288),[isCollapsed,setIsCollapsed]=useState(false),[isResizing,setIsResizing]=useState(false);
 const MIN_WIDTH=220,MAX_WIDTH=450,COLLAPSED_WIDTH=80;
 useEffect(()=>{setIsMounted(true);(async()=>{try{const r=await fetch('/api/auth/me',{cache:'no-store'});if(!r.ok){router.replace('/login');return;}const d=await r.json();setUser({id:d.employeeId||'super-admin',name:d.isAdmin?'Super Admin':'',email:'',role:d.isAdmin?Role.ADMIN:(d.userRole==='DeptHead'||d.userRole==='Admin'||d.userRole==='Manager'?Role.MANAGER:Role.EMPLOYEE),department:d.department||null});}finally{setLoadingUser(false)}})()},[router]);
 const startResizing=useCallback((e:React.MouseEvent)=>{e.preventDefault();if(!isCollapsed)setIsResizing(true)},[isCollapsed]); const stopResizing=useCallback(()=>setIsResizing(false),[]); const resize=useCallback((e:MouseEvent)=>{if(isResizing)setSidebarWidth(Math.max(MIN_WIDTH,Math.min(MAX_WIDTH,e.clientX)))},[isResizing]);
 useEffect(()=>{if(isResizing){window.addEventListener('mousemove',resize);window.addEventListener('mouseup',stopResizing)}return()=>{window.removeEventListener('mousemove',resize);window.removeEventListener('mouseup',stopResizing)}},[isResizing,resize,stopResizing]);
 const handleLogout=async()=>{await fetch('/api/auth/logout',{method:'POST'});router.replace('/login');router.refresh()};
 const isAdmin=user.role===Role.ADMIN,isManager=user.role===Role.MANAGER;
 const menuItems=[
  {name:'Overview',path:'/dashboard/overview',icon:LayoutDashboard,roles:[Role.ADMIN,Role.MANAGER,Role.EMPLOYEE]},
  {name:'Leads Management',path:'/dashboard/leads',icon:Target,roles:[Role.ADMIN,Role.MANAGER,Role.EMPLOYEE]},
  {name:'Sales Pipeline',path:'/dashboard/sales',icon:Target,roles:[Role.ADMIN,Role.MANAGER,Role.EMPLOYEE]},
  {name:'Marketing',path:'/dashboard/marketing',icon:Megaphone,roles:[Role.ADMIN,Role.MANAGER,Role.EMPLOYEE]},
  {name:'Department Center',path:'/dashboard/departments',icon:Building2,roles:[Role.ADMIN,Role.MANAGER]},
  {name:'Department Tasks',path:'/dashboard/tasks',icon:ListTodo,roles:[Role.ADMIN,Role.MANAGER,Role.EMPLOYEE]},
  {name:'Finance',path:'/dashboard/finance',icon:DollarSign,roles:[Role.ADMIN,Role.MANAGER,Role.EMPLOYEE]},
  {name:'Operations',path:'/dashboard/operations',icon:Cog,roles:[Role.ADMIN,Role.MANAGER,Role.EMPLOYEE]},
  {name:'HR & Staff',path:'/dashboard/hr',icon:Users,roles:[Role.ADMIN,Role.MANAGER]},
  {name:'IT Projects',path:'/dashboard/projects',icon:FolderKanban,roles:[Role.ADMIN,Role.MANAGER,Role.EMPLOYEE]},
  {name:'Service Tickets',path:'/dashboard/tickets',icon:Ticket,roles:[Role.ADMIN,Role.MANAGER,Role.EMPLOYEE]},
  {name:'User Management',path:'/dashboard/users',icon:Users,roles:[Role.ADMIN,Role.MANAGER]}
 ];
 const filteredMenuItems=menuItems.filter(i=>i.roles.includes(user.role));
 const roleInfo=isAdmin?{label:'Super Admin',sub:'Full System Control',icon:Shield}:isManager?{label:user.department?`${user.department} Admin`:'Department Admin',sub:'Department-wide Control',icon:Briefcase}:{label:user.department?`${user.department} Employee`:'Employee',sub:'Assigned Work Only',icon:User};
 const RoleIcon=roleInfo.icon,currentSidebarWidth=isCollapsed?COLLAPSED_WIDTH:sidebarWidth;
 if(loadingUser)return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-500">Loading workspace…</div>;
 return <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col lg:flex-row antialiased"><header className="lg:hidden sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-3"><Image src="/logo.png" alt="Company Logo" width={36} height={36}/><b>4Biz CRM</b></div><button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation">{mobileMenuOpen?<X/>:<Menu/>}</button></header>{mobileMenuOpen&&<div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40" onClick={()=>setMobileMenuOpen(false)}/>}<aside style={{width:isMounted&&window.innerWidth>=1024?`${currentSidebarWidth}px`:undefined}} className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white flex flex-col border-r shadow-md transition-transform ${mobileMenuOpen?'translate-x-0 w-72':'-translate-x-full lg:translate-x-0'} ${isResizing?'select-none':''}`}>{!isCollapsed&&<div onMouseDown={startResizing} className="hidden lg:block absolute top-0 right-0 w-2 h-full cursor-col-resize"/>}<div className="p-5 border-b flex items-center gap-3"><Image src="/logo.png" alt="Company Logo" width={40} height={40}/>{!isCollapsed&&<div><b className="text-lg">4Biz <span className="text-teal-600">CRM</span></b><div className="text-[10px] uppercase text-teal-700">Enterprise Suite</div></div>}<button className="ml-auto hidden lg:block" onClick={()=>setIsCollapsed(!isCollapsed)} aria-label="Collapse sidebar">{isCollapsed?<PanelLeftOpen/>:<PanelLeftClose/>}</button></div><div className="p-4"><div className="p-3 rounded-xl bg-slate-50 border flex items-center gap-3"><RoleIcon className="text-teal-600"/>{!isCollapsed&&<div><b className="text-xs">{roleInfo.label}</b><div className="text-[10px] text-slate-500">{roleInfo.sub}</div></div>}</div></div><nav className="p-4 space-y-1 flex-1 overflow-y-auto">{filteredMenuItems.map(item=>{const Icon=item.icon,isActive=pathname===item.path;return <Link key={item.path} href={item.path} onClick={()=>setMobileMenuOpen(false)} title={isCollapsed?item.name:undefined} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${isCollapsed?'justify-center':''} ${isActive?'bg-teal-600 text-white':'hover:bg-slate-100'}`}><Icon className="w-4 h-4"/>{!isCollapsed&&item.name}</Link>})}</nav><div className="p-4 border-t"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold"><LogOut className="w-4 h-4 text-rose-600"/>{!isCollapsed&&'Sign Out Workspace'}</button></div></aside><div className="flex-1 min-w-0 min-h-screen"><header className="hidden lg:flex sticky top-0 z-30 bg-white border-b px-6 py-3 items-center"><div className="flex items-center bg-slate-100 rounded-xl px-3 py-2 w-80"><Search className="w-4 h-4 text-slate-400 mr-2"/><input placeholder="Search leads, departments, employees..." className="bg-transparent outline-none text-xs w-full"/></div><div className="ml-auto"><Bell className="w-5 h-5 text-slate-500"/></div></header>{children}</div></div>;
}
