'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Download, Calendar, CheckCircle2, FileText,
  Bot, UserCheck, Trash2, PhoneCall, Edit
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
  value: number;
  assigned_to?: string | null;
  notes?: string;
  created_at: string;
}

export default function WebsiteContactFormEnquiriesPage() {
  const [activeTab, setActiveTab] = useState<'details' | 'pipeline' | 'automation'>('details');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    company: '',
    source: 'Website',
    campaign_name: '',
    requirements: '',
    value: 0,
    status: 'New',
    assigned_to: 'not_assigned',
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
    // Fetch ONLY website contact form enquiries
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .eq('source', 'Website')
      .order('created_at', { ascending: false });

    if (leadsData) setLeads(leadsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLeads = useMemo(() => {
    if (dateRange === 'all') return leads;

    const now = new Date();
    return leads.filter((lead) => {
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
      return true;
    });
  }, [leads, dateRange]);

  const saveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    const isAssigned = formData.assigned_to === 'assigned';
    const payload: Record<string, any> = {
      name: formData.name,
      email: formData.contact_info.includes('@')
        ? formData.contact_info.split('\n')[0].trim()
        : `${formData.name.toLowerCase().replace(/\s+/g, '')}@lead.com`,
      phone: formData.contact_info.split('\n')[0].trim(),
      contact_info: formData.contact_info,
      company: formData.company || null,
      source: 'Website',
      value: Number(formData.value) || 0,
      status: isAssigned && formData.status === 'New' ? 'Assigned' : formData.status,
      assigned_to: isAssigned ? 'assigned' : null,
      notes: formData.notes || null,
      campaign_name: formData.campaign_name || null,
      requirements: formData.requirements || null
    };

    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', editingLead.id)
      .select();

    if (error) {
      alert(`Could not update enquiry: ${error.message}`);
      return;
    }

    if (data && data.length > 0) {
      setLeads(leads.map((l) => (l.id === editingLead.id ? data[0] : l)));
      closeModal();
    }
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    const isAssigned = lead.assigned_to === 'assigned' || lead.assigned_to === 'Assigned';
    setFormData({
      name: lead.name || '',
      contact_info: lead.contact_info || lead.phone || lead.email || '',
      company: lead.company || '',
      source: 'Website',
      campaign_name: lead.campaign_name || '',
      requirements: lead.requirements || '',
      value: lead.value || 0,
      status: lead.status || 'New',
      assigned_to: isAssigned ? 'assigned' : 'not_assigned',
      notes: lead.notes || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLead(null);
  };

  const updateAssignment = async (id: string, assignmentStatus: string) => {
    const isAssigned = assignmentStatus === 'assigned';
    const assignedVal = isAssigned ? 'assigned' : null;

    const { error } = await supabase
      .from('leads')
      .update({ 
        assigned_to: assignedVal,
        ...(isAssigned ? { status: 'Assigned' } : {})
      })
      .eq('id', id);

    if (error) {
      alert(`Assignment update failed: ${error.message}`);
      return;
    }

    setLeads(leads.map((l) => (l.id === id ? { 
      ...l, 
      assigned_to: assignedVal,
      ...(isAssigned ? { status: 'Assigned' } : {})
    } : l)));
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }
    setLeads(leads.filter((l) => l.id !== id));
  };

  const exportCSV = () => {
    const headers = ['Name,Contact Details,Company,Source,Campaign,Requirements,Status,Value,Assign Lead,Date Created\n'];
    const rows = filteredLeads
      .map((l) => {
        const assignmentLabel = l.assigned_to ? 'assign to leads' : 'not assign to leads';
        const formattedDate = formatDateDDMMYYYY(l.created_at);
        const cleanReq = (l.requirements || '').replace(/"/g, '""');
        const cleanContact = (l.contact_info || l.phone || l.email || '').replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${l.name}","${cleanContact}","${l.company || ''}","${l.source || ''}","${l.campaign_name || ''}","${cleanReq}","${l.status}",${l.value},"${assignmentLabel}","${formattedDate}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `website_contact_enquiries_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600 shrink-0" />
            Website Contact Form Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Displaying only website contact form enquiries. Select <span className="font-semibold text-slate-700">"assign to leads"</span> to push an enquiry to the main Leads page.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'details', label: 'Enquiry Records & Assignment', icon: FileText },
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
        <div className="flex items-center gap-2">
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
          </select>
        </div>
        <button
          onClick={exportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export Filtered Enquiries (CSV)
        </button>
      </div>

      {/* Main Table */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading enquiry database...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No website enquiries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                  <tr>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Company</th>
                    <th className="p-4 max-w-xs">Requirements</th>
                    <th className="p-4">Campaign Source</th>
                    <th className="p-4">Date Created</th>
                    <th className="p-4">Assign Lead</th>
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
                          <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60 line-clamp-3 whitespace-pre-line">
                            {lead.requirements}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No requirements</span>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <div className="text-xs font-semibold text-slate-800">{lead.source || 'Website'}</div>
                        <div className="text-[11px] text-slate-500">{lead.campaign_name || 'Direct'}</div>
                      </td>
                      <td className="p-4 align-top text-xs font-medium text-slate-600">
                        {formatDateDDMMYYYY(lead.created_at)}
                      </td>
                      <td className="p-4 align-top">
                        <select
                          value={lead.assigned_to ? 'assigned' : 'not_assigned'}
                          onChange={(e) => updateAssignment(lead.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg text-xs font-semibold px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 text-slate-800"
                        >
                          <option value="not_assigned">not assign to leads</option>
                          <option value="assigned">assign to leads</option>
                        </select>
                      </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Enquiry"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Enquiry"
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

      {/* Edit Modal */}
      {showModal && editingLead && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={saveLead} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl border border-slate-100 my-auto">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Edit Enquiry Record</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Company</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Contact Info (Phone / Email)</label>
              <textarea
                rows={2}
                className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Requirements</label>
              <textarea
                rows={3}
                className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Assign Lead</label>
                <select
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                >
                  <option value="not_assigned">not assign to leads</option>
                  <option value="assigned">assign to leads</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Pipeline Status</label>
                <select
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {leadFlow.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Update Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}