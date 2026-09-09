'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Download, Calendar, CheckCircle2, FileText,
  Bot, UserCheck, Trash2, Edit, Eye, X, Filter, Sparkles, ChevronRight, User
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

export default function WebsiteContactFormEnquiriesPage() {
  const [activeTab, setActiveTab] = useState<'details' | 'pipeline' | 'automation'>('details');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Requirements Modal Zoom State
  const [viewRequirements, setViewRequirements] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    company: '',
    source: 'Website',
    campaign_name: '',
    requirements: '',
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
    if (!editingLead) return;

    const isAssigned = formData.assigned_to === 'assigned';

    // Separate potential email and phone from the contact_info string lines
    const lines = formData.contact_info.split('\n').map((line) => line.trim());
    const extractedEmail =
      lines.find((line) => line.includes('@')) ||
      editingLead.email ||
      `${formData.name.toLowerCase().replace(/\s+/g, '')}@lead.com`;
    const extractedPhone =
      lines.find((line) => !line.includes('@')) || formData.contact_info.trim();

    const payload: Record<string, any> = {
      name: formData.name,
      email: extractedEmail,
      phone: extractedPhone,
      contact_info: formData.contact_info,
      company: formData.company || null,
      source: 'Website',
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
      contact_info: lead.contact_info || (lead.email && lead.phone ? `${lead.email}\n${lead.phone}` : lead.email || lead.phone || ''),
      company: lead.company || '',
      source: 'Website',
      campaign_name: lead.campaign_name || '',
      requirements: lead.requirements || '',
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
    const headers = ['Name,Contact Details,Company,Source,Campaign,Requirements,Status,Assign Lead,Date Created\n'];
    const rows = filteredLeads
      .map((l) => {
        const assignmentLabel = l.assigned_to ? 'assign to leads' : 'not assign to leads';
        const formattedDate = formatDateDDMMYYYY(l.created_at);
        const cleanReq = (l.requirements || '').replace(/"/g, '""');
        const contactVal = l.contact_info || (l.email && l.phone ? `${l.email} ${l.phone}` : l.email || l.phone || '');
        const cleanContact = contactVal.replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${l.name}","${cleanContact}","${l.company || ''}","${l.source || ''}","${l.campaign_name || ''}","${cleanReq}","${l.status}","${assignmentLabel}","${formattedDate}"`;
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
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans pb-12 px-2 sm:px-4 md:px-6 bg-[#040D0C] text-[#E0E2EC] min-h-screen">
      
      {/* 1. Header Container */}
      <div className="bg-[#0B1E1C]/90 p-5 sm:p-6 rounded-3xl border border-[#183B36] shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-[#1A5248]/30 via-[#277D6C]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#143B35] border border-[#277D6C]/50 text-[#6CE5D0] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#6CE5D0]" />
              <span>Inbound Web Leads Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F0F2F5] tracking-tight flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#164940] via-[#22685B] to-[#34A08B] text-[#E0E2EC] shadow-md shadow-[#000000]/40 shrink-0 border border-[#277D6C]/40">
                <UserCheck className="w-6 h-6 text-[#72F5DE]" />
              </div>
              Website Contact Form Enquiries
            </h1>
            <p className="text-xs sm:text-sm text-[#8DA09D] leading-relaxed pt-1">
              Displaying only website contact form enquiries. Select <span className="font-semibold text-[#6CE5D0] bg-[#12312C] px-2 py-0.5 rounded-md border border-[#1D4A42]">assign to leads</span> to route an enquiry into the main Sales Lead Pipeline.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="group relative inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-xs sm:text-sm text-[#051815] shadow-lg shadow-[#000000]/50 bg-gradient-to-r from-[#5BE3CA] via-[#34A08B] to-[#257A6A] hover:from-[#72F5DE] hover:to-[#34A08B] active:scale-[0.98] transition-all duration-200 cursor-pointer shrink-0 border border-[#8BFFEC]/40 overflow-hidden font-bold"
          >
            <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 text-[#051815]" />
            <span>Export Enquiries CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Date Filter Bar Container */}
      <div className="bg-[#0B1E1C]/90 p-4 sm:p-5 rounded-3xl border border-[#183B36] shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-[#8DA09D] font-bold text-xs uppercase tracking-wider shrink-0">
            <Filter className="w-4 h-4 text-[#6CE5D0]" />
            <span>Date Range:</span>
          </div>
          <div className="flex flex-wrap bg-[#061513] p-1.5 rounded-2xl border border-[#163833] text-xs font-semibold w-full sm:w-auto">
            {(['all', 'daily', 'weekly', 'monthly', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl capitalize transition-all duration-200 cursor-pointer text-center ${
                  dateRange === r
                    ? 'bg-[#18453E] text-[#72F5DE] shadow-sm font-bold border border-[#277D6C]/60'
                    : 'text-[#8DA09D] hover:text-[#E0E2EC] hover:bg-[#0E2824]'
                }`}
              >
                {r === 'all' ? 'All Enquiries' : r}
              </button>
            ))}
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 text-xs bg-[#061513] p-2 rounded-2xl border border-[#163833]">
            <Calendar className="w-4 h-4 text-[#8DA09D] shrink-0" />
            <input
              type="date"
              className="px-2.5 py-1.5 rounded-xl border border-[#1E4B43] bg-[#0E2824] text-[#E0E2EC] font-medium focus:outline-none focus:ring-2 focus:ring-[#277D6C]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-[#8DA09D] font-medium">to</span>
            <input
              type="date"
              className="px-2.5 py-1.5 rounded-xl border border-[#1E4B43] bg-[#0E2824] text-[#E0E2EC] font-medium focus:outline-none focus:ring-2 focus:ring-[#277D6C]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 3. View Tabs Navigation */}
      <div className="w-full overflow-x-auto no-scrollbar py-1">
        <div className="inline-flex items-center gap-2 p-1.5 bg-[#0B1E1C]/90 rounded-2xl border border-[#183B36] shadow-xl max-w-full min-w-max">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === 'details'
                ? 'bg-[#18453E] text-[#72F5DE] shadow-md border border-[#277D6C]/60'
                : 'text-[#8DA09D] hover:text-[#E0E2EC] hover:bg-[#0E2824]'
            }`}
          >
            Detailed Enquiry Table
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === 'pipeline'
                ? 'bg-[#18453E] text-[#72F5DE] shadow-md border border-[#277D6C]/60'
                : 'text-[#8DA09D] hover:text-[#E0E2EC] hover:bg-[#0E2824]'
            }`}
          >
            Visual Enquiry Pipeline
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === 'automation'
                ? 'bg-[#18453E] text-[#72F5DE] shadow-md border border-[#277D6C]/60'
                : 'text-[#8DA09D] hover:text-[#E0E2EC] hover:bg-[#0E2824]'
            }`}
          >
            Form AI & Webhook Automation
          </button>
        </div>
      </div>

      {/* Requirements Full Text Zoom Modal */}
      {viewRequirements && (
        <div className="fixed inset-0 bg-[#020807]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0B1E1C] rounded-3xl p-6 sm:p-7 w-full max-w-lg space-y-5 shadow-2xl my-auto relative border border-[#1E4B43] animate-in zoom-in-95 duration-200 text-[#E0E2EC]">
            <div className="flex items-center justify-between border-b border-[#163833] pb-4">
              <h3 className="text-base font-bold text-[#F0F2F5] flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#143B35] text-[#6CE5D0]">
                  <FileText className="w-5 h-5" />
                </div>
                Enquiry Requirements & Details
              </h3>
              <button
                onClick={() => setViewRequirements(null)}
                className="p-1.5 rounded-xl text-[#8DA09D] hover:text-[#E0E2EC] hover:bg-[#143B35] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5 bg-[#061513] rounded-2xl border border-[#163833] text-sm text-[#D3E4E0] whitespace-pre-wrap leading-relaxed font-sans">
              {viewRequirements}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewRequirements(null)}
                className="px-5 py-2.5 bg-[#18453E] hover:bg-[#225F56] text-[#72F5DE] border border-[#277D6C]/60 rounded-xl text-xs font-semibold transition-all duration-150 shadow-sm cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Detailed Enquiry Table */}
      {activeTab === 'details' && (
        <div className="bg-[#0B1E1C]/90 rounded-3xl border border-[#183B36] shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#8DA09D] text-sm font-medium flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#6CE5D0] border-t-transparent rounded-full animate-spin" />
              <span>Loading website contact form enquiries...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-[#8DA09D] text-sm font-medium">
              No website contact enquiries found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead className="bg-[#061513] border-b border-[#163833] text-[#8DA09D] font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Name</th>
                    <th className="py-4 px-5">Contact Details</th>
                    <th className="py-4 px-5">Company</th>
                    <th className="py-4 px-5">Source</th>
                    <th className="py-4 px-5">Campaign Name</th>
                    <th className="py-4 px-5">Requirements</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Assign Lead</th>
                    <th className="py-4 px-5">Date Created</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14312B] text-xs">
                  {filteredLeads.map((lead) => {
                    const isAssigned = lead.assigned_to === 'assigned' || lead.assigned_to === 'Assigned';
                    const formattedDate = formatDateDDMMYYYY(lead.created_at);

                    return (
                      <tr key={lead.id} className="hover:bg-[#112E29]/60 transition-colors group">
                        <td className="py-4 px-5 font-bold text-[#F0F2F5] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#6CE5D0] shrink-0" />
                            <span>{lead.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-medium text-[#C2D6D3] whitespace-pre-line leading-relaxed">
                          {lead.contact_info || (
                            <>
                              {lead.email && <div className="text-[#E0E2EC]">{lead.email}</div>}
                              {lead.phone && <div className="text-[#8DA09D] text-[11px]">{lead.phone}</div>}
                            </>
                          )}
                        </td>
                        <td className="py-4 px-5 text-[#A2B8B4] font-medium whitespace-nowrap">{lead.company || '-'}</td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="inline-flex items-center bg-[#123630] text-[#6CE5D0] border border-[#23685C] px-2.5 py-1 rounded-lg text-[11px] font-bold">
                            {lead.source || 'Website'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-[#8DA09D] whitespace-nowrap">{lead.campaign_name || 'Website Contact Form'}</td>
                        <td className="py-4 px-5 max-w-xs">
                          {lead.requirements ? (
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[#C2D6D3] block max-w-[180px]">
                                {lead.requirements}
                              </span>
                              <button
                                onClick={() => setViewRequirements(lead.requirements || '')}
                                className="p-1 text-[#6CE5D0] hover:text-[#8BFFEC] hover:bg-[#18453E] rounded-lg transition-colors shrink-0 cursor-pointer"
                                title="Zoom / View Full Requirements"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#5B736F] italic">No notes</span>
                          )}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block border ${
                            lead.status === 'Converted' ? 'bg-[#123A31] text-[#6CE5D0] border-[#257A6A]' :
                            lead.status === 'Assigned' ? 'bg-[#2A2140] text-[#D0B3FF] border-[#533980]' :
                            'bg-[#122A26] text-[#A2B8B4] border-[#1D4A42]'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <select
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all duration-150 focus:outline-none ${
                              isAssigned
                                ? 'bg-[#2A2140] border-[#533980] text-[#D0B3FF] shadow-xs'
                                : 'bg-[#0E2824] border-[#1E4B43] text-[#8DA09D] hover:bg-[#143B35]'
                            }`}
                            value={isAssigned ? 'assigned' : 'not_assigned'}
                            onChange={(e) => updateAssignment(lead.id, e.target.value)}
                          >
                            <option value="not_assigned" className="bg-[#0B1E1C] text-[#E0E2EC]">not assign to leads</option>
                            <option value="assigned" className="bg-[#0B1E1C] text-[#E0E2EC]">assign to leads</option>
                          </select>
                        </td>
                        <td className="py-4 px-5 font-semibold text-[#8DA09D] whitespace-nowrap">{formattedDate}</td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(lead)}
                              className="p-1.5 text-[#8DA09D] hover:text-[#6CE5D0] hover:bg-[#143B35] rounded-lg transition-colors cursor-pointer"
                              title="Edit Enquiry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteLead(lead.id)}
                              className="p-1.5 text-[#8DA09D] hover:text-[#FF8B8B] hover:bg-[#3D1414] rounded-lg transition-colors cursor-pointer"
                              title="Delete Enquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Visual Enquiry Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
          {leadFlow.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            return (
              <div key={stage} className="bg-[#0B1E1C]/90 p-3.5 rounded-3xl border border-[#183B36] min-w-[220px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-[#163833] pb-3 mb-3">
                    <span className="font-extrabold text-xs text-[#E0E2EC] tracking-tight">{stage}</span>
                    <span className="bg-[#12312C] border border-[#23685C] text-[#6CE5D0] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {stageLeads.map((l) => (
                      <div key={l.id} className="bg-[#061513] p-3.5 rounded-2xl border border-[#183B36] shadow-2xs hover:border-[#277D6C]/60 transition-all duration-200 space-y-2">
                        <div className="font-bold text-xs text-[#F0F2F5] truncate">{l.name}</div>
                        <div className="text-[11px] text-[#8DA09D] truncate">{l.company || l.email}</div>
                        <div className="text-[10px] text-[#5B736F] flex justify-between items-center pt-2 border-t border-[#122A26]">
                          <span className="font-medium">{formatDateDDMMYYYY(l.created_at)}</span>
                          {l.requirements && (
                            <button
                              onClick={() => setViewRequirements(l.requirements || '')}
                              className="text-[#6CE5D0] hover:text-[#8BFFEC] font-bold cursor-pointer inline-flex items-center gap-0.5"
                            >
                              <span>View</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Automation & Form Webhooks */}
      {activeTab === 'automation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0B1E1C]/90 p-6 sm:p-7 rounded-3xl border border-[#183B36] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#F0F2F5] flex items-center gap-2.5 border-b border-[#163833] pb-4">
              <div className="p-2 rounded-xl bg-[#143B35] text-[#6CE5D0]">
                <Bot className="w-5 h-5" />
              </div>
              Website Contact Form Webhook Integration
            </h3>
            <p className="text-xs text-[#8DA09D] leading-relaxed">
              Connect your external marketing site contact form directly to this CRM via API. Enquiries automatically post with source <span className="font-semibold text-[#6CE5D0] bg-[#12312C] px-2 py-0.5 rounded-md border border-[#1D4A42]">&quot;Website&quot;</span>.
            </p>
            <div className="bg-[#030B0A] text-[#D0E5E1] p-5 rounded-2xl text-xs font-mono overflow-x-auto space-y-2 border border-[#143B35] shadow-inner">
              <div className="text-[#6CE5D0] font-semibold">// Endpoint URL</div>
              <div className="text-[#8DA09D]">POST https://your-crm-domain.com/api/contact</div>
              <div className="text-[#6CE5D0] font-semibold pt-2">// Request Payload JSON</div>
              <div className="text-[#C2D6D3] leading-relaxed">
                {`{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "phone": "+1 555-0192",
  "company": "Enterprise Corp",
  "requirements": "Interested in full IT infrastructure service package."
}`}
              </div>
            </div>
          </div>

          <div className="bg-[#0B1E1C]/90 p-6 sm:p-7 rounded-3xl border border-[#183B36] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#F0F2F5] flex items-center gap-2.5 border-b border-[#163833] pb-4">
              <div className="p-2 rounded-xl bg-[#143B35] text-[#6CE5D0]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              Automated Enquiry Routing Rules
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-[#061513] rounded-2xl border border-[#163833] space-y-1">
                <span className="font-bold text-[#E0E2EC]">1. Instant Status Tagging</span>
                <p className="text-[#8DA09D] leading-relaxed">Every submission from the website contact form is created with default status &quot;New&quot;.</p>
              </div>
              <div className="p-4 bg-[#061513] rounded-2xl border border-[#163833] space-y-1">
                <span className="font-bold text-[#E0E2EC]">2. Single-Click Sales Pipeline Promotion</span>
                <p className="text-[#8DA09D] leading-relaxed">Changing &quot;Assign Lead&quot; to &quot;assign to leads&quot; instantly changes status to &quot;Assigned&quot; and includes it in team lead assignments.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingLead && (
        <div className="fixed inset-0 bg-[#020807]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={saveLead}
            className="bg-[#0B1E1C] rounded-3xl p-6 sm:p-7 w-full max-w-lg space-y-4 shadow-2xl my-auto border border-[#1E4B43] animate-in zoom-in-95 duration-200 text-[#E0E2EC]"
          >
            <div className="flex items-center justify-between border-b border-[#163833] pb-3">
              <h2 className="text-base font-bold text-[#F0F2F5]">Edit Contact Form Enquiry</h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-xl text-[#8DA09D] hover:text-[#E0E2EC] hover:bg-[#143B35] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#8DA09D] block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border border-[#1E4B43] rounded-xl text-xs bg-[#061513] text-[#E0E2EC] focus:bg-[#0E2824] focus:ring-2 focus:ring-[#277D6C] focus:border-[#277D6C] transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8DA09D] block mb-1">Company</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-[#1E4B43] rounded-xl text-xs bg-[#061513] text-[#E0E2EC] focus:bg-[#0E2824] focus:ring-2 focus:ring-[#277D6C] focus:border-[#277D6C] transition-all"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8DA09D] block mb-1">Contact Details (Email & Phone)</label>
              <textarea
                rows={2}
                className="w-full p-2.5 border border-[#1E4B43] rounded-xl text-xs bg-[#061513] text-[#E0E2EC] focus:bg-[#0E2824] focus:ring-2 focus:ring-[#277D6C] focus:border-[#277D6C] transition-all"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#8DA09D] block mb-1">Status</label>
                <select
                  className="w-full p-2.5 border border-[#1E4B43] rounded-xl text-xs bg-[#061513] text-[#E0E2EC] focus:bg-[#0E2824] focus:ring-2 focus:ring-[#277D6C] focus:border-[#277D6C] transition-all cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {leadFlow.map((s) => (
                    <option key={s} value={s} className="bg-[#0B1E1C] text-[#E0E2EC]">{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8DA09D] block mb-1">Assign Lead</label>
                <select
                  className="w-full p-2.5 border border-[#1E4B43] rounded-xl text-xs bg-[#061513] text-[#E0E2EC] focus:bg-[#0E2824] focus:ring-2 focus:ring-[#277D6C] focus:border-[#277D6C] transition-all cursor-pointer"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                >
                  <option value="not_assigned" className="bg-[#0B1E1C] text-[#E0E2EC]">not assign to leads</option>
                  <option value="assigned" className="bg-[#0B1E1C] text-[#E0E2EC]">assign to leads</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8DA09D] block mb-1">Requirements</label>
              <textarea
                rows={3}
                className="w-full p-2.5 border border-[#1E4B43] rounded-xl text-xs bg-[#061513] text-[#E0E2EC] focus:bg-[#0E2824] focus:ring-2 focus:ring-[#277D6C] focus:border-[#277D6C] transition-all"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#163833]">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-[#1E4B43] rounded-xl text-xs font-semibold text-[#8DA09D] hover:bg-[#143B35] hover:text-[#E0E2EC] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-[#18453E] via-[#225F56] to-[#2B7D70] border border-[#277D6C]/60 text-[#72F5DE] rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}