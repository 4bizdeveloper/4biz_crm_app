'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, FolderKanban } from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  budget: number;
  status: string;
  assigned_employee_id?: string;
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
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    budget: 0,
    status: 'Planning',
    assigned_employee_id: '',
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

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      assigned_employee_id: formData.assigned_employee_id || null,
    };
    const { data, error } = await supabase.from('projects').insert([payload]).select();
    if (!error && data) {
      setProjects([data[0], ...projects]);
      setShowModal(false);
      setFormData({
        project_name: '',
        client_name: '',
        budget: 0,
        status: 'Planning',
        assigned_employee_id: '',
      });
    }
  };

  const updateProjectStatus = async (id: string, status: string) => {
    await supabase.from('projects').update({ status }).eq('id', id);
    setProjects(projects.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const deleteProject = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            Projects & Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track client deliverables, tech stacks, budgets, and staff allocations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center gap-2 text-sm shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Project
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={createProject}
            className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-xl my-auto"
          >
            <h2 className="text-lg font-bold text-slate-900">Add New IT Project</h2>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Project Name</label>
              <input
                type="text"
                placeholder="e.g. Infrastructure Upgrade"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Client Organization</label>
              <input
                type="text"
                placeholder="e.g. Acme Enterprise"
                required
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Budget ($)</label>
                <input
                  type="number"
                  placeholder="25000"
                  required
                  className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Initial Status</label>
                <select
                  className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              <label className="text-xs font-semibold text-slate-600 block mb-1">Assigned Tech Lead</label>
              <select
                className="w-full p-2.5 sm:p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={formData.assigned_employee_id}
                onChange={(e) =>
                  setFormData({ ...formData, assigned_employee_id: e.target.value })
                }
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
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
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Save Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
          Loading project data...
        </div>
      ) : projects.length === 0 ? (
        <div className="p-8 sm:p-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
          <FolderKanban className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-slate-700 text-base">No active projects found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Click "Create Project" above to add your first IT delivery engagement.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop & Tablet Table View (Hidden on Small Screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Assigned Tech Lead</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {projects.map((project) => {
                  const assignedStaff = employees.find(
                    (e) => e.id === project.assigned_employee_id
                  );
                  return (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{project.project_name}</td>
                      <td className="p-4 text-slate-700 font-medium">{project.client_name}</td>
                      <td className="p-4 text-slate-600">
                        {assignedStaff ? (
                          <span className="font-medium text-slate-800">{assignedStaff.full_name}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        ${project.budget?.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <select
                          value={project.status}
                          onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                          className="p-1.5 border rounded-lg text-xs font-semibold bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Planning">Planning</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Testing">Testing</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (Visible on Small Screens) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {projects.map((project) => {
              const assignedStaff = employees.find(
                (e) => e.id === project.assigned_employee_id
              );
              return (
                <div key={project.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-base">{project.project_name}</div>
                      <div className="text-xs text-slate-500 font-medium">{project.client_name}</div>
                    </div>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors shrink-0"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">Tech Lead</span>
                      <span className="text-slate-800 font-semibold truncate block">
                        {assignedStaff ? assignedStaff.full_name : 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Budget</span>
                      <span className="text-slate-900 font-bold">${project.budget?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-slate-500">Status</span>
                    <select
                      value={project.status}
                      onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                      className="p-1.5 border rounded-lg text-xs font-semibold bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Testing">Testing</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}