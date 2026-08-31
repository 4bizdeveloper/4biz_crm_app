'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase.from('employees').select('*');
      if (data) setEmployees(data);
    };
    fetchEmployees();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Human Resources Directory</h1>
        <p className="text-sm text-slate-500">Manage internal IT personnel and team allocations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <h3 className="font-bold text-base text-slate-900">{emp.full_name}</h3>
              <p className="text-sm text-slate-600 font-medium">{emp.role}</p>
              <p className="text-xs text-slate-400">{emp.email}</p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Department: <strong className="text-slate-800 font-semibold">{emp.department}</strong>
              </span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                {emp.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}