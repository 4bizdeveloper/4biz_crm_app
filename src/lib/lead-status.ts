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

export function toPrismaLeadStatus(value: unknown): PrismaLeadStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value === 'Follow-up' ? 'Follow_up' : value;
  return (['New', 'Assigned', 'Contacted', 'Follow_up', 'Qualified', 'Converted', 'Disqualified'] as string[])
    .includes(normalized) ? normalized as PrismaLeadStatus : null;
}

export function toApiLeadStatus(value: unknown): string {
  return value === 'Follow_up' ? 'Follow-up' : String(value ?? 'Unknown');
}

export function serializeLead<T extends { status: unknown }>(lead: T): Omit<T, 'status'> & { status: string } {
  return { ...lead, status: toApiLeadStatus(lead.status) };
}
