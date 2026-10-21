import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { serializeLead } from '@/lib/lead-status';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const departmentEmployeeIds = !ctx.isAdmin && ctx.department
      ? (await prisma.employees.findMany({
          where: { department_type: ctx.department as never },
          select: { id: true },
        })).map((employee) => employee.id)
      : [];

    let leadWhere: Record<string, unknown> = { archived_at: null };
    let projectWhere: Record<string, unknown> = {};
    let ticketWhere: Record<string, unknown> = {};
    let employeeWhere: Record<string, unknown> = {};

    if (!ctx.isAdmin) {
      if (isDepartmentHead(ctx)) {
        leadWhere.assigned_department = ctx.department ?? undefined;
        if (ctx.department !== 'Operations') projectWhere.assigned_to = ctx.employeeId;
        ticketWhere.assigned_to = departmentEmployeeIds.length ? { in: departmentEmployeeIds } : ctx.employeeId;
        employeeWhere.department_type = ctx.department ?? undefined;
      } else {
        leadWhere.OR = [
          { assigned_employee_id: ctx.employeeId },
          { assigned_marketing_id: ctx.employeeId },
          { assigned_sales_id: ctx.employeeId },
        ];
        projectWhere.assigned_to = ctx.employeeId;
        ticketWhere.assigned_to = ctx.employeeId;
        employeeWhere.id = ctx.employeeId;
      }
    }

    const [leads, projects, tickets, employees] = await Promise.all([
      prisma.leads.findMany({ where: leadWhere as never, select: { id: true, name: true, status: true, created_at: true } }),
      prisma.projects.findMany({ where: projectWhere as never, select: { id: true, project_name: true, status: true, created_at: true, assigned_to: true } }),
      prisma.tickets.findMany({ where: ticketWhere as never, select: { id: true, title: true, priority: true, status: true, created_at: true, assigned_to: true } }),
      prisma.employees.findMany({ where: employeeWhere as never, select: { id: true, first_name: true, last_name: true, department_type: true, status: true, hire_date: true } }),
    ]);

    return NextResponse.json({
      leads: leads.map(serializeLead),
      projects,
      tickets,
      employees: employees.map((employee) => ({
        id: employee.id,
        full_name: [employee.first_name, employee.last_name].filter(Boolean).join(' '),
        department: employee.department_type,
        status: employee.status,
        joined_date: employee.hire_date,
      })),
    });
  } catch (error) {
    console.error('Unable to load CRM overview:', error);
    return NextResponse.json({ error: 'Unable to load overview.' }, { status: 500 });
  }
}
