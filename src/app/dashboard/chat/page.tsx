'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Paperclip, MessageSquare, UserCheck, ShieldCheck } from 'lucide-react';

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
  const [attachmentUrl, setAttachmentUrl] = useState('');

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee || (!textInput.trim() && !attachmentUrl.trim())) return;

    const attachmentsArray = attachmentUrl.trim() ? [attachmentUrl.trim()] : [];

    const payload = {
      sender_type: userRole,
      employee_id: activeEmployee.id,
      message: textInput,
      attachments: attachmentsArray,
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([payload])
      .select();

    if (!error && data) {
      setMessages([...messages, data[0]]);
      setTextInput('');
      setAttachmentUrl('');
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        {/* Left Bar: Employee Selection (Only Admin sees all, Employee sees active status) */}
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

        {/* Right Bar: Chat Messages Screen */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Chat Messages */}
          <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-slate-400 my-auto pt-20">No messages yet in this conversation.</p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_type === userRole;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 shadow-2xs ${
                        isMe ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 border border-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-[10px] opacity-80 uppercase">
                        {msg.sender_type === 'admin' ? 'Admin' : 'Employee'}
                      </div>
                      <p className="leading-relaxed">{msg.message}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="pt-1">
                          {msg.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att}
                              target="_blank"
                              rel="noreferrer"
                              className={`block underline text-[11px] truncate ${
                                isMe ? 'text-blue-100' : 'text-blue-600'
                              }`}
                            >
                              Attachment Link #{idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input Area */}
          <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-200 space-y-2">
            <input
              type="text"
              placeholder="Paste attachment/file URL (Optional)..."
              className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-600"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}