'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Download, Calendar, CheckCircle2, FileText,
  Bot, UserCheck, Trash2, Sparkles, FileCode, X, Edit,
  BarChart2, Search, Globe, Building,
  Flame, Zap, Layers, User, ChevronRight, RefreshCw, Eye, MoreHorizontal
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

  // Aggregation Metrics
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
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans pb-16 px-3 sm:px-6 text-[#d0e5e0] bg-[#061915] min-h-screen">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d2a24] border border-[#1b4a40] text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>CRM Sales Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Leads Directory & Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-[#8baab0] mt-1 font-medium">
            Real-time lead scoring, stage attribution, status tracking, and automated conversion pipelines.
          </p>
        </div>

        {/* Create Lead Action Button */}
        <button
          onClick={openCreateModal}
          className="bg-emerald-500 hover:bg-emerald-400 text-[#061915] font-black px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Lead Record</span>
        </button>
      </div>

      {/* Top Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 - Total Balance/Leads */}
        <div className="bg-[#0b241f]/80 backdrop-blur-xl p-5 rounded-2xl border border-[#16433a] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8baab0]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a0c5bd]">Total Leads</span>
            <MoreHorizontal className="w-4 h-4 cursor-pointer text-[#8baab0]" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">{metrics.totalLeads}</div>
            <div className="text-xs text-[#6e9b90] font-semibold mt-1">Active database records</div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-2 border-t border-[#16433a]/60">
            <span className="bg-[#0e352e] px-2 py-0.5 rounded-md text-emerald-400 font-bold border border-[#1d574c]">+{metrics.newToday} New</span>
            <span className="text-[#8baab0]">Added Today</span>
          </div>
        </div>

        {/* Metric 2 - Unassigned & Action Needed */}
        <div className="bg-[#0b241f]/80 backdrop-blur-xl p-5 rounded-2xl border border-[#16433a] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8baab0]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a0c5bd]">Unassigned</span>
            <MoreHorizontal className="w-4 h-4 cursor-pointer text-[#8baab0]" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-[#f59e0b] tracking-tight">{metrics.unassigned}</div>
            <div className="text-xs text-[#6e9b90] font-semibold mt-1">Pending rep assignment</div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 pt-2 border-t border-[#16433a]/60">
            <span>Requires Action</span>
          </div>
        </div>

        {/* Metric 3 - XY Line Graph: Pipeline Volume Trend */}
        <div className="bg-[#0b241f]/80 backdrop-blur-xl p-5 rounded-2xl border border-[#16433a] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8baab0] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a0c5bd]">Pipeline Trend</span>
            <span className="text-xs font-extrabold text-emerald-400">{filteredLeads.length} leads</span>
          </div>
          <div className="w-full h-16 flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="gradientLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 35 Q 20 10, 40 25 T 80 15 T 100 5 L 100 40 L 0 40 Z"
                fill="url(#gradientLine)"
              />
              <path
                d="M 0 35 Q 20 10, 40 25 T 80 15 T 100 5"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />
              <circle cx="100" cy="5" r="3" fill="#34d399" />
            </svg>
          </div>
          <div className="text-[11px] text-[#6e9b90] font-semibold pt-2 border-t border-[#16433a]/60">
            Lead acquisition velocity
          </div>
        </div>

        {/* Metric 4 - Donut Chart: Win Rate */}
        <div className="bg-[#0b241f]/80 backdrop-blur-xl p-5 rounded-2xl border border-[#16433a] shadow-xl relative overflow-hidden flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a0c5bd] block mb-1">Win Rate</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{metrics.conversionRate}%</div>
            <div className="text-xs text-[#6e9b90] font-semibold mt-1">{metrics.converted} Leads Won</div>
          </div>
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#0e352e]"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400"
                strokeDasharray={`${metrics.conversionRate}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-extrabold text-white">{metrics.conversionRate}%</span>
          </div>
        </div>

      </div>

      {/* Navigation Pills */}
      <div className="flex items-center justify-start py-2">
        <div className="inline-flex items-center gap-1.5 p-1.5 bg-[#0b241f]/90 backdrop-blur-md rounded-2xl border border-[#16433a] shadow-inner">
          {[
            { id: 'details', label: 'Overview Table', icon: FileText },
            { id: 'pipeline', label: 'Pipeline Stages', icon: CheckCircle2 },
            { id: 'automation', label: 'Automations', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-[#061915] shadow-md shadow-emerald-950/50'
                    : 'text-[#8baab0] hover:text-white hover:bg-[#0e352e]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#061915]' : 'text-[#8baab0]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-[#0b241f]/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-[#16433a] shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#16433a]/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white bg-[#0e352e] px-3 py-2 rounded-xl border border-[#1d574c]">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Timeline:</span>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="bg-[#061915] border border-[#1d574c] rounded-xl text-xs font-bold px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="daily">Today</option>
              <option value="weekly">Past 7 Days</option>
              <option value="monthly">This Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#061915] border border-[#1d574c] rounded-xl text-xs font-bold px-2.5 py-1.5 text-white"
                />
                <span className="text-xs font-bold text-[#8baab0]">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#061915] border border-[#1d574c] rounded-xl text-xs font-bold px-2.5 py-1.5 text-white"
                />
              </div>
            )}
          </div>

          <button
            onClick={exportCSV}
            className="bg-[#0e352e] hover:bg-[#13493f] text-emerald-400 border border-[#1d574c] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer w-full lg:w-auto"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="font-extrabold text-[#a0c5bd] block mb-1 uppercase text-[10px] tracking-wider">Temperature</label>
            <select
              className="w-full p-2.5 border border-[#1d574c] rounded-xl bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              value={filters.temperature}
              onChange={(e) => setFilters({ ...filters, temperature: e.target.value })}
            >
              <option value="all">All Temp</option>
              <option value="Hot">🔥 Hot</option>
              <option value="Warm">⚡ Warm</option>
              <option value="Cold">❄️ Cold</option>
            </select>
          </div>

          <div>
            <label className="font-extrabold text-[#a0c5bd] block mb-1 uppercase text-[10px] tracking-wider">Status</label>
            <select
              className="w-full p-2.5 border border-[#1d574c] rounded-xl bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
            <label className="font-extrabold text-[#a0c5bd] block mb-1 uppercase text-[10px] tracking-wider">Source</label>
            <select
              className="w-full p-2.5 border border-[#1d574c] rounded-xl bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
            <label className="font-extrabold text-[#a0c5bd] block mb-1 uppercase text-[10px] tracking-wider">Branch</label>
            <select
              className="w-full p-2.5 border border-[#1d574c] rounded-xl bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
            <label className="font-extrabold text-[#a0c5bd] block mb-1 uppercase text-[10px] tracking-wider">Service</label>
            <select
              className="w-full p-2.5 border border-[#1d574c] rounded-xl bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
              className="w-full bg-[#061915] hover:bg-[#0e352e] text-[#8baab0] hover:text-white font-extrabold p-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-[#1d574c] flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Kanban Tab */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {leadFlow.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            return (
              <div key={stage} className="bg-[#0b241f]/80 backdrop-blur-xl p-4 rounded-3xl border border-[#16433a] flex flex-col h-full min-w-[280px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#16433a]/60">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#a0c5bd] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    {stage}
                  </h4>
                  <span className="text-xs bg-[#061915] px-2.5 py-0.5 rounded-full font-black text-white border border-[#1d574c]">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="text-xs text-[#6e9b90] font-semibold italic text-center py-10 bg-[#061915]/50 rounded-2xl border border-dashed border-[#16433a]">
                      No leads in stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div key={lead.id} className="bg-[#061915] p-4 rounded-2xl border border-[#16433a] shadow-md space-y-2.5 hover:border-emerald-500/40 transition-all">
                        <div className="font-bold text-white text-sm flex items-center justify-between">
                          <span className="truncate max-w-[170px] text-white">{lead.name}</span>
                          <button
                            onClick={() => openEditModal(lead)}
                            className="text-emerald-400 hover:text-white p-1 cursor-pointer shrink-0 rounded-lg hover:bg-[#0e352e]"
                            title="Edit Lead"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs font-semibold text-[#8baab0]">{lead.company || 'Personal Lead'}</div>

                        <div className="flex items-center justify-between pt-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              lead.lead_temperature === 'Hot'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                : lead.lead_temperature === 'Cold'
                                ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            }`}
                          >
                            {lead.lead_temperature || 'Warm'}
                          </span>
                          <span className="text-[11px] font-extrabold text-[#a0c5bd]">Score: {lead.lead_score || 0}</span>
                        </div>

                        <div className="pt-2 border-t border-[#16433a]/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Details
                          </button>
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            className="text-[11px] p-1 border border-[#1d574c] rounded-lg bg-[#0b241f] text-white font-bold max-w-[120px] cursor-pointer"
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
        <div className="bg-[#0b241f]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#16433a] shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-extrabold text-base">
            <div className="p-2 rounded-xl bg-emerald-500 text-[#061915]">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span>CRM Workflow Trigger Engine</span>
          </div>
          <p className="text-xs text-[#8baab0] font-medium">Automated actions, follow-up notifications, and SLA task scheduling.</p>

          <div className="divide-y divide-[#16433a]/60">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    {lead.name}
                    <span className="text-[10px] bg-[#0e352e] text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-[#1d574c]">{lead.status}</span>
                  </div>
                  <div className="text-xs text-[#8baab0] font-semibold">
                    Company: <strong className="text-white">{lead.company || 'N/A'}</strong> | Source: <strong className="text-white">{lead.source || 'Website'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Automated follow-up triggered for ${lead.name}`)}
                  className="bg-[#0e352e] hover:bg-emerald-500 hover:text-[#061915] text-emerald-400 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all border border-[#1d574c] cursor-pointer shrink-0 w-full sm:w-auto text-center"
                >
                  Trigger Follow-up Task
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimized De-Congested Lead Table */}
      {activeTab === 'details' && (
        <div className="bg-[#0b241f]/80 backdrop-blur-xl rounded-3xl border border-[#16433a] shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-[#16433a]/60 flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#061915]/40">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e9b90]" />
              <input
                type="text"
                placeholder="Search leads by name, email, or company..."
                className="w-full pl-10 pr-3 py-2 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-semibold placeholder:text-[#6e9b90] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-xs text-[#8baab0] font-semibold">
              Showing <span className="font-extrabold text-white">{filteredLeads.length}</span> leads
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[#8baab0] text-sm font-semibold">Loading CRM records...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-[#8baab0] text-sm font-semibold">No leads matched your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#061915] border-b border-[#16433a]/60 text-[#a0c5bd] font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Lead Name & Job Title</th>
                    <th className="p-4">Company & Industry</th>
                    <th className="p-4">Temperature & Score</th>
                    <th className="p-4">Pipeline Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#16433a]/40 text-sm font-medium">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#0e352e]/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#0e352e] border border-[#1d574c] flex items-center justify-center text-emerald-400 shrink-0 font-extrabold text-xs">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{lead.name}</div>
                            <div className="text-xs text-[#8baab0] font-medium">{lead.job_title || 'Lead Contact'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{lead.company || '—'}</div>
                        <div className="text-[11px] font-semibold text-[#6e9b90]">{lead.interested_service || lead.industry || 'Client'}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              lead.lead_temperature === 'Hot'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                : lead.lead_temperature === 'Cold'
                                ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            }`}
                          >
                            {lead.lead_temperature || 'Warm'}
                          </span>
                          <span className="font-extrabold text-[#a0c5bd] text-xs">Score: {lead.lead_score || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="bg-[#061915] border border-[#1d574c] rounded-xl text-xs font-bold px-2.5 py-1.5 text-white cursor-pointer focus:ring-2 focus:ring-emerald-500"
                        >
                          {leadFlow.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="bg-[#0e352e] hover:bg-emerald-500 hover:text-[#061915] text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border border-[#1d574c] cursor-pointer flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => openEditModal(lead)}
                            className="text-[#8baab0] hover:text-white p-1.5 rounded-xl hover:bg-[#0e352e] cursor-pointer transition-colors"
                            title="Edit Lead"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-xl hover:bg-rose-950/50 cursor-pointer transition-colors"
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

      {/* Detailed Full Profile Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#0b241f] rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl border border-[#16433a] relative text-[#d0e5e0]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#16433a] pb-4">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                  CRM Lead Profile Record
                </span>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mt-1">
                  <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{selectedLead.name}</span>
                </h2>
                <p className="text-xs text-[#8baab0] font-semibold mt-0.5">{selectedLead.job_title || 'Contact Person'} at <span className="text-white font-bold">{selectedLead.company || 'N/A'}</span></p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-[#8baab0] hover:text-white p-2 rounded-xl hover:bg-[#0e352e] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Structured Info Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Personal Contact */}
              <div className="bg-[#061915] p-4 rounded-2xl border border-[#16433a] space-y-2.5">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Contact Information
                </h3>
                <div className="text-xs space-y-2 text-white font-semibold">
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Email:</span> {selectedLead.email}</p>
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Phone:</span> {selectedLead.phone || selectedLead.mobile_number || selectedLead.contact_info || 'N/A'}</p>
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Preferred Method:</span> {selectedLead.preferred_contact_method || 'Email'}</p>
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Location:</span> {selectedLead.city || 'Dubai'}, {selectedLead.country || 'UAE'}</p>
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-[#061915] p-4 rounded-2xl border border-[#16433a] space-y-2.5">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4" /> Company Profile
                </h3>
                <div className="text-xs space-y-2 text-white font-semibold">
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Company Name:</span> {selectedLead.company || 'N/A'}</p>
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Industry Sector:</span> {selectedLead.industry || 'IT / Enterprise'}</p>
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Website:</span> {selectedLead.company_website || 'N/A'}</p>
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">VAT / TRN:</span> {selectedLead.vat_trn_number || 'N/A'}</p>
                </div>
              </div>

              {/* Requirement & Budget */}
              <div className="bg-[#061915] p-4 rounded-2xl border border-[#16433a] space-y-2.5">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Deal Specifications
                </h3>
                <div className="text-xs space-y-2 text-white font-semibold">
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Service Category:</span> {selectedLead.interested_service || 'IT Services'}</p>
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Estimated Budget:</span> ${selectedLead.estimated_budget?.toLocaleString() || '0'}</p>
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Timeline:</span> {selectedLead.project_timeline || '1-3 Months'}</p>
                  <p><span className="text-[#6e9b90] block text-[10px] uppercase font-bold">Creation Date:</span> {formatDateDDMMYYYY(selectedLead.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Detailed Requirements Description */}
            <div className="space-y-2">
              <label className="text-xs font-black text-white uppercase tracking-wider">Detailed Lead Requirements</label>
              <div className="bg-[#061915] p-4 rounded-2xl border border-[#16433a] text-xs text-[#d0e5e0] font-medium whitespace-pre-wrap min-h-[90px]">
                {selectedLead.requirements || selectedLead.requirement_description || 'No detailed requirements submitted for this record.'}
              </div>
            </div>

            {/* Marketing Attribution Details */}
            <div className="bg-[#061915] p-4 rounded-2xl border border-[#16433a] space-y-2">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> Attribution & Source Metrics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                <div>
                  <span className="text-[#6e9b90] text-[10px] uppercase font-bold block">Lead Source</span>
                  <span className="font-extrabold text-white">{selectedLead.source || 'Website'}</span>
                </div>
                <div>
                  <span className="text-[#6e9b90] text-[10px] uppercase font-bold block">Campaign</span>
                  <span className="font-extrabold text-white">{selectedLead.campaign_name || 'Direct / Organic'}</span>
                </div>
                <div>
                  <span className="text-[#6e9b90] text-[10px] uppercase font-bold block">UTM Source</span>
                  <span className="font-extrabold text-white">{selectedLead.utm_source || 'organic'}</span>
                </div>
                <div>
                  <span className="text-[#6e9b90] text-[10px] uppercase font-bold block">UTM Medium</span>
                  <span className="font-extrabold text-white">{selectedLead.utm_medium || 'cpc'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#16433a]/60">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-6 py-2.5 bg-[#0e352e] hover:bg-[#13493f] text-white font-extrabold text-xs rounded-xl transition-all border border-[#1d574c] cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={saveLead} className="bg-[#0b241f] rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-[#16433a] text-[#d0e5e0]">
            <h2 className="text-lg font-extrabold text-white border-b border-[#16433a] pb-3">
              {editingLead ? 'Edit Lead Record' : 'Add New Lead Contact'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 placeholder:text-[#6e9b90]"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. IT Director"
                  className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 placeholder:text-[#6e9b90]"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Contact Info (Phone / Email)</label>
              <textarea
                rows={2}
                required
                placeholder={"+1 (555) 000-0000\nemail@company.com"}
                className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 placeholder:text-[#6e9b90]"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Company</label>
                <input
                  type="text"
                  placeholder="Enterprise Inc."
                  className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 placeholder:text-[#6e9b90]"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Website</label>
                <input
                  type="text"
                  placeholder="https://company.com"
                  className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 placeholder:text-[#6e9b90]"
                  value={formData.company_website}
                  onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Pipeline Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {leadFlow.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Lead Source</label>
                <select
                  className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
                <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Lead Temperature</label>
                <select
                  className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  value={formData.lead_temperature}
                  onChange={(e) => setFormData({ ...formData, lead_temperature: e.target.value as any })}
                >
                  <option value="Hot">🔥 Hot</option>
                  <option value="Warm">⚡ Warm</option>
                  <option value="Cold">❄️ Cold</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Lead Score (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500"
                  value={formData.lead_score}
                  onChange={(e) => setFormData({ ...formData, lead_score: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#a0c5bd] block mb-1">Requirements Details</label>
              <textarea
                rows={3}
                placeholder="Enter client technical or project requirements..."
                className="w-full p-2.5 border border-[#1d574c] rounded-xl text-xs bg-[#061915] text-white font-bold focus:ring-2 focus:ring-emerald-500 placeholder:text-[#6e9b90]"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#16433a]">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 border border-[#1d574c] rounded-xl text-xs font-bold text-[#8baab0] hover:bg-[#0e352e] cursor-pointer"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#061915] font-black rounded-xl text-xs transition-all shadow-md cursor-pointer"
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