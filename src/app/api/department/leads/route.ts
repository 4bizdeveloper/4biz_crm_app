import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessDepartment, canAccessLeadBranch, canEditAssignedRecord, getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { canTransitionLeadStatus, serializeLead, toPrismaLeadStatus } from '@/lib/lead-status';

const departments = ['Marketing', 'Sales'] as const;
type Department = (typeof departments)[number];

function canManageDepartment(ctx: Awaited<ReturnType<typeof getAuthContext>>, department: Department) {
  return ctx.isAdmin || (ctx.department === department && isDepartmentHead(ctx));
}

function asDate(value: unknown) {
  return value ? new Date(String(value)) : null;
}

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const department = (searchParams.get('department') ?? ctx.department ?? 'Sales') as Department;
  if (!departments.includes(department) || !canAccessDepartment(ctx, department)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const conditions: Record<string, unknown>[] = [
    { assigned_department: department },
    ...(department === 'Sales' ? [{ is_high_conversion_probable: true }] : []),
  ];
  const employeeId = searchParams.get('employeeId');
  if (employeeId) conditions.push({ [department === 'Marketing' ? 'assigned_marketing_id' : 'assigned_sales_id']: employeeId });
  if (searchParams.get('highConversion') === 'true') conditions.push({ is_high_conversion_probable: true });
  const where: Record<string, unknown> = { AND: conditions, archived_at: null };
  if (!ctx.isAdmin && ctx.branch) where.branch = ctx.branch;
  if (searchParams.get('today') === 'true') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    where.OR = [
      { follow_up_date: { gte: start, lt: end } },
      { call_scheduled_at: { gte: start, lt: end } },
    ];
  }

  try {
    const data = await prisma.leads.findMany({
      where: where as never,
      orderBy: { last_activity_at: 'desc' },
    });
    return NextResponse.json({ data: data.map(serializeLead) });
  } catch (error) {
    console.error('Unable to load department leads:', error);
    return NextResponse.json({ error: 'Unable to load department leads.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { leadId, action } = body as { leadId?: string; action?: string };
    if (!leadId || !action) return NextResponse.json({ error: 'leadId and action are required' }, { status: 400 });

    const lead = await prisma.leads.findUnique({ where: { id: leadId } });
    if (!lead || lead.archived_at) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (!canAccessLeadBranch(ctx, lead.branch)) return NextResponse.json({ error: 'You cannot access leads outside your assigned branch.' }, { status: 403 });

    const payload: Record<string, unknown> = { last_activity_at: new Date(), updated_at: new Date() };
    let activityDetails = '';

    if (action === 'marketing_assign') {
      if (!canManageDepartment(ctx, 'Marketing')) return NextResponse.json({ error: 'Only the Marketing lead or Super Admin can assign marketing employees' }, { status: 403 });
      if (body.employeeId) {
        const employee = await prisma.employees.findUnique({ where: { id: String(body.employeeId) }, select: { id: true, department_type: true, user_role: true, status: true } });
        if (!employee || employee.department_type !== 'Marketing' || employee.user_role !== 'Employee' || employee.status !== 'Active') {
          return NextResponse.json({ error: 'Select an active Marketing employee account.' }, { status: 400 });
        }
      }
      payload.assigned_marketing_id = body.employeeId ?? null;
      payload.assigned_department = 'Marketing';
      if (body.employeeId && lead.status === 'New') payload.status = 'Assigned';
      activityDetails = `Marketing assignment changed to ${body.employeeId ?? 'unassigned'}`;
    } else if (action === 'marketing_update') {
      if (!canEditAssignedRecord(ctx, lead.assigned_marketing_id) || (!ctx.isAdmin && ctx.department !== 'Marketing')) {
        return NextResponse.json({ error: 'Only the assigned marketing employee, Marketing lead or Super Admin can update this lead' }, { status: 403 });
      }
      if (body.status !== undefined) {
        const status = toPrismaLeadStatus(body.status);
        if (!status || !canTransitionLeadStatus(lead.status, status, ctx.isAdmin)) return NextResponse.json({ error: 'Invalid lead status transition.' }, { status: 400 });
        payload.status = status;
      }
      if (body.notes !== undefined) payload.marketing_notes = body.notes;
      if (typeof body.isHighConversion === 'boolean') payload.is_high_conversion_probable = body.isHighConversion;
      if (body.conversionProbability !== undefined) payload.conversion_probability = Math.max(0, Math.min(100, Number(body.conversionProbability) || 0));
      if (body.pipelineStage !== undefined) payload.marketing_pipeline_stage = String(body.pipelineStage);
      if (body.nextAction !== undefined) payload.next_action = body.nextAction || null;
      if (body.nextActionAt !== undefined) payload.next_action_at = asDate(body.nextActionAt);
      activityDetails = String(body.notes || body.pipelineStage || 'Marketing lead updated');
    } else if (action === 'transfer_to_sales') {
      if (!canManageDepartment(ctx, 'Marketing')) return NextResponse.json({ error: 'Only the Marketing lead or Super Admin can transfer leads to Sales' }, { status: 403 });
      if (!lead.is_high_conversion_probable) return NextResponse.json({ error: 'Only high-conversion leads can be transferred' }, { status: 400 });
      if (!canTransitionLeadStatus(lead.status, 'Qualified', ctx.isAdmin)) return NextResponse.json({ error: 'Lead status cannot transition to Qualified from its current state.' }, { status: 400 });
      payload.assigned_department = 'Sales';
      payload.assigned_dept_head_id = body.salesLeadId ?? null;
      payload.assigned_sales_id = null;
      payload.status = 'Qualified';
      payload.qualified_at = new Date();
      activityDetails = 'Lead handed over from Marketing to Sales';
    } else if (action === 'sales_assign') {
      if (!canManageDepartment(ctx, 'Sales') || lead.assigned_department !== 'Sales') {
        return NextResponse.json({ error: 'Only the Sales lead or Super Admin can assign sales employees' }, { status: 403 });
      }
      if (body.employeeId) {
        const employee = await prisma.employees.findUnique({ where: { id: String(body.employeeId) }, select: { id: true, department_type: true, user_role: true, status: true } });
        if (!employee || employee.department_type !== 'Sales' || employee.user_role !== 'Employee' || employee.status !== 'Active') {
          return NextResponse.json({ error: 'Select an active Sales employee account.' }, { status: 400 });
        }
      }
      payload.assigned_sales_id = body.employeeId ?? null;
      if (body.employeeId) {
        if (!canTransitionLeadStatus(lead.status, 'Assigned', ctx.isAdmin)) return NextResponse.json({ error: 'Lead cannot be assigned from its current status.' }, { status: 400 });
        payload.status = 'Assigned';
      }
      activityDetails = `Sales assignment changed to ${body.employeeId ?? 'unassigned'}`;
    } else if (action === 'sales_update') {
      if (!canEditAssignedRecord(ctx, lead.assigned_sales_id) || (!ctx.isAdmin && ctx.department !== 'Sales')) {
        return NextResponse.json({ error: 'Only the assigned sales employee, Sales lead or Super Admin can update this lead' }, { status: 403 });
      }
      if (body.status !== undefined) {
        const status = toPrismaLeadStatus(body.status);
        if (!status || !canTransitionLeadStatus(lead.status, status, ctx.isAdmin)) return NextResponse.json({ error: 'Invalid lead status transition.' }, { status: 400 });
        payload.status = status;
      }
      if (body.notes !== undefined) payload.sales_notes = body.notes;
      if (body.salesPipelineStage !== undefined) payload.sales_pipeline_stage = String(body.salesPipelineStage);
      if (body.followUpDate !== undefined) payload.follow_up_date = asDate(body.followUpDate);
      if (body.callScheduledAt !== undefined) payload.call_scheduled_at = asDate(body.callScheduledAt);
      if (body.nextAction !== undefined) payload.next_action = body.nextAction || null;
      if (body.nextActionAt !== undefined) payload.next_action_at = asDate(body.nextActionAt);
      if (body.status === 'Contacted') payload.last_contacted_at = new Date();
      if (body.status === 'Qualified' && !lead.qualified_at) payload.qualified_at = new Date();
      if (body.status === 'Converted') payload.converted_at = new Date();
      activityDetails = String(body.notes || body.salesPipelineStage || 'Sales lead updated');
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.leads.update({ where: { id: leadId }, data: payload as never });
      await tx.lead_activities.create({
        data: {
          lead_id: leadId, employee_id: ctx.employeeId, department: ctx.department as never,
          activity_type: action, subject: action.replaceAll('_', ' '), details: activityDetails,
        },
      });
      return result;
    });
    return NextResponse.json({ success: true, data: serializeLead(updated) });
  } catch (error) {
    console.error('Department lead workflow error:', error);
    return NextResponse.json({ error: 'Unable to update department lead.' }, { status: 400 });
  }
}
