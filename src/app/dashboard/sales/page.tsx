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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Responsive Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-500">Manage client leads, deal stages, and contract values</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 text-sm shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={createLead} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-xl my-auto">
            <h2 className="text-lg font-bold text-slate-900">Add New Sales Lead</h2>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Contact Name</label>
              <input
                type="text"
                placeholder="Contact Name"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Email Address"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Company</label>
              <input
                type="text"
                placeholder="Company"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Estimated Value ($)</label>
              <input
                type="number"
                placeholder="Estimated Value ($)"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Save Lead
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Responsive Leads Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No leads found. Click "Add Lead" to get started.</div>
        ) : (
          <>
            {/* Desktop & Tablet Table View (Hidden on Small Mobile Screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
                  <tr>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Company</th>
                    <th className="p-4">Value</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{lead.name}</div>
                        <div className="text-xs text-slate-500">{lead.email}</div>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">{lead.company}</td>
                      <td className="p-4 font-semibold text-slate-900">${lead.value?.toLocaleString()}</td>
                      <td className="p-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="p-1.5 border border-slate-200 rounded-md text-xs font-medium bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Lead">Lead</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Proposal">Proposal</option>
                          <option value="Converted">Converted</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => deleteLead(lead.id)} 
                          className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout (Visible on Small Screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900 text-base">{lead.name}</div>
                      <div className="text-xs text-slate-500">{lead.email}</div>
                    </div>
                    <button 
                      onClick={() => deleteLead(lead.id)} 
                      className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors shrink-0"
                      title="Delete Lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">Company</span>
                      <span className="text-slate-800 font-semibold">{lead.company}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Est. Value</span>
                      <span className="text-slate-900 font-bold">${lead.value?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-slate-500">Stage</span>
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                      className="p-1.5 border border-slate-200 rounded-md text-xs font-medium bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Lead">Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}