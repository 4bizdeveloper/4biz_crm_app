import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessLeadBranch, getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { canTransitionLeadStatus, serializeLead } from '@/lib/lead-status';

const validDepartments = ['HR', 'Finance', 'Marketing', 'Sales', 'Operations'];

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { leadId, assignedDepartment, assignedEmployeeId, assignedDeptHeadId } = body as {
      leadId?: string; assignedDepartment?: string; assignedEmployeeId?: string | null; assignedDeptHeadId?: string | null;
    };
    if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

    const lead = await prisma.leads.findUnique({ where: { id: leadId } });
    if (!lead || lead.archived_at) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (!canAccessLeadBranch(ctx, lead.branch)) return NextResponse.json({ error: 'You cannot assign leads outside your assigned branch.' }, { status: 403 });
    const canSupervise = ctx.isAdmin || isDepartmentHead(ctx);
    const dept = String(assignedDepartment || lead.assigned_department || 'Sales');
    if (!validDepartments.includes(dept)) return NextResponse.json({ error: 'Invalid department.' }, { status: 400 });

    if (!ctx.isAdmin && (!canSupervise || ctx.department !== dept)) {
      return NextResponse.json({ error: 'You can only manage leads for your department.' }, { status: 403 });
    }

    if (assignedEmployeeId) {
      if (!canTransitionLeadStatus(lead.status, 'Assigned', ctx.isAdmin)) return NextResponse.json({ error: 'Lead cannot be assigned from its current status.' }, { status: 400 });
      const employee = await prisma.employees.findUnique({
        where: { id: assignedEmployeeId },
        select: { id: true, department_type: true, status: true },
      });
      if (!employee || employee.status !== 'Active' || employee.department_type !== dept) {
        return NextResponse.json({ error: 'Selected employee is not an active member of this department.' }, { status: 400 });
      }
    }
    if (assignedDeptHeadId) {
      const head = await prisma.employees.findUnique({
        where: { id: assignedDeptHeadId },
        select: { id: true, department_type: true, status: true, user_role: true },
      });
      if (!head || head.status !== 'Active' || head.department_type !== dept || !['Admin', 'DeptHead', 'Manager', 'SuperAdmin'].includes(head.user_role)) {
        return NextResponse.json({ error: 'Selected department head is not an active authorized member of this department.' }, { status: 400 });
      }
    }

    const data = await prisma.$transaction(async (tx) => {
      const updated = await tx.leads.update({
        where: { id: leadId },
        data: {
          assigned_department: dept as never,
          assigned_dept_head_id: ctx.isAdmin ? (assignedDeptHeadId || null) : ctx.employeeId,
          assigned_employee_id: assignedEmployeeId || null,
          status: assignedEmployeeId ? 'Assigned' : lead.status,
          last_activity_at: new Date(),
          updated_at: new Date(),
        },
      });
      await tx.lead_activities.create({
        data: {
          lead_id: leadId, employee_id: ctx.employeeId, department: ctx.department as never,
          activity_type: 'assignment_changed', subject: 'Lead assignment changed',
          details: `Department: ${dept}; employee: ${assignedEmployeeId || 'unassigned'}`,
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, data: serializeLead(data) });
  } catch (error) {
    console.error('Lead assignment error', error);
    return NextResponse.json({ error: 'Unable to update lead assignment.' }, { status: 400 });
  }
}
