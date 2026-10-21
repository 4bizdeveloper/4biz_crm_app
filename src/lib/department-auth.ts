import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { canAccessLeadBranch } from '@/lib/branch-access';
export { canAccessLeadBranch } from '@/lib/branch-access';
import { verifySessionToken } from '@/lib/auth-session';

export type Department = 'Marketing' | 'Sales' | 'Operations' | 'HR' | 'Finance';

export interface AuthContext {
  employeeId: string | null;
  isAdmin: boolean;
  userRole: string;
  department: Department | null;
  branch: string | null;
}

export async function getAuthContext(): Promise<AuthContext> {
  const unauthenticated: AuthContext = {
    employeeId: null,
    isAdmin: false,
    userRole: '',
    department: null,
    branch: null,
  };

  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get('crm_session')?.value);

  if (!session) return unauthenticated;
  if (session.sub === 'super-admin' && session.role === 'SuperAdmin') {
    return { employeeId: null, isAdmin: true, userRole: 'SuperAdmin', department: null, branch: null };
  }

  try {
    const employee = await prisma.employees.findUnique({
      where: { id: session.sub },
      select: { id: true, user_role: true, department_type: true, status: true, branch: true },
    });

    if (!employee || employee.status !== 'Active') return unauthenticated;

    const userRole = String(employee.user_role ?? 'Employee');
    return {
      employeeId: employee.id,
      isAdmin: userRole === 'SuperAdmin',
      userRole,
      department: (employee.department_type as Department | null) ?? null,
      branch: employee.branch,
    };
  } catch (error) {
    console.error('Unable to resolve CRM session:', error);
    return unauthenticated;
  }
}

export function isDepartmentHead(ctx: AuthContext) {
  return ctx.isAdmin || ['SuperAdmin', 'Admin', 'DeptHead', 'Manager'].includes(ctx.userRole);
}

export function canAccessDepartment(ctx: AuthContext, department: Department) {
  return ctx.isAdmin || ctx.department === department;
}

export function canEditAssignedRecord(ctx: AuthContext, assignedId?: string | null) {
  return ctx.isAdmin || isDepartmentHead(ctx) || (!!ctx.employeeId && ctx.employeeId === assignedId);
}

