'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, PhoneCall, FileCode, X, Calendar, Download } from 'lucide-react';

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Sales Team Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Displaying assigned leads for active sales representatives
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Leads</p>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{assignedLeads.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Converted Wins</p>
          <h3 className="text-3xl font-extrabold text-blue-600 mt-2">
            {assignedLeads.filter((l) => l.status === 'Converted').length}
          </h3>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-100 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-semibold text-slate-700">Filter By Date Created:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-white border border-slate-300 rounded-lg text-xs font-semibold px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
          >
            <option value="all">All Dates</option>
            <option value="daily">Today Only</option>
            <option value="weekly">Past 7 Days</option>
            <option value="monthly">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg text-xs font-semibold px-2 py-1 focus:ring-2 focus:ring-blue-600 text-slate-800"
              />
              <span className="text-xs font-semibold text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg text-xs font-semibold px-2 py-1 focus:ring-2 focus:ring-blue-600 text-slate-800"
              />
            </div>
          )}
        </div>
        <button
          onClick={exportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export Filtered Leads (CSV)
        </button>
      </div>

      {/* Assigned Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800">
          Assigned Deals & Lead Queue
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading assigned sales data...</div>
        ) : filteredAssignedLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No assigned leads found for this view. Select "Assigned to sales" in the Leads Directory to display them here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Lead Contact</th>
                  <th className="p-4">Company</th>
                  <th className="p-4 max-w-xs">Requirements</th>
                  <th className="p-4">Campaign Source</th>
                  <th className="p-4">Date Created</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAssignedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-500 flex items-start gap-1.5 mt-1 whitespace-pre-line">
                        <PhoneCall className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" /> 
                        <span>{lead.contact_info || lead.phone || lead.email}</span>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-semibold text-slate-800">{lead.company || '—'}</div>
                    </td>
                    <td className="p-4 align-top max-w-xs">
                      {lead.requirements ? (
                        <div 
                          onClick={() => setSelectedLead(lead)}
                          className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60 line-clamp-2 cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all"
                          title="Click to view full requirements"
                        >
                          {lead.requirements}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No requirements specified</span>
                      )}
                    </td>
                    <td className="p-4 align-top text-xs font-medium text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded-md">{lead.source || 'Website'}</span>
                      {lead.campaign_name && <div className="text-[10px] text-slate-400 mt-0.5">{lead.campaign_name}</div>}
                    </td>
                    <td className="p-4 align-top text-xs font-medium text-slate-700">
                      {formatDateDDMMYYYY(lead.created_at)}
                    </td>
                    <td className="p-4 align-top">
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className="p-1 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 text-slate-800 focus:ring-1 focus:ring-blue-600"
                      >
                        {leadStatuses.map((st) => (
                          <option key={st} value={st}>
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl my-auto border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                Lead Requirements Details
              </h2>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-800">{selectedLead.name}</div>
              <div className="text-xs text-slate-500">{selectedLead.company || 'Personal Account'}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
              {selectedLead.requirements || 'No custom requirements specified.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
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