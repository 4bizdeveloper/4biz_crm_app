// src/lib/lead-access.ts
import type { AuthContext } from '@/lib/department-auth';

export type LeadAccessRecord = {
  assigned_department?: string | null;
  branch?: string | null;
  assigned_employee_id?: string | null;
  assigned_marketing_id?: string | null;
  assigned_sales_id?: string | null;
  assigned_dept_head_id?: string | null;
};

export type LeadAccessMode = 'read' | 'write';

// Super Admin: full access.
// DeptHead / Manager: full access to their department's leads.
// Employee: read/write only leads assigned to them; read-only within their department branch.
export function canAccessLead(
  ctx: AuthContext,
  lead: LeadAccessRecord,
  mode: LeadAccessMode = 'read'
): boolean {
  if (ctx.isAdmin) return true;

  const dept = ctx.department;
  if (!dept) return false;
  if (!ctx.employeeId) return false;

  const leadDept = lead.assigned_department ?? null;

  // Branch scoping: employees and managers only see their own department unless super admin.
  if (leadDept && leadDept !== dept) return false;

  const isHead = ['DeptHead', 'Admin', 'Manager', 'SuperAdmin'].includes(ctx.userRole);

  if (isHead) return true;

  // Employee: read-only within department, write only own assigned.
  const isOwn =
    lead.assigned_employee_id === ctx.employeeId ||
    lead.assigned_marketing_id === ctx.employeeId ||
    lead.assigned_sales_id === ctx.employeeId;

  if (mode === 'read') return isOwn || !leadDept;
  return isOwn;
}

export function assertLeadAccess(
  ctx: AuthContext,
  lead: LeadAccessRecord,
  mode: LeadAccessMode
): string | null {
  if (!ctx.employeeId && !ctx.isAdmin) return 'Unauthorized';
  if (!canAccessLead(ctx, lead, mode)) {
    return mode === 'write'
      ? 'You are not allowed to modify this lead.'
      : 'You are not allowed to view this lead.';
  }
  return null;
}

export function canManageAssignment(ctx: AuthContext, targetDepartment: string | null): boolean {
  if (ctx.isAdmin) return true;
  if (!ctx.department) return false;
  if (targetDepartment && targetDepartment !== ctx.department) return false;
  return ['DeptHead', 'Admin', 'Manager'].includes(ctx.userRole);
}