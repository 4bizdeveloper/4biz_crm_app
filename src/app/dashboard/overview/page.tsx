// src/app/dashboard/overview/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3, Users, FolderKanban, Ticket, TrendingUp } from 'lucide-react';

export default function OverviewPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    pipelineValue: 0,
    activeProjects: 0,
    openTickets: 0,
    totalEmployees: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      setLoading(true);
      
      const [leadsRes, projectsRes, ticketsRes, employeesRes] = await Promise.all([
        supabase.from('leads').select('value'),
        supabase.from('projects').select('id', { count: 'exact' }).neq('status', 'Completed'),
        supabase.from('tickets').select('id', { count: 'exact' }).neq('status', 'Closed').neq('status', 'Resolved'),
        supabase.from('employees').select('id', { count: 'exact' }).eq('status', 'Active')
      ]);

      const leads = leadsRes.data || [];
      const pipelineValue = leads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);

      setStats({
        totalLeads: leads.length,
        pipelineValue,
        activeProjects: projectsRes.count || 0,
        openTickets: ticketsRes.count || 0,
        totalEmployees: employeesRes.count || 0,
      });

      setLoading(false);
    };

    fetchOverviewData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading overall operations...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            High-level metrics across all departments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Est. Pipeline Value</span>
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-600">${stats.pipelineValue.toLocaleString()}</h3>
          <p className="text-xs text-slate-400">Across {stats.totalLeads} total leads</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <FolderKanban className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
          </div>
          <h3 className="text-3xl font-extrabold text-blue-600">{stats.activeProjects}</h3>
          <p className="text-xs text-slate-400">In planning, progress, or testing</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Ticket className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Open Tickets</span>
          </div>
          <h3 className="text-3xl font-extrabold text-orange-600">{stats.openTickets}</h3>
          <p className="text-xs text-slate-400">Requiring attention</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Active Staff</span>
          </div>
          <h3 className="text-3xl font-extrabold text-indigo-600">{stats.totalEmployees}</h3>
          <p className="text-xs text-slate-400">Across all departments</p>
        </div>
      </div>
    </div>
  );
}