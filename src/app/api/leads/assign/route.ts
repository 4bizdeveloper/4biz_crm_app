// src/app/api/leads/assign/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { leadId, assignedDepartment, assignedEmployeeId, assignedDeptHeadId, userRole } = await request.json();

    // Workflows:
    // 1. Super Admin assigns Lead -> Department & Dept Head
    // 2. Department Head assigns Lead -> Department Employee

    let updateData: Record<string, any> = {};

    if (userRole === 'SuperAdmin') {
      updateData = {
        assigned_department: assignedDepartment,
        assigned_dept_head_id: assignedDeptHeadId || null,
        status: 'In Review',
      };
    } else if (userRole === 'DeptHead') {
      updateData = {
        assigned_employee_id: assignedEmployeeId,
        status: 'Assigned',
      };
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}