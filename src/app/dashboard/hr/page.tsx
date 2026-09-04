'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, UserCheck, ShieldCheck, Mail, Lock } from 'lucide-react';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  password?: string;
}

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Software Engineer',
    department: 'Engineering',
    status: 'Active',
  });

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('joined_date', { ascending: false });
    if (data) setEmployees(data);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const createEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('employees').insert([formData]).select();
    if (error) {
      alert(`Error creating employee: ${error.message}`);
      return;
    }
    if (data) {
      setEmployees([data[0], ...employees]);
      setShowModal(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'Software Engineer',
        department: 'Engineering',
        status: 'Active',
      });
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    await supabase.from('employees').delete().eq('id', id);
    setEmployees(employees.filter((e) => e.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600 shrink-0" /> Employee & User Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create employee portal credentials and manage IT department roles
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Employee User
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={createEmployee}
            className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-xl my-auto"
          >
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Create Employee Account</h2>
            
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Work Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="employee@itcompany.com"
                  className="w-full pl-9 p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Portal Login Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Role</label>
                <input
                  type="text"
                  required
                  placeholder="Frontend Developer"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Department</label>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="DevOps">DevOps</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative group flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between pr-6">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{emp.full_name}</h3>
                  <p className="text-xs text-blue-600 font-semibold">{emp.role}</p>
                </div>
                <button
                  onClick={() => deleteEmployee(emp.id)}
                  className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  title="Delete User Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{emp.email}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{emp.department}</span>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md font-semibold">
                {emp.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}