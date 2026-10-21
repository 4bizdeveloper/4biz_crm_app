import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await prisma.tickets.findMany({
      where: !ctx.isAdmin && !isDepartmentHead(ctx) ? { assigned_to: ctx.employeeId } : {},
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unable to load tickets:', error);
    return NextResponse.json({ error: 'Unable to load tickets.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.title || !(body.client_name ?? body.clientName)) {
      return NextResponse.json({ error: 'title and client name are required.' }, { status: 400 });
    }
    const data = await prisma.tickets.create({
      data: {
        title: String(body.title), client_name: String(body.client_name ?? body.clientName),
        assigned_to: body.assigned_to ?? body.assignedTo ?? ctx.employeeId,
        priority: (body.priority ?? 'Medium') as never, status: (body.status ?? 'Open') as never,
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unable to create ticket:', error);
    return NextResponse.json({ error: 'Unable to create ticket.' }, { status: 400 });
  }
}
