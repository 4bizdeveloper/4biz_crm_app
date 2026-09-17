import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { canAccessDepartment, getAuthContext } from '@/lib/department-auth';

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const department = new URL(request.url).searchParams.get('department') ?? ctx.department;
  if (!department || !canAccessDepartment(ctx, department as never)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data, error } = await supabase.from('employees').select('id,first_name,last_name,email,phone,department,job_title,role,status,user_role,department_type,avatar_url,hire_date,created_at').eq('department_type', department).order('first_name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
