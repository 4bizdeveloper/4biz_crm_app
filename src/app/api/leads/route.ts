import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const db = supabaseAdmin ?? supabase;

function isMarketingAdmin(ctx: Awaited<ReturnType<typeof getAuthContext>>) {
  return ctx.department === 'Marketing' && ctx.userRole === 'Admin';
}

function canManage(ctx: Awaited<ReturnType<typeof getAuthContext>>, lead: any) {
  if (ctx.isAdmin) return true;
  if (isMarketingAdmin(ctx) && (!lead.assigned_department || lead.assigned_department === 'Marketing')) return true;
  if (!ctx.employeeId || !ctx.department || lead.assigned_department !== ctx.department) return false;
  return isDepartmentHead(ctx)
    || lead.assigned_employee_id === ctx.employeeId
    || lead.assigned_marketing_id === ctx.employeeId
    || lead.assigned_sales_id === ctx.employeeId;
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = db.from('leads').select('*').order('created_at', { ascending: false });
  if (!ctx.isAdmin) {
    if (isMarketingAdmin(ctx)) {
      query = query.or('assigned_department.eq.Marketing,assigned_department.is.null');
    } else if (isDepartmentHead(ctx)) {
      query = query.eq('assigned_department', ctx.department);
    } else {
      query = query.or(`assigned_employee_id.eq.${ctx.employeeId},assigned_marketing_id.eq.${ctx.employeeId},assigned_sales_id.eq.${ctx.employeeId}`);
    }
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ctx.isAdmin && !isDepartmentHead(ctx)) return NextResponse.json({ error: 'Only Super Admin or department leads can create leads.' }, { status: 403 });
  const body = await request.json();
  const payload = { ...body, last_activity_at: new Date().toISOString() };
  delete payload.id;
  delete payload.password;
  const { data, error } = await db.from('leads').insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'Lead id is required.' }, { status: 400 });

  const { data: lead, error: findError } = await db.from('leads').select('*').eq('id', id).maybeSingle();
  if (findError || !lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  if (!canManage(ctx, lead)) return NextResponse.json({ error: 'You are not allowed to modify this lead.' }, { status: 403 });

  const { id: _id, action, ...changes } = body;
  if (action === 'archive') changes.status = 'Disqualified';
  changes.last_activity_at = new Date().toISOString();

  const { data, error } = await db.from('leads').update(changes).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
