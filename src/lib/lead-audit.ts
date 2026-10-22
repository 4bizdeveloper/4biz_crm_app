// src/lib/lead-audit.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

const db = supabaseAdmin ?? supabase;

export type LeadAuditEvent = {
  lead_id: string;
  employee_id?: string | null;
  department?: string | null;
  activity_type: string;
  subject?: string | null;
  details?: string | null;
};

export async function logLeadActivity(event: LeadAuditEvent): Promise<void> {
  try {
    await db.from('lead_activities').insert({
      lead_id: event.lead_id,
      employee_id: event.employee_id ?? null,
      department: event.department ?? null,
      activity_type: event.activity_type,
      subject: event.subject ?? null,
      details: event.details ?? null,
    });
  } catch (err) {
    console.error('Failed to log lead activity', err);
  }
}

export async function logPipelineChange(params: {
  lead_id: string;
  changed_by?: string | null;
  from_status?: string | null;
  to_status?: string | null;
  from_department?: string | null;
  to_department?: string | null;
  from_assigned_employee?: string | null;
  to_assigned_employee?: string | null;
  note?: string | null;
}): Promise<void> {
  try {
    await db.from('lead_pipeline_history').insert({
      lead_id: params.lead_id,
      changed_by: params.changed_by ?? null,
      from_status: params.from_status ?? null,
      to_status: params.to_status ?? null,
      from_department: params.from_department ?? null,
      to_department: params.to_department ?? null,
      from_assigned_employee: params.from_assigned_employee ?? null,
      to_assigned_employee: params.to_assigned_employee ?? null,
      note: params.note ?? null,
    });
  } catch (err) {
    console.error('Failed to log pipeline change', err);
  }
}

export async function getLeadActivity(leadId: string) {
  const { data, error } = await db
    .from('lead_activities')
    .select('id,activity_type,subject,details,department,activity_at,employee:employees(id,first_name,last_name,email)')
    .eq('lead_id', leadId)
    .order('activity_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}