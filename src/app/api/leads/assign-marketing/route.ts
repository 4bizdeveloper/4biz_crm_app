import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/department-auth';
import { canTransitionLeadStatus } from '@/lib/lead-status';

function canAssignMarketingLeads(ctx: Awaited<ReturnType<typeof getAuthContext>>) {
  return ctx.isAdmin || (ctx.department === 'Marketing' && ['Admin', 'DeptHead'].includes(ctx.userRole));
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAssignMarketingLeads(ctx)) {
    return NextResponse.json({ error: 'Only Super Admin or Marketing Admin can assign leads to Marketing employees.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const leadId = String(body.leadId || body.id || '');
    const marketingEmployeeId = String(body.marketingEmployeeId || '');
    if (!leadId || !marketingEmployeeId) {
      return NextResponse.json({ error: 'Lead and Marketing employee are required.' }, { status: 400 });
    }

    const [lead, employee] = await Promise.all([
      prisma.leads.findUnique({ where: { id: leadId } }),
      prisma.employees.findUnique({
        where: { id: marketingEmployeeId },
        select: { id: true, first_name: true, last_name: true, email: true, department_type: true, user_role: true, status: true },
      }),
    ]);
    if (!lead || lead.archived_at) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    if (!employee) return NextResponse.json({ error: 'Marketing employee not found.' }, { status: 404 });
    if (lead.status === 'New' && !canTransitionLeadStatus(lead.status, 'Assigned', ctx.isAdmin)) return NextResponse.json({ error: 'Lead cannot be assigned from its current status.' }, { status: 400 });
    if (employee.department_type !== 'Marketing' || employee.status !== 'Active' || employee.user_role !== 'Employee') {
      return NextResponse.json({ error: 'The selected assignee must be an active Marketing employee, not an admin or department head.' }, { status: 400 });
    }

    const data = await prisma.$transaction(async (tx) => {
      const updated = await tx.leads.update({
        where: { id: leadId },
        data: {
          assigned_marketing_id: employee.id,
          assigned_department: 'Marketing',
          status: lead.status === 'New' ? 'Assigned' : lead.status,
          last_activity_at: new Date(),
          updated_at: new Date(),
        },
      });
      await tx.lead_activities.create({
        data: {
          lead_id: leadId, employee_id: ctx.employeeId, department: ctx.department as never,
          activity_type: 'marketing_assign', subject: 'Marketing assignment changed',
          details: `Assigned to ${employee.first_name} ${employee.last_name} (${employee.id})`,
        },
      });
      return updated;
    });
    return NextResponse.json({ data: { ...data, status: data.status === 'Follow_up' ? 'Follow-up' : data.status } });
  } catch (error) {
    console.error('Marketing lead assignment error:', error);
    return NextResponse.json({ error: 'Unable to assign lead to Marketing employee.' }, { status: 400 });
  }
}
