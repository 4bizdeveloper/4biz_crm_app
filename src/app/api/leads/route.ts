import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  validateLeadBasics,
  isLeadStatus,
  canTransitionStatus,
  filterAllowedFields,
  EMPLOYEE_UPDATABLE_FIELDS,
  MANAGER_UPDATABLE_FIELDS,
  normalizeEmail,
  normalizePhone,
  normalizeCompany,
} from '@/lib/lead-validation';
import { assertLeadAccess, canAccessLead } from '@/lib/lead-access';
import { logLeadActivity, logPipelineChange } from '@/lib/lead-audit';

const db = supabaseAdmin ?? supabase;

// Default UAE/AED values applied consistently on create.
const UAE_DEFAULTS = {
  country: 'UAE',
  city: 'Dubai',
  time_zone: 'Asia/Dubai',
  currency: 'AED',
  preferred_contact_method: 'Email',
  preferred_language: 'English',
  branch: 'Main Branch',
  team: 'Sales Team',
  lead_temperature: 'Warm' as const,
  lead_score: 50,
};

function isMarketingAdmin(ctx: Awaited<ReturnType<typeof getAuthContext>>) {
  return ctx.department === 'Marketing' && ['Admin', 'DeptHead'].includes(ctx.userRole);
}

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const includeArchived = url.searchParams.get('includeArchived') === 'true';

  let query = db
    .from('leads')
    .select('*')
    .is('merged_into_id', null) // never surface merged leads in lists
    .order('created_at', { ascending: false });

  if (!includeArchived) {
    query = query.is('archived_at', null);
  }

  if (!ctx.isAdmin) {
    if (isMarketingAdmin(ctx)) {
      query = query.or('assigned_department.eq.Marketing,assigned_department.is.null');
    } else if (isDepartmentHead(ctx)) {
      query = query.eq('assigned_department', ctx.department);
    } else {
      query = query.or(
        `assigned_employee_id.eq.${ctx.employeeId},assigned_marketing_id.eq.${ctx.employeeId},assigned_sales_id.eq.${ctx.employeeId}`
      );
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
    return NextResponse.json(
      { error: 'Only Super Admin or department leads can create leads.' },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Merge contact_info into email/phone when explicit fields are absent.
  const contactInfo = typeof body.contact_info === 'string' ? body.contact_info : '';
  const contactLines = contactInfo
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const inferredEmail =
    (typeof body.email === 'string' && body.email) ||
    contactLines.find((l) => l.includes('@')) ||
    '';
  const inferredPhone =
    (typeof body.phone === 'string' && body.phone) ||
    (typeof body.mobile_number === 'string' && body.mobile_number) ||
    contactLines.find((l) => /\d{6,}/.test(l)) ||
    '';

  const validation = validateLeadBasics({
    name: typeof body.name === 'string' ? body.name : '',
    email: inferredEmail,
    phone: inferredPhone,
    mobile_number: typeof body.mobile_number === 'string' ? body.mobile_number : '',
    company: typeof body.company === 'string' ? body.company : '',
  });

  if (!validation.ok) {
    return NextResponse.json({ error: validation.errors.join(' ') }, { status: 400 });
  }

  const { email, phone, company } = validation.normalized;

  // Duplicate detection across active leads.
  if (email || phone) {
    const orClauses: string[] = [];
    if (email) orClauses.push(`normalized_email.eq.${email}`);
    if (phone) orClauses.push(`normalized_phone.eq.${phone}`);
    if (company && email) {
      orClauses.push(`and(normalized_email.eq.${email},normalized_company.eq.${company})`);
    }
    const { data: dupes } = await db
      .from('leads')
      .select('id,name,email,phone,company,status')
      .is('merged_into_id', null)
      .is('archived_at', null)
      .or(orClauses.join(','))
      .limit(5);
    if (dupes && dupes.length > 0) {
      return NextResponse.json(
        {
          error: 'Potential duplicate lead detected. Use the duplicate review endpoint to merge.',
          duplicates: dupes,
        },
        { status: 409 }
      );
    }
  }

  // Compose a safe payload with defaults applied consistently.
  const payload: Record<string, unknown> = {
    ...UAE_DEFAULTS,
    ...body,
    email,
    phone,
    company: typeof body.company === 'string' ? body.company : null,
    normalized_email: email,
    normalized_phone: phone,
    normalized_company: company,
    status: isLeadStatus(body.status) ? body.status : 'New',
    last_activity_at: new Date().toISOString(),
  };

  delete payload.id;
  delete payload.password;
  delete payload.archived_at;
  delete payload.archived_by;
  delete payload.merged_into_id;

  // Assigned department is required for delegation.
  if (!payload.assigned_department) payload.assigned_department = ctx.department ?? 'Sales';

  // Employees cannot self-assign or set privileged ownership.
  if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
    delete payload.assigned_employee_id;
    delete payload.assigned_marketing_id;
    delete payload.assigned_sales_id;
    delete payload.assigned_dept_head_id;
  }

  const { data, error } = await db.from('leads').insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logLeadActivity({
    lead_id: data.id,
    employee_id: ctx.employeeId,
    department: ctx.department,
    activity_type: 'lead_created',
    subject: 'Lead created',
    details: `Created ${data.name} (${data.email || data.phone || 'no contact'}).`,
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'Lead id is required.' }, { status: 400 });

  const { data: lead, error: findError } = await db
    .from('leads')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (findError || !lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });

  // Archive / merge are handled as discrete actions only.
  const action = typeof body.action === 'string' ? body.action : undefined;

  if (action === 'archive') {
    if (!canAccessLead(ctx, lead, 'write')) {
      return NextResponse.json({ error: 'You cannot archive this lead.' }, { status: 403 });
    }
    const { data, error } = await db
      .from('leads')
      .update({
        archived_at: new Date().toISOString(),
        archived_by: ctx.employeeId,
        archived_reason: typeof body.reason === 'string' ? body.reason : null,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await logLeadActivity({
      lead_id: id,
      employee_id: ctx.employeeId,
      department: ctx.department,
      activity_type: 'lead_archived',
      subject: 'Lead archived',
      details: typeof body.reason === 'string' ? body.reason : null,
    });
    return NextResponse.json({ data });
  }

  if (action === 'unarchive') {
    if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
      return NextResponse.json({ error: 'Only managers can unarchive.' }, { status: 403 });
    }
    const { data, error } = await db
      .from('leads')
      .update({ archived_at: null, archived_by: null, archived_reason: null })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await logLeadActivity({
      lead_id: id,
      employee_id: ctx.employeeId,
      department: ctx.department,
      activity_type: 'lead_unarchived',
      subject: 'Lead unarchived',
    });
    return NextResponse.json({ data });
  }

  // Standard update path.
  const accessError = assertLeadAccess(ctx, lead, 'write');
  if (accessError) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  // Determine the field whitelist based on role.
  const isManager = ctx.isAdmin || isDepartmentHead(ctx);
  const allowed = isManager ? MANAGER_UPDATABLE_FIELDS : EMPLOYEE_UPDATABLE_FIELDS;
  const changes = filterAllowedFields(body, allowed);
  delete (changes as Record<string, unknown>).id;
  delete (changes as Record<string, unknown>).action;

  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: 'No permitted fields to update.' }, { status: 400 });
  }

  // Status transition validation.
  if (typeof changes.status === 'string') {
    const next = changes.status;
    if (!isLeadStatus(next)) {
      return NextResponse.json({ error: 'Invalid lead status.' }, { status: 400 });
    }
    if (!canTransitionStatus(lead.status, next)) {
      return NextResponse.json(
        { error: `Cannot move status from "${lead.status}" to "${next}".` },
        { status: 400 }
      );
    }
  }

  // Re-normalise if identity fields are changing.
  if (typeof changes.email === 'string') {
    const normalized = normalizeEmail(changes.email);
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid email.' }, { status: 400 });
    }
    (changes as Record<string, unknown>).normalized_email = normalized;
    (changes as Record<string, unknown>).email = normalized;
  }
  if (typeof changes.phone === 'string' || typeof changes.mobile_number === 'string') {
    const phoneVal =
      (changes.phone as string | undefined) ?? (changes.mobile_number as string | undefined) ?? null;
    (changes as Record<string, unknown>).normalized_phone = normalizePhone(phoneVal);
  }
  if (typeof changes.company === 'string') {
    (changes as Record<string, unknown>).normalized_company = normalizeCompany(changes.company);
  }

  (changes as Record<string, unknown>).updated_at = new Date().toISOString();
  (changes as Record<string, unknown>).last_activity_at = new Date().toISOString();

  const { data, error } = await db.from('leads').update(changes).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logPipelineChange({
    lead_id: id,
    changed_by: ctx.employeeId,
    from_status: lead.status,
    to_status: data.status,
    from_department: lead.assigned_department,
    to_department: data.assigned_department,
    from_assigned_employee: lead.assigned_employee_id ?? lead.assigned_marketing_id ?? lead.assigned_sales_id,
    to_assigned_employee: data.assigned_employee_id ?? data.assigned_marketing_id ?? data.assigned_sales_id,
    note: typeof changes.notes === 'string' ? changes.notes : null,
  });

  await logLeadActivity({
    lead_id: id,
    employee_id: ctx.employeeId,
    department: ctx.department,
    activity_type: action === 'archive' ? 'lead_archived' : 'lead_updated',
    subject: 'Lead updated',
    details: `Updated fields: ${Object.keys(changes).join(', ')}`,
  });

  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  // Hard delete is intentionally disabled. Use archive instead.
  return NextResponse.json(
    { error: 'Hard delete disabled. Use the archive action instead.' },
    { status: 405 }
  );
}