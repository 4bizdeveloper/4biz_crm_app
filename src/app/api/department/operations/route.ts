import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessDepartment, getAuthContext, isDepartmentHead } from '@/lib/department-auth';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Operations')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await prisma.projects.findMany({ orderBy: [{ due_date: 'asc' }, { created_at: 'desc' }] });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unable to load Operations projects:', error);
    return NextResponse.json({ error: 'Unable to load projects.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Operations') || !isDepartmentHead(ctx)) {
    return NextResponse.json({ error: 'Only Operations leads can create projects.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.clientName || !body.projectName || !body.startDate) {
      return NextResponse.json({ error: 'clientName, projectName and startDate are required.' }, { status: 400 });
    }
    const data = await prisma.projects.create({
      data: {
        client_name: String(body.clientName), project_name: String(body.projectName),
        budget: String(body.budget ?? 0), assigned_to: body.assignedTo ?? null,
        start_date: new Date(String(body.startDate)),
        due_date: body.dueDate ? new Date(String(body.dueDate)) : null,
        description: body.description ?? null, status: (body.status ?? 'Planning') as never,
      },
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Unable to create project:', error);
    return NextResponse.json({ error: 'Unable to create project. Check the supplied fields.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Operations') || !isDepartmentHead(ctx)) {
    return NextResponse.json({ error: 'Only Operations leads can update projects.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    const updates: Record<string, unknown> = {};
    for (const [from, to] of [['clientName', 'client_name'], ['projectName', 'project_name'], ['budget', 'budget'], ['assignedTo', 'assigned_to'], ['description', 'description'], ['status', 'status']] as const) {
      if (body[from] !== undefined) updates[to] = body[from];
    }
    if (body.budget !== undefined) updates.budget = String(body.budget);
    if (body.startDate !== undefined) updates.start_date = new Date(String(body.startDate));
    if (body.dueDate !== undefined) updates.due_date = body.dueDate ? new Date(String(body.dueDate)) : null;
    const data = await prisma.projects.update({ where: { id: String(body.projectId) }, data: updates as never });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unable to update project:', error);
    return NextResponse.json({ error: 'Unable to update project.' }, { status: 400 });
  }
}
