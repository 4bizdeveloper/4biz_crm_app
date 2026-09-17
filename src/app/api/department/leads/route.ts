import { NextResponse } from 'next/server';
import { canAccessDepartment, canEditAssignedRecord, getAuthContext } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';

const departments = ['Marketing', 'Sales'] as const;
type Department = (typeof departments)[number];
const leadStatuses = ['New', 'Assigned', 'Contacted', 'Follow-up', 'Qualified', 'Converted', 'Disqualified'] as const;

type LeadStatus = (typeof leadStatuses)[number];

function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && leadStatuses.includes(value as LeadStatus);
}

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const department = (searchParams.get('department') ?? ctx.department ?? 'Sales') as Department;
  if (!departments.includes(department) || !canAccessDepartment(ctx, department)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let query = supabase.from('leads').select('*').order('last_activity_at', { ascending: false });
  query = department === 'Marketing'
    ? query.eq('assigned_department', 'Marketing')
    : query.eq('assigned_department', 'Sales').eq('is_high_conversion_probable', true);

  const employeeId = searchParams.get('employeeId');
  if (employeeId) {
    query = query.eq(department === 'Marketing' ? 'assigned_marketing_id' : 'assigned_sales_id', employeeId);
  }

  if (searchParams.get('today') === 'true') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const from = start.toISOString();
    const to = end.toISOString();
    query = query.or(`and(follow_up_date.gte.${from},follow_up_date.lt.${to}),and(call_scheduled_at.gte.${from},call_scheduled_at.lt.${to})`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { leadId, action } = body as { leadId?: string; action?: string };
  if (!leadId || !action) return NextResponse.json({ error: 'leadId and action are required' }, { status: 400 });

  const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const payload: Record<string, unknown> = { last_activity_at: new Date().toISOString() };

  if (action === 'marketing_assign') {
    if (!canAccessDepartment(ctx, 'Marketing')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    payload.assigned_marketing_id = body.employeeId ?? null;
    payload.assigned_department = 'Marketing';
    if (body.employeeId) payload.status = 'Assigned';
  } else if (action === 'marketing_update') {
    if (!canEditAssignedRecord(ctx, lead.assigned_marketing_id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (body.status !== undefined && !isLeadStatus(body.status)) return NextResponse.json({ error: 'Invalid lead status' }, { status: 400 });
    payload.status = body.status ?? lead.status;
    payload.marketing_notes = body.notes ?? lead.marketing_notes;
    if (typeof body.isHighConversion === 'boolean') payload.is_high_conversion_probable = body.isHighConversion;
  } else if (action === 'transfer_to_sales') {
    if (!ctx.isAdmin && !(ctx.department === 'Marketing' && ['DeptHead', 'Manager', 'Admin', 'SuperAdmin'].includes(ctx.userRole))) {
      return NextResponse.json({ error: 'Only Marketing leads can transfer leads' }, { status: 403 });
    }
    if (!lead.is_high_conversion_probable) return NextResponse.json({ error: 'Only high-conversion leads can be transferred' }, { status: 400 });
    payload.assigned_department = 'Sales';
    payload.assigned_dept_head_id = body.salesLeadId ?? null;
    payload.assigned_sales_id = null;
    payload.status = 'Qualified';
  } else if (action === 'sales_assign') {
    if (!canAccessDepartment(ctx, 'Sales') || lead.assigned_department !== 'Sales') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    payload.assigned_sales_id = body.employeeId ?? null;
    if (body.employeeId) payload.status = 'Assigned';
  } else if (action === 'sales_update') {
    if (!canEditAssignedRecord(ctx, lead.assigned_sales_id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (body.status !== undefined && !isLeadStatus(body.status)) return NextResponse.json({ error: 'Invalid lead status' }, { status: 400 });
    payload.status = body.status ?? lead.status;
    payload.sales_notes = body.notes ?? lead.sales_notes;
    if (body.followUpDate !== undefined) payload.follow_up_date = body.followUpDate || null;
    if (body.callScheduledAt !== undefined) payload.call_scheduled_at = body.callScheduledAt || null;
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { data, error } = await supabase.from('leads').update(payload).eq('id', leadId).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
