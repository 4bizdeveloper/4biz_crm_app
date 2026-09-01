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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">HR & Employee Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500">Manage internal IT staff and department roles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 text-sm shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={createEmployee} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-xl my-auto">
            <h2 className="text-lg font-bold text-slate-900">Add Staff Member</h2>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Full Name"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Email Address"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Role</label>
              <input
                type="text"
                placeholder="Role (e.g. Senior DevOps)"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Department</label>
              <select
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative group">
            <button
              onClick={() => deleteEmployee(emp.id)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 rounded-md"
              title="Delete Staff Member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-base text-slate-900 pr-8 truncate">{emp.full_name}</h3>
            <p className="text-sm text-slate-600 font-medium truncate">{emp.role}</p>
            <p className="text-xs text-slate-400 mb-4 truncate">{emp.email}</p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 truncate">{emp.department}</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium shrink-0">{emp.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}