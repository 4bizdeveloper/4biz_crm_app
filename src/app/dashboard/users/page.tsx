'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, X, UserCheck, Eye, EyeOff } from 'lucide-react';

export default function UserManagementModule({ currentUserRole = 'SuperAdmin', currentDept = 'Sales' }) {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'Sales',             // EmployeeRole: Sales, Manager, Developer, Support, Admin
    user_role: 'Employee',     // UserRole: Admin, SuperAdmin, DeptHead, Employee
    department_type: currentDept,
  });

  const fetchUsers = async () => {
    let query = supabase.from('employees').select('*');
    if (currentUserRole === 'DeptHead') {
      query = query.eq('department_type', currentDept);
    }
    const { data, error } = await query;
    if (error) console.error('Error fetching users:', error);
    if (data) setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password || 'changeMe123',
      role: formData.role,
      user_role: formData.user_role,
      department_type: currentUserRole === 'DeptHead' ? currentDept : formData.department_type,
    };

    let res;
    if (formData.id) {
      res = await supabase.from('employees').update(payload).eq('id', formData.id);
    } else {
      res = await supabase.from('employees').insert([payload]);
    }

    if (res.error) {
      setErrorMsg(res.error.message);
    } else {
      setShowModal(false);
      setShowPassword(false);
      fetchUsers();
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">User Access Management</h1>
          <p className="text-xs text-slate-500 font-medium">Manage departmental staff, role definitions, and access permissions.</p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setShowPassword(false);
            setFormData({
              id: '',
              first_name: '',
              last_name: '',
              email: '',
              password: '',
              role: 'Sales',
              user_role: 'Employee',
              department_type: currentDept,
            });
            setShowModal(true);
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Register New Account
        </button>
      </div>

      {/* USER TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs font-medium">
          <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Job Role</th>
              <th className="py-3 px-4">System Access</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 italic">No user accounts found. Click "Register New Account" to add one.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {u.first_name} {u.last_name}
                    <br />
                    <span className="text-slate-400 text-[10px]">{u.email}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600">{u.department_type}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md border border-teal-200 font-bold">{u.role}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-bold">{u.user_role}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setErrorMsg('');
                        setShowPassword(false);
                        setFormData(u);
                        setShowModal(true);
                      }}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    {currentUserRole === 'SuperAdmin' && (
                      <button
                        onClick={async () => {
                          await supabase.from('employees').delete().eq('id', u.id);
                          fetchUsers();
                        }}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REGISTRATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-600" />
                {formData.id ? 'Edit User Account' : 'Register New Account'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={formData.id ? 'Leave blank to keep unchanged' : 'Default: changeMe123'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border rounded-xl p-2.5 pr-10 outline-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Department</label>
                  <select
                    value={formData.department_type}
                    onChange={(e) => setFormData({ ...formData, department_type: e.target.value })}
                    disabled={currentUserRole === 'DeptHead'}
                    className="w-full border rounded-xl p-2.5 outline-teal-600 bg-white"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Support">Support</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Job Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-teal-600 bg-white"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Manager">Manager</option>
                    <option value="Developer">Developer</option>
                    <option value="Support">Support</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">System User Access</label>
                <select
                  value={formData.user_role}
                  onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-teal-600 bg-white"
                >
                  <option value="Employee">Employee</option>
                  <option value="DeptHead">Dept Head</option>
                  <option value="Admin">Admin</option>
                  <option value="SuperAdmin">Super Admin</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}