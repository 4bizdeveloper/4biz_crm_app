'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Search, ShieldCheck, UserCheck, Users, X, Trash2 } from 'lucide-react';

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  department_type: string;
  job_title?: string | null;
  role?: string | null;
  status: string;
  user_role: string;
  employee_code?: string | null;
  work_location?: string | null;
  notes?: string | null;
};

const departments = ['Sales', 'Marketing', 'Operations', 'HR', 'Finance'];
const jobRoles = ['Sales', 'Manager', 'Developer', 'Support', 'Admin'];

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ isAdmin: boolean; role: string; department: string | null } | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', department_type: 'Sales',
    job_title: '', role: 'Sales', user_role: 'Employee', password: '',
    employee_code: '', work_location: '', notes: '', status: 'Active',
  });

  const load = async () => {
    const res = await fetch('/api/users', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Unable to load users.'); return; }
    setUsers(json.data || []);
    setCurrentUser(json.currentUser || null);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => [u.first_name, u.last_name, u.email, u.department_type, u.job_title, u.user_role].some(v => String(v || '').toLowerCase().includes(q)));
  }, [users, search]);

  const openCreate = () => {
    setEditing(null);
    setError('');
    setForm({
      first_name: '', last_name: '', email: '', phone: '',
      department_type: currentUser?.department || 'Sales', job_title: '',
      role: 'Sales', user_role: currentUser?.isAdmin ? 'Employee' : 'Employee',
      password: '', employee_code: '', work_location: '', notes: '', status: 'Active',
    });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setError('');
    setForm({
      first_name: u.first_name || '', last_name: u.last_name || '', email: u.email || '',
      phone: u.phone || '', department_type: u.department_type || 'Sales',
      job_title: u.job_title || '', role: u.role || 'Sales', user_role: u.user_role || 'Employee',
      password: '', employee_code: u.employee_code || '', work_location: u.work_location || '',
      notes: u.notes || '', status: u.status || 'Active',
    });
    setShowModal(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/users', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...form, id: editing.id } : form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to save user.');
      setShowModal(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save user.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: User) => {
    setError('');
    const next = u.status === 'Active' ? 'Terminated' : 'Active';
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, status: next }),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error || 'Unable to update account.');
    else load();
  };
  const deleteUser = async (u: User) => {
    if (!currentUser?.isAdmin) return;
    if (!confirm(`Terminate ${u.first_name} ${u.last_name} and revoke the account credentials?`)) return;
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id }),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error || 'Unable to terminate user.');
    else load();
  };


  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider"><ShieldCheck className="h-4 w-4" /> Access control</div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">People & Permissions</h1>
            <p className="mt-1 text-sm text-slate-500">Manage employees, departmental access and account status without exposing credentials to the browser.</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-700"><Plus className="h-4 w-4" /> Add employee</button>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border bg-white p-4"><Users className="h-5 w-5 text-teal-600" /><p className="mt-3 text-2xl font-black">{users.length}</p><p className="text-xs text-slate-500">Visible employees</p></div>
          <div className="rounded-2xl border bg-white p-4"><UserCheck className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-2xl font-black">{users.filter(u => u.status === 'Active').length}</p><p className="text-xs text-slate-500">Active accounts</p></div>
          <div className="rounded-2xl border bg-white p-4"><ShieldCheck className="h-5 w-5 text-indigo-600" /><p className="mt-3 text-2xl font-black">{users.filter(u => ['DeptHead','Manager','Admin','SuperAdmin'].includes(u.user_role)).length}</p><p className="text-xs text-slate-500">Leads / admins</p></div>
          <div className="rounded-2xl border bg-white p-4"><p className="text-2xl font-black">{new Set(users.map(u => u.department_type)).size}</p><p className="mt-3 text-xs text-slate-500">Departments represented</p></div>
        </section>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..." className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500" /></div>
            <span className="text-xs font-semibold text-slate-500">{filtered.length} records</span>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Access</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y">{filtered.map(u => <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-4"><div className="font-bold text-slate-900">{u.first_name} {u.last_name}</div><div className="text-xs text-slate-500">{u.email}{u.job_title ? ` • ${u.job_title}` : ''}</div></td>
                <td className="px-5 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold">{u.department_type}</span></td>
                <td className="px-5 py-4"><span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">{u.user_role}</span></td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.status}</span></td>
                <td className="px-5 py-4 text-right"><div className="inline-flex gap-2"><button onClick={() => openEdit(u)} className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50"><Edit className="h-4 w-4" /></button><button onClick={() => toggleStatus(u)} className="rounded-lg border px-3 py-2 text-xs font-bold">{u.status === 'Active' ? 'Terminate' : 'Activate'}</button>{currentUser?.isAdmin && <button onClick={() => deleteUser(u)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title="Terminate and revoke"><Trash2 className="h-4 w-4" /></button>}</div></td>
              </tr>)}</tbody>
            </table>
          </div>

          <div className="divide-y md:hidden">{filtered.map(u => <article key={u.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-slate-900">{u.first_name} {u.last_name}</div><div className="text-xs text-slate-500">{u.email}</div></div><span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700">{u.user_role}</span></div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold">{u.department_type}</span><span className="rounded-lg bg-slate-100 px-2 py-1">{u.role}</span><span className="rounded-lg bg-slate-100 px-2 py-1">{u.status}</span></div><div className="mt-3 flex gap-2"><button onClick={() => openEdit(u)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold"><Edit className="h-3.5 w-3.5" /> Edit</button><button onClick={() => toggleStatus(u)} className="rounded-lg border px-3 py-2 text-xs font-bold">{u.status === 'Active' ? 'Deactivate' : 'Activate'}</button></div></article>)}</div>
        </section>
      </div>

      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
        <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b pb-4"><div><h2 className="text-lg font-black">{editing ? 'Edit employee' : 'Add employee'}</h2><p className="text-xs text-slate-500">Credentials are stored server-side using password hashing.</p></div><button onClick={() => setShowModal(false)}><X /></button></div>
          <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
            {([['first_name','First name'],['last_name','Last name'],['email','Email'],['phone','Phone'],['job_title','Job title'],['employee_code','Employee code'],['work_location','Work location']] as const).map(([key,label]) => <label key={key} className="text-xs font-bold text-slate-600">{label}<input required={key==='first_name'||key==='last_name'||key==='email'} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-500" /></label>)}
            <label className="text-xs font-bold text-slate-600">Department<select value={form.department_type} disabled={!currentUser?.isAdmin} onChange={e => setForm({...form,department_type:e.target.value})} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal disabled:bg-slate-100">{departments.map(d => <option key={d}>{d}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-600">Job role<select value={form.role} onChange={e => setForm({...form,role:e.target.value})} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal">{jobRoles.map(d => <option key={d}>{d}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-600">System access<select value={form.user_role} disabled={!currentUser?.isAdmin} onChange={e => setForm({...form,user_role:e.target.value})} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal disabled:bg-slate-100"><option>Employee</option><option>DeptHead</option><option>SuperAdmin</option></select></label>
            <label className="text-xs font-bold text-slate-600">Account status<select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal"><option>Active</option><option>OnLeave</option><option>Terminated</option></select></label>
            <label className="text-xs font-bold text-slate-600 sm:col-span-2">Password {editing && <span className="font-normal text-slate-400">(leave blank to keep current)</span>}<input type="password" required={!editing} value={form.password} onChange={e => setForm({...form,password:e.target.value})} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-500" /></label>
            <label className="text-xs font-bold text-slate-600 sm:col-span-2">Notes<textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} className="mt-1.5 min-h-24 w-full rounded-xl border px-3 py-2.5 text-sm font-normal outline-none focus:border-teal-500" /></label>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setShowModal(false)} className="rounded-xl border px-4 py-2.5 text-sm font-bold">Cancel</button><button disabled={saving} className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save employee'}</button></div>
          </form>
        </div>
      </div>}
    </main>
  );
}
