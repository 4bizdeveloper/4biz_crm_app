import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { canAccessDepartment, getAuthContext } from '@/lib/department-auth';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Finance')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [invoices, leads] = await Promise.all([
    supabase.from('invoices').select('*,lead:leads(id,name,company),project:projects(id,project_name)').order('due_date'),
    supabase.from('leads').select('id,name,company,value,payment_status,status').order('value', { ascending: false }),
  ]);
  if (invoices.error) return NextResponse.json({ error: invoices.error.message }, { status: 500 });
  if (leads.error) return NextResponse.json({ error: leads.error.message }, { status: 500 });
  return NextResponse.json({ invoices: invoices.data, leads: leads.data });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Finance')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  const { data, error } = await supabase.from('invoices').insert({ lead_id: body.leadId ?? null, project_id: body.projectId ?? null, client_name: body.clientName, amount: body.amount ?? 0, tax_amount: body.taxAmount ?? 0, status: body.status ?? 'Draft', due_date: body.dueDate, created_by: ctx.employeeId }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Finance')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  if (!body.invoiceId) return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
  const updates: Record<string, unknown> = {};
  for (const [from, to] of [['status','status'],['amount','amount'],['taxAmount','tax_amount'],['dueDate','due_date']] as const) if (body[from] !== undefined) updates[to] = body[from];
  const { data, error } = await supabase.from('invoices').update(updates).eq('id', body.invoiceId).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
