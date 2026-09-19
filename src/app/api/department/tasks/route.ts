import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { canAccessDepartment, getAuthContext, isDepartmentHead } from '@/lib/department-auth';

const db = supabaseAdmin ?? supabase;

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const department = params.get('department') ?? ctx.department;
  if (!department || !canAccessDepartment(ctx, department as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let query = db.from('department_tasks').select('*,assigned_employee:employees(id,first_name,last_name,email),lead:leads(id,name,company,email)').eq('department', department).order('scheduled_at');
  if (!ctx.isAdmin && !isDepartmentHead(ctx)) query = query.eq('assigned_to', ctx.employeeId);
  else if (params.get('employeeId')) query = query.eq('assigned_to', params.get('employeeId'));
  if (params.get('completed') === 'false') query = query.eq('is_completed', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const department = body.department ?? ctx.department;
  if (!department || !canAccessDepartment(ctx, department as any) || !isDepartmentHead(ctx)) return NextResponse.json({ error: 'Only department leads can create department tasks.' }, { status: 403 });
  const { data, error } = await db.from('department_tasks').insert({
    title: body.title, description: body.description ?? null, department,
    assigned_to: body.assignedTo ?? null, lead_id: body.leadId ?? null, scheduled_at: body.scheduledAt
  }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
  const { data: task } = await db.from('department_tasks').select('*').eq('id', body.taskId).maybeSingle();
  if (!task || !canAccessDepartment(ctx, task.department as any)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!ctx.isAdmin && !isDepartmentHead(ctx) && task.assigned_to !== ctx.employeeId) {
    return NextResponse.json({ error: 'You can only update tasks assigned to you.' }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ['title', 'description', 'assigned_to', 'lead_id', 'scheduled_at', 'is_completed']) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
    delete updates.assigned_to;
    delete updates.lead_id;
  }

  const { data, error } = await db.from('department_tasks').update(updates).eq('id', body.taskId).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
