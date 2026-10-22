import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const db = supabaseAdmin ?? supabase;

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let query = db.from('tickets').select('*').order('created_at', { ascending: false });
  if (!ctx.isAdmin && !isDepartmentHead(ctx)) query = query.eq('assigned_to', ctx.employeeId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const payload = {
    title: body.title, client_name: body.client_name ?? body.clientName,
    assigned_to: body.assigned_to ?? body.assignedTo ?? ctx.employeeId,
    priority: body.priority ?? 'Medium', status: body.status ?? 'Open',
  };
  const { data, error } = await db.from('tickets').insert(payload).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
