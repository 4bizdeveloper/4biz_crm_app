'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  FolderKanban, Send, Link as LinkIcon, FileText, Upload,
  CheckCircle2, Clock, Calendar, Paperclip, MessageSquare
} from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  status: string;
  start_date?: string;
  due_date?: string;
  description?: string;
}

interface Submission {
  id: string;
  project_id: string;
  content_text: string;
  urls: string[];
  file_urls: string[];
  submitted_at: string;
}

export default function EmployeePortalPage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [contentText, setContentText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fileInput, setFileInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Extract logged-in employee ID from cookies
    const cookies = document.cookie.split(';');
    const empCookie = cookies.find((c) => c.trim().startsWith('employee_id='));
    const id = empCookie ? empCookie.split('=')[1] : null;

    if (id) {
      setEmployeeId(id);
      fetchEmployeeData(id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchEmployeeData = async (empId: string) => {
    setLoading(true);
    const { data: projData } = await supabase
      .from('projects')
      .select('*')
      .eq('assigned_employee_id', empId)
      .order('created_at', { ascending: false });

    if (projData) {
      setAssignedProjects(projData);
      if (projData.length > 0) {
        setSelectedProject(projData[0]);
        fetchSubmissions(projData[0].id);
      }
    }
    setLoading(false);
  };

  const fetchSubmissions = async (projectId: string) => {
    const { data } = await supabase
      .from('project_submissions')
      .select('*')
      .eq('project_id', projectId)
      .order('submitted_at', { ascending: false });

    if (data) setSubmissions(data);
  };

  const handleSelectProject = (proj: Project) => {
    setSelectedProject(proj);
    fetchSubmissions(proj.id);
  };

  const submitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !employeeId) return;

    setIsSubmitting(true);

    const urlsArray = urlInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const filesArray = fileInput
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const payload = {
      project_id: selectedProject.id,
      employee_id: employeeId,
      content_text: contentText,
      urls: urlsArray,
      file_urls: filesArray,
    };

    const { data, error } = await supabase
      .from('project_submissions')
      .insert([payload])
      .select();

    if (error) {
      alert(`Submission failed: ${error.message}`);
    } else if (data) {
      setSubmissions([data[0], ...submissions]);
      setContentText('');
      setUrlInput('');
      setFileInput('');
      alert('Deliverables submitted successfully!');
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading your workspace...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-blue-600" />
            My Employee Workspace & Deliverables
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access assigned projects, submit code deliverables, URLs, docs, and report completion
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Projects List */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b pb-3">Assigned Projects ({assignedProjects.length})</h2>
          
          <div className="space-y-3">
            {assignedProjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No assigned projects found.</p>
            ) : (
              assignedProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedProject?.id === proj.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 text-sm">{proj.project_name}</h3>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{proj.client_name}</p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Due: {proj.due_date || 'N/A'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Submission Form & History */}
        <div className="lg:col-span-8 space-y-6">
          {selectedProject ? (
            <>
              {/* Project Instructions Widget */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h3 className="text-lg font-bold text-slate-900">{selectedProject.project_name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProject.description || 'No detailed instructions provided by Admin.'}
                </p>
              </div>

              {/* Work Submission Form */}
              <form onSubmit={submitDeliverable} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                  <Send className="w-4 h-4 text-blue-600" /> Submit Project Deliverables
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Project Content / Summary *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe completed tasks, notes, or implementation summary..."
                    className="w-full p-2.5 border rounded-xl text-sm bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600"
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                      <LinkIcon className="w-3.5 h-3.5 text-blue-600" /> Submission URLs (GitHub, Figma, Vercel)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="One URL per line e.g. https://github.com/..."
                      className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" /> File Attachment URLs
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Google Drive, Dropbox, or storage link..."
                      className="w-full p-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600"
                      value={fileInput}
                      onChange={(e) => setFileInput(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Submitting Deliverable...' : 'Submit Work to Admin'}
                </button>
              </form>

              {/* Submission Logs */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b pb-3">Previous Deliverable Submissions</h3>
                {submissions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No submissions made yet for this project.</p>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span className="font-semibold text-slate-700">Submitted Work</span>
                          <span>{new Date(sub.submitted_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-800">{sub.content_text}</p>
                        
                        {sub.urls && sub.urls.length > 0 && (
                          <div className="text-xs space-y-1 pt-1">
                            <span className="font-semibold text-slate-600 block">Links:</span>
                            {sub.urls.map((u, idx) => (
                              <a key={idx} href={u} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block truncate">
                                {u}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-2xl border text-center text-slate-400 text-sm">
              Select a project from the left panel to submit your work.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}