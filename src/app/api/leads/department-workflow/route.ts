import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessLeadBranch, getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { canTransitionLeadStatus, serializeLead, toPrismaLeadStatus } from '@/lib/lead-status';

function asDate(value: unknown) {
  return value ? new Date(String(value)) : null;
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action, leadId, employeeId, notes, callScheduledAt, isHighConversion, targetDeptHeadId } = body;
    if (!leadId || typeof action !== 'string') return NextResponse.json({ error: 'action and leadId are required.' }, { status: 400 });
    const lead = await prisma.leads.findUnique({ where: { id: String(leadId) } });
    if (!lead || lead.archived_at) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (!canAccessLeadBranch(ctx, lead.branch)) return NextResponse.json({ error: 'You cannot update leads outside your assigned branch.' }, { status: 403 });

    const marketingLead = ctx.isAdmin || (ctx.department === 'Marketing' && isDepartmentHead(ctx));
    const salesLead = ctx.isAdmin || (ctx.department === 'Sales' && isDepartmentHead(ctx));
    const updateData: Record<string, unknown> = { last_activity_at: new Date(), updated_at: new Date() };

    switch (action) {
      case 'MARKETING_UPDATE':
        if (!ctx.isAdmin && ctx.department !== 'Marketing') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (!ctx.isAdmin && !marketingLead && lead.assigned_marketing_id !== ctx.employeeId) return NextResponse.json({ error: 'You can only update leads assigned to you.' }, { status: 403 });
        if (notes !== undefined) updateData.marketing_notes = notes;
        updateData.is_high_conversion_probable = isHighConversion ?? false;
        break;
      case 'MARKETING_TRANSFER_TO_SALES':
        if (!marketingLead) return NextResponse.json({ error: 'Only Marketing leads or Super Admin can transfer leads.' }, { status: 403 });
        if (targetDeptHeadId) {
          const head = await prisma.employees.findUnique({ where: { id: String(targetDeptHeadId) }, select: { id: true, department_type: true, user_role: true, status: true } });
          if (!head || head.department_type !== 'Sales' || head.status !== 'Active' || !['Admin', 'DeptHead', 'Manager', 'SuperAdmin'].includes(head.user_role)) {
            return NextResponse.json({ error: 'Selected Sales department head is invalid.' }, { status: 400 });
          }
        }
        if (!canTransitionLeadStatus(lead.status, 'Qualified', ctx.isAdmin)) return NextResponse.json({ error: 'Lead cannot be transferred from its current status.' }, { status: 400 });
        updateData.assigned_department = 'Sales';
        updateData.assigned_dept_head_id = targetDeptHeadId || null;
        updateData.assigned_sales_id = null;
        updateData.status = 'Qualified';
        updateData.qualified_at = new Date();
        break;
      case 'SALES_ASSIGN':
        if (!salesLead) return NextResponse.json({ error: 'Only Sales leads or Super Admin can assign sales leads.' }, { status: 403 });
        if (employeeId) {
          const employee = await prisma.employees.findUnique({ where: { id: String(employeeId) }, select: { id: true, department_type: true, user_role: true, status: true } });
          if (!employee || employee.department_type !== 'Sales' || employee.status !== 'Active' || employee.user_role !== 'Employee') {
            return NextResponse.json({ error: 'Selected Sales employee is invalid.' }, { status: 400 });
          }
        }
        updateData.assigned_sales_id = employeeId || null;
        updateData.assigned_department = 'Sales';
        if (employeeId) {
          if (!canTransitionLeadStatus(lead.status, 'Assigned', ctx.isAdmin)) return NextResponse.json({ error: 'Lead cannot be assigned from its current status.' }, { status: 400 });
          updateData.status = 'Assigned';
        }
        break;
      case 'SALES_UPDATE_STAGE':
        if (!ctx.isAdmin && ctx.department !== 'Sales') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (!ctx.isAdmin && !salesLead && lead.assigned_sales_id !== ctx.employeeId) return NextResponse.json({ error: 'You can only update leads assigned to you.' }, { status: 403 });
        if (body.status !== undefined) {
          const status = toPrismaLeadStatus(body.status);
          if (!status || !canTransitionLeadStatus(lead.status, status, ctx.isAdmin)) return NextResponse.json({ error: 'Invalid lead status transition.' }, { status: 400 });
          updateData.status = status;
        }
        if (body.pipelineStage !== undefined) updateData.sales_pipeline_stage = String(body.pipelineStage);
        if (notes !== undefined) updateData.sales_notes = notes;
        if (body.followUpDate !== undefined) updateData.follow_up_date = asDate(body.followUpDate);
        if (callScheduledAt !== undefined) updateData.call_scheduled_at = asDate(callScheduledAt);
        if (body.nextAction !== undefined) updateData.next_action = body.nextAction || null;
        if (body.nextActionAt !== undefined) updateData.next_action_at = asDate(body.nextActionAt);
        if (body.conversionProbability !== undefined) updateData.conversion_probability = Math.max(0, Math.min(100, Number(body.conversionProbability) || 0));
        break;
      default:
        return NextResponse.json({ error: 'Invalid workflow action' }, { status: 400 });
    }

    const data = await prisma.$transaction(async (tx) => {
      const updated = await tx.leads.update({ where: { id: lead.id }, data: updateData as never });
      await tx.lead_activities.create({
        data: {
          lead_id: lead.id, employee_id: ctx.employeeId, department: ctx.department as never,
          activity_type: String(action), subject: String(action).replaceAll('_', ' '),
          details: typeof notes === 'string' ? notes : 'Lead workflow updated.',
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, data: serializeLead(data) });
  } catch (error) {
    console.error('Lead workflow error', error);
    return NextResponse.json({ error: 'Unable to update lead workflow.' }, { status: 400 });
  }
}
