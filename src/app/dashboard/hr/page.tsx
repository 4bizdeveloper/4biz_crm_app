'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  status: string;
}

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    department: 'Engineering',
    status: 'Active',
  });

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').order('joined_date', { ascending: false });
    if (data) setEmployees(data);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const createEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('employees').insert([formData]).select();
    if (!error && data) {
      setEmployees([data[0], ...employees]);
      setShowModal(false);
      setFormData({ full_name: '', email: '', role: '', department: 'Engineering', status: 'Active' });
    }
  };

  const deleteEmployee = async (id: string) => {
    await supabase.from('employees').delete().eq('id', id);
    setEmployees(employees.filter((e) => e.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR & Employee Directory</h1>
          <p className="text-sm text-slate-500">Manage internal IT staff and department roles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={createEmployee} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Add Staff Member</h2>
            <input
              type="text"
              placeholder="Full Name"
              required
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Role (e.g. Senior DevOps)"
              required
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
            <select
              className="w-full p-2 border rounded-lg text-sm"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              <option value="Engineering">Engineering</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Sales">Sales</option>
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
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
            <button
              onClick={() => deleteEmployee(emp.id)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-base text-slate-900">{emp.full_name}</h3>
            <p className="text-sm text-slate-600 font-medium">{emp.role}</p>
            <p className="text-xs text-slate-400 mb-4">{emp.email}</p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{emp.department}</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">{emp.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}