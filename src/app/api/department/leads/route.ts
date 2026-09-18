import { NextResponse } from 'next/server';
import { canAccessDepartment, canEditAssignedRecord, getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
const departments = ['Marketing', 'Sales'] as const;
type Department = (typeof departments)[number];
const leadStatuses = ['New', 'Assigned', 'Contacted', 'Follow-up', 'Qualified', 'Converted', 'Disqualified'] as const;
type LeadStatus = (typeof leadStatuses)[number];
function isLeadStatus(value: unknown): value is LeadStatus { return typeof value === 'string' && leadStatuses.includes(value as LeadStatus); }
function canManageDepartment(ctx: Awaited<ReturnType<typeof getAuthContext>>, department: Department) { return ctx.isAdmin || (ctx.department === department && isDepartmentHead(ctx)); }
function assignedColumn(department: Department) { return department === 'Marketing' ? 'assigned_marketing_id' : 'assigned_sales_id'; }

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const department = (searchParams.get('department') ?? ctx.department ?? 'Sales') as Department;
  if (!departments.includes(department) || !canAccessDepartment(ctx, department)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let query = supabase.from('leads').select('*').order('last_activity_at', { ascending: false });
  query = department === 'Marketing' ? query.eq('assigned_department', 'Marketing') : query.eq('assigned_department', 'Sales').eq('is_high_conversion_probable', true);
  const employeeId = searchParams.get('employeeId');
  if (employeeId) query = query.eq(assignedColumn(department), employeeId);
  else if (!ctx.isAdmin && !isDepartmentHead(ctx)) query = query.eq(assignedColumn(department), ctx.employeeId);
  if (searchParams.get('highConversion') === 'true') query = query.eq('is_high_conversion_probable', true);
  if (searchParams.get('today') === 'true') {
    const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
    query = query.or(`and(follow_up_date.gte.${start.toISOString()},follow_up_date.lt.${end.toISOString()}),and(call_scheduled_at.gte.${start.toISOString()},call_scheduled_at.lt.${end.toISOString()})`);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json(); const { leadId, action } = body as { leadId?: string; action?: string };
  if (!leadId || !action) return NextResponse.json({ error: 'leadId and action are required' }, { status: 400 });
  const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  const payload: Record<string, unknown> = { last_activity_at: new Date().toISOString() }; let activityType = action, activityDetails = '';
  if (action === 'marketing_assign') {
    if (!canManageDepartment(ctx, 'Marketing')) return NextResponse.json({ error: 'Only a Marketing admin or Super Admin can assign marketing employees' }, { status: 403 });
    payload.assigned_marketing_id = body.employeeId ?? null; payload.assigned_department = 'Marketing'; if (body.employeeId) payload.status = 'Assigned'; activityDetails = `Marketing assignment changed to ${body.employeeId ?? 'unassigned'}`;
  } else if (action === 'marketing_update') {
    if (!ctx.isAdmin && ctx.department !== 'Marketing') return NextResponse.json({ error: 'You cannot edit Marketing leads' }, { status: 403 });
    if (!canEditAssignedRecord(ctx, lead.assigned_marketing_id)) return NextResponse.json({ error: 'Only the assigned employee or department admin can update this lead' }, { status: 403 });
    if (body.status !== undefined && !isLeadStatus(body.status)) return NextResponse.json({ error: 'Invalid lead status' }, { status: 400 });
    payload.status = body.status ?? lead.status; payload.marketing_notes = body.notes ?? lead.marketing_notes;
    if (typeof body.isHighConversion === 'boolean') payload.is_high_conversion_probable = body.isHighConversion;
    if (body.conversionProbability !== undefined) payload.conversion_probability = Math.max(0, Math.min(100, Number(body.conversionProbability) || 0));
    if (body.pipelineStage !== undefined) payload.marketing_pipeline_stage = String(body.pipelineStage);
    if (body.nextAction !== undefined) payload.next_action = body.nextAction || null; if (body.nextActionAt !== undefined) payload.next_action_at = body.nextActionAt || null;
    activityDetails = body.notes || body.pipelineStage || 'Marketing lead updated';
  } else if (action === 'transfer_to_sales') {
    if (!canManageDepartment(ctx, 'Marketing')) return NextResponse.json({ error: 'Only a Marketing admin or Super Admin can transfer leads to Sales' }, { status: 403 });
    if (!lead.is_high_conversion_probable) return NextResponse.json({ error: 'Only high-conversion leads can be transferred' }, { status: 400 });
    payload.assigned_department = 'Sales'; payload.assigned_dept_head_id = body.salesLeadId ?? null; payload.assigned_sales_id = null; payload.status = 'Qualified'; payload.qualified_at = new Date().toISOString(); activityDetails = 'Lead handed over from Marketing to Sales';
  } else if (action === 'sales_assign') {
    if (!canManageDepartment(ctx, 'Sales') || lead.assigned_department !== 'Sales') return NextResponse.json({ error: 'Only a Sales admin or Super Admin can assign sales employees' }, { status: 403 });
    payload.assigned_sales_id = body.employeeId ?? null; if (body.employeeId) payload.status = 'Assigned'; activityDetails = `Sales assignment changed to ${body.employeeId ?? 'unassigned'}`;
  } else if (action === 'sales_update') {
    if (!ctx.isAdmin && ctx.department !== 'Sales') return NextResponse.json({ error: 'You cannot edit Sales leads' }, { status: 403 });
    if (!canEditAssignedRecord(ctx, lead.assigned_sales_id)) return NextResponse.json({ error: 'Only the assigned employee or department admin can update this lead' }, { status: 403 });
    if (body.status !== undefined && !isLeadStatus(body.status)) return NextResponse.json({ error: 'Invalid lead status' }, { status: 400 });
    payload.status = body.status ?? lead.status; payload.sales_notes = body.notes ?? lead.sales_notes;
    if (body.salesPipelineStage !== undefined) payload.sales_pipeline_stage = String(body.salesPipelineStage); if (body.followUpDate !== undefined) payload.follow_up_date = body.followUpDate || null; if (body.callScheduledAt !== undefined) payload.call_scheduled_at = body.callScheduledAt || null; if (body.nextAction !== undefined) payload.next_action = body.nextAction || null; if (body.nextActionAt !== undefined) payload.next_action_at = body.nextActionAt || null;
    if (body.status === 'Contacted') payload.last_contacted_at = new Date().toISOString(); if (body.status === 'Qualified' && !lead.qualified_at) payload.qualified_at = new Date().toISOString(); if (body.status === 'Converted') payload.converted_at = new Date().toISOString(); activityDetails = body.notes || body.salesPipelineStage || 'Sales lead updated';
  } else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  const { data, error } = await supabase.from('leads').update(payload).eq('id', leadId).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from('lead_activities').insert({ lead_id: leadId, employee_id: ctx.employeeId, department: ctx.department ?? (action.startsWith('marketing') || action === 'transfer_to_sales' ? 'Marketing' : 'Sales'), activity_type: activityType, details: activityDetails });
  return NextResponse.json({ success: true, data });
}
