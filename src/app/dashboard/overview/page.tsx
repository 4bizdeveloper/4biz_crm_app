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
            className="stroke-[#132a2f]"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </svg>
        <span className="absolute text-xs text-[#527d7d] font-medium">No Data</span>
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
        <span className="text-2xl font-extrabold text-[#e2f3f3] tracking-tight">{total}</span>
        <span className="text-[10px] font-bold uppercase text-[#527d7d] tracking-wider">Total</span>
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

  // Donut chart color setup tailored for dark teal palette
  const leadDonutData = useMemo(() => {
    const palette = ['#4fd1c5', '#38b2ac', '#319795', '#2b6cb0', '#dd6b20', '#3182ce'];
    const keys = Object.keys(stats.leadsByStatus);
    return keys.map((key, idx) => ({
      label: key,
      value: stats.leadsByStatus[key],
      color: palette[idx % palette.length],
    }));
  }, [stats.leadsByStatus]);

  const projectStatusList = ['Planning', 'In Progress', 'Testing', 'On Hold', 'Completed'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12 text-[#b0c4c4] bg-[#071317] p-6 rounded-3xl min-h-screen">
      {/* Dynamic Header Section */}
      <div className="bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-12 -right-12 w-60 h-60 bg-gradient-to-br from-[#1cd2ad]/10 via-[#27535b]/20 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16363d] border border-[#23535d] text-[#2dd4bf] font-semibold text-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#2dd4bf] animate-pulse" />
            <span>Unified Executive Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f0fdfa] tracking-tight flex items-center gap-3">
            Operations & Technical Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#81a3a3] mt-1 max-w-xl leading-relaxed">
            Real-time pipeline analytics, project lifecycle metrics, support desk workload, and operational throughput.
          </p>
        </div>

        <button
          onClick={fetchOverviewData}
          className="relative z-10 self-start md:self-auto bg-[#173a42] hover:bg-[#1e4852] text-[#e2f3f3] border border-[#2b5d69] text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#2dd4bf] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-[#0e2126] p-4 rounded-3xl border border-[#1a383f] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 bg-[#17383f] text-[#2dd4bf] rounded-xl border border-[#25525d]">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-[#81a3a3] uppercase tracking-wider">Timeline Filter:</span>
          
          <div className="flex flex-wrap bg-[#08171b] p-1 rounded-2xl border border-[#16343b] text-xs font-medium">
            {(['all', 'weekly', 'monthly', 'annually', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3.5 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  dateRange === r
                    ? 'bg-[#1b434c] text-[#f0fdfa] border border-[#2b6471] shadow-xs font-bold'
                    : 'text-[#81a3a3] hover:text-[#f0fdfa]'
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
              className="p-2 border border-[#234d57] rounded-xl bg-[#08171b] text-[#e2f3f3] focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-[#527d7d] font-bold">to</span>
            <input
              type="date"
              className="p-2 border border-[#234d57] rounded-xl bg-[#08171b] text-[#e2f3f3] focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* High Impact KPI Cards (Ultra-Modern Dark Teal Gradients) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Leads */}
        <div className="bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl relative overflow-hidden group hover:border-[#2b616d] transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#2dd4bf]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#81a3a3] uppercase tracking-wider">Lead Acquisition</span>
            <div className="p-2.5 bg-[#173a42] text-[#2dd4bf] rounded-2xl border border-[#23535d] shadow-sm">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-[#f0fdfa] tracking-tight">{stats.totalLeads}</h3>
            <span className="text-xs font-bold text-[#2dd4bf] flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Pipeline
            </span>
          </div>
          <p className="text-xs text-[#527d7d] mt-1 font-medium">Inquiries & converted leads</p>
        </div>

        {/* KPI 2: Active Projects */}
        <div className="bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl relative overflow-hidden group hover:border-[#2b616d] transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#10b981]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#81a3a3] uppercase tracking-wider">Active Deliveries</span>
            <div className="p-2.5 bg-[#143632] text-[#34d399] rounded-2xl border border-[#1f544e] shadow-sm">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-[#f0fdfa] tracking-tight">{stats.activeProjects}</h3>
            <span className="text-xs font-bold text-[#34d399] flex items-center">
              <Zap className="w-3.5 h-3.5 mr-0.5" /> Operations
            </span>
          </div>
          <p className="text-xs text-[#527d7d] mt-1 font-medium">Planning, active or in QA</p>
        </div>

        {/* KPI 3: Open Tickets */}
        <div className="bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl relative overflow-hidden group hover:border-[#2b616d] transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#f59e0b]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#81a3a3] uppercase tracking-wider">Service Desk SLA</span>
            <div className="p-2.5 bg-[#362a14] text-[#fbbf24] rounded-2xl border border-[#52411f] shadow-sm">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-[#f0fdfa] tracking-tight">{stats.openTickets}</h3>
            <span className="text-xs font-bold text-[#fbbf24] flex items-center">
              <Clock className="w-3.5 h-3.5 mr-0.5" /> Active Desk
            </span>
          </div>
          <p className="text-xs text-[#527d7d] mt-1 font-medium">Pending client resolutions</p>
        </div>

        {/* KPI 4: Active Workforce */}
        <div className="bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl relative overflow-hidden group hover:border-[#2b616d] transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#8b5cf6]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#81a3a3] uppercase tracking-wider">Engineering Staff</span>
            <div className="p-2.5 bg-[#251a38] text-[#a78bfa] rounded-2xl border border-[#3c2a59] shadow-sm">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-[#f0fdfa] tracking-tight">{stats.totalEmployees}</h3>
            <span className="text-xs font-bold text-[#a78bfa] flex items-center">
              <Briefcase className="w-3.5 h-3.5 mr-0.5" /> Allocated
            </span>
          </div>
          <p className="text-xs text-[#527d7d] mt-1 font-medium">Active IT specialists</p>
        </div>
      </div>

      {/* Operational Workflow Architecture Banner */}
      <div className="bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#18363d] pb-4">
          <h2 className="text-base font-extrabold text-[#f0fdfa] flex items-center gap-2">
            <div className="p-2 bg-[#17383f] text-[#2dd4bf] rounded-xl border border-[#25525d]">
              <Workflow className="w-4 h-4" />
            </div>
            End-to-End Enterprise Delivery Pipeline
          </h2>
          <span className="text-[11px] font-bold text-[#2dd4bf] bg-[#16363d] border border-[#23535d] px-3 py-1 rounded-full uppercase tracking-wider">
            Operational Lifecycle
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-[#0a181c] border border-[#183a42] flex flex-col items-center text-center space-y-1 hover:border-[#275d69] transition-all">
            <Target className="w-6 h-6 text-[#2dd4bf] mb-1" />
            <span className="font-bold text-sm text-[#e2f3f3]">1. Acquisition</span>
            <span className="text-[11px] text-[#81a3a3]">Capture & classify inquiries</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a181c] border border-[#183a42] flex flex-col items-center text-center space-y-1 hover:border-[#275d69] transition-all">
            <Users className="w-6 h-6 text-[#38b2ac] mb-1" />
            <span className="font-bold text-sm text-[#e2f3f3]">2. Staff Allocation</span>
            <span className="text-[11px] text-[#81a3a3]">Assign leads & tech teams</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a181c] border border-[#183a42] flex flex-col items-center text-center space-y-1 hover:border-[#275d69] transition-all">
            <FolderKanban className="w-6 h-6 text-[#34d399] mb-1" />
            <span className="font-bold text-sm text-[#e2f3f3]">3. Execution</span>
            <span className="text-[11px] text-[#81a3a3]">Milestone builds & releases</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a181c] border border-[#183a42] flex flex-col items-center text-center space-y-1 hover:border-[#275d69] transition-all">
            <Ticket className="w-6 h-6 text-[#fbbf24] mb-1" />
            <span className="font-bold text-sm text-[#e2f3f3]">4. Support SLA</span>
            <span className="text-[11px] text-[#81a3a3]">Maintain & resolve tickets</span>
          </div>
        </div>
      </div>

      {/* Modern Analytics Section (Donut Chart & Horizontal Bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Circle Diagram: Lead Pipeline Distribution */}
        <div className="lg:col-span-5 bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#18363d] pb-3 mb-4">
              <h2 className="text-base font-extrabold text-[#f0fdfa] flex items-center gap-2">
                <div className="p-2 bg-[#17383f] text-[#2dd4bf] rounded-xl border border-[#25525d]">
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
                      <span className="font-medium text-[#a0c2c2]">{item.label}</span>
                    </div>
                    <span className="font-bold text-[#f0fdfa]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#08171b] rounded-2xl border border-[#18363d] text-[11px] text-[#81a3a3] flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-[#2dd4bf] shrink-0" />
            <span>Interactive Lead flow tracking synchronized with CRM database.</span>
          </div>
        </div>

        {/* Project Lifecycle Graph */}
        <div className="lg:col-span-7 bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#18363d] pb-3 mb-4">
              <h2 className="text-base font-extrabold text-[#f0fdfa] flex items-center gap-2">
                <div className="p-2 bg-[#143632] text-[#34d399] rounded-xl border border-[#1f544e]">
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
                    <div className="flex justify-between text-xs font-semibold text-[#a0c2c2]">
                      <span>{status}</span>
                      <span className="text-[#f0fdfa] font-bold">{count} Projects</span>
                    </div>
                    <div className="w-full bg-[#08171b] rounded-full h-3 overflow-hidden p-0.5 border border-[#18363d]">
                      <div
                        className="bg-gradient-to-r from-[#1fb89a] to-[#2dd4bf] h-full rounded-full transition-all duration-700 shadow-xs"
                        style={{ width: `${Math.max(percentage, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#18363d] flex items-center justify-between text-xs text-[#527d7d]">
            <span>Real-time milestone tracking</span>
            <span className="font-semibold text-[#34d399]">{stats.activeProjects} Active Works</span>
          </div>
        </div>
      </div>

      {/* Support Ticket Priorities & Live Operations Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Support Tickets Breakdown */}
        <div className="lg:col-span-6 bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#18363d] pb-3 mb-4">
            <h2 className="text-base font-extrabold text-[#f0fdfa] flex items-center gap-2">
              <div className="p-2 bg-[#362a14] text-[#fbbf24] rounded-xl border border-[#52411f]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              Incident Support Tickets by Priority
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#231215] rounded-2xl border border-[#481c21] flex flex-col justify-between">
              <span className="text-[11px] font-extrabold text-[#f87171] uppercase tracking-wider">Urgent SLA</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-[#fca5a5]">
                  {stats.ticketsByPriority['Urgent'] || 0}
                </span>
                <Clock className="w-5 h-5 text-[#f87171]" />
              </div>
            </div>

            <div className="p-4 bg-[#291e12] rounded-2xl border border-[#523719] flex flex-col justify-between">
              <span className="text-[11px] font-extrabold text-[#fb923c] uppercase tracking-wider">High Priority</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-[#fdba74]">
                  {stats.ticketsByPriority['High'] || 0}
                </span>
                <AlertTriangle className="w-5 h-5 text-[#fb923c]" />
              </div>
            </div>

            <div className="p-4 bg-[#11242d] rounded-2xl border border-[#1e4859] flex flex-col justify-between">
              <span className="text-[11px] font-extrabold text-[#38bdf8] uppercase tracking-wider">Medium</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-[#7dd3fc]">
                  {stats.ticketsByPriority['Medium'] || 0}
                </span>
                <Activity className="w-5 h-5 text-[#38bdf8]" />
              </div>
            </div>

            <div className="p-4 bg-[#0a181c] rounded-2xl border border-[#183a42] flex flex-col justify-between">
              <span className="text-[11px] font-extrabold text-[#81a3a3] uppercase tracking-wider">Low</span>
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-[#f0fdfa]">
                  {stats.ticketsByPriority['Low'] || 0}
                </span>
                <CheckCircle2 className="w-5 h-5 text-[#527d7d]" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Operational Activity Log */}
        <div className="lg:col-span-6 bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#18363d] pb-3 mb-4">
              <h2 className="text-base font-extrabold text-[#f0fdfa] flex items-center gap-2">
                <div className="p-2 bg-[#251a38] text-[#a78bfa] rounded-xl border border-[#3c2a59]">
                  <Clock className="w-4 h-4" />
                </div>
                Recent Activity Log
              </h2>
            </div>

            <div className="space-y-3">
              {stats.recentActivities.length === 0 ? (
                <p className="text-xs text-[#527d7d] italic">No recent operational activity recorded.</p>
              ) : (
                stats.recentActivities.map((act, index) => (
                  <div
                    key={index}
                    className="p-3 bg-[#08171b] rounded-2xl border border-[#18363d] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#2dd4bf]" />
                      <span className="text-xs font-semibold text-[#e2f3f3]">{act.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#81a3a3] bg-[#0e2126] px-2 py-0.5 rounded-lg border border-[#18363d]">
                      {act.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#18363d] text-right">
            <span className="text-[11px] text-[#527d7d] font-medium">Auto-updated via Supabase Realtime</span>
          </div>
        </div>
      </div>

      {/* Staff Department Allocation */}
      <div className="bg-[#0e2126] p-6 rounded-3xl border border-[#1a383f] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#18363d] pb-3">
          <h2 className="text-base font-extrabold text-[#f0fdfa] flex items-center gap-2">
            <div className="p-2 bg-[#17383f] text-[#2dd4bf] rounded-xl border border-[#25525d]">
              <Users className="w-4 h-4" />
            </div>
            Department Work Force Distribution
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {Object.entries(stats.employeesByDept).map(([dept, count]) => (
            <div
              key={dept}
              className="p-4 rounded-2xl bg-[#0a181c] border border-[#183a42] hover:border-[#275d69] transition-all"
            >
              <span className="text-xs font-semibold text-[#81a3a3] block truncate">{dept}</span>
              <span className="text-2xl font-black text-[#f0fdfa] mt-1 block">{count} Staff</span>
            </div>
          ))}

          {Object.keys(stats.employeesByDept).length === 0 && (
            <div className="text-xs text-[#527d7d] italic col-span-4">No active department allocations found.</div>
          )}
        </div>
      </div>
    </div>
  );
}