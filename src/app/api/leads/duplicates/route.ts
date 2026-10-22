import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeEmail, normalizePhone, normalizeCompany } from '@/lib/lead-validation';

const db = supabaseAdmin ?? supabase;

// GET /api/leads/duplicates?email=&phone=&company=
// Returns candidate duplicates for the given identity triple.
export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ctx.isAdmin && !isDepartmentHead(ctx)) {
    return NextResponse.json({ error: 'Only managers can review duplicates.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const email = normalizeEmail(url.searchParams.get('email'));
  const phone = normalizePhone(url.searchParams.get('phone'));
  const company = normalizeCompany(url.searchParams.get('company'));

  if (!email && !phone && !company) {
    return NextResponse.json({ error: 'Provide email, phone, or company.' }, { status: 400 });
  }

  const orClauses: string[] = [];
  if (email) orClauses.push(`normalized_email.eq.${email}`);
  if (phone) orClauses.push(`normalized_phone.eq.${phone}`);
  if (company) orClauses.push(`normalized_company.eq.${company}`);
  if (email && company) {
    orClauses.push(`and(normalized_email.eq.${email},normalized_company.eq.${company})`);
  }

  let query = db
    .from('leads')
    .select('id,name,email,phone,company,status,assigned_department,created_at,archived_at')
    .is('merged_into_id', null)
    .or(orClauses.join(','))
    .order('created_at', { ascending: false })
    .limit(25);

  if (!ctx.isAdmin) query = query.eq('assigned_department', ctx.department);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    query: { email, phone, company },
    data: data ?? [],
  });
}