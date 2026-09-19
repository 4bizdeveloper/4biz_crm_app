import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { canAccessDepartment, getAuthContext, isDepartmentHead } from '@/lib/department-auth';

const db = supabaseAdmin ?? supabase;

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const department = (new URL(request.url).searchParams.get('department') ?? ctx.department) as any;
  const canListRequestedDepartment = ctx.isAdmin || (ctx.department === department && isDepartmentHead(ctx));
  if (!department || !canListRequestedDepartment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data, error } = await db.from('employees')
    .select('id,first_name,last_name,email,phone,department,job_title,role,status,user_role,department_type,avatar_url,hire_date,created_at')
    .eq('department_type', department)
    .eq('status', 'Active')
    .order('first_name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
