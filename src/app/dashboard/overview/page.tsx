'use client';

import { useEffect, useState } from 'react';
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
  Workflow
} from 'lucide-react';

interface OverviewStats {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  activeProjects: number;
  projectsByStatus: Record<string, number>;
  openTickets: number;
  ticketsByPriority: Record<string, number>;
  totalEmployees: number;
  employeesByDept: Record<string, number>;
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      setLoading(true);

      const [leadsRes, projectsRes, ticketsRes, employeesRes] = await Promise.all([
        supabase.from('leads').select('status'),
        supabase.from('projects').select('status'),
        supabase.from('tickets').select('priority, status'),
        supabase.from('employees').select('department, status')
      ]);

      const leads = leadsRes.data || [];
      const projects = projectsRes.data || [];
      const tickets = ticketsRes.data || [];
      const employees = employeesRes.data || [];

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

      setStats({
        totalLeads: leads.length,
        leadsByStatus,
        activeProjects,
        projectsByStatus,
        openTickets: openTicketsList.length,
        ticketsByPriority,
        totalEmployees: activeEmployees.length,
        employeesByDept,
      });

      setLoading(false);
    };

    fetchOverviewData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading overall operations...</div>;
  }

  const projectStatusList = ['Planning', 'In Progress', 'Testing', 'On Hold', 'Completed'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Operations & Technical Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time Operational Metrics, Lead Pipelines, and Service Desk Analytics
          </p>
        </div>
      </div>

      {/* Metric Overview Cards (Revenue Removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Active Leads</span>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900">{stats.totalLeads}</h3>
          <p className="text-xs text-slate-400">Tracked in lead pipeline</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <FolderKanban className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-600">{stats.activeProjects}</h3>
          <p className="text-xs text-slate-400">In planning, progress, or testing</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Ticket className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Open Tickets</span>
          </div>
          <h3 className="text-3xl font-extrabold text-orange-600">{stats.openTickets}</h3>
          <p className="text-xs text-slate-400">Pending desk resolution</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Active Staff</span>
          </div>
          <h3 className="text-3xl font-extrabold text-indigo-600">{stats.totalEmployees}</h3>
          <p className="text-xs text-slate-400">Across IT & operations</p>
        </div>
      </div>

      {/* Operational Workflow Diagram */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Workflow className="w-5 h-5 text-blue-600" />
          End-to-End Delivery & Operational Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center pt-2">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center space-y-1">
            <Target className="w-6 h-6 text-blue-600 mb-1" />
            <span className="font-bold text-sm text-slate-800">1. Lead Acquisition</span>
            <span className="text-xs text-slate-500">Capture & qualify client needs</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center space-y-1">
            <Users className="w-6 h-6 text-indigo-600 mb-1" />
            <span className="font-bold text-sm text-slate-800">2. Staff Allocation</span>
            <span className="text-xs text-slate-500">Assign tech leads & resources</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center space-y-1">
            <FolderKanban className="w-6 h-6 text-emerald-600 mb-1" />
            <span className="font-bold text-sm text-slate-800">3. Project Execution</span>
            <span className="text-xs text-slate-500">Plan, build & release solutions</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center space-y-1">
            <Ticket className="w-6 h-6 text-amber-600 mb-1" />
            <span className="font-bold text-sm text-slate-800">4. Support & Desk SLA</span>
            <span className="text-xs text-slate-500">Maintain & resolve incident tickets</span>
          </div>
        </div>
      </div>

      {/* Operations Analytics: Graphs & Diagrams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Delivery Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Activity className="w-5 h-5 text-emerald-600" />
            Project Lifecycle Status Graph
          </h2>
          <div className="space-y-3 pt-2">
            {projectStatusList.map((status) => {
              const count = stats.projectsByStatus[status] || 0;
              const maxCount = Math.max(...Object.values(stats.projectsByStatus), 1);
              const percentage = Math.round((count / maxCount) * 100);

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{status}</span>
                    <span>{count} projects</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Ticket Priority Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Open Incident Tickets by Priority
          </h2>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-red-700 uppercase">Urgent</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-red-800">
                  {stats.ticketsByPriority['Urgent'] || 0}
                </span>
                <Clock className="w-4 h-4 text-red-500" />
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-orange-700 uppercase">High</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-orange-800">
                  {stats.ticketsByPriority['High'] || 0}
                </span>
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase">Medium</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-blue-800">
                  {stats.ticketsByPriority['Medium'] || 0}
                </span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">Low</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-slate-800">
                  {stats.ticketsByPriority['Low'] || 0}
                </span>
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Distribution Analytics */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Users className="w-5 h-5 text-indigo-600" />
          Department Staff Distribution
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {Object.entries(stats.employeesByDept).map(([dept, count]) => (
            <div key={dept} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-medium text-slate-500 block truncate">{dept}</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{count} Staff</span>
            </div>
          ))}
          {Object.keys(stats.employeesByDept).length === 0 && (
            <div className="text-xs text-slate-400 italic">No department data recorded</div>
          )}
        </div>
      </div>
    </div>
  );
}