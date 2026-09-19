import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const db = supabaseAdmin ?? supabase;

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let query = db.from('projects').select('*').order('due_date', { ascending: true, nullsFirst: false });
  if (!ctx.isAdmin) {
    if (ctx.department === 'Operations' && isDepartmentHead(ctx)) query = query;
    else query = query.eq('assigned_to', ctx.employeeId);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ctx.isAdmin && (!isDepartmentHead(ctx) || ctx.department !== 'Operations')) return NextResponse.json({ error: 'Only Operations leads can create projects.' }, { status: 403 });
  const body = await request.json();
  const { data, error } = await db.from('projects').insert({
    client_name: body.clientName, project_name: body.projectName, budget: body.budget ?? 0,
    assigned_to: body.assignedTo ?? ctx.employeeId, start_date: body.startDate,
    due_date: body.dueDate ?? null, description: body.description ?? null, status: body.status ?? 'Planning',
  }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { data: project } = await db.from('projects').select('*').eq('id', body.projectId).maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  if (!ctx.isAdmin && !(isDepartmentHead(ctx) && ctx.department === 'Operations') && project.assigned_to !== ctx.employeeId) return NextResponse.json({ error: 'You can only update projects assigned to you.' }, { status: 403 });
  const updates: Record<string, unknown> = {};
  for (const [from, to] of [['clientName','client_name'],['projectName','project_name'],['budget','budget'],['assignedTo','assigned_to'],['startDate','start_date'],['dueDate','due_date'],['description','description'],['status','status']] as const) if (body[from] !== undefined) updates[to] = body[from];
  const { data, error } = await db.from('projects').update(updates).eq('id', body.projectId).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
