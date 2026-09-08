'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Download, Calendar, CheckCircle2, FileText,
  Bot, UserCheck, Trash2, PhoneCall, Sparkles, FileCode, X, Edit,
  BarChart2, Search, Globe, Building,
  Flame, Zap, Layers, User, ChevronRight, RefreshCw
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

  // Extended CRM Schema Fields
  first_name?: string;
  last_name?: string;
  display_name?: string;
  job_title?: string;
  department?: string;
  secondary_email?: string;
  mobile_number?: string;
  alternative_number?: string;
  whatsapp_number?: string;
  preferred_contact_method?: string;
  preferred_language?: string;
  contact_time_preference?: string;
  country?: string;
  emirate_state?: string;
  city?: string;
  address?: string;
  time_zone?: string;
  company_website?: string;
  industry?: string;
  company_size?: string;
  number_of_employees?: number;
  annual_revenue_range?: string;
  business_type?: string;
  company_location?: string;
  vat_trn_number?: string;
  customer_type?: string;
  parent_company?: string;
  linkedin_company_url?: string;
  interested_service?: string;
  sub_service?: string;
  product_category?: string;
  requirement_description?: string;
  main_pain_point?: string;
  expected_solution?: string;
  estimated_budget?: number;
  expected_purchase_date?: string;
  project_timeline?: string;
  urgency?: string;
  quantity?: number;
  project_location?: string;
  existing_vendor?: string;
  competitors_considered?: string;
  additional_requirements?: string;
  sub_source?: string;
  campaign_id?: string;
  ad_set?: string;
  ad_name?: string;
  keyword?: string;
  landing_page?: string;
  referral_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  first_touch_source?: string;
  latest_touch_source?: string;
  lead_temperature?: 'Hot' | 'Warm' | 'Cold';
  lead_score?: number;
  branch?: string;
  team?: string;
  last_activity_at?: string;
  follow_up_date?: string;
  first_response_time_minutes?: number;
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
  const [searchQuery, setSearchQuery] = useState('');

  // Extended CRM Multi-Parametric Filter State
  const [filters, setFilters] = useState({
    leadOwner: 'all',
    team: 'all',
    branch: 'all',
    source: 'all',
    campaign: 'all',
    status: 'all',
    service: 'all',
    country: 'all',
    temperature: 'all',
    minScore: 0,
    maxScore: 100,
  });

  const [formData, setFormData] = useState({
    name: '',
    first_name: '',
    last_name: '',
    contact_info: '',
    phone: '',
    secondary_email: '',
    mobile_number: '',
    company: '',
    company_website: '',
    industry: '',
    job_title: '',
    source: 'Manual / Outreach',
    campaign_name: '',
    requirements: '',
    interested_service: '',
    estimated_budget: 0,
    status: 'New',
    lead_temperature: 'Warm' as 'Hot' | 'Warm' | 'Cold',
    lead_score: 50,
    branch: 'Main Branch',
    team: 'Sales Team',
    country: 'UAE',
    city: 'Dubai',
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
      // Search Filter
      if (
        searchQuery &&
        !lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !lead.company?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Date Range Filter
      const leadDate = new Date(lead.created_at);
      if (dateRange === 'daily') {
        if (leadDate.toDateString() !== now.toDateString()) return false;
      } else if (dateRange === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        if (leadDate < oneWeekAgo) return false;
      } else if (dateRange === 'monthly') {
        if (leadDate.getMonth() !== now.getMonth() || leadDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateRange === 'custom') {
        if (startDate && leadDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (leadDate > end) return false;
        }
      }

      // Multi-Parametric CRM Filters
      if (filters.leadOwner !== 'all' && lead.assigned_to !== filters.leadOwner) return false;
      if (filters.team !== 'all' && lead.team !== filters.team) return false;
      if (filters.branch !== 'all' && lead.branch !== filters.branch) return false;
      if (filters.source !== 'all' && lead.source !== filters.source) return false;
      if (filters.campaign !== 'all' && lead.campaign_name !== filters.campaign) return false;
      if (filters.status !== 'all' && lead.status !== filters.status) return false;
      if (filters.service !== 'all' && lead.interested_service !== filters.service) return false;
      if (filters.country !== 'all' && lead.country !== filters.country) return false;
      if (filters.temperature !== 'all' && lead.lead_temperature !== filters.temperature) return false;

      const score = lead.lead_score || 0;
      if (score < filters.minScore || score > filters.maxScore) return false;

      return true;
    });
  }, [leads, dateRange, startDate, endDate, filters, searchQuery]);

  // Dashboard Aggregation Analytics Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toDateString();
    const nowTs = new Date().getTime();

    let newToday = 0;
    let unassigned = 0;
    let hot = 0;
    let warm = 0;
    let cold = 0;
    let qualified = 0;
    let converted = 0;
    let disqualified = 0;
    let followUpsDueToday = 0;
    let overdueFollowUps = 0;
    let totalFirstResponseMinutes = 0;
    let respondedLeadsCount = 0;

    filteredLeads.forEach((lead) => {
      const createdAt = new Date(lead.created_at);
      if (createdAt.toDateString() === todayStr) newToday++;
      if (!lead.assigned_to) unassigned++;

      const temp = lead.lead_temperature || 'Warm';
      if (temp === 'Hot') hot++;
      if (temp === 'Warm') warm++;
      if (temp === 'Cold') cold++;

      if (lead.status === 'Qualified') qualified++;
      if (lead.status === 'Converted') converted++;
      if (lead.status === 'Disqualified') disqualified++;

      if (lead.follow_up_date) {
        const followUpTs = new Date(lead.follow_up_date).getTime();
        const followUpDateStr = new Date(lead.follow_up_date).toDateString();
        if (followUpDateStr === todayStr) followUpsDueToday++;
        if (followUpTs < nowTs && followUpDateStr !== todayStr) overdueFollowUps++;
      }

      if (lead.first_response_time_minutes) {
        totalFirstResponseMinutes += lead.first_response_time_minutes;
        respondedLeadsCount++;
      }
    });

    const conversionRate = filteredLeads.length > 0 ? Math.round((converted / filteredLeads.length) * 100) : 0;
    const avgResponseTimeHours = respondedLeadsCount > 0 ? (totalFirstResponseMinutes / respondedLeadsCount / 60).toFixed(1) : 'N/A';

    return {
      totalLeads: filteredLeads.length,
      newToday,
      unassigned,
      hot,
      warm,
      cold,
      qualified,
      converted,
      disqualified,
      followUpsDueToday,
      overdueFollowUps,
      avgResponseTimeHours,
      conversionRate,
    };
  }, [filteredLeads]);

  const saveLead = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, any> = {
      name: formData.name,
      first_name: formData.first_name || formData.name.split(' ')[0] || null,
      last_name: formData.last_name || formData.name.split(' ').slice(1).join(' ') || null,
      email: formData.contact_info.includes('@')
        ? formData.contact_info.split('\n')[0].trim()
        : `${formData.name.toLowerCase().replace(/\s+/g, '')}@lead.com`,
      phone: formData.phone || formData.contact_info.split('\n')[0].trim(),
      mobile_number: formData.mobile_number || null,
      secondary_email: formData.secondary_email || null,
      contact_info: formData.contact_info,
      company: formData.company || null,
      company_website: formData.company_website || null,
      industry: formData.industry || null,
      job_title: formData.job_title || null,
      source: formData.source || 'Manual / Outreach',
      status: formData.status,
      notes: formData.notes || null,
      campaign_name: formData.campaign_name || null,
      requirements: formData.requirements || null,
      interested_service: formData.interested_service || null,
      estimated_budget: formData.estimated_budget || 0,
      lead_temperature: formData.lead_temperature,
      lead_score: formData.lead_score,
      branch: formData.branch,
      team: formData.team,
      country: formData.country,
      city: formData.city,
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
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      contact_info: lead.contact_info || lead.phone || lead.email || '',
      phone: lead.phone || '',
      secondary_email: lead.secondary_email || '',
      mobile_number: lead.mobile_number || '',
      company: lead.company || '',
      company_website: lead.company_website || '',
      industry: lead.industry || '',
      job_title: lead.job_title || '',
      source: lead.source || 'Manual / Outreach',
      campaign_name: lead.campaign_name || '',
      requirements: lead.requirements || '',
      interested_service: lead.interested_service || '',
      estimated_budget: lead.estimated_budget || 0,
      status: lead.status || 'New',
      lead_temperature: lead.lead_temperature || 'Warm',
      lead_score: lead.lead_score || 50,
      branch: lead.branch || 'Main Branch',
      team: lead.team || 'Sales Team',
      country: lead.country || 'UAE',
      city: lead.city || 'Dubai',
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
      first_name: '',
      last_name: '',
      contact_info: '',
      phone: '',
      secondary_email: '',
      mobile_number: '',
      company: '',
      company_website: '',
      industry: '',
      job_title: '',
      source: 'Manual / Outreach',
      campaign_name: '',
      requirements: '',
      interested_service: '',
      estimated_budget: 0,
      status: 'New',
      lead_temperature: 'Warm',
      lead_score: 50,
      branch: 'Main Branch',
      team: 'Sales Team',
      country: 'UAE',
      city: 'Dubai',
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
    const headers = ['Name,Contact Details,Company,Source,Campaign,Requirements,Status,Lead Temperature,Score,Date Created\n'];
    const rows = filteredLeads
      .map((l) => {
        const formattedDate = formatDateDDMMYYYY(l.created_at);
        const cleanReq = (l.requirements || '').replace(/"/g, '""');
        const cleanContact = (l.contact_info || l.phone || l.email || '').replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${l.name}","${cleanContact}","${l.company || ''}","${l.source || ''}","${l.campaign_name || ''}","${cleanReq}","${l.status}","${l.lead_temperature || 'Warm'}","${l.lead_score || 0}","${formattedDate}"`;
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
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans pb-12 px-2 sm:px-4 md:px-6">
      
      {/* Executive CRM Header Container */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <UserCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Unified Leads Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              Leads Directory & Pipeline Management
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
              Real-time lead scoring, acquisition attribution, status tracking, and automated workflows.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shrink-0 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Lead Record</span>
        </button>
      </div>

      {/* Analytics Summary Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Total Leads</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{metrics.totalLeads}</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
            <span className="bg-emerald-50 px-1.5 py-0.5 rounded-md text-emerald-800 border border-emerald-200/80">+{metrics.newToday} New</span>
            <span className="text-[10px] text-slate-500 font-semibold">Today</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Unassigned</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">{metrics.unassigned}</div>
          <span className="text-[10px] text-slate-600 font-bold">Pending Sales Action</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Temperature</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 flex items-center gap-1 mt-0.5">
            <span className="text-rose-600">{metrics.hot}</span>
            <span className="text-slate-400">/</span>
            <span className="text-amber-600">{metrics.warm}</span>
            <span className="text-slate-400">/</span>
            <span className="text-blue-600">{metrics.cold}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold">
            <span className="text-rose-700 font-black">Hot</span> • <span className="text-amber-700 font-black">Warm</span> • <span className="text-blue-700 font-black">Cold</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Follow-ups</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 tracking-tight">{metrics.followUpsDueToday}</div>
          <div className="mt-1 text-[10px] font-bold">
            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/80">{metrics.overdueFollowUps} Overdue</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Avg Response</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 tracking-tight">{metrics.avgResponseTimeHours} <span className="text-xs font-bold text-slate-600">hrs</span></div>
          <span className="text-[10px] text-slate-600 font-bold">SLA Response Time</span>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Conversion</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 tracking-tight">{metrics.conversionRate}%</div>
          <span className="text-[10px] text-slate-600 font-bold">{metrics.converted} Leads Converted</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full overflow-x-auto no-scrollbar py-1">
        <div className="inline-flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-full min-w-max">
          {[
            { id: 'details', label: 'Lead Directory Table', icon: FileText },
            { id: 'pipeline', label: 'Kanban Pipeline & Status', icon: CheckCircle2 },
            { id: 'automation', label: 'Automations & Workflows', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Multi-Parametric Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 bg-slate-100/80 px-3 py-2 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Timeline:</span>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-xl text-xs font-bold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 shadow-2xs cursor-pointer"
            >
              <option value="all">All Available Dates</option>
              <option value="daily">Today Only</option>
              <option value="weekly">Past 7 Days</option>
              <option value="monthly">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {dateRange === 'custom' && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl text-xs font-bold px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 text-slate-900 shadow-2xs"
                />
                <span className="text-xs font-bold text-slate-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl text-xs font-bold px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 text-slate-900 shadow-2xs"
                />
              </div>
            )}
          </div>

          <button
            onClick={exportCSV}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 cursor-pointer w-full lg:w-auto"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export CSV Data</span>
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="font-extrabold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">Temperature</label>
            <select
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold shadow-2xs focus:ring-2 focus:ring-blue-600 cursor-pointer"
              value={filters.temperature}
              onChange={(e) => setFilters({ ...filters, temperature: e.target.value })}
            >
              <option value="all">All Temperatures</option>
              <option value="Hot">🔥 Hot</option>
              <option value="Warm">⚡ Warm</option>
              <option value="Cold">❄️ Cold</option>
            </select>
          </div>

          <div>
            <label className="font-extrabold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">Pipeline Status</label>
            <select
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold shadow-2xs focus:ring-2 focus:ring-blue-600 cursor-pointer"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              {leadFlow.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-extrabold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">Source Channel</label>
            <select
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold shadow-2xs focus:ring-2 focus:ring-blue-600 cursor-pointer"
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            >
              <option value="all">All Sources</option>
              <option value="Manual / Outreach">Manual / Outreach</option>
              <option value="Website">Website Form</option>
              <option value="Google Ads">Google Ads</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Referral">Referral</option>
            </select>
          </div>

          <div>
            <label className="font-extrabold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">Branch Office</label>
            <select
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold shadow-2xs focus:ring-2 focus:ring-blue-600 cursor-pointer"
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            >
              <option value="all">All Branches</option>
              <option value="Main Branch">Main Branch</option>
              <option value="Dubai Office">Dubai Office</option>
              <option value="Abu Dhabi Office">Abu Dhabi Office</option>
            </select>
          </div>

          <div>
            <label className="font-extrabold text-slate-700 block mb-1 uppercase text-[10px] tracking-wider">Target Service</label>
            <select
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold shadow-2xs focus:ring-2 focus:ring-blue-600 cursor-pointer"
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
            >
              <option value="all">All Services</option>
              <option value="IT Consulting">IT Consulting</option>
              <option value="Cloud Migration">Cloud Migration</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Custom ERP">Custom ERP</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  leadOwner: 'all',
                  team: 'all',
                  branch: 'all',
                  source: 'all',
                  campaign: 'all',
                  status: 'all',
                  service: 'all',
                  country: 'all',
                  temperature: 'all',
                  minScore: 0,
                  maxScore: 100,
                })
              }
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold p-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-300 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Tab View */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {leadFlow.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            return (
              <div key={stage} className="bg-slate-50 p-4 rounded-3xl border border-slate-200 flex flex-col h-full min-w-[280px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    {stage}
                  </h4>
                  <span className="text-xs bg-white px-2.5 py-0.5 rounded-full font-black text-slate-900 border border-slate-300 shadow-2xs">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="text-xs text-slate-500 font-semibold italic text-center py-10 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                      No leads in {stage}
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div key={lead.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md shadow-slate-100 space-y-2.5 hover:shadow-lg transition-all">
                        <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                          <span className="truncate max-w-[170px] text-slate-900">{lead.name}</span>
                          <button
                            onClick={() => openEditModal(lead)}
                            className="text-slate-500 hover:text-blue-600 p-1 cursor-pointer shrink-0 rounded-lg hover:bg-slate-100"
                            title="Edit Lead"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs font-medium text-slate-700 whitespace-pre-line truncate">{lead.contact_info || lead.phone || lead.email}</div>
                        
                        {lead.requirements && (
                          <div className="text-xs bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-800 mt-1 line-clamp-2">
                            <span className="font-bold text-slate-900">Req: </span>
                            {lead.requirements}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              lead.lead_temperature === 'Hot'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : lead.lead_temperature === 'Cold'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {lead.lead_temperature || 'Warm'}
                          </span>
                          <span className="text-[11px] font-black text-slate-900">Score: {lead.lead_score || 0}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-600 font-bold truncate">
                            {formatDateDDMMYYYY(lead.created_at)}
                          </span>
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            className="text-[11px] p-1 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-bold max-w-[120px] cursor-pointer"
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

      {/* Automation Tab View */}
      {activeTab === 'automation' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100 space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 font-black text-base">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span>CRM Lead Automations & Activity Schedule</span>
          </div>
          <p className="text-xs text-slate-700 font-semibold">Automated workflow logs and scheduled actions based on current lead pipelines.</p>

          <div className="divide-y divide-slate-100">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {lead.name}
                    <span className="text-[10px] bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-extrabold border border-slate-200">{lead.status}</span>
                  </div>
                  <div className="text-xs text-slate-700 flex flex-wrap items-center gap-2 font-semibold">
                    <span>Source: <strong className="text-slate-900">{lead.source}</strong></span> • 
                    <span>Pipeline Status: <strong className="text-slate-900">{lead.status}</strong></span>
                  </div>
                  {lead.requirements && (
                    <div className="text-xs text-slate-800 line-clamp-1 bg-slate-50 p-2 rounded-xl border border-slate-200 max-w-2xl font-medium">
                      <span className="font-bold text-slate-900">Requirements:</span> {lead.requirements}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => alert(`Automated follow-up task triggered for ${lead.name}`)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 cursor-pointer shrink-0 w-full sm:w-auto text-center"
                >
                  Trigger Follow-up Action
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Directory Table View */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search leads by name, email, or company..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-xs text-slate-700 font-bold self-end sm:self-center">
              Showing <span className="font-black text-slate-900">{filteredLeads.length}</span> matching leads
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-600 text-sm font-bold">Loading lead database...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-600 text-sm font-bold">No lead records found for selected filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Lead Contact</th>
                    <th className="p-4">Company & Service</th>
                    <th className="p-4 max-w-xs">Requirements</th>
                    <th className="p-4">Campaign Source</th>
                    <th className="p-4">Score & Temp</th>
                    <th className="p-4">Date Created</th>
                    <th className="p-4">Lead Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs mt-0.5">
                            <User className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{lead.name}</div>
                            <div className="text-xs text-slate-700 font-semibold flex items-start gap-1.5 mt-1 whitespace-pre-line">
                              <PhoneCall className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" /> 
                              <span>{lead.contact_info || lead.phone || lead.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-900">{lead.company || '—'}</div>
                        <div className="text-[11px] font-extrabold text-blue-700 mt-0.5">{lead.interested_service || lead.industry || 'IT Client'}</div>
                      </td>
                      <td className="p-4 align-top max-w-xs">
                        {lead.requirements ? (
                          <div 
                            onClick={() => setSelectedLead(lead)}
                            className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 line-clamp-2 cursor-pointer hover:bg-blue-50/60 hover:border-blue-300 transition-all font-medium"
                            title="Click to view full requirements & full lead profile"
                          >
                            {lead.requirements}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium italic">No requirements specified</span>
                        )}
                      </td>
                      <td className="p-4 align-top text-xs font-bold text-slate-800">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-black border border-slate-200">{lead.source || 'Website'}</span>
                        {lead.campaign_name && <div className="text-[10px] text-slate-600 mt-1 font-semibold">{lead.campaign_name}</div>}
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              lead.lead_temperature === 'Hot'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : lead.lead_temperature === 'Cold'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {lead.lead_temperature || 'Warm'}
                          </span>
                          <span className="font-black text-slate-900 text-xs">{lead.lead_score || 0}</span>
                        </div>
                      </td>
                      <td className="p-4 align-top text-xs font-bold text-slate-800">
                        {formatDateDDMMYYYY(lead.created_at)}
                      </td>
                      <td className="p-4 align-top">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded-xl text-xs font-bold px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 text-slate-900 shadow-2xs cursor-pointer"
                        >
                          {leadFlow.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(lead)}
                            className="text-slate-600 hover:text-blue-600 p-1.5 rounded-xl transition-colors cursor-pointer hover:bg-slate-100"
                            title="Edit Lead"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-slate-600 hover:text-rose-600 p-1.5 rounded-xl transition-colors cursor-pointer hover:bg-rose-50"
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

      {/* Extended Profile & Requirements Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl my-auto border border-slate-200 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">
                  Lead Profile #{selectedLead.id.slice(0, 8)}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>{selectedLead.name}</span>
                </h2>
                <p className="text-xs text-slate-700 font-bold">{selectedLead.job_title || 'Decision Maker'} at <span className="font-black text-slate-900">{selectedLead.company || 'Personal / N/A'}</span></p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Structured Profile Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Section 1: Personal Details */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h3 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Personal Details
                </h3>
                <div className="text-xs space-y-2 text-slate-900 font-bold">
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Email:</span> {selectedLead.email}</p>
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Phone:</span> {selectedLead.mobile_number || selectedLead.phone || selectedLead.contact_info || 'N/A'}</p>
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Preferred Method:</span> {selectedLead.preferred_contact_method || 'Email'}</p>
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Location:</span> {selectedLead.city || 'Dubai'}, {selectedLead.country || 'UAE'}</p>
                </div>
              </div>

              {/* Section 2: Company Details */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h3 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4" /> Company Details
                </h3>
                <div className="text-xs space-y-2 text-slate-900 font-bold">
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Company:</span> {selectedLead.company || 'N/A'}</p>
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Industry:</span> {selectedLead.industry || 'IT Services'}</p>
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Website:</span> {selectedLead.company_website || 'N/A'}</p>
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">VAT / TRN:</span> {selectedLead.vat_trn_number || 'N/A'}</p>
                </div>
              </div>

              {/* Section 3: Requirements & Budget */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h3 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Requirements & Budget
                </h3>
                <div className="text-xs space-y-2 text-slate-900 font-bold">
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Service:</span> {selectedLead.interested_service || 'IT Solutions'}</p>
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Est. Budget:</span> ${selectedLead.estimated_budget?.toLocaleString() || '0'}</p>
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Timeline:</span> {selectedLead.project_timeline || '1-3 Months'}</p>
                  <p><span className="font-extrabold text-slate-500 block text-[10px] uppercase">Urgency:</span> {selectedLead.urgency || 'Medium'}</p>
                </div>
              </div>
            </div>

            {/* Detailed Requirements Description */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider">Requirements Specifications</label>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-sm text-slate-900 font-medium whitespace-pre-wrap min-h-[90px] shadow-2xs">
                {selectedLead.requirements || selectedLead.requirement_description || 'No custom requirements specified.'}
              </div>
            </div>

            {/* Marketing Source Attribution Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
              <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> Marketing Attribution & Source
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-900 pt-1">
                <div>
                  <span className="font-extrabold text-slate-500 text-[10px] uppercase block">Lead Source</span>
                  <span className="font-black text-slate-900">{selectedLead.source || 'Website'}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 text-[10px] uppercase block">Campaign Name</span>
                  <span className="font-black text-slate-900">{selectedLead.campaign_name || 'Direct / Organic'}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 text-[10px] uppercase block">UTM Source</span>
                  <span className="font-black text-slate-900">{selectedLead.utm_source || 'google'}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 text-[10px] uppercase block">UTM Medium</span>
                  <span className="font-black text-slate-900">{selectedLead.utm_medium || 'cpc'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-slate-800 to-slate-950 hover:from-slate-900 hover:to-black text-white font-bold text-xs rounded-xl transition-all cursor-pointer w-full sm:w-auto text-center shadow-md"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <form onSubmit={saveLead} className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl my-auto border border-slate-200">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-3">
              {editingLead ? 'Edit Lead Details' : 'Add New Lead Contact'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-1">Job Title / Designation</label>
                <input
                  type="text"
                  placeholder="e.g. IT Director"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-800 block mb-1">Contact Details (Phone / Email / Address)</label>
              <textarea
                rows={2}
                required
                placeholder={"+1 (555) 000-0000\nemail@company.com\n123 Business St, Suite 100"}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="Enterprise Inc."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-1">Company Website</label>
                <input
                  type="text"
                  placeholder="https://company.com"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                  value={formData.company_website}
                  onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-1">Pipeline Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  {leadFlow.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-1">Lead Source</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600 cursor-pointer"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-1">Lead Temperature</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  value={formData.lead_temperature}
                  onChange={(e) => setFormData({ ...formData, lead_temperature: e.target.value as any })}
                >
                  <option value="Hot">🔥 Hot</option>
                  <option value="Warm">⚡ Warm</option>
                  <option value="Cold">❄️ Cold</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-1">Lead Score (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                  value={formData.lead_score}
                  onChange={(e) => setFormData({ ...formData, lead_score: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-800 block mb-1">Requirements Details</label>
              <textarea
                rows={3}
                placeholder="Enter client technical or project requirements..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer w-full sm:w-auto text-center"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer w-full sm:w-auto text-center"
              >
                {editingLead ? 'Update Lead' : 'Save Lead'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}