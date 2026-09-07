'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, PhoneCall, FileCode, X, Calendar, Download, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  contact_info?: string;
  company?: string;
  source?: string;
  campaign_name?: string;
  requirements?: string;
  notes?: string;
  status: string;
  assigned_to?: string | null;
  created_at: string;
}

export default function SalesDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Date Filter State
  const [dateRange, setDateRange] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const formatDateDDMMYYYY = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsData) setLeads(leadsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter ONLY ASSIGNED LEADS
  const assignedLeads = useMemo(() => {
    return leads.filter(
      (l) => l.assigned_to !== null && l.assigned_to !== undefined && l.assigned_to !== ''
    );
  }, [leads]);

  // Apply Date Filtering to Assigned Leads
  const filteredAssignedLeads = useMemo(() => {
    if (dateRange === 'all') return assignedLeads;

    const now = new Date();
    return assignedLeads.filter((lead) => {
      const leadDate = new Date(lead.created_at);
      if (dateRange === 'daily') {
        return leadDate.toDateString() === now.toDateString();
      }
      if (dateRange === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return leadDate >= oneWeekAgo;
      }
      if (dateRange === 'monthly') {
        return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
      }
      if (dateRange === 'custom') {
        if (!startDate || !endDate) return true;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return leadDate >= start && leadDate <= end;
      }
      return true;
    });
  }, [assignedLeads, dateRange, startDate, endDate]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);

    if (error) {
      alert(`Status update failed: ${error.message}`);
      return;
    }

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const exportCSV = () => {
    const headers = ['Lead Contact,Company,Requirements,Campaign Source,Date Created,Status\n'];
    const rows = filteredAssignedLeads
      .map((l) => {
        const contactVal = l.contact_info || l.phone || l.email || '';
        const cleanContact = contactVal.replace(/"/g, '""').replace(/\n/g, ' ');
        const cleanCompany = (l.company || '—').replace(/"/g, '""');
        const cleanReq = (l.requirements || '').replace(/"/g, '""');
        const sourceVal = l.campaign_name ? `${l.source || 'Website'} (${l.campaign_name})` : l.source || 'Website';
        const formattedDate = formatDateDDMMYYYY(l.created_at);

        return `"${l.name} - ${cleanContact}","${cleanCompany}","${cleanReq}","${sourceVal}","${formattedDate}","${l.status}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assigned_sales_leads_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const leadStatuses = ['New', 'Assigned', 'Contacted', 'Follow-up', 'Qualified', 'Converted', 'Disqualified'];

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Converted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Qualified':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Contacted':
      case 'Follow-up':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Disqualified':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 font-sans pb-12 px-3 sm:px-6 lg:px-8">
      {/* Ultra-Modern Header Bar Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-900/5 relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-600 text-xs font-bold tracking-wide uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Executive CRM Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Sales Team Dashboard
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Real-time lead distribution & high-conversion pipeline tracking
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Metric Card 1 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 flex items-center justify-between group hover:border-blue-200 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Assigned Leads</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {assignedLeads.length}
            </h3>
            <p className="text-xs font-medium text-slate-500">Active pipeline volume</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
            <UserCheck className="w-7 h-7" />
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 flex items-center justify-between group hover:border-emerald-200 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Converted Wins</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {assignedLeads.filter((l) => l.status === 'Converted').length}
            </h3>
            <p className="text-xs font-medium text-emerald-600">Successfully closed deals</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-300">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Date Filter & Control Bar Container */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-xs font-bold">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Filter By Date:</span>
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 transition-all cursor-pointer hover:bg-slate-100/80"
          >
            <option value="all">All Dates</option>
            <option value="daily">Today Only</option>
            <option value="weekly">Past 7 Days</option>
            <option value="monthly">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 text-slate-800 outline-none"
              />
              <span className="text-xs font-bold text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 text-slate-800 outline-none"
              />
            </div>
          )}
        </div>

        {/* Ultra-Modern Gradient Button */}
        <button
          onClick={exportCSV}
          className="w-full lg:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Filtered Leads (CSV)
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Assigned Deals & Lead Queue
            </h2>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
            {filteredAssignedLeads.length} Total
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
            Loading assigned sales data...
          </div>
        ) : filteredAssignedLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            No assigned leads found for this view. Select "Assigned to sales" in the Leads Directory to display them here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px] tracking-wider bg-slate-50/30">
                  <th className="py-4 px-6">Lead Contact</th>
                  <th className="py-4 px-6">Company</th>
                  <th className="py-4 px-6 max-w-xs">Requirements</th>
                  <th className="py-4 px-6">Campaign Source</th>
                  <th className="py-4 px-6">Date Created</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-sm">
                {filteredAssignedLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-slate-50/80 transition-colors duration-200 group"
                  >
                    <td className="py-4 px-6 align-top">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {lead.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                        <span className="font-medium">{lead.contact_info || lead.phone || lead.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="font-bold text-slate-800">{lead.company || '—'}</div>
                    </td>
                    <td className="py-4 px-6 align-top max-w-xs">
                      {lead.requirements ? (
                        <div 
                          onClick={() => setSelectedLead(lead)}
                          className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 line-clamp-2 cursor-pointer hover:bg-blue-50/60 hover:border-blue-200/80 hover:text-blue-900 transition-all font-medium"
                          title="Click to view full requirements"
                        >
                          {lead.requirements}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic font-medium">No requirements specified</span>
                      )}
                    </td>
                    <td className="py-4 px-6 align-top text-xs font-semibold text-slate-600">
                      <span className="bg-slate-100/80 border border-slate-200/60 text-slate-700 px-2.5 py-1 rounded-lg inline-block">
                        {lead.source || 'Website'}
                      </span>
                      {lead.campaign_name && (
                        <div className="text-[10px] text-slate-400 font-medium mt-1">
                          {lead.campaign_name}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 align-top text-xs font-semibold text-slate-600">
                      {formatDateDDMMYYYY(lead.created_at)}
                    </td>
                    <td className="py-4 px-6 align-top">
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getStatusBadgeStyle(lead.status)}`}
                      >
                        {leadStatuses.map((st) => (
                          <option key={st} value={st} className="bg-white text-slate-800 font-semibold">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Requirements Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg space-y-5 shadow-2xl my-auto border border-slate-100 transform transition-all scale-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <FileCode className="w-5 h-5" />
                </div>
                Requirements Details
              </h2>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="text-sm font-extrabold text-slate-900">{selectedLead.name}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{selectedLead.company || 'Personal Account'}</div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedLead.requirements || 'No custom requirements specified.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}