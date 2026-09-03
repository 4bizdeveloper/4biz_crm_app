'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Download, Calendar, CheckCircle2, FileText,
  Bot, UserCheck, Trash2, PhoneCall, Sparkles, FileCode, X, Edit
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  contact_info?: string;
  phone?: string;
  company?: string;
  source?: string;
  campaign_name?: string;
  requirements?: string;
  status: string;
  assigned_to?: string | null;
  notes?: string;
  created_at: string;
}

export default function LeadsModule() {
  const [activeTab, setActiveTab] = useState<'details' | 'pipeline' | 'automation'>('details');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    company: '',
    source: 'Manual / Outreach',
    campaign_name: '',
    requirements: '',
    status: 'New',
    assigned_to: 'Not assigned to sales',
    notes: ''
  });

  const leadFlow = ['New', 'Assigned', 'Contacted', 'Follow-up', 'Qualified', 'Converted', 'Disqualified'];

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

  const filteredLeads = useMemo(() => {
    const now = new Date();

    return leads.filter((lead) => {
      // 1. Filter Check: Include self-created leads + assigned contact form leads
      const isContactFormLead = lead.source?.toLowerCase() === 'website';
      const isAssigned =
        lead.assigned_to !== null &&
        lead.assigned_to !== undefined &&
        lead.assigned_to !== '' &&
        lead.assigned_to !== 'Not assigned to sales' &&
        lead.assigned_to !== 'not_assigned';

      const isSelfCreatedOrAssignedWebsite = !isContactFormLead || isAssigned;

      if (!isSelfCreatedOrAssignedWebsite) {
        return false;
      }

      // 2. Date Range Filter
      if (dateRange === 'all') return true;

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
  }, [leads, dateRange, startDate, endDate]);

  const saveLead = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, any> = {
      name: formData.name,
      email: formData.contact_info.includes('@')
        ? formData.contact_info.split('\n')[0].trim()
        : `${formData.name.toLowerCase().replace(/\s+/g, '')}@lead.com`,
      phone: formData.contact_info.split('\n')[0].trim(),
      contact_info: formData.contact_info,
      company: formData.company || null,
      source: formData.source || 'Manual / Outreach',
      status: formData.status,
      assigned_to: formData.assigned_to === 'Assigned to sales' ? 'assigned' : null,
      notes: formData.notes || null,
      campaign_name: formData.campaign_name || null,
      requirements: formData.requirements || null
    };

    if (editingLead) {
      const { data, error } = await supabase
        .from('leads')
        .update(payload)
        .eq('id', editingLead.id)
        .select();

      if (error) {
        alert(`Could not update lead: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        setLeads(leads.map((l) => (l.id === editingLead.id ? data[0] : l)));
        closeModal();
      }
    } else {
      const { data, error } = await supabase.from('leads').insert([payload]).select();

      if (error) {
        alert(`Could not save lead: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        setLeads([data[0], ...leads]);
        closeModal();
      }
    }
  };

  const openCreateModal = () => {
    setEditingLead(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      contact_info: lead.contact_info || lead.phone || lead.email || '',
      company: lead.company || '',
      source: lead.source || 'Manual / Outreach',
      campaign_name: lead.campaign_name || '',
      requirements: lead.requirements || '',
      status: lead.status || 'New',
      assigned_to: lead.assigned_to ? 'Assigned to sales' : 'Not assigned to sales',
      notes: lead.notes || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLead(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_info: '',
      company: '',
      source: 'Manual / Outreach',
      campaign_name: '',
      requirements: '',
      status: 'New',
      assigned_to: 'Not assigned to sales',
      notes: ''
    });
  };

  const updateLeadStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) {
      alert(`Status update failed: ${error.message}`);
      return;
    }
    setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const updateAssignment = async (id: string, assignmentStatus: string) => {
    const assignedVal = assignmentStatus === 'Assigned to sales' ? 'assigned' : null;

    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: assignedVal })
      .eq('id', id);

    if (error) {
      alert(`Assignment update failed: ${error.message}`);
      return;
    }

    setLeads(leads.map((l) => (l.id === id ? { ...l, assigned_to: assignedVal } : l)));
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }
    setLeads(leads.filter((l) => l.id !== id));
  };

  const exportCSV = () => {
    const headers = ['Name,Contact Details,Company,Source,Campaign,Requirements,Status,Sales Assigned,Date Created\n'];
    const rows = filteredLeads
      .map((l) => {
        const assignmentLabel = l.assigned_to ? 'Assigned to sales' : 'Not assigned to sales';
        const formattedDate = formatDateDDMMYYYY(l.created_at);
        const cleanReq = (l.requirements || '').replace(/"/g, '""');
        const cleanContact = (l.contact_info || l.phone || l.email || '').replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${l.name}","${cleanContact}","${l.company || ''}","${l.source || ''}","${l.campaign_name || ''}","${cleanReq}","${l.status}","${assignmentLabel}","${formattedDate}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600 shrink-0" />
            Leads Management Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Flow: <span className="font-semibold text-slate-700">New → Assigned → Contacted → Follow-up → Qualified → Converted / Disqualified</span>
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-md shadow-blue-500/20 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Lead
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'details', label: 'Lead Records & Assignment', icon: FileText },
          { id: 'pipeline', label: 'Status & Pipeline', icon: CheckCircle2 },
          { id: 'automation', label: 'Automation & Tasks', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/60'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
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

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {leadFlow.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            return (
              <div key={stage} className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200 flex flex-col h-full min-w-[260px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <h4 className="font-bold text-sm text-slate-800">{stage}</h4>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full font-bold text-slate-600 shadow-xs">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageLeads.length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-6">No leads in {stage}</div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div key={lead.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                          <span>{lead.name}</span>
                          <button
                            onClick={() => openEditModal(lead)}
                            className="text-slate-400 hover:text-blue-600 p-1"
                            title="Edit Lead"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-slate-500 whitespace-pre-line">{lead.contact_info || lead.phone || lead.email}</div>
                        
                        {lead.requirements && (
                          <div className="text-xs bg-slate-50 border border-slate-100 p-2 rounded-md text-slate-600 mt-1 line-clamp-2">
                            <span className="font-semibold text-slate-700">Req: </span>
                            {lead.requirements}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDateDDMMYYYY(lead.created_at)}
                          </span>
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            className="text-[11px] p-1 border rounded bg-slate-50 text-slate-800 font-semibold"
                          >
                            {leadFlow.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
            <Sparkles className="w-5 h-5" />
            CRM Lead Automations & Activity Reminders
          </div>
          <p className="text-xs text-slate-500">Automated workflow logs and upcoming schedule actions based on current lead assignments.</p>

          <div className="divide-y divide-slate-100">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{lead.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Source: {lead.source}</span> • <span>Sales Status: {lead.assigned_to ? 'Assigned to sales' : 'Not assigned to sales'}</span>
                  </div>
                  {lead.requirements && (
                    <div className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold">Requirements:</span> {lead.requirements}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => alert(`Automated follow-up task triggered for ${lead.name}`)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs px-3 py-1.5 rounded-lg border border-blue-200 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  Trigger Follow-up Task
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading lead database...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No lead records found for selected filter.</div>
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
                    <th className="p-4">Sales Assigned</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLeads.map((lead) => (
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
                          value={lead.assigned_to ? 'Assigned to sales' : 'Not assigned to sales'}
                          onChange={(e) => updateAssignment(lead.id, e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg text-xs font-medium px-2.5 py-1.5 focus:ring-1 focus:ring-blue-600 text-slate-800"
                        >
                          <option value="Not assigned to sales">Not assigned to sales</option>
                          <option value="Assigned to sales">Assigned to sales</option>
                        </select>
                      </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(lead)}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-md transition-colors cursor-pointer"
                            title="Edit Lead"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-md transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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

      {/* Create / Edit Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={saveLead} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl my-auto border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">
              {editingLead ? 'Edit Lead Details' : 'Add New Lead Contact'}
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Contact Details (Phone / Email / Address)</label>
              <textarea
                rows={3}
                required
                placeholder={"+1 (555) 000-0000\nemail@company.com\n123 Business St, Suite 100"}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="Enterprise Inc."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Sales Assigned</label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Not assigned to sales">Not assigned to sales</option>
                  <option value="Assigned to sales">Assigned to sales</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Lead Source</label>
              <select
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="Manual / Outreach">Manual / Outreach</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Referral">Referral</option>
                <option value="Website">Website</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Requirements Details</label>
              <textarea
                rows={3}
                placeholder="Enter client technical or project requirements..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md cursor-pointer">
                {editingLead ? 'Update Lead' : 'Save Lead'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}