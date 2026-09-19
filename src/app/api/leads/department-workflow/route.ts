import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';

const db = supabaseAdmin ?? supabase;

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, leadId, employeeId, notes, callScheduledAt, isHighConversion, targetDeptHeadId } = body;
    const { data: lead } = await db.from('leads').select('*').eq('id', leadId).maybeSingle();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const marketingLead = ctx.isAdmin || (ctx.department === 'Marketing' && isDepartmentHead(ctx));
    const salesLead = ctx.isAdmin || (ctx.department === 'Sales' && isDepartmentHead(ctx));

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'MARKETING_UPDATE':
        if (!ctx.isAdmin && ctx.department !== 'Marketing') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (!ctx.isAdmin && !marketingLead && lead.assigned_marketing_id !== ctx.employeeId) return NextResponse.json({ error: 'You can only update leads assigned to you.' }, { status: 403 });
        updateData = { marketing_notes: notes, is_high_conversion_probable: isHighConversion ?? false, last_activity_at: new Date().toISOString() };
        break;
      case 'MARKETING_TRANSFER_TO_SALES':
        if (!marketingLead) return NextResponse.json({ error: 'Only Marketing leads or Super Admin can transfer leads.' }, { status: 403 });
        updateData = { assigned_department: 'Sales', assigned_dept_head_id: targetDeptHeadId || null, assigned_sales_id: null, status: 'Qualified', qualified_at: new Date().toISOString(), last_activity_at: new Date().toISOString() };
        break;
      case 'SALES_ASSIGN':
        if (!salesLead) return NextResponse.json({ error: 'Only Sales leads or Super Admin can assign sales leads.' }, { status: 403 });
        updateData = { assigned_sales_id: employeeId || null, assigned_department: 'Sales', status: employeeId ? 'Assigned' : 'In Review', last_activity_at: new Date().toISOString() };
        break;
      case 'SALES_UPDATE_STAGE':
        if (!ctx.isAdmin && ctx.department !== 'Sales') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (!ctx.isAdmin && !salesLead && lead.assigned_sales_id !== ctx.employeeId) return NextResponse.json({ error: 'You can only update leads assigned to you.' }, { status: 403 });
        updateData = {
          status: body.status,
          sales_pipeline_stage: body.pipelineStage || lead.sales_pipeline_stage,
          sales_notes: notes,
          follow_up_date: body.followUpDate || null,
          call_scheduled_at: callScheduledAt || null,
          next_action: body.nextAction || null,
          next_action_at: body.nextActionAt || null,
          conversion_probability: body.conversionProbability !== undefined ? Math.max(0, Math.min(100, Number(body.conversionProbability) || 0)) : lead.conversion_probability,
          last_activity_at: new Date().toISOString(),
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid workflow action' }, { status: 400 });
    }

    const { data, error } = await db.from('leads').update(updateData).eq('id', leadId).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Lead workflow error', error);
    return NextResponse.json({ error: 'Unable to update lead workflow.' }, { status: 500 });
  }
}
