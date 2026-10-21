export const API_LEAD_STATUSES = [
  'New',
  'Assigned',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Converted',
  'Disqualified',
] as const;

export type ApiLeadStatus = (typeof API_LEAD_STATUSES)[number];
export type PrismaLeadStatus = 'New' | 'Assigned' | 'Contacted' | 'Follow_up' | 'Qualified' | 'Converted' | 'Disqualified';

const ALLOWED_TRANSITIONS: Record<ApiLeadStatus, ApiLeadStatus[]> = {
  New: ['Assigned', 'Contacted', 'Follow-up', 'Qualified', 'Disqualified'],
  Assigned: ['Contacted', 'Follow-up', 'Qualified', 'Disqualified'],
  Contacted: ['Follow-up', 'Qualified', 'Disqualified'],
  'Follow-up': ['Contacted', 'Qualified', 'Disqualified'],
  Qualified: ['Follow-up', 'Converted', 'Disqualified'],
  Converted: [],
  Disqualified: [],
};

export function toPrismaLeadStatus(value: unknown): PrismaLeadStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value === 'Follow-up' ? 'Follow_up' : value;
  return (['New', 'Assigned', 'Contacted', 'Follow_up', 'Qualified', 'Converted', 'Disqualified'] as string[])
    .includes(normalized) ? normalized as PrismaLeadStatus : null;
}

export function toApiLeadStatus(value: unknown): string {
  return value === 'Follow_up' ? 'Follow-up' : String(value ?? 'Unknown');
}

export function canTransitionLeadStatus(current: unknown, requested: unknown, isAdmin = false) {
  const currentStatus = toApiLeadStatus(current) as ApiLeadStatus;
  const requestedPrisma = toPrismaLeadStatus(requested);
  if (!requestedPrisma) return false;
  const requestedStatus = toApiLeadStatus(requestedPrisma) as ApiLeadStatus;
  if (currentStatus === requestedStatus || isAdmin) return true;
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(requestedStatus) ?? false;
}

export function serializeLead<T extends { status: unknown }>(lead: T): Omit<T, 'status'> & { status: string } {
  return { ...lead, status: toApiLeadStatus(lead.status) };
}
