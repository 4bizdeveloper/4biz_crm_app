'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, ArrowRight, Megaphone, ShoppingCart, Wallet, Settings2 } from 'lucide-react';

type Department = { id:string; code:string; name:string; description?:string; department_modules?: {id:string;module_key:string;module_name:string;description?:string;is_enabled:boolean}[] };
const icons: Record<string, typeof Building2> = { HR: Users, 'Finance & Accounting': Wallet, Marketing: Megaphone, Sales: ShoppingCart, Operations: Settings2 };
const routes: Record<string,string> = { HR:'/dashboard/hr', 'Finance & Accounting':'/dashboard/finance', Marketing:'/dashboard/marketing', Sales:'/dashboard/sales', Operations:'/dashboard/operations' };

export default function DepartmentsPage(){
 const [departments,setDepartments]=useState<Department[]>([]); const [loading,setLoading]=useState(true);
 useEffect(()=>{fetch('/api/departments').then(r=>r.json()).then(j=>setDepartments(j.data??[])).finally(()=>setLoading(false));},[]);
 return <main className="p-6 space-y-6"><header><div className="flex items-center gap-3"><Building2 className="text-teal-600"/><div><h1 className="text-2xl font-extrabold">Department Center</h1><p className="text-sm text-slate-500">Centralized workspace for HR, Finance, Marketing, Sales and Operations.</p></div></div></header>
 {loading?<div className="bg-white border rounded-2xl p-8">Loading departments…</div>:<div className="grid xl:grid-cols-2 gap-5">{departments.map(d=>{const Icon=icons[d.name]??Building2;return <section key={d.id} className="bg-white border rounded-2xl p-5 shadow-sm"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center"><Icon className="text-teal-600"/></div><div className="flex-1"><div className="flex items-center justify-between"><div><h2 className="font-bold text-lg">{d.name}</h2><p className="text-xs text-slate-500 mt-1">{d.description}</p></div>{routes[d.name]&&<Link href={routes[d.name]} className="flex items-center gap-1 text-xs font-bold text-teal-700">Open <ArrowRight className="w-3 h-3"/></Link>}</div><div className="grid md:grid-cols-3 gap-2 mt-4">{(d.department_modules??[]).filter(m=>m.is_enabled).map(m=><div key={m.id} className="rounded-xl border bg-slate-50 p-3"><b className="text-xs">{m.module_name}</b><p className="text-[11px] text-slate-500 mt-1">{m.description}</p></div>)}</div></div></div></section>})}</div>}
 </main>;
}
