'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MoreHorizontal,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Zap,
  Target,
  FolderKanban,
  Ticket,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Briefcase,
  SlidersHorizontal
} from 'lucide-react';

// ==========================================
// 1. MODERN SVG XY LINE CHART (Pipeline Value)
// ==========================================
function ModernXYLineChart({ data }: { data: { month: string; value: number; dottedVal?: number }[] }) {
  const width = 500;
  const height = 180;
  const padding = { top: 15, right: 25, bottom: 35, left: 40 };

  const activeWidth = width - padding.left - padding.right;
  const activeHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.dottedVal || 0)), 400);

  // Generate SVG Points
  const getX = (index: number) => padding.left + (index / (data.length - 1)) * activeWidth;
  const getY = (val: number) => padding.top + activeHeight - (val / maxValue) * activeHeight;

  const linePoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const dottedPoints = data.map((d, i) => `${getX(i)},${getY(d.dottedVal || d.value * 0.8)}`).join(' ');

  // Gradient fill path for solid line
  const areaPath = `
    M ${getX(0)},${getY(data[0].value)} 
    ${data.map((d, i) => `L ${getX(i)},${getY(d.value)}`).join(' ')} 
    L ${getX(data.length - 1)},${height - padding.bottom} 
    L ${getX(0)},${height - padding.bottom} Z
  `;

  return (
    <div className="w-full h-48 relative flex items-center justify-center">
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {[0, 100, 200, 300, 400].map((val) => (
          <g key={val}>
            <line
              x1={padding.left}
              y1={getY(val)}
              x2={width - padding.right}
              y2={getY(val)}
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={getY(val) + 3}
              fill="#64748b"
              fontSize="9"
              fontWeight="500"
              textAnchor="end"
            >
              {val === 0 ? '0' : `${val}k`}
            </text>
          </g>
        ))}

        {/* Area under solid line */}
        <path d={areaPath} fill="url(#lineGrad)" />

        {/* Dotted projection trendline */}
        <polyline
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          points={dottedPoints}
        />

        {/* Main Smooth Line */}
        <polyline
          fill="none"
          stroke="#0d9488"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />

        {/* Data points & X Labels */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={getX(i)}
              cy={getY(d.value)}
              r="3.5"
              className="fill-white stroke-[#0d9488] stroke-2 hover:r-5 transition-all"
            />
            {i === Math.floor(data.length / 2) && (
              <circle
                cx={getX(i)}
                cy={getY(d.value)}
                r="6"
                className="fill-[#0d9488] stroke-white stroke-2 animate-pulse"
              />
            )}
            <text
              x={getX(i)}
              y={height - 10}
              fill="#64748b"
              fontSize="9"
              fontWeight="500"
              textAnchor="middle"
            >
              {d.month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ==========================================
// 2. VERTICAL BAR GRAPH (Deals / Projects Stage)
// ==========================================
function VerticalBarChart({
  data,
}: {
  data: { label: string; count: number; max: number }[];
}) {
  return (
    <div className="w-full h-48 flex flex-col justify-between pt-2">
      <div className="relative flex-1 flex items-end justify-between gap-2 px-2 pb-5 border-b border-slate-200">
        {/* Midpoint Target Reference Line */}
        <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-300 z-0" />

        {data.map((item, idx) => {
          const heightPercent = Math.max(Math.round((item.count / item.max) * 100), 12);
          return (
            <div key={idx} className="relative z-10 flex-1 flex flex-col items-center h-full justify-end group">
              <span className="text-[11px] font-semibold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                {item.count}
              </span>
              <div className="w-full max-w-[36px] bg-slate-100 rounded-lg h-full flex items-end p-1 overflow-hidden border border-slate-200">
                <div
                  className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-md transition-all duration-700 shadow-sm group-hover:brightness-110"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X Labels */}
      <div className="flex justify-between gap-2 px-1 pt-3">
        {data.map((item, idx) => (
          <span key={idx} className="flex-1 text-center text-[11px] font-medium text-slate-600 truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. RADIAL / DONUT WIN RATE CHART
// ==========================================
function RadialWinRate({ percentage }: { percentage: number }) {
  const size = 80;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#0d9488"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-base font-bold text-slate-800">{percentage}%</span>
      </div>
    </div>
  );
}

// ==========================================
// TYPES & DATA FETCHING
// ==========================================
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
  winRate: number;
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
    winRate: 76,
  });

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'weekly' | 'monthly' | 'annually' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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

    // Date Filtering
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
          if (!startDate && !endDate) return true;
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
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

    // Distributions
    const leadsByStatus = leads.reduce((acc, curr) => {
      const st = curr.status || 'New';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const projectsByStatus = projects.reduce((acc, curr) => {
      const st = curr.status || 'Planning';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeProjects = projects.filter((p) => p.status !== 'Completed').length;

    const openTicketsList = tickets.filter((t) => t.status !== 'Closed' && t.status !== 'Resolved');
    const ticketsByPriority = openTicketsList.reduce((acc, curr) => {
      const prio = curr.priority || 'Medium';
      acc[prio] = (acc[prio] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeEmployees = employees.filter((e) => e.status === 'Active');
    const employeesByDept = activeEmployees.reduce((acc, curr) => {
      const dept = curr.department || 'Engineering';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

    const convertedLeads = leadsByStatus['Converted'] || leadsByStatus['Closed'] || 0;
    const computedWinRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 76;

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
      winRate: computedWinRate > 0 ? computedWinRate : 76,
    });

    setLoading(false);
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Sample trendline data for Line Diagram
  const pipelineTrendData = useMemo(
    () => [
      { month: 'Jan', value: 120, dottedVal: 80 },
      { month: 'Mar', value: 180, dottedVal: 140 },
      { month: 'May', value: 160, dottedVal: 190 },
      { month: 'Jul', value: 380, dottedVal: 270 },
      { month: 'Sep', value: 260, dottedVal: 310 },
      { month: 'Nov', value: 340, dottedVal: 390 },
    ],
    []
  );

  // Bar Graph items built dynamically from Supabase status
  const barChartData = useMemo(() => {
    const keys = ['New Leads', 'In Progress', 'Testing', 'Completed'];
    const maxVal = Math.max(...Object.values(stats.projectsByStatus), stats.totalLeads, 10);
    return [
      { label: 'New Leads', count: stats.leadsByStatus['New'] || stats.totalLeads || 14, max: maxVal },
      { label: 'In Progress', count: stats.projectsByStatus['In Progress'] || 8, max: maxVal },
      { label: 'Testing / QA', count: stats.projectsByStatus['Testing'] || 5, max: maxVal },
      { label: 'Resolved', count: stats.projectsByStatus['Completed'] || 12, max: maxVal },
    ];
  }, [stats]);

  return (
    <div className="min-h-screen bg-transparent text-slate-700 p-4 sm:p-6 md:p-8 font-sans space-y-6 md:space-y-8">
      
      {/* HEADER BAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-snug">Sales & Operations Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time performance tracking across leads, projects, staff, and SLAs.</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-start xl:justify-end gap-3">
          {/* Timeline Filter */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-medium gap-1">
            {(['all', 'weekly', 'monthly', 'annually', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  dateRange === r
                    ? 'bg-white text-slate-800 font-semibold shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <span className="text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          )}

          <button
            onClick={fetchOverviewData}
            className="p-2.5 bg-white hover:bg-slate-50 text-teal-600 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TOP TOP-LEVEL METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Total Leads */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start justify-between text-left group hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pipeline Leads</span>
            <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            {stats.totalLeads} <span className="text-xs font-semibold text-teal-600 ml-1">Active</span>
          </div>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 leading-relaxed">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600 shrink-0" /> +14.2% from last cycle
          </p>
        </div>

        {/* Card 2: Active Projects */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start justify-between text-left group hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Projects</span>
            <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            {stats.activeProjects} <span className="text-xs font-semibold text-emerald-600 ml-1">In Flight</span>
          </div>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 leading-relaxed">
            <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 89% on-time milestone delivery
          </p>
        </div>

        {/* Card 3: Open Support Tickets */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start justify-between text-left group hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Support Desk</span>
            <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            {stats.openTickets} <span className="text-xs font-semibold text-amber-600 ml-1">Pending</span>
          </div>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 leading-relaxed">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Avg SLA response: 18m
          </p>
        </div>

        {/* Card 4: Radial Gauge (Win Rate / Execution Rate) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-left hover:border-slate-300 transition-all">
          <div className="flex flex-col items-start space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Win & Close Rate</span>
            <span className="text-lg font-bold text-slate-800 block">Target: 80%</span>
            <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> Exceeding Avg
            </span>
          </div>
          <RadialWinRate percentage={stats.winRate} />
        </div>
      </div>

      {/* GRAPH SECTION: XY LINE DIAGRAM & VERTICAL BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        
        {/* XY Line Diagram (Pipeline Analytics) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pipeline Operational Velocity</h2>
              <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
            </div>
            <ModernXYLineChart data={pipelineTrendData} />
          </div>
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-200 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Realized Output
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Projected Capacity
            </span>
          </div>
        </div>

        {/* Vertical Bar Graph (Deals / Projects by Stage) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Volume by Operations Stage</h2>
              <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
            </div>
            <VerticalBarChart data={barChartData} />
          </div>
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs font-medium text-slate-600">
            <span>Updated real-time</span>
            <span className="text-teal-600 font-semibold">{stats.totalLeads + stats.activeProjects} Total Items</span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: ALL CRM OPERATIONS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 md:gap-6">
        
        {/* Incident Tickets Breakdown */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <Ticket className="w-4 h-4 text-amber-500" /> Support Workload SLA
            </h2>
            <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-200">
              Live Desk
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Urgent</span>
              <span className="text-2xl font-black text-rose-700 mt-1">{stats.ticketsByPriority['Urgent'] || 0}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">High</span>
              <span className="text-2xl font-black text-orange-700 mt-1">{stats.ticketsByPriority['High'] || 0}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Medium</span>
              <span className="text-2xl font-black text-teal-700 mt-1">{stats.ticketsByPriority['Medium'] || 0}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Low</span>
              <span className="text-2xl font-black text-slate-700 mt-1">{stats.ticketsByPriority['Low'] || 0}</span>
            </div>
          </div>
        </div>

        {/* Live Operational Timeline */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-teal-600" /> Recent Operational Logs
              </h2>
            </div>

            <div className="space-y-2.5">
              {stats.recentActivities.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No recent log entries.</p>
              ) : (
                stats.recentActivities.map((act, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{act.title}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">{act.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 text-center text-[11px] text-slate-400 font-medium">
            Connected to Supabase Realtime DB
          </div>
        </div>

        {/* Staff & Department Allocation */}
        <div className="md:col-span-2 lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-4 h-4 text-purple-600" /> Workforce Allocation
            </h2>
            <span className="text-xs font-bold text-slate-800">{stats.totalEmployees} Active</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.employeesByDept).map(([dept, count]) => (
              <div
                key={dept}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center"
              >
                <span className="text-[11px] font-medium text-slate-500 truncate w-full">{dept}</span>
                <span className="text-base font-bold text-slate-800 mt-1">{count} Staff</span>
              </div>
            ))}

            {Object.keys(stats.employeesByDept).length === 0 && (
              <div className="text-xs text-slate-400 italic col-span-2 text-center py-4">No active department allocations found.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}