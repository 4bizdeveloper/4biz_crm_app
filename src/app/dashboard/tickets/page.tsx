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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">IT Service Desk & Helpdesk</h1>
          <p className="text-sm text-slate-500">Track client support tickets and incident resolutions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Create Incident Ticket
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={createTicket} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">New Incident Ticket</h2>
            <input
              type="text"
              placeholder="Ticket Title / Issue Description"
              required
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <input
              type="text"
              placeholder="Client Company Name"
              required
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            />
            <select
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
              <option value="Urgent">Urgent Priority</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
            <tr>
              <th className="p-4">Ticket</th>
              <th className="p-4">Client</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-4 font-semibold text-slate-900">{t.title}</td>
                <td className="p-4 text-slate-700">{t.client_name}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      t.priority === 'Urgent'
                        ? 'bg-red-100 text-red-800'
                        : t.priority === 'High'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="p-4 font-medium text-slate-700">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}