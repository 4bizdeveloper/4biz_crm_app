'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp } from 'lucide-react';

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
  assigned_to?: string;
  created_at: string;
}

export default function SalesDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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
  const assignedLeads = leads.filter(
    (l) => l.assigned_to !== null && l.assigned_to !== undefined && l.assigned_to !== ''
  );

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);

    if (error) {
      alert(`Status update failed: ${error.message}`);
      return;
    }

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
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

      {/* Assigned Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800">
          Assigned Deals & Lead Queue
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading assigned sales data...</div>
        ) : assignedLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No assigned leads found for this view. Assign leads from the Leads Directory to display them here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4">Lead Contact</th>
                  <th className="p-4">Company & Requirements</th>
                  <th className="p-4">Campaign Source</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {assignedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {lead.contact_info || lead.phone || lead.email || '—'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{lead.company || '—'}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">
                        {lead.requirements || lead.notes || 'No notes'}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded-md">{lead.source || 'Website'}</span>
                      {lead.campaign_name && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{lead.campaign_name}</div>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
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
    </div>
  );
}