// src/lib/lead-validation.ts
// Centralised validation, normalisation, and duplicate detection for leads.

export type LeadStatus =
  | 'New'
  | 'Assigned'
  | 'Contacted'
  | 'Follow-up'
  | 'Qualified'
  | 'Converted'
  | 'Disqualified';

export const LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Assigned',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Converted',
  'Disqualified',
];

// Valid forward transitions. Disqualified is terminal; Converted is terminal.
// A lead may move backwards only to an earlier non-terminal status (correction).
export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  New: ['Assigned', 'Contacted', 'Disqualified'],
  Assigned: ['Contacted', 'Follow-up', 'Qualified', 'Disqualified'],
  Contacted: ['Follow-up', 'Qualified', 'Disqualified'],
  'Follow-up': ['Contacted', 'Qualified', 'Disqualified'],
  Qualified: ['Converted', 'Disqualified'],
  Converted: ['Qualified', 'Disqualified'], // allow correction back
  Disqualified: ['New', 'Assigned'], // allow re-open
};

export function canTransitionStatus(from: string, to: string): boolean {
  if (!isLeadStatus(from) || !isLeadStatus(to)) return false;
  if (from === to) return true;
  return LEAD_STATUS_TRANSITIONS[from].includes(to);
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as string[]).includes(value);
}

// ---------- Email / Phone normalisation ----------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMAIL_RE.test(String(value).trim());
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

// UAE-focused phone normalisation: strips spaces, dashes, parentheses, and
// converts leading 00 to +. Keeps digits and a leading +. Returns digits-only
// string when no international prefix is present, for stable comparisons.
export function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  let raw = String(value).trim();
  if (!raw) return null;
  raw = raw.replace(/[\s\-().]/g, '');
  if (raw.startsWith('00')) raw = '+' + raw.slice(2);
  if (raw.startsWith('+')) {
    const digits = raw.slice(1).replace(/\D/g, '');
    return digits ? '+' + digits : null;
  }
  const digits = raw.replace(/\D/g, '');
  return digits || null;
}

export function normalizeCompany(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = String(value)
    .trim()
    .toLowerCase()
    .replace(/\b(l\.?l\.?c|fzco|fzc|fze|pjsc|pvt|inc|ltd|limited|llp|gmbh|co\.?|corp\.?|corporation|company)\b\.?/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function isValidUaePhone(value: string | null | undefined): boolean {
  const normalized = normalizePhone(value);
  if (!normalized) return false;
  const digits = normalized.replace(/^\+/, '');
  // UAE: country code 971, mobile starts 50/52/54/55/56/58, landline starts 2/3/4/6/7/9
  if (digits.startsWith('971')) {
    const rest = digits.slice(3);
    return rest.length >= 8 && rest.length <= 9;
  }
  // Local format without country code
  return digits.length >= 8 && digits.length <= 10;
}

// ---------- Lead validation ----------

export type LeadValidationInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile_number?: string | null;
  company?: string | null;
};

export type LeadValidationResult = {
  ok: boolean;
  errors: string[];
  normalized: {
    email: string | null;
    phone: string | null;
    company: string | null;
  };
};

export function validateLeadBasics(input: LeadValidationInput): LeadValidationResult {
  const errors: string[] = [];
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone ?? input.mobile_number);
  const company = normalizeCompany(input.company);

  if (!input.name || !String(input.name).trim()) {
    errors.push('Lead name is required.');
  }

  if (!email && !phone) {
    errors.push('A valid email or phone number is required.');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Email address is not valid.');
  }

  if (phone && !isValidUaePhone(phone)) {
    errors.push('Phone number does not look like a valid UAE number.');
  }

  return {
    ok: errors.length === 0,
    errors,
    normalized: { email, phone, company },
  };
}

// ---------- Field whitelists ----------

// Fields an employee may update on a lead they own (non-privileged).
export const EMPLOYEE_UPDATABLE_FIELDS = new Set<string>([
  'notes',
  'status',
  'lead_temperature',
  'lead_score',
  'follow_up_date',
  'call_scheduled_at',
  'next_action',
  'next_action_at',
  'marketing_notes',
  'sales_notes',
  'marketing_pipeline_stage',
  'sales_pipeline_stage',
  'conversion_probability',
]);

// Fields a department head / admin may update.
export const MANAGER_UPDATABLE_FIELDS = new Set<string>([
  ...EMPLOYEE_UPDATABLE_FIELDS,
  'name',
  'first_name',
  'last_name',
  'display_name',
  'email',
  'phone',
  'mobile_number',
  'secondary_email',
  'whatsapp_number',
  'contact_info',
  'company',
  'company_website',
  'industry',
  'job_title',
  'country',
  'city',
  'address',
  'branch',
  'team',
  'interested_service',
  'requirements',
  'requirement_description',
  'estimated_budget',
  'source',
  'campaign_name',
  'assigned_department',
  'assigned_employee_id',
  'assigned_marketing_id',
  'assigned_sales_id',
  'assigned_dept_head_id',
  'is_high_conversion_probable',
  'qualified_at',
  'converted_at',
  'last_contacted_at',
]);

export function filterAllowedFields(
  body: Record<string, unknown>,
  allowed: Set<string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}