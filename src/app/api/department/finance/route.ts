import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessDepartment, getAuthContext, isDepartmentHead } from '@/lib/department-auth';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Finance') || !isDepartmentHead(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const [invoices, leads] = await Promise.all([
      prisma.invoices.findMany({
        orderBy: { due_date: 'asc' },
        include: {
          leads: { select: { id: true, name: true, company: true } },
          projects: { select: { id: true, project_name: true } },
        },
      }),
      prisma.leads.findMany({
        where: ctx.isAdmin || !ctx.branch ? {} : { branch: ctx.branch },
        select: { id: true, name: true, company: true, value: true, payment_status: true, status: true },
        orderBy: { value: 'desc' },
      }),
    ]);
    return NextResponse.json({
      invoices: invoices.map(({ leads: lead, projects: project, ...invoice }) => ({ ...invoice, lead, project })),
      leads,
    });
  } catch (error) {
    console.error('Unable to load Finance data:', error);
    return NextResponse.json({ error: 'Unable to load Finance data.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Finance') || !isDepartmentHead(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    if (!body.clientName || !body.dueDate) return NextResponse.json({ error: 'clientName and dueDate are required.' }, { status: 400 });
    const data = await prisma.invoices.create({
      data: {
        lead_id: body.leadId ?? null, project_id: body.projectId ?? null,
        client_name: String(body.clientName), amount: String(body.amount ?? 0),
        tax_amount: String(body.taxAmount ?? 0), status: (body.status ?? 'Draft') as never,
        due_date: new Date(String(body.dueDate)), created_by: ctx.employeeId,
      },
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Unable to create invoice:', error);
    return NextResponse.json({ error: 'Unable to create invoice. Check the supplied fields.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccessDepartment(ctx, 'Finance') || !isDepartmentHead(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    if (!body.invoiceId) return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.amount !== undefined) updates.amount = String(body.amount);
    if (body.taxAmount !== undefined) updates.tax_amount = String(body.taxAmount);
    if (body.dueDate !== undefined) updates.due_date = new Date(String(body.dueDate));
    const data = await prisma.invoices.update({ where: { id: String(body.invoiceId) }, data: updates as never });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unable to update invoice:', error);
    return NextResponse.json({ error: 'Unable to update invoice.' }, { status: 400 });
  }
}
