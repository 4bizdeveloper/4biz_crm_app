'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart3,
  Users,
  FolderKanban,
  Ticket,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  Workflow,
  Calendar,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Zap,
  Briefcase
} from 'lucide-react';

// Custom SVG Donut Diagram Component
function ModernDonutChart({
  data,
  total,
}: {
  data: { label: string; value: number; color: string }[];
  total: number;
}) {
  const size = 160;
  const strokeWidth = 24;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  if (total === 0) {
    return (
      <div className="relative flex items-center justify-center w-40 h-40">
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-slate-100"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </svg>
        <span className="absolute text-xs text-slate-400 font-medium">No Data</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center w-40 h-40 shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, index) => {
          const percentage = item.value / total;
          const strokeDashoffset = circumference - percentage * circumference;
          const rotation = accumulatedAngle;
          accumulatedAngle += percentage * 360;

          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transformOrigin: 'center',
                transform: `rotate(${rotation}deg)`,
                transition: 'stroke-dashoffset 0.8s ease-in-out, transform 0.8s ease-in-out',
              }}
            />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{total}</span>
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total</span>
      </div>
    </div>
  );
}

interface OverviewStats {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  activeProjects: number;
  projectsByStatus: Record<string, number>;
  openTickets: number;
  ticketsByPriority: Record<string, number>;
  totalEmployees: number;
  employeesByDept: Record<string, number>;
  recentActivities: { title: string; time: string; type: string }[];
}

export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats>({
    totalLeads: 0,
    leadsByStatus: {},
    activeProjects: 0,
    projectsByStatus: {},
    openTickets: 0,
    ticketsByPriority: {},
    totalEmployees: 0,
    employeesByDept: {},
    recentActivities: [],
  });

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'weekly' | 'monthly' | 'annually' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);

    const [leadsRes, projectsRes, ticketsRes, employeesRes] = await Promise.all([
      supabase.from('leads').select('id, name, status, created_at'),
      supabase.from('projects').select('id, project_name, status, created_at'),
      supabase.from('tickets').select('id, title, priority, status, created_at'),
      supabase.from('employees').select('id, full_name, department, status, joined_date'),
    ]);

    let leads = leadsRes.data || [];
    let projects = projectsRes.data || [];
    let tickets = ticketsRes.data || [];
    let employees = employeesRes.data || [];

    // Date Range Filtering Logic
    const filterByDate = (items: any[], dateField: string = 'created_at') => {
      if (dateRange === 'all') return items;
      const now = new Date();

      return items.filter((item) => {
        if (!item[dateField]) return true;
        const itemDate = new Date(item[dateField]);

        if (dateRange === 'weekly') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return itemDate >= oneWeekAgo;
        }
        if (dateRange === 'monthly') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        if (dateRange === 'annually') {
          return itemDate.getFullYear() === now.getFullYear();
        }
        if (dateRange === 'custom') {
          if (!startDate || !endDate) return true;
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }
        return true;
      });
    };

    leads = filterByDate(leads);
    projects = filterByDate(projects);
    tickets = filterByDate(tickets);
    employees = filterByDate(employees, 'joined_date');

    // Calculate Lead status distribution
    const leadsByStatus = leads.reduce((acc, curr) => {
      const st = curr.status || 'New';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate Project status distribution & active count
    const projectsByStatus = projects.reduce((acc, curr) => {
      const st = curr.status || 'Planning';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeProjects = projects.filter((p) => p.status !== 'Completed').length;

    // Calculate Open Tickets and Priority breakdown
    const openTicketsList = tickets.filter(
      (t) => t.status !== 'Closed' && t.status !== 'Resolved'
    );
    const ticketsByPriority = openTicketsList.reduce((acc, curr) => {
      const prio = curr.priority || 'Medium';
      acc[prio] = (acc[prio] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate Staff distribution
    const activeEmployees = employees.filter((e) => e.status === 'Active');
    const employeesByDept = activeEmployees.reduce((acc, curr) => {
      const dept = curr.department || 'Engineering';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent Operations Timeline Build
    const recentActivities = [
      ...leads.slice(0, 3).map((l) => ({
        title: `New Lead: ${l.name}`,
        time: new Date(l.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Lead',
      })),
      ...projects.slice(0, 3).map((p) => ({
        title: `Project: ${p.project_name}`,
        time: new Date(p.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Project',
      })),
      ...tickets.slice(0, 3).map((t) => ({
        title: `Ticket: ${t.title}`,
        time: new Date(t.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Ticket',
      })),
    ].slice(0, 5);

    setStats({
      totalLeads: leads.length,
      leadsByStatus,
      activeProjects,
      projectsByStatus,
      openTickets: openTicketsList.length,
      ticketsByPriority,
      totalEmployees: activeEmployees.length,
      employeesByDept,
      recentActivities,
    });

    setLoading(false);
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Donut chart color setup for Leads & Operations
  const leadDonutData = useMemo(() => {
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    const keys = Object.keys(stats.leadsByStatus);
    return keys.map((key, idx) => ({
      label: key,
      value: stats.leadsByStatus[key],
      color: palette[idx % palette.length],
    }));
  }, [stats.leadsByStatus]);

  const projectStatusList = ['Planning', 'In Progress', 'Testing', 'On Hold', 'Completed'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12">
      {/* Dynamic Header Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-12 -right-12 w-60 h-60 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-600 font-semibold text-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Unified Executive Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Operations & Technical Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Real-time pipeline analytics, project lifecycle metrics, support desk workload, and operational throughput.
          </p>
        </div>

        <button
          onClick={fetchOverviewData}
          className="relative z-10 self-start md:self-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Timeline Filter:</span>
          
          <div className="flex flex-wrap bg-slate-100/80 p-1 rounded-2xl text-xs font-medium">
            {(['all', 'weekly', 'monthly', 'annually', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3.5 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  dateRange === r
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'all' ? 'All Time' : r}
              </button>
            ))}
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
            <input
              type="date"
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-400 font-bold">to</span>
            <input
              type="date"
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* High Impact KPI Cards (Ultra-Modern Gradients) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Leads */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Acquisition</span>
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-sm">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalLeads}</h3>
            <span className="text-xs font-bold text-blue-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Inquiries & converted leads</p>
        </div>

        {/* KPI 2: Active Projects */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Deliveries</span>
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-2xl shadow-sm">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.activeProjects}</h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <Zap className="w-3.5 h-3.5 mr-0.5" /> Operations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Planning, active or in QA</p>
        </div>

        {/* KPI 3: Open Tickets */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Desk SLA</span>
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 text-white rounded-2xl shadow-sm">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.openTickets}</h3>
            <span className="text-xs font-bold text-amber-600 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-0.5" /> Active Desk
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Pending client resolutions</p>
        </div>

        {/* KPI 4: Active Workforce */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engineering Staff</span>
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-sm">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalEmployees}</h3>
            <span className="text-xs font-bold text-purple-600 flex items-center">
              <Briefcase className="w-3.5 h-3.5 mr-0.5" /> Allocated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Active IT specialists</p>
        </div>
      </div>

      {/* Operational Workflow Architecture Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Workflow className="w-4 h-4" />
            </div>
            End-to-End Enterprise Delivery Pipeline
          </h2>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Operational Lifecycle
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/60 to-slate-50 border border-blue-100 flex flex-col items-center text-center space-y-1 hover:border-blue-300 transition-all">
            <Target className="w-6 h-6 text-blue-600 mb-1" />
            <span className="font-bold text-sm text-slate-900">1. Acquisition</span>
            <span className="text-[11px] text-slate-500">Capture & classify inquiries</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-50/60 to-slate-50 border border-indigo-100 flex flex-col items-center text-center space-y-1 hover:border-indigo-300 transition-all">
            <Users className="w-6 h-6 text-indigo-600 mb-1" />
            <span className="font-bold text-sm text-slate-900">2. Staff Allocation</span>
            <span className="text-[11px] text-slate-500">Assign leads & tech teams</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/60 to-slate-50 border border-emerald-100 flex flex-col items-center text-center space-y-1 hover:border-emerald-300 transition-all">
            <FolderKanban className="w-6 h-6 text-emerald-600 mb-1" />
            <span className="font-bold text-sm text-slate-900">3. Execution</span>
            <span className="text-[11px] text-slate-500">Milestone builds & releases</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-50/60 to-slate-50 border border-amber-100 flex flex-col items-center text-center space-y-1 hover:border-amber-300 transition-all">
            <Ticket className="w-6 h-6 text-amber-600 mb-1" />
            <span className="font-bold text-sm text-slate-900">4. Support SLA</span>
            <span className="text-[11px] text-slate-500">Maintain & resolve tickets</span>
          </div>
        </div>
      </div>

      {/* Modern Analytics Section (Donut Chart & Horizontal Bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Circle Diagram: Lead Pipeline Distribution */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BarChart3 className="w-4 h-4" />
                </div>
                Lead Pipeline breakdown
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
              <ModernDonutChart data={leadDonutData} total={stats.totalLeads} />

              <div className="space-y-2 w-full sm:w-auto">
                {leadDonutData.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700">{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Interactive Lead flow tracking synchronized with CRM database.</span>
          </div>
        </div>

        {/* Project Lifecycle Graph */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Activity className="w-4 h-4" />
                </div>
                Project Delivery Lifecycle Analytics
              </h2>
            </div>

            <div className="space-y-4 pt-2">
              {projectStatusList.map((status) => {
                const count = stats.projectsByStatus[status] || 0;
                const maxCount = Math.max(...Object.values(stats.projectsByStatus), 1);
                const percentage = Math.round((count / maxCount) * 100);

                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{status}</span>
                      <span className="text-slate-900 font-bold">{count} Projects</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-700 shadow-xs"
                        style={{ width: `${Math.max(percentage, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Real-time milestone tracking</span>
            <span className="font-semibold text-emerald-600">{stats.activeProjects} Active Works</span>
          </div>
        </div>
      </div>

      {/* Support Ticket Priorities & Live Operations Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Support Tickets Breakdown */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
              Incident Support Tickets by Priority
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/30 rounded-2xl border border-red-200/60 flex flex-col justify-between">
              <span className="text-[11px] font-extrabold text-red-700 uppercase tracking-wider">Urgent SLA</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-red-900">
                  {stats.ticketsByPriority['Urgent'] || 0}
                </span>
                <Clock className="w-5 h-5 text-red-500" />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/30 rounded-2xl border border-orange-200/60 flex flex-col justify-between">
              <span className="text-[11px] font-extrabold text-orange-700 uppercase tracking-wider">High Priority</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-orange-900">
                  {stats.ticketsByPriority['High'] || 0}
                </span>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl border border-blue-200/60 flex flex-col justify-between">
              <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider">Medium</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-blue-900">
                  {stats.ticketsByPriority['Medium'] || 0}
                </span>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Low</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-slate-900">
                  {stats.ticketsByPriority['Low'] || 0}
                </span>
                <CheckCircle2 className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Operational Activity Log */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
                Recent Activity Log
              </h2>
            </div>

            <div className="space-y-3">
              {stats.recentActivities.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No recent operational activity recorded.</p>
              ) : (
                stats.recentActivities.map((act, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-xs font-semibold text-slate-800">{act.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                      {act.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400 font-medium">Auto-updated via Supabase Realtime</span>
          </div>
        </div>
      </div>

      {/* Staff Department Allocation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            Department Work Force Distribution
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {Object.entries(stats.employeesByDept).map(([dept, count]) => (
            <div
              key={dept}
              className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/20 border border-slate-200/60 hover:border-indigo-300 transition-all"
            >
              <span className="text-xs font-semibold text-slate-500 block truncate">{dept}</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{count} Staff</span>
            </div>
          ))}

          {Object.keys(stats.employeesByDept).length === 0 && (
            <div className="text-xs text-slate-400 italic col-span-4">No active department allocations found.</div>
          )}
        </div>
      </div>
    </div>
  );
}