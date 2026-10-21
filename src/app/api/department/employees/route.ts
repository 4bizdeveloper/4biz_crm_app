import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';

const publicSelect = {
  id: true, first_name: true, last_name: true, email: true, phone: true, department: true,
  job_title: true, role: true, status: true, user_role: true, department_type: true,
  avatar_url: true, hire_date: true, created_at: true,
} as const;

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const department = searchParams.get('department') ?? ctx.department;
  const roleFilter = searchParams.get('role');
  const canListRequestedDepartment = ctx.isAdmin || (ctx.department === department && (isDepartmentHead(ctx) || ctx.userRole === 'Admin'));
  if (!department || !canListRequestedDepartment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await prisma.employees.findMany({
      where: {
        department_type: department as never,
        status: 'Active',
        ...(roleFilter === 'employee' ? { user_role: 'Employee' } : {}),
      },
      select: publicSelect,
      orderBy: { first_name: 'asc' },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unable to load department employees:', error);
    return NextResponse.json({ error: 'Unable to load employees.' }, { status: 500 });
  }
}
