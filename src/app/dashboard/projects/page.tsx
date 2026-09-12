'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, FolderKanban, Edit, Calendar, UserCheck } from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  budget: number;
  status: string;
  assigned_employee_id?: string;
  start_date?: string;
  due_date?: string;
  description?: string;
}

interface Employee {
  id: string;
  full_name: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    budget: 0,
    status: 'Planning',
    assigned_employee_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    description: '',
  });

  const fetchData = async () => {
    const { data: projData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    const { data: empData } = await supabase.from('employees').select('id, full_name');

    if (projData) setProjects(projData);
    if (empData) setEmployees(empData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      project_name: '',
      client_name: '',
      budget: 0,
      status: 'Planning',
      assigned_employee_id: '',
      start_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      description: '',
    });
    setShowModal(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setFormData({
      project_name: proj.project_name || '',
      client_name: proj.client_name || '',
      budget: proj.budget || 0,
      status: proj.status || 'Planning',
      assigned_employee_id: proj.assigned_employee_id || '',
      start_date: proj.start_date || new Date().toISOString().slice(0, 10),
      due_date: proj.due_date || '',
      description: proj.description || '',
    });
    setShowModal(true);
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      assigned_employee_id: formData.assigned_employee_id || null,
      due_date: formData.due_date || null,
    };

    if (editingProject) {
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', editingProject.id)
        .select();

      if (!error && data) {
        setProjects(projects.map((p) => (p.id === editingProject.id ? data[0] : p)));
        setShowModal(false);
      }
    } else {
      const { data, error } = await supabase.from('projects').insert([payload]).select();
      if (!error && data) {
        setProjects([data[0], ...projects]);
        setShowModal(false);
      }
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'In Progress':
        return 'bg-teal-50 text-teal-600 border-teal-200';
      case 'Testing':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'On Hold':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-slate-50 text-slate-800 min-h-screen p-2 sm:p-4 md:p-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-teal-600 shrink-0" /> IT Projects & ERP Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Schedule projects, assign tech teams, set milestones, and track deliveries
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto relative z-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all border border-teal-600 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" /> Create & Schedule Project
        </button>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={saveProject}
            className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-lg my-auto border border-slate-200 text-slate-800"
          >
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3">
              {editingProject ? 'Edit Project Schedule' : 'Schedule New Project'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="ERP System Migration"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enterprise Client Corp"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Budget ($)</label>
                <input
                  type="number"
                  placeholder="15000"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Testing">Testing</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Assigned Employee</label>
              <select
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all cursor-pointer"
                value={formData.assigned_employee_id}
                onChange={(e) => setFormData({ ...formData, assigned_employee_id: e.target.value })}
              >
                <option value="">-- Unassigned --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Project Instructions</label>
              <textarea
                rows={3}
                placeholder="Details & deliverable requirements..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-all"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 border border-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm cursor-pointer"
              >
                Save Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Data Container / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading projects database...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No projects active.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Project / Client</th>
                  <th className="p-4">Assigned Employee</th>
                  <th className="p-4">Schedule Dates</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {projects.map((project) => {
                  const assignedStaff = employees.find((e) => e.id === project.assigned_employee_id);
                  return (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{project.project_name}</div>
                        <div className="text-xs text-slate-500 font-medium">{project.client_name}</div>
                      </td>
                      <td className="p-4">
                        {assignedStaff ? (
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                            {assignedStaff.full_name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {project.start_date || 'N/A'} → {project.due_date || 'No Due Date'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-800">${project.budget?.toLocaleString()}</td>
                      <td className="p-4">
                        <span
                          className={`border px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusBadgeStyle(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(project)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}