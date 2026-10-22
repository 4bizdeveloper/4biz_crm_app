import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logLeadActivity, logPipelineChange } from '@/lib/lead-audit';

const db = supabaseAdmin ?? supabase;

// Fields that are carried over from the duplicate when the primary is empty.
const MERGE_FILL_FIELDS = [
  'first_name',
  'last_name',
  'display_name',
  'phone',
  'mobile_number',
  'secondary_email',
  'whatsapp_number',
  'job_title',
  'company',
  'company_website',
  'industry',
  'country',
  'city',
  'address',
  'requirements',
  'requirement_description',
  'interested_service',
  'estimated_budget',
  'campaign_name',
  'source',
  'notes',
  'marketing_notes',
  'sales_notes',
];

// POST /api/leads/merge  { primaryId, duplicateId, notes? }
// Moves all child records from duplicate -> primary, fills gaps, marks duplicate as merged.
export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
    return NextResponse.json({ error: 'Only managers can merge leads.' }, { status: 403 });
  }

  let body: { primaryId?: string; duplicateId?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { primaryId, duplicateId, notes } = body;
  if (!primaryId || !duplicateId || primaryId === duplicateId) {
    return NextResponse.json({ error: 'primaryId and duplicateId are required and must differ.' }, { status: 400 });
  }

  const [{ data: primary }, { data: dup }] = await Promise.all([
    db.from('leads').select('*').eq('id', primaryId).maybeSingle(),
    db.from('leads').select('*').eq('id', duplicateId).maybeSingle(),
  ]);

  if (!primary || !dup) {
    return NextResponse.json({ error: 'One or both leads not found.' }, { status: 404 });
  }
  if (dup.merged_into_id) {
    return NextResponse.json({ error: 'Duplicate already merged.' }, { status: 400 });
  }
  if (!ctx.isAdmin) {
    if (primary.assigned_department !== ctx.department || dup.assigned_department !== ctx.department) {
      return NextResponse.json({ error: 'Both leads must belong to your department.' }, { status: 403 });
    }
  }

  // Fill gaps on primary from duplicate.
  const updates: Record<string, unknown> = {};
  for (const field of MERGE_FILL_FIELDS) {
    const p = (primary as Record<string, unknown>)[field];
    const d = (dup as Record<string, unknown>)[field];
    if ((p === null || p === undefined || p === '') && d !== null && d !== undefined && d !== '') {
      updates[field] = d;
    }
  }
  // Preserve the higher lead score.
  if ((dup.lead_score ?? 0) > (primary.lead_score ?? 0)) updates.lead_score = dup.lead_score;

  updates.last_activity_at = new Date().toISOString();
  updates.updated_at = new Date().toISOString();

  // Re-point child records.
  const childTables = [
    { table: 'lead_activities', column: 'lead_id' },
    { table: 'lead_pipeline_history', column: 'lead_id' },
    { table: 'crm_tasks', column: 'lead_id' },
    { table: 'department_tasks', column: 'lead_id' },
    { table: 'projects', column: 'lead_id' },
    { table: 'invoices', column: 'lead_id' },
  ];

  for (const { table, column } of childTables) {
    const { error } = await db.from(table).update({ [column]: primaryId }).eq(column, duplicateId);
    if (error) {
      console.error(`Merge re-point failed on ${table}`, error);
      return NextResponse.json({ error: `Failed to re-point ${table}: ${error.message}` }, { status: 500 });
    }
  }

  // Apply gap fill.
  if (Object.keys(updates).length > 0) {
    const { error } = await db.from('leads').update(updates).eq('id', primaryId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Snapshot duplicate for history then mark as merged.
  const snapshot = { ...dup };
  const { error: mergeErr } = await db.from('leads').update({
    merged_into_id: primaryId,
    archived_at: new Date().toISOString(),
    archived_reason: 'merged',
  }).eq('id', duplicateId);
  if (mergeErr) return NextResponse.json({ error: mergeErr.message }, { status: 500 });

  await db.from('lead_merges').insert({
    primary_lead_id: primaryId,
    duplicate_lead_id: duplicateId,
    merged_by: ctx.employeeId,
    snapshot,
    merge_notes: notes ?? null,
  });

  await logLeadActivity({
    lead_id: primaryId,
    employee_id: ctx.employeeId,
    department: ctx.department,
    activity_type: 'lead_merged',
    subject: 'Duplicate merged in',
    details: `Merged duplicate "${dup.name}" (${dup.email || dup.phone || dup.id}).`,
  });
  await logPipelineChange({
    lead_id: primaryId,
    changed_by: ctx.employeeId,
    from_status: primary.status,
    to_status: primary.status,
    note: `Merged duplicate ${duplicateId}`,
  });

  const { data: refreshed } = await db.from('leads').select('*').eq('id', primaryId).single();
  return NextResponse.json({ data: refreshed, merged_from: duplicateId });
}