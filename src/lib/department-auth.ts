import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export type Department = 'Marketing' | 'Sales' | 'Operations' | 'HR' | 'Finance';

export interface AuthContext {
  employeeId: string | null;
  isAdmin: boolean;
  userRole: string;
  department: Department | null;
}

export async function getAuthContext(): Promise<AuthContext> {
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value?.toLowerCase();
  const employeeId = cookieStore.get('employee_id')?.value ?? null;

  if (role === 'admin') {
    return { employeeId: null, isAdmin: true, userRole: 'SuperAdmin', department: null };
  }

  if (!employeeId) {
    return { employeeId: null, isAdmin: false, userRole: '', department: null };
  }

  const { data } = await supabase
    .from('employees')
    .select('id,user_role,department_type,status')
    .eq('id', employeeId)
    .maybeSingle();

  if (!data || data.status !== 'Active') {
    return { employeeId: null, isAdmin: false, userRole: '', department: null };
  }

  return {
    employeeId: data.id,
    isAdmin: false,
    userRole: String(data.user_role ?? 'Employee'),
    department: (data.department_type as Department | null) ?? null,
  };
}

export function isDepartmentHead(ctx: AuthContext) {
  return ctx.isAdmin || ['SuperAdmin', 'Admin', 'DeptHead', 'Manager'].includes(ctx.userRole);
}

export function canAccessDepartment(ctx: AuthContext, department: Department) {
  return ctx.isAdmin || ctx.department === department || isDepartmentHead(ctx);
}

export function canEditAssignedRecord(ctx: AuthContext, assignedId?: string | null) {
  return ctx.isAdmin || isDepartmentHead(ctx) || (!!ctx.employeeId && ctx.employeeId === assignedId);
}
