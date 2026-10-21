import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/department-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await prisma.departments.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, code: true, name: true, description: true, is_active: true,
        department_modules: { select: { id: true, module_key: true, module_name: true, description: true, is_enabled: true } },
      },
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unable to load departments:', error);
    return NextResponse.json({ error: 'Unable to load departments.' }, { status: 500 });
  }
}
