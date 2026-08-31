'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

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
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', value: 0, status: 'Lead' });

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const createLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('leads').insert([formData]).select();
    if (!error && data) {
      setLeads([data[0], ...leads]);
      setShowModal(false);
      setFormData({ name: '', email: '', company: '', value: 0, status: 'Lead' });
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    await supabase.from('leads').update({ status }).eq('id', id);
    setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const deleteLead = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
    setLeads(leads.filter((l) => l.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-sm text-slate-500">Manage client leads, deal stages, and contract values</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={createLead} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Add New Sales Lead</h2>
            <input
              type="text"
              placeholder="Contact Name"
              required
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Company"
              required
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <input
              type="number"
              placeholder="Estimated Value ($)"
              required
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                Save Lead
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
            <tr>
              <th className="p-4">Contact</th>
              <th className="p-4">Company</th>
              <th className="p-4">Value</th>
              <th className="p-4">Stage</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-semibold text-slate-900">{lead.name}</div>
                  <div className="text-xs text-slate-500">{lead.email}</div>
                </td>
                <td className="p-4 text-slate-700">{lead.company}</td>
                <td className="p-4 font-semibold text-slate-900">${lead.value?.toLocaleString()}</td>
                <td className="p-4">
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                    className="p-1 border rounded-md text-xs font-medium bg-slate-50"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </td>
                <td className="p-4">
                  <button onClick={() => deleteLead(lead.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}