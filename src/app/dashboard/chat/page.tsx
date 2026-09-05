'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Paperclip, MessageSquare, X, FileText } from 'lucide-react';

interface Employee {
  id: string;
  full_name: string;
  role: string;
}

interface Message {
  id: string;
  sender_type: 'admin' | 'employee';
  employee_id: string;
  message: string;
  attachments: string[];
  created_at: string;
}

export default function OperationsChatPage() {
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');
  const [currentEmpId, setCurrentEmpId] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Determine user role and employee ID from cookies
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find((c) => c.trim().startsWith('user_role='));
    const empCookie = cookies.find((c) => c.trim().startsWith('employee_id='));

    const role = roleCookie ? (roleCookie.split('=')[1] as 'admin' | 'employee') : 'admin';
    const empId = empCookie ? empCookie.split('=')[1] : null;

    setUserRole(role);
    setCurrentEmpId(empId);

    fetchEmployees(role, empId);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchEmployees = async (role: string, empId: string | null) => {
    const { data } = await supabase.from('employees').select('id, full_name, role');
    if (data) {
      setEmployees(data);
      if (role === 'admin' && data.length > 0) {
        setActiveEmployee(data[0]);
        fetchChatMessages(data[0].id);
      } else if (role === 'employee' && empId) {
        const me = data.find((e) => e.id === empId);
        if (me) setActiveEmployee(me);
        fetchChatMessages(empId);
      }
    }
  };

  const fetchChatMessages = async (empId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('employee_id', empId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const handleSelectEmployee = (emp: Employee) => {
    setActiveEmployee(emp);
    fetchChatMessages(emp.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert uploaded local file selection into mock object URLs or storage references
    const fileUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      fileUrls.push(URL.createObjectURL(files[i]));
    }

    setSelectedAttachments((prev) => [...prev, ...fileUrls]);
  };

  const removeAttachment = (index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee || (!textInput.trim() && selectedAttachments.length === 0)) return;

    const payload = {
      sender_type: userRole,
      employee_id: activeEmployee.id,
      message: textInput,
      attachments: selectedAttachments,
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([payload])
      .select();

    if (!error && data) {
      setMessages([...messages, data[0]]);
      setTextInput('');
      setSelectedAttachments([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-10">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">ERP & Operations Chat Hub</h1>
          <p className="text-xs text-slate-500">Real-time messaging and file sharing between Admin and Employees</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Left Bar: Employee Selection */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs overflow-y-auto space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">
            {userRole === 'admin' ? 'Select Employee' : 'My Discussion Channel'}
          </h2>

          {userRole === 'admin' ? (
            employees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => handleSelectEmployee(emp)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeEmployee?.id === emp.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-slate-900 text-sm">{emp.full_name}</div>
                <div className="text-xs text-slate-500">{emp.role}</div>
              </div>
            ))
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="font-bold text-slate-900 text-sm">Admin Operations Channel</div>
              <div className="text-xs text-blue-600 font-semibold">Direct communication with Admin</div>
            </div>
          )}
        </div>

        {/* Right Bar: Chat Workspace Screen */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          
          {/* Active Conversation Header */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {userRole === 'admin' ? activeEmployee?.full_name || 'Select an Employee' : 'Admin Operations'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {userRole === 'admin' ? activeEmployee?.role : 'Direct support channel'}
              </p>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/30">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-slate-400 my-auto pt-20">
                No messages yet in this conversation.
              </p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_type === userRole;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-lg p-4 rounded-2xl text-sm space-y-1.5 shadow-xs ${
                        isMe ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 border border-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-[10px] opacity-80 uppercase tracking-wider">
                        {msg.sender_type === 'admin' ? 'Admin' : 'Employee'}
                      </div>
                      {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="pt-2 space-y-1 border-t border-white/20">
                          {msg.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-1.5 text-xs truncate ${
                                isMe ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:underline'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span>Attachment #{idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Unified Chat Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            {/* Attachment Preview Chips */}
            {selectedAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedAttachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="truncate max-w-[150px]">Attachment {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="hover:text-red-500 cursor-pointer ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={sendMessage} className="flex items-end gap-2">
              {/* File Upload Input Button */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Single Chat Input Field */}
              <div className="flex-1">
                <textarea
                  rows={2}
                  placeholder="Type a message or paste notes/links..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 resize-none"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 h-[48px]"
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}