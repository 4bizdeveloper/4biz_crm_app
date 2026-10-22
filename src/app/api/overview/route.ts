import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const db = supabaseAdmin ?? supabase;

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let employeeIds: string[] = [];
  if (!ctx.isAdmin && ctx.department) {
    const { data } = await db.from('employees').select('id').eq('department_type', ctx.department);
    employeeIds = (data ?? []).map(e => e.id);
  }

  let leadsQuery = db.from('leads').select('id,name,status,created_at');
  let projectsQuery = db.from('projects').select('id,project_name,status,created_at,assigned_to');
  let ticketsQuery = db.from('tickets').select('id,title,priority,status,created_at,assigned_to');
  let employeesQuery = db.from('employees').select('id,first_name,last_name,department_type,status,hire_date');

  if (!ctx.isAdmin) {
    if (isDepartmentHead(ctx)) {
      leadsQuery = leadsQuery.eq('assigned_department', ctx.department);
      if (ctx.department !== 'Operations') projectsQuery = projectsQuery.eq('assigned_to', ctx.employeeId);
      ticketsQuery = employeeIds.length ? ticketsQuery.in('assigned_to', employeeIds) : ticketsQuery.eq('assigned_to', ctx.employeeId);
      employeesQuery = employeesQuery.eq('department_type', ctx.department);
    } else {
      leadsQuery = leadsQuery.or(`assigned_employee_id.eq.${ctx.employeeId},assigned_marketing_id.eq.${ctx.employeeId},assigned_sales_id.eq.${ctx.employeeId}`);
      projectsQuery = projectsQuery.eq('assigned_to', ctx.employeeId);
      ticketsQuery = ticketsQuery.eq('assigned_to', ctx.employeeId);
      employeesQuery = employeesQuery.eq('id', ctx.employeeId);
    }
  }

  const [leads, projects, tickets, employees] = await Promise.all([leadsQuery, projectsQuery, ticketsQuery, employeesQuery]);
  const error = leads.error || projects.error || tickets.error || employees.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    leads: leads.data ?? [],
    projects: projects.data ?? [],
    tickets: tickets.data ?? [],
    employees: (employees.data ?? []).map(e => ({
      id: e.id,
      full_name: [e.first_name, e.last_name].filter(Boolean).join(' '),
      department: e.department_type,
      status: e.status,
      joined_date: e.hire_date,
    })),
  });
}
