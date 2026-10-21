import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { serializeLead, toApiLeadStatus, toPrismaLeadStatus } from '@/lib/lead-status';

type AuthContext = Awaited<ReturnType<typeof getAuthContext>>;
type LeadRecord = {
  id: string;
  assigned_department: string | null;
  assigned_employee_id: string | null;
  assigned_marketing_id: string | null;
  assigned_sales_id: string | null;
};

function isMarketingAdmin(ctx: AuthContext) {
  return ctx.department === 'Marketing' && ['Admin', 'DeptHead'].includes(ctx.userRole);
}

function canManage(ctx: AuthContext, lead: LeadRecord) {
  if (ctx.isAdmin) return true;
  if (isMarketingAdmin(ctx) && (!lead.assigned_department || lead.assigned_department === 'Marketing')) return true;
  if (!ctx.employeeId || !ctx.department || lead.assigned_department !== ctx.department) return false;
  return isDepartmentHead(ctx)
    || lead.assigned_employee_id === ctx.employeeId
    || lead.assigned_marketing_id === ctx.employeeId
    || lead.assigned_sales_id === ctx.employeeId;
}

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePhone(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value: string) {
  return normalizePhone(value).length >= 7;
}

const MUTABLE_FIELDS = new Set([
  'name', 'email', 'company', 'value', 'phone', 'source', 'notes', 'assigned_to',
  'requirements', 'campaign_name', 'interactions', 'tasks', 'documents', 'quotation_details',
  'discount_pct', 'handover_notes', 'contact_info', 'first_name', 'last_name', 'display_name',
  'job_title', 'department', 'secondary_email', 'mobile_number', 'alternative_number',
  'whatsapp_number', 'preferred_contact_method', 'preferred_language', 'contact_time_preference',
  'country', 'emirate_state', 'city', 'address', 'time_zone', 'company_website', 'industry',
  'company_size', 'number_of_employees', 'annual_revenue_range', 'business_type', 'company_location',
  'vat_trn_number', 'customer_type', 'parent_company', 'linkedin_company_url', 'interested_service',
  'sub_service', 'product_category', 'requirement_description', 'main_pain_point', 'expected_solution',
  'estimated_budget', 'expected_purchase_date', 'project_timeline', 'urgency', 'quantity',
  'project_location', 'existing_vendor', 'competitors_considered', 'additional_requirements',
  'sub_source', 'campaign_id', 'ad_set', 'ad_name', 'keyword', 'landing_page', 'referral_url',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'first_touch_source',
  'latest_touch_source', 'lead_score', 'branch', 'team', 'follow_up_date',
  'first_response_time_minutes', 'status', 'approval_status', 'payment_status', 'lead_temperature',
  'assigned_department', 'assigned_dept_head_id', 'assigned_employee_id', 'is_high_conversion_probable',
  'marketing_notes', 'sales_notes', 'call_scheduled_at', 'assigned_marketing_id', 'assigned_sales_id',
  'conversion_probability', 'marketing_pipeline_stage', 'sales_pipeline_stage', 'next_action',
  'next_action_at', 'last_contacted_at', 'qualified_at', 'converted_at',
]);

const PRIVILEGED_FIELDS = new Set([
  'assigned_to', 'branch', 'team', 'status', 'approval_status', 'payment_status',
  'assigned_department', 'assigned_dept_head_id', 'assigned_employee_id', 'assigned_marketing_id',
  'assigned_sales_id', 'lead_score', 'conversion_probability', 'is_high_conversion_probable',
  'marketing_pipeline_stage', 'sales_pipeline_stage', 'converted_at', 'qualified_at',
]);

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  New: ['Assigned', 'Contacted', 'Follow_up', 'Qualified', 'Disqualified'],
  Assigned: ['Contacted', 'Follow_up', 'Qualified', 'Disqualified'],
  Contacted: ['Follow_up', 'Qualified', 'Disqualified'],
  'Follow-up': ['Contacted', 'Qualified', 'Disqualified'],
  Qualified: ['Follow_up', 'Converted', 'Disqualified'],
  Converted: [],
  Disqualified: [],
};

const DATE_FIELDS = new Set([
  'expected_purchase_date', 'follow_up_date', 'call_scheduled_at', 'next_action_at',
  'last_contacted_at', 'qualified_at', 'converted_at',
]);

function filterLeadFields(input: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!MUTABLE_FIELDS.has(key) || value === undefined) continue;
    result[key] = DATE_FIELDS.has(key) && value !== null && value !== ''
      ? new Date(String(value))
      : value;
  }
  return result;
}

async function findDuplicateCandidates(input: Record<string, unknown>, excludeId?: string) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone ?? input.mobile_number ?? input.alternative_number ?? input.whatsapp_number);
  const company = String(input.company ?? '').trim();
  const OR: Record<string, unknown>[] = [];
  if (email && validEmail(email)) OR.push({ email: { equals: email, mode: 'insensitive' } });
  if (phone.length >= 7) {
    for (const field of ['phone', 'mobile_number', 'alternative_number', 'whatsapp_number']) {
      OR.push({ [field]: { not: null } });
    }
  }
  if (company) OR.push({ company: { equals: company, mode: 'insensitive' } });
  if (!OR.length) return [];

  const candidates = await prisma.leads.findMany({
    where: { OR, ...(excludeId ? { id: { not: excludeId } } : {}) } as never,
    select: {
      id: true, name: true, email: true, phone: true, mobile_number: true,
      alternative_number: true, whatsapp_number: true, company: true, status: true,
      assigned_department: true, assigned_employee_id: true, assigned_marketing_id: true, assigned_sales_id: true,
    },
    take: 200,
  });

  return candidates.filter((candidate) => {
    const emailMatch = !!email && validEmail(email) && normalizeEmail(candidate.email) === email;
    const phoneMatch = phone.length >= 7 && [
      candidate.phone, candidate.mobile_number, candidate.alternative_number, candidate.whatsapp_number,
    ].some((value) => normalizePhone(value) === phone);
    const companyMatch = !!company && String(candidate.company ?? '').trim().toLowerCase() === company.toLowerCase();
    return emailMatch || phoneMatch || companyMatch;
  });
}

export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const includeArchived = new URL(request.url).searchParams.get('includeArchived') === '1';
  if (includeArchived && !ctx.isAdmin) {
    return NextResponse.json({ error: 'Only Super Admin can view archived leads.' }, { status: 403 });
  }

  try {
    const where: Record<string, unknown> = { archived_at: includeArchived ? { not: null } : null };
    if (!ctx.isAdmin) {
      if (isMarketingAdmin(ctx)) {
        where.OR = [{ assigned_department: 'Marketing' }, { assigned_department: null }];
      } else if (isDepartmentHead(ctx)) {
        where.assigned_department = ctx.department ?? undefined;
      } else {
        where.OR = [
          { assigned_employee_id: ctx.employeeId },
          { assigned_marketing_id: ctx.employeeId },
          { assigned_sales_id: ctx.employeeId },
        ];
      }
    }

    const data = await prisma.leads.findMany({
      where: where as never,
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ data: data.map(serializeLead) });
  } catch (error) {
    console.error('Unable to load leads:', error);
    return NextResponse.json({ error: 'Unable to load leads.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
    return NextResponse.json({ error: 'Only Super Admin or department leads can create leads.' }, { status: 403 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const phone = String(body.phone ?? body.mobile_number ?? body.alternative_number ?? body.whatsapp_number ?? '').trim();
    if ((!email || !validEmail(email)) && !validPhone(phone)) {
      return NextResponse.json({ error: 'Enter a valid email address or phone number.' }, { status: 400 });
    }
    const name = String(body.name ?? body.display_name ?? [body.first_name, body.last_name].filter(Boolean).join(' ')).trim();
    if (!name) return NextResponse.json({ error: 'Lead name is required.' }, { status: 400 });

    const duplicates = await findDuplicateCandidates({ ...body, email, phone });
    if (duplicates.length) {
      return NextResponse.json({
        error: 'Possible duplicate leads found. Review the matches before creating a new lead.',
        duplicates: duplicates.map(({ id, name, email, phone, company, status }) => ({ id, name, email, phone, company, status })),
      }, { status: 409 });
    }

    const data = filterLeadFields({ ...body, name, email, phone, last_activity_at: new Date() });
    if (data.status !== undefined) {
      const normalizedStatus = toPrismaLeadStatus(data.status);
      if (!normalizedStatus) return NextResponse.json({ error: 'Invalid lead status.' }, { status: 400 });
      data.status = normalizedStatus;
    }
    delete data.id;
    delete data.archived_at;
    const created = await prisma.leads.create({ data: data as never });
    await prisma.lead_activities.create({
      data: {
        lead_id: created.id,
        employee_id: ctx.employeeId,
        department: ctx.department as never,
        activity_type: 'created',
        subject: 'Lead created',
        details: 'Lead record created through CRM API.',
      },
    });
    return NextResponse.json({ data: serializeLead(created) }, { status: 201 });
  } catch (error) {
    console.error('Unable to create lead:', error);
    return NextResponse.json({ error: 'Unable to create lead. Check the supplied lead fields.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const id = String(body.id ?? '');
    if (!id) return NextResponse.json({ error: 'Lead id is required.' }, { status: 400 });

    const lead = await prisma.leads.findUnique({ where: { id } });
    if (!lead || lead.archived_at) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    if (!canManage(ctx, lead)) return NextResponse.json({ error: 'You are not allowed to modify this lead.' }, { status: 403 });

    const action = String(body.action ?? '');
    if (action === 'archive') {
      const archived = await prisma.leads.update({
        where: { id },
        data: { archived_at: new Date(), updated_at: new Date(), last_activity_at: new Date() },
      });
      await prisma.lead_activities.create({
        data: {
          lead_id: id,
          employee_id: ctx.employeeId,
          department: ctx.department as never,
          activity_type: 'archived',
          subject: 'Lead archived',
          details: 'Lead archived without changing its sales status.',
        },
      });
      return NextResponse.json({ data: serializeLead(archived) });
    }

    if (action === 'restore') {
      if (!ctx.isAdmin) return NextResponse.json({ error: 'Only Super Admin can restore archived leads.' }, { status: 403 });
      const restored = await prisma.leads.update({
        where: { id },
        data: { archived_at: null, updated_at: new Date(), last_activity_at: new Date() },
      });
      await prisma.lead_activities.create({
        data: {
          lead_id: id,
          employee_id: ctx.employeeId,
          activity_type: 'restored',
          subject: 'Lead restored',
        },
      });
      return NextResponse.json({ data: serializeLead(restored) });
    }

    if (action === 'merge') {
      if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
        return NextResponse.json({ error: 'Only Super Admin or department leads can merge leads.' }, { status: 403 });
      }
      const duplicateIds = Array.isArray(body.duplicateIds)
        ? [...new Set(body.duplicateIds.map(String).filter((candidateId) => candidateId && candidateId !== id))]
        : [];
      if (!duplicateIds.length) return NextResponse.json({ error: 'Select at least one duplicate lead to merge.' }, { status: 400 });

      const result = await prisma.$transaction(async (tx) => {
        const duplicates = await tx.leads.findMany({ where: { id: { in: duplicateIds }, archived_at: null } });
        if (duplicates.length !== duplicateIds.length) throw new Error('One or more duplicate leads were not found.');
        if (duplicates.some((duplicate) => !canManage(ctx, duplicate))) throw new Error('You are not allowed to merge one or more selected leads.');

        const mergedJson: Record<string, unknown> = {};
        for (const field of ['interactions', 'tasks', 'documents'] as const) {
          const allItems = [lead[field], ...duplicates.map((duplicate) => duplicate[field])]
            .flatMap((value) => Array.isArray(value) ? value : []);
          mergedJson[field] = allItems;
        }

        const fillable = [
          'company', 'phone', 'secondary_email', 'mobile_number', 'alternative_number', 'whatsapp_number',
          'notes', 'requirements', 'contact_info', 'company_website', 'industry', 'city', 'country',
          'emirate_state', 'address', 'job_title', 'vat_trn_number', 'linkedin_company_url',
        ] as const;
        const fillChanges: Record<string, unknown> = { ...mergedJson, updated_at: new Date(), last_activity_at: new Date() };
        for (const field of fillable) {
          if (!lead[field]) {
            const value = duplicates.find((duplicate) => duplicate[field])?.[field];
            if (value) fillChanges[field] = value;
          }
        }

        await tx.leads.update({ where: { id }, data: fillChanges as never });
        for (const duplicateId of duplicateIds) {
          await tx.crm_tasks.updateMany({ where: { lead_id: duplicateId }, data: { lead_id: id } });
          await tx.department_tasks.updateMany({ where: { lead_id: duplicateId }, data: { lead_id: id } });
          await tx.invoices.updateMany({ where: { lead_id: duplicateId }, data: { lead_id: id } });
          await tx.projects.updateMany({ where: { lead_id: duplicateId }, data: { lead_id: id } });
          await tx.lead_activities.updateMany({ where: { lead_id: duplicateId }, data: { lead_id: id } });
          await tx.lead_pipeline_history.updateMany({ where: { lead_id: duplicateId }, data: { lead_id: id } });
          await tx.leads.update({ where: { id: duplicateId }, data: { archived_at: new Date(), updated_at: new Date() } });
        }
        await tx.lead_activities.create({
          data: {
            lead_id: id,
            employee_id: ctx.employeeId,
            department: ctx.department as never,
            activity_type: 'merged',
            subject: 'Duplicate leads merged',
            details: `Merged lead IDs: ${duplicateIds.join(', ')}`,
          },
        });
        return tx.leads.findUnique({ where: { id } });
      });
      return NextResponse.json({ data: result ? serializeLead(result) : null, mergedIds: duplicateIds });
    }

    const changesInput = { ...body };
    delete changesInput.id;
    delete changesInput.action;
    delete changesInput.duplicateIds;
    const unsupportedFields = Object.keys(changesInput).filter((key) => !MUTABLE_FIELDS.has(key));
    if (unsupportedFields.length) {
      return NextResponse.json({ error: `Unsupported lead fields: ${unsupportedFields.join(', ')}` }, { status: 400 });
    }
    if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
      const protectedFields = Object.keys(changesInput).filter((key) => PRIVILEGED_FIELDS.has(key));
      if (protectedFields.length) {
        return NextResponse.json({ error: 'You are not authorized to change assignment, status, or pipeline control fields.' }, { status: 403 });
      }
    }

    if ('email' in changesInput || 'phone' in changesInput || 'mobile_number' in changesInput) {
      const email = normalizeEmail(changesInput.email ?? lead.email);
      const phone = String(changesInput.phone ?? changesInput.mobile_number ?? lead.phone ?? lead.mobile_number ?? '').trim();
      if ((!email || !validEmail(email)) && !validPhone(phone)) {
        return NextResponse.json({ error: 'Enter a valid email address or phone number.' }, { status: 400 });
      }
      const duplicates = await findDuplicateCandidates({ ...lead, ...changesInput, email, phone }, id);
      if (duplicates.length) {
        return NextResponse.json({
          error: 'These changes match existing leads. Review possible duplicates before saving.',
          duplicates: duplicates.map(({ id, name, email, phone, company, status }) => ({ id, name, email, phone, company, status })),
        }, { status: 409 });
      }
    }

    if (typeof changesInput.status === 'string') {
      const normalizedStatus = toPrismaLeadStatus(changesInput.status);
      if (!normalizedStatus) return NextResponse.json({ error: 'Invalid lead status.' }, { status: 400 });
      const currentStatus = toApiLeadStatus(lead.status);
      const requestedStatus = toApiLeadStatus(normalizedStatus);
      if (requestedStatus !== currentStatus) {
        const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
        if (!ctx.isAdmin && !allowed.includes(requestedStatus)) {
          return NextResponse.json({ error: `Invalid lead status transition from ${currentStatus} to ${requestedStatus}.` }, { status: 400 });
        }
      }
      changesInput.status = normalizedStatus;
    }

    const changes = filterLeadFields(changesInput);
    changes.updated_at = new Date();
    changes.last_activity_at = new Date();
    const updated = await prisma.leads.update({ where: { id }, data: changes as never });
    await prisma.lead_activities.create({
      data: {
        lead_id: id,
        employee_id: ctx.employeeId,
        department: ctx.department as never,
        activity_type: 'updated',
        subject: 'Lead updated',
        details: `Updated fields: ${Object.keys(changesInput).join(', ')}`,
      },
    });
    return NextResponse.json({ data: serializeLead(updated) });
  } catch (error) {
    console.error('Unable to update lead:', error);
    return NextResponse.json({ error: 'Unable to update lead. Check the supplied fields and selected records.' }, { status: 400 });
  }
}
