import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const db = supabaseAdmin ?? supabase;

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { leadId, assignedDepartment, assignedEmployeeId, assignedDeptHeadId } = body as {
      leadId?: string;
      assignedDepartment?: string;
      assignedEmployeeId?: string | null;
      assignedDeptHeadId?: string | null;
    };
    if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

    const { data: lead, error: leadError } = await db.from('leads').select('*').eq('id', leadId).maybeSingle();
    if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const canSupervise = ctx.isAdmin || isDepartmentHead(ctx);
    const dept = String(assignedDepartment || lead.assigned_department || 'Sales');

    if (ctx.isAdmin) {
      const updateData = {
        assigned_department: dept,
        assigned_dept_head_id: assignedDeptHeadId || null,
        assigned_employee_id: null,
        status: 'In Review',
        last_activity_at: new Date().toISOString(),
      };
      const { data, error } = await db.from('leads').update(updateData).eq('id', leadId).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (!canSupervise || ctx.department !== dept) {
      return NextResponse.json({ error: 'You can only manage leads for your department.' }, { status: 403 });
    }

    if (assignedEmployeeId) {
      const { data: employee } = await db.from('employees').select('id,department_type,status').eq('id', assignedEmployeeId).maybeSingle();
      if (!employee || employee.status !== 'Active' || employee.department_type !== dept) {
        return NextResponse.json({ error: 'Selected employee is not an active member of this department.' }, { status: 400 });
      }
    }

    const updateData = {
      assigned_department: dept,
      assigned_dept_head_id: ctx.employeeId,
      assigned_employee_id: assignedEmployeeId || null,
      status: assignedEmployeeId ? 'Assigned' : 'In Review',
      last_activity_at: new Date().toISOString(),
    };
    const { data, error } = await db.from('leads').update(updateData).eq('id', leadId).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Lead assignment error', error);
    return NextResponse.json({ error: 'Unable to update lead assignment.' }, { status: 500 });
  }
}
