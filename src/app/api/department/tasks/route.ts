import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessDepartment, getAuthContext, isDepartmentHead } from '@/lib/department-auth';

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const department = params.get('department') ?? ctx.department;
  if (!department || !canAccessDepartment(ctx, department as never)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await prisma.department_tasks.findMany({
      where: {
        department: department as never,
        ...(!ctx.isAdmin && !isDepartmentHead(ctx) ? { assigned_to: ctx.employeeId } : {}),
        ...(isDepartmentHead(ctx) && params.get('employeeId') ? { assigned_to: params.get('employeeId') } : {}),
        ...(params.get('completed') === 'false' ? { is_completed: false } : {}),
      },
      include: {
        employees: { select: { id: true, first_name: true, last_name: true, email: true } },
        leads: { select: { id: true, name: true, company: true, email: true } },
      },
      orderBy: { scheduled_at: 'asc' },
    });
    return NextResponse.json({
      data: data.map(({ employees, leads, ...task }) => ({ ...task, assigned_employee: employees, lead: leads })),
    });
  } catch (error) {
    console.error('Unable to load department tasks:', error);
    return NextResponse.json({ error: 'Unable to load department tasks.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const department = body.department ?? ctx.department;
    if (!department || !canAccessDepartment(ctx, department as never) || !isDepartmentHead(ctx)) {
      return NextResponse.json({ error: 'Only department leads can create department tasks.' }, { status: 403 });
    }
    if (!body.title || !body.scheduledAt) return NextResponse.json({ error: 'title and scheduledAt are required.' }, { status: 400 });
    const data = await prisma.department_tasks.create({
      data: {
        title: String(body.title), description: body.description ?? null, department: department as never,
        assigned_to: body.assignedTo ?? null, lead_id: body.leadId ?? null,
        scheduled_at: new Date(String(body.scheduledAt)),
      },
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Unable to create department task:', error);
    return NextResponse.json({ error: 'Unable to create department task.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    const task = await prisma.department_tasks.findUnique({ where: { id: String(body.taskId) } });
    if (!task || !canAccessDepartment(ctx, task.department as never)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!ctx.isAdmin && !isDepartmentHead(ctx) && task.assigned_to !== ctx.employeeId) {
      return NextResponse.json({ error: 'You can only update tasks assigned to you.' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    for (const key of ['title', 'description', 'is_completed'] as const) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.scheduledAt !== undefined) updates.scheduled_at = new Date(String(body.scheduledAt));
    if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
      if (body.assigned_to !== undefined || body.assignedTo !== undefined || body.lead_id !== undefined || body.leadId !== undefined) {
        return NextResponse.json({ error: 'Only department leads can reassign tasks or change their lead.' }, { status: 403 });
      }
    } else {
      if (body.assignedTo !== undefined) updates.assigned_to = body.assignedTo || null;
      if (body.leadId !== undefined) updates.lead_id = body.leadId || null;
    }
    const data = await prisma.department_tasks.update({ where: { id: String(body.taskId) }, data: updates as never });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unable to update department task:', error);
    return NextResponse.json({ error: 'Unable to update department task.' }, { status: 400 });
  }
}
