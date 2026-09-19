import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { hashPassword } from '@/lib/password';

const db = supabaseAdmin ?? supabase;
const publicFields = 'id,first_name,last_name,email,phone,department,job_title,role,status,hire_date,user_role,department_type,avatar_url,reports_to_id,employee_code,work_location,joined_at,notes,created_at';

function canManageTarget(ctx: Awaited<ReturnType<typeof getAuthContext>>, department: string | null) {
  return ctx.isAdmin || (isDepartmentHead(ctx) && !!ctx.department && ctx.department === department);
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let query = db.from('employees').select(publicFields).order('created_at', { ascending: false });
  if (!ctx.isAdmin) query = query.eq('department_type', ctx.department);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Unable to load users.' }, { status: 500 });
  return NextResponse.json({ data: data ?? [], currentUser: { id: ctx.employeeId, role: ctx.userRole, department: ctx.department, isAdmin: ctx.isAdmin } });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const department = String(body.department_type || body.department || ctx.department || '');
  if (!canManageTarget(ctx, department)) return NextResponse.json({ error: 'You can only manage users in your department.' }, { status: 403 });
  const requestedRole = String(body.user_role || 'Employee');
  if (!ctx.isAdmin && requestedRole !== 'Employee') return NextResponse.json({ error: 'Department leads can create employee accounts only.' }, { status: 403 });

  const password = String(body.password || 'changeMe123');
  const { hash, salt } = await hashPassword(password);
  const payload = {
    first_name: String(body.first_name || '').trim(),
    last_name: String(body.last_name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    phone: body.phone || null,
    department,
    department_type: department,
    job_title: body.job_title || null,
    role: body.role || 'Sales',
    user_role: requestedRole,
    status: body.status || 'Active',
    password: null,
    password_hash: hash,
    password_salt: salt,
    reports_to_id: ctx.employeeId || body.reports_to_id || null,
    employee_code: body.employee_code || null,
    work_location: body.work_location || null,
    notes: body.notes || null,
  };
  if (!payload.first_name || !payload.last_name || !payload.email) return NextResponse.json({ error: 'First name, last name and email are required.' }, { status: 400 });
  const { data, error } = await db.from('employees').insert(payload).select(publicFields).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
  const { data: existing, error: findError } = await db.from('employees').select('id,department_type,user_role').eq('id', id).maybeSingle();
  if (findError || !existing) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (!canManageTarget(ctx, existing.department_type)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const nextRole = String(body.user_role ?? existing.user_role);
  if (!ctx.isAdmin && nextRole !== 'Employee') return NextResponse.json({ error: 'Department leads cannot elevate account privileges.' }, { status: 403 });

  const payload: Record<string, unknown> = {
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    phone: body.phone || null,
    department: body.department || existing.department_type,
    department_type: body.department_type || existing.department_type,
    job_title: body.job_title || null,
    role: body.role || 'Sales',
    user_role: nextRole,
    status: body.status || 'Active',
    reports_to_id: body.reports_to_id || ctx.employeeId || null,
    employee_code: body.employee_code || null,
    work_location: body.work_location || null,
    notes: body.notes || null,
  };
  if (body.password) {
    const { hash, salt } = await hashPassword(String(body.password));
    payload.password = null;
    payload.password_hash = hash;
    payload.password_salt = salt;
  }
  const { data, error } = await db.from('employees').update(payload).eq('id', id).select(publicFields).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
