'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  client_name: string;
  priority: string;
  status: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', client_name: '', priority: 'Medium', status: 'Open' });

  const fetchTickets = async () => {
    const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    if (data) setTickets(data);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('tickets').insert([formData]).select();
    if (!error && data) {
      setTickets([data[0], ...tickets]);
      setShowModal(false);
      setFormData({ title: '', client_name: '', priority: 'Medium', status: 'Open' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 bg-slate-50 text-slate-800 min-h-screen p-2 sm:p-4 md:p-6 font-sans">
      {/* Responsive Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">IT Service Desk & Helpdesk</h1>
          <p className="text-xs sm:text-sm text-slate-500">Track client support tickets and incident resolutions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto relative z-10 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 sm:py-2 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> Create Incident Ticket
        </button>
      </div>

      {/* Responsive Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={createTicket} className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-xl my-auto border border-slate-200 text-slate-800">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3">New Incident Ticket</h2>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Ticket Title</label>
              <input
                type="text"
                placeholder="Ticket Title / Issue Description"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Client Company</label>
              <input
                type="text"
                placeholder="Client Company Name"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Priority</label>
              <select
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all cursor-pointer"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low" className="bg-white text-slate-800">Low Priority</option>
                <option value="Medium" className="bg-white text-slate-800">Medium Priority</option>
                <option value="High" className="bg-white text-slate-800">High Priority</option>
                <option value="Urgent" className="bg-white text-slate-800">Urgent Priority</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-sm cursor-pointer">
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No tickets found.</div>
        ) : (
          <>
            {/* Desktop & Tablet Table View (Hidden on Small Screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="p-4">Ticket</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{t.title}</td>
                      <td className="p-4 text-slate-600">{t.client_name}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            t.priority === 'Urgent'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : t.priority === 'High'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout (Visible on Small Screens) */}
            <div className="block md:hidden divide-y divide-slate-200">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-800 text-base">{t.title}</div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                        t.priority === 'Urgent'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : t.priority === 'High'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-medium">Client: <span className="text-slate-800 font-semibold">{t.client_name}</span></span>
                    <span className="font-medium text-teal-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">{t.status}</span>
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