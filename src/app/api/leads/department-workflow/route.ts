import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, leadId, employeeId, notes, callScheduledAt, isHighConversion, targetDeptHeadId } = body;

    let updateData: Record<string, any> = {};

    switch (action) {
      // Marketing Employee updates notes & flags high conversion
      case 'MARKETING_UPDATE':
        updateData = {
          marketing_notes: notes,
          is_high_conversion_probable: isHighConversion ?? false,
          last_activity_at: new Date().toISOString(),
        };
        break;

      // Marketing Lead passes high-conversion lead to Sales Lead
      case 'MARKETING_TRANSFER_TO_SALES':
        updateData = {
          assigned_department: 'Sales',
          assigned_dept_head_id: targetDeptHeadId, // Sales Team Lead ID
          status: 'Marketing Qualified',
          last_activity_at: new Date().toISOString(),
        };
        break;

      // Sales Lead assigns to Sales Rep
      case 'SALES_ASSIGN':
        updateData = {
          assigned_sales_id: employeeId,
          status: 'Assigned To Sales',
          last_activity_at: new Date().toISOString(),
        };
        break;

      // Sales Rep updates sales pipeline & schedules follow-up call
      case 'SALES_UPDATE_STAGE':
        updateData = {
          status: body.status,
          sales_notes: notes,
          follow_up_date: body.followUpDate || null,
          call_scheduled_at: callScheduledAt || null,
          last_activity_at: new Date().toISOString(),
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid workflow action' }, { status: 400 });
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