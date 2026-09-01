'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Download, Calendar, Filter, Phone, Mail, MessageSquare,
  Flame, Zap, CheckCircle2, AlertCircle, FileText, Bot, BarChart3, UserCheck, Trash2
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  value: number;
  notes?: string;
  created_at: string;
}

export default function LeadsModule() {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'campaigns' | 'pipeline' | 'scoring' | 'automation'>('overview');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', source: 'Website', value: 0, status: 'New', notes: ''
  });

  const leadStages = ['New', 'Assigned', 'Contacted', 'Follow-up', 'Qualified', 'Converted', 'Disqualified'];

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const createLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('leads').insert([formData]).select();
    if (!error && data) {
      setLeads([data[0], ...leads]);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', company: '', source: 'Website', value: 0, status: 'New', notes: '' });
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

  // Export Overview details to CSV
  const exportCSV = () => {
    const headers = ['Name,Email,Phone,Company,Source,Status,Value,Created At\n'];
    const rows = leads.map(l => `"${l.name}","${l.email}","${l.phone || ''}","${l.company || ''}","${l.source || ''}","${l.status}",${l.value},"${new Date(l.created_at).toLocaleDateString()}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600 shrink-0" />
            Leads Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Flow: <span className="font-semibold text-slate-700">New → Assigned → Contacted → Follow-up → Qualified → Converted / Disqualified</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview & Export', icon: BarChart3 },
          { id: 'details', label: 'Lead Details', icon: FileText },
          { id: 'campaigns', label: 'Sources & Tracking', icon: Filter },
          { id: 'pipeline', label: 'Status & Pipeline', icon: CheckCircle2 },
          { id: 'scoring', label: 'Lead Scoring', icon: Flame },
          { id: 'automation', label: 'Automation', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content: Overview & Export */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-100 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Filter Overview:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-md text-xs font-semibold px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="daily">Daily Basis</option>
                <option value="weekly">Weekly Basis</option>
                <option value="monthly">Monthly Basis</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            <button
              onClick={exportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Overview Data (CSV)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Total Leads</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{leads.length}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Qualified Leads</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                {leads.filter((l) => l.status === 'Qualified').length}
              </h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Converted Leads</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {leads.filter((l) => l.status === 'Converted').length}
              </h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Pipeline Value</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                ${leads.reduce((sum, l) => sum + (l.value || 0), 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Main Leads Table / List View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading leads data...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No leads recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Lead Contact</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Est. Value</th>
                  <th className="p-4">Stage Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">{lead.company || '—'}</td>
                    <td className="p-4 text-xs font-medium text-slate-600">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md">{lead.source || 'Website'}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-900">${(lead.value || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                        className="p-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        {leadStages.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
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
        )}
      </div>

      {/* Add Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={createLead} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 shadow-xl my-auto">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Create New Lead</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Company</label>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Source Tracking</label>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="Website">Website</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                Save Lead
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}