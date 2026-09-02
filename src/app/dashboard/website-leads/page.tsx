'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Globe, UserCheck, Trash2, Edit, Phone, Mail, Building, FileText, CheckCircle2 } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  assigned_to?: string | null;
  requirements?: string;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
}

export default function WebsiteContactLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchWebsiteLeads = async () => {
    setLoading(true);
    const [leadsRes, empRes] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .eq('source', 'Website')
        .order('created_at', { ascending: false }),
      supabase.from('employees').select('id, full_name')
    ]);

    if (leadsRes.data) setLeads(leadsRes.data);
    if (empRes.data) setEmployees(empRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWebsiteLeads();
  }, []);

  // Handle lead assignment to a sales representative / employee
  const handleAssignLead = async (leadId: string, employeeName: string) => {
    const newStatus = employeeName ? 'Assigned' : 'New';
    
    const { error } = await supabase
      .from('leads')
      .update({ 
        assigned_to: employeeName || null,
        status: newStatus 
      })
      .eq('id', leadId);

    if (error) {
      alert(`Assignment failed: ${error.message}`);
      return;
    }

    setLeads(leads.map(l => l.id === leadId ? { ...l, assigned_to: employeeName, status: newStatus } : l));
  };

  // Delete lead record
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this website lead?')) return;
    
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }

    setLeads(leads.filter(l => l.id !== id));
  };

  // Save edited lead details
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    const { error } = await supabase
      .from('leads')
      .update({
        name: editingLead.name,
        email: editingLead.email,
        phone: editingLead.phone,
        company: editingLead.company,
        requirements: editingLead.requirements,
      })
      .eq('id', editingLead.id);

    if (error) {
      alert(`Update failed: ${error.message}`);
      return;
    }

    setLeads(leads.map(l => l.id === editingLead.id ? editingLead : l));
    setShowEditModal(false);
    setEditingLead(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600 shrink-0" />
            Website Contact Form Leads
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time inquiries captured from 4bizinternational.com contact forms. Assign leads directly to pipeline team members.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-2 text-blue-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{leads.length} Total Web Inquiries</span>
        </div>
      </div>

      {/* Main Table / Grid Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading website leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Globe className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-700 text-base">No website contact leads yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Submissions made through your official website contact form will instantly sync here as fresh leads.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Prospect / Contact</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Requirements / Message</th>
                  <th className="p-4">Date Received</th>
                  <th className="p-4">Assign Lead</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 align-top">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lead.company || 'Independent'}</span>
                      </div>
                    </td>

                    <td className="p-4 align-top max-w-xs">
                      {lead.requirements ? (
                        <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 line-clamp-3">
                          {lead.requirements}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No requirements specified</span>
                      )}
                    </td>

                    <td className="p-4 align-top text-xs font-medium text-slate-600">
                      {new Date(lead.created_at).toLocaleDateString()} at {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Assignment Field Option */}
                    <td className="p-4 align-top">
                      <div className="space-y-1">
                        <select
                          value={lead.assigned_to || ''}
                          onChange={(e) => handleAssignLead(lead.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg text-xs font-semibold px-3 py-2 focus:ring-2 focus:ring-blue-600 text-slate-800 shadow-xs"
                        >
                          <option value="">-- Unassigned (Fresh) --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.full_name}>
                              Assign to: {emp.full_name}
                            </option>
                          ))}
                        </select>
                        <div className="text-[10px] text-slate-400 px-1">
                          Status: <span className="font-semibold text-slate-600">{lead.status}</span>
                        </div>
                      </div>
                    </td>

                    {/* Edit & Delete Options */}
                    <td className="p-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Lead Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Edit Modal */}
      {showEditModal && editingLead && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Edit Website Lead</h2>
            
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={editingLead.name}
                onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={editingLead.email}
                onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={editingLead.phone || ''}
                onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Company</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={editingLead.company || ''}
                onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Requirements</label>
              <textarea
                rows={3}
                className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={editingLead.requirements || ''}
                onChange={(e) => setEditingLead({ ...editingLead, requirements: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
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