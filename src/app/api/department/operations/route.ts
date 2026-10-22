import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { canAccessDepartment, getAuthContext, isDepartmentHead } from '@/lib/department-auth';

const db = supabaseAdmin ?? supabase;

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Operations')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data, error } = await db.from('projects').select('*').order('due_date', { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Operations') || !isDepartmentHead(ctx)) return NextResponse.json({ error: 'Only Operations leads can create projects.' }, { status: 403 });
  const body = await request.json();
  const { data, error } = await db.from('projects').insert({ client_name: body.clientName, project_name: body.projectName, budget: body.budget ?? 0, assigned_to: body.assignedTo ?? null, start_date: body.startDate, due_date: body.dueDate ?? null, description: body.description ?? null, status: body.status ?? 'Planning' }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Operations') || !isDepartmentHead(ctx)) return NextResponse.json({ error: 'Only Operations leads can update projects.' }, { status: 403 });
  const body = await request.json();
  if (!body.projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  const updates: Record<string, unknown> = {};
  for (const [from, to] of [['clientName','client_name'],['projectName','project_name'],['budget','budget'],['assignedTo','assigned_to'],['startDate','start_date'],['dueDate','due_date'],['description','description'],['status','status']] as const) if (body[from] !== undefined) updates[to] = body[from];
  const { data, error } = await db.from('projects').update(updates).eq('id', body.projectId).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
