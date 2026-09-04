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

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-blue-600 shrink-0" /> IT Projects & ERP Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Schedule projects, assign tech teams, set milestones, and track deliveries
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create & Schedule Project
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={saveProject}
            className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-xl my-auto"
          >
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">
              {editingProject ? 'Edit Project Schedule' : 'Schedule New Project'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="ERP System Migration"
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
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
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
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
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
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
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
                <select
                  className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
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
                className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
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
                className="w-full p-2.5 border rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-600"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
                Save Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Responsive Table / Card View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading projects database...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No projects active.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Project / Client</th>
                  <th className="p-4">Assigned Employee</th>
                  <th className="p-4">Schedule Dates</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {projects.map((project) => {
                  const assignedStaff = employees.find((e) => e.id === project.assigned_employee_id);
                  return (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{project.project_name}</div>
                        <div className="text-xs text-slate-500 font-medium">{project.client_name}</div>
                      </td>
                      <td className="p-4">
                        {assignedStaff ? (
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            {assignedStaff.full_name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {project.start_date || 'N/A'} → {project.due_date || 'No Due Date'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-900">${project.budget?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-800">
                          {project.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(project)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Project"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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