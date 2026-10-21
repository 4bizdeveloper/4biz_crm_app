import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { hashPassword } from '@/lib/password';

const publicSelect = {
  id: true, first_name: true, last_name: true, email: true, phone: true, department: true,
  job_title: true, role: true, status: true, hire_date: true, user_role: true,
  department_type: true, avatar_url: true, reports_to_id: true, employee_code: true,
  work_location: true, joined_at: true, notes: true, created_at: true,
} as const;

const validDepartments = ['HR', 'Finance', 'Marketing', 'Sales', 'Operations'];
const validRoles = ['SuperAdmin', 'DeptHead', 'Employee'];

function canManageTarget(ctx: Awaited<ReturnType<typeof getAuthContext>>, department: string | null) {
  return ctx.isAdmin || (isDepartmentHead(ctx) && !!ctx.department && ctx.department === department);
}

function toEmployeeStatus(value: unknown) {
  return value === 'Inactive' ? 'Terminated' : String(value || 'Active');
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await prisma.employees.findMany({
      where: ctx.isAdmin ? {} : { department_type: ctx.department as never },
      select: publicSelect,
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({
      data,
      currentUser: { id: ctx.employeeId, role: ctx.userRole, department: ctx.department, isAdmin: ctx.isAdmin },
    });
  } catch (error) {
    console.error('Unable to load users:', error);
    return NextResponse.json({ error: 'Unable to load users.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const department = String(body.department_type || body.department || ctx.department || '');
    if (!validDepartments.includes(department) || !canManageTarget(ctx, department)) {
      return NextResponse.json({ error: 'You can only manage users in your department.' }, { status: 403 });
    }

    const requestedRole = String(body.user_role || 'Employee') === 'Admin' ? 'DeptHead' : String(body.user_role || 'Employee');
    if (!validRoles.includes(requestedRole)) return NextResponse.json({ error: 'Invalid user role.' }, { status: 400 });
    if (!ctx.isAdmin && requestedRole !== 'Employee') {
      return NextResponse.json({ error: 'Department leads can create employee accounts only.' }, { status: 403 });
    }

    const firstName = String(body.first_name || '').trim();
    const lastName = String(body.last_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!firstName || !lastName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid first name, last name and email are required.' }, { status: 400 });
    }

    const password = String(body.password || 'changeMe123');
    const { hash, salt } = await hashPassword(password);
    const data = await prisma.employees.create({
      data: {
        first_name: firstName, last_name: lastName, email,
        phone: body.phone ? String(body.phone) : null,
        department: department,
        department_type: department as never,
        job_title: body.job_title ? String(body.job_title) : null,
        role: (body.role || 'Sales') as never,
        user_role: requestedRole as never,
        status: toEmployeeStatus(body.status) as never,
        password: '',
        password_hash: hash,
        password_salt: salt,
        reports_to_id: ctx.employeeId || body.reports_to_id || null,
        employee_code: body.employee_code ? String(body.employee_code) : null,
        work_location: body.work_location ? String(body.work_location) : null,
        notes: body.notes ? String(body.notes) : null,
      },
      select: publicSelect,
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unable to create user:', error);
    return NextResponse.json({ error: 'Unable to create user. Check the supplied fields.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
    const existing = await prisma.employees.findUnique({
      where: { id },
      select: { id: true, department_type: true, user_role: true },
    });
    if (!existing) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    if (!canManageTarget(ctx, existing.department_type)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const nextRole = String(body.user_role ?? existing.user_role) === 'Admin'
      ? 'DeptHead'
      : String(body.user_role ?? existing.user_role);
    if (!validRoles.includes(nextRole)) return NextResponse.json({ error: 'Invalid user role.' }, { status: 400 });
    if (!ctx.isAdmin && (nextRole !== 'Employee' || body.department_type !== undefined || body.department !== undefined)) {
      return NextResponse.json({ error: 'Department leads cannot elevate privileges or move employees between departments.' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    for (const key of ['first_name', 'last_name', 'phone', 'job_title', 'avatar_url', 'employee_code', 'work_location', 'notes'] as const) {
      if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key];
    }
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
      updates.email = email;
    }
    if (body.status !== undefined) updates.status = toEmployeeStatus(body.status);
    if (body.user_role !== undefined) updates.user_role = nextRole;
    if (body.role !== undefined) updates.role = body.role;
    if (ctx.isAdmin && (body.department_type !== undefined || body.department !== undefined)) {
      const targetDepartment = String(body.department_type ?? body.department);
      if (!validDepartments.includes(targetDepartment)) return NextResponse.json({ error: 'Invalid department.' }, { status: 400 });
      updates.department_type = targetDepartment;
      updates.department = body.department ?? targetDepartment;
    }
    if (ctx.isAdmin && body.reports_to_id !== undefined) updates.reports_to_id = body.reports_to_id || null;
    if (body.password) {
      const { hash, salt } = await hashPassword(String(body.password));
      updates.password = '';
      updates.password_hash = hash;
      updates.password_salt = salt;
    }

    const data = await prisma.employees.update({ where: { id }, data: updates as never, select: publicSelect });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unable to update user:', error);
    return NextResponse.json({ error: 'Unable to update user.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Only Super Admin can delete users.' }, { status: 403 });
  try {
    const body = await request.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
    if (id === ctx.employeeId) return NextResponse.json({ error: 'You cannot delete the account you are currently using.' }, { status: 400 });
    const existing = await prisma.employees.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const data = await prisma.employees.update({
      where: { id },
      data: { status: 'Terminated', password: '', password_hash: null, password_salt: null },
      select: publicSelect,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unable to terminate user:', error);
    return NextResponse.json({ error: 'Unable to terminate user.' }, { status: 400 });
  }
}
