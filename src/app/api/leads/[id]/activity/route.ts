import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { canAccessLead } from '@/lib/lead-access';

const db = supabaseAdmin ?? supabase;

// GET /api/leads/[id]/activity — full audit trail for a lead.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const { data: lead } = await db
    .from('leads')
    .select('id,assigned_department,branch,assigned_employee_id,assigned_marketing_id,assigned_sales_id,assigned_dept_head_id')
    .eq('id', id)
    .maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  if (!canAccessLead(ctx, lead, 'read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [activities, pipeline] = await Promise.all([
    db
      .from('lead_activities')
      .select('id,activity_type,subject,details,department,activity_at,employee:employees(id,first_name,last_name,email)')
      .eq('lead_id', id)
      .order('activity_at', { ascending: false })
      .limit(200),
    db
      .from('lead_pipeline_history')
      .select('id,from_status,to_status,from_department,to_department,note,changed_at,employee:employees(id,first_name,last_name)')
      .eq('lead_id', id)
      .order('changed_at', { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    activities: activities.data ?? [],
    pipeline: pipeline.data ?? [],
  });
}