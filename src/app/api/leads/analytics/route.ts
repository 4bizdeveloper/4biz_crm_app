import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const db = supabaseAdmin ?? supabase;

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = db.from('leads').select('id,status,value,estimated_budget,lead_score,conversion_probability,assigned_department,assigned_employee_id,assigned_marketing_id,assigned_sales_id,marketing_pipeline_stage,sales_pipeline_stage,source,created_at,updated_at,next_action_at,is_high_conversion_probable');
  if (!ctx.isAdmin) query = query.eq('assigned_department', ctx.department);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Unable to load pipeline analytics.' }, { status: 500 });

  const rows = data ?? [];
  const total = rows.length;
  const weightedPipeline = rows.reduce((sum, r) => sum + Number(r.value || r.estimated_budget || 0) * (Number(r.conversion_probability || 0) / 100), 0);
  const openPipeline = rows.filter(r => !['Converted', 'Disqualified'].includes(String(r.status))).reduce((sum, r) => sum + Number(r.value || r.estimated_budget || 0), 0);
  const converted = rows.filter(r => r.status === 'Converted').length;
  const overdue = rows.filter(r => r.next_action_at && new Date(r.next_action_at).getTime() < Date.now() && !['Converted', 'Disqualified'].includes(String(r.status))).length;

  const byStatus = Object.entries(rows.reduce<Record<string, number>>((acc, r) => {
    const key = String(r.status || 'Unknown'); acc[key] = (acc[key] || 0) + 1; return acc;
  }, {})).map(([status, count]) => ({ status, count }));

  const bySource = Object.entries(rows.reduce<Record<string, number>>((acc, r) => {
    const key = String(r.source || 'Unknown'); acc[key] = (acc[key] || 0) + 1; return acc;
  }, {})).map(([source, count]) => ({ source, count }));

  return NextResponse.json({
    total,
    converted,
    conversionRate: total ? Number(((converted / total) * 100).toFixed(1)) : 0,
    openPipeline,
    weightedPipeline,
    overdue,
    highConversion: rows.filter(r => r.is_high_conversion_probable).length,
    byStatus,
    bySource,
  });
}
