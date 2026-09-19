import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';

const db = supabaseAdmin ?? supabase;

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const department = (searchParams.get('department') ?? ctx.department) as any;
  const roleFilter = searchParams.get('role');

  const canListRequestedDepartment = ctx.isAdmin || (ctx.department === department && isDepartmentHead(ctx));
  if (!department || !canListRequestedDepartment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let query = db
    .from('employees')
    .select('id,first_name,last_name,email,phone,department,job_title,role,status,user_role,department_type,avatar_url,hire_date,created_at')
    .eq('department_type', department)
    .eq('status', 'Active')
    .order('first_name');

  // The leads assignment UI explicitly requests target employees only.
  // This prevents Marketing Admin / DeptHead accounts from appearing as assignees.
  if (roleFilter === 'employee') {
    query = query.eq('user_role', 'Employee');
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
