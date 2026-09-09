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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 bg-[#040D0C] text-[#E0E2EC] min-h-screen p-2 sm:p-4 md:p-6 font-sans">
      {/* Responsive Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1E1C]/90 p-5 rounded-2xl border border-[#183B36] shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-[#1A5248]/30 via-[#277D6C]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-[#F0F2F5]">IT Service Desk & Helpdesk</h1>
          <p className="text-xs sm:text-sm text-[#8DA09D]">Track client support tickets and incident resolutions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto relative z-10 bg-gradient-to-r from-[#5BE3CA] via-[#34A08B] to-[#257A6A] hover:from-[#72F5DE] hover:to-[#34A08B] text-[#051815] font-bold px-4 py-2.5 sm:py-2 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#000000]/50 transition-all border border-[#8BFFEC]/40 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#051815]" /> Create Incident Ticket
        </button>
      </div>

      {/* Responsive Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#020807]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={createTicket} className="bg-[#0B1E1C] rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl my-auto border border-[#1E4B43] text-[#E0E2EC]">
            <h2 className="text-lg font-bold text-[#F0F2F5] border-b border-[#163833] pb-3">New Incident Ticket</h2>
            <div>
              <label className="text-xs font-semibold text-[#8DA09D] block mb-1">Ticket Title</label>
              <input
                type="text"
                placeholder="Ticket Title / Issue Description"
                required
                className="w-full p-2.5 sm:p-2 border border-[#1E4B43] rounded-xl text-sm bg-[#061513] text-[#E0E2EC] placeholder-[#5B736F] focus:bg-[#0E2824] focus:ring-2 focus:ring-[#277D6C] focus:outline-none transition-all"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8DA09D] block mb-1">Client Company</label>
              <input
                type="text"
                placeholder="Client Company Name"
                required
                className="w-full p-2.5 sm:p-2 border border-[#1E4B43] rounded-xl text-sm bg-[#061513] text-[#E0E2EC] placeholder-[#5B736F] focus:bg-[#0E2824] focus:ring-2 focus:ring-[#277D6C] focus:outline-none transition-all"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8DA09D] block mb-1">Priority</label>
              <select
                className="w-full p-2.5 sm:p-2 border border-[#1E4B43] rounded-xl text-sm bg-[#061513] text-[#E0E2EC] focus:bg-[#0E2824] focus:ring-2 focus:ring-[#277D6C] focus:outline-none transition-all cursor-pointer"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low" className="bg-[#0B1E1C] text-[#E0E2EC]">Low Priority</option>
                <option value="Medium" className="bg-[#0B1E1C] text-[#E0E2EC]">Medium Priority</option>
                <option value="High" className="bg-[#0B1E1C] text-[#E0E2EC]">High Priority</option>
                <option value="Urgent" className="bg-[#0B1E1C] text-[#E0E2EC]">Urgent Priority</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#163833]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#1E4B43] rounded-xl text-sm font-semibold text-[#8DA09D] hover:bg-[#143B35] hover:text-[#E0E2EC] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-[#18453E] via-[#225F56] to-[#2B7D70] border border-[#277D6C]/60 text-[#72F5DE] rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md cursor-pointer">
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets Container */}
      <div className="bg-[#0B1E1C]/90 rounded-2xl border border-[#183B36] shadow-2xl overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-[#8DA09D] text-sm">No tickets found.</div>
        ) : (
          <>
            {/* Desktop & Tablet Table View (Hidden on Small Screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-[#061513] border-b border-[#163833] text-[#8DA09D] font-semibold uppercase text-xs">
                  <tr>
                    <th className="p-4">Ticket</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14312B] text-sm">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-[#112E29]/60 transition-colors">
                      <td className="p-4 font-semibold text-[#F0F2F5]">{t.title}</td>
                      <td className="p-4 text-[#C2D6D3]">{t.client_name}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            t.priority === 'Urgent'
                              ? 'bg-[#3D1414] text-[#FF8B8B] border border-[#662222]'
                              : t.priority === 'High'
                              ? 'bg-[#3B2510] text-[#FFB366] border border-[#66401A]'
                              : 'bg-[#123630] text-[#6CE5D0] border border-[#23685C]'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-[#A6B8B5]">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout (Visible on Small Screens) */}
            <div className="block md:hidden divide-y divide-[#14312B]">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-[#F0F2F5] text-base">{t.title}</div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${
                        t.priority === 'Urgent'
                          ? 'bg-[#3D1414] text-[#FF8B8B] border border-[#662222]'
                          : t.priority === 'High'
                          ? 'bg-[#3B2510] text-[#FFB366] border border-[#66401A]'
                          : 'bg-[#123630] text-[#6CE5D0] border border-[#23685C]'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#8DA09D] font-medium">Client: <span className="text-[#F0F2F5] font-semibold">{t.client_name}</span></span>
                    <span className="font-medium text-[#6CE5D0] bg-[#061513] px-2 py-1 rounded border border-[#183B36]">{t.status}</span>
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