'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  value: number;
}

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLeadStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Operations</h1>
          <p className="text-sm text-slate-500">Track deals, software services, and lead status</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
          Loading sales records...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
              <tr>
                <th className="p-4">Contact</th>
                <th className="p-4">Company</th>
                <th className="p-4">Estimated Value</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-normal text-slate-800">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{lead.name}</div>
                    <div className="text-xs text-slate-500 font-normal">{lead.email}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{lead.company}</td>
                  <td className="p-4 font-semibold text-slate-900">${lead.value?.toLocaleString()}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${
                        lead.status === 'Converted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {lead.status !== 'Converted' ? (
                      <button
                        onClick={() => updateLeadStatus(lead.id, 'Converted')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Convert to Client
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Converted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}