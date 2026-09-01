'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp, Plus, Download, Calendar, DollarSign, FileCheck,
  Percent, Handshake, CreditCard, ShieldCheck, PieChart
} from 'lucide-react';

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  status: string;
  created_at: string;
}

export default function SalesModule() {
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'quotations' | 'approvals' | 'handover'>('overview');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');

  const salesPipeline = ['Qualified', 'Requirement', 'Proposal', 'Negotiation', 'Approval', 'Won', 'Lost', 'Payment & Handover'];

  const fetchDeals = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) {
      setDeals(data.map(d => ({
        id: d.id,
        name: d.name,
        company: d.company || 'Enterprise Account',
        value: d.value || 0,
        status: d.status === 'Converted' ? 'Won' : d.status,
        created_at: d.created_at
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchDeals(); }, []);

  const exportSalesCSV = () => {
    const headers = ['Deal Name,Company,Value,Stage Status,Created At\n'];
    const rows = deals.map(d => `"${d.name}","${d.company}",${d.value},"${d.status}","${new Date(d.created_at).toLocaleDateString()}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_export_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600 shrink-0" />
            Sales Operations & Deals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Flow: <span className="font-semibold text-slate-700">Qualified → Requirement → Proposal → Negotiation → Approval → Won/Lost → Payment & Handover</span>
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview & Export', icon: PieChart },
          { id: 'deals', label: 'Pipeline & Deals', icon: DollarSign },
          { id: 'quotations', label: 'Quotations & Proposals', icon: FileCheck },
          { id: 'approvals', label: 'Discount Approvals', icon: Percent },
          { id: 'handover', label: 'Payment & Handover', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Analytics Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-100 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Filter Range:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-md text-xs font-semibold px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="daily">Daily Basis</option>
                <option value="weekly">Weekly Basis</option>
                <option value="monthly">Monthly Basis</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            <button
              onClick={exportSalesCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Sales Report (CSV)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Won Revenue</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                ${deals.filter(d => d.status === 'Won').reduce((sum, d) => sum + d.value, 0).toLocaleString()}
              </h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Forecasted Revenue</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                ${deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
              </h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Negotiation Phase</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {deals.filter(d => d.status === 'Negotiation').length} Deals
              </h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {deals.filter(d => d.status === 'Approval').length} Deals
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Deals & Pipeline View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading deal data...</div>
        ) : deals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No sales deals found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Account / Client</th>
                  <th className="p-4">Deal Opportunity</th>
                  <th className="p-4">Deal Value</th>
                  <th className="p-4">Pipeline Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{deal.company}</td>
                    <td className="p-4 text-slate-700">{deal.name}</td>
                    <td className="p-4 font-semibold text-slate-900">${deal.value.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        deal.status === 'Won' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {deal.status}
                      </span>
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