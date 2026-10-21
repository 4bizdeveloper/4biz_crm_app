import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function corsHeaders(origin: string | null) {
  const allowed = (process.env.CONTACT_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  const allowOrigin = origin && (allowed.length === 0 || allowed.includes(origin))
    ? origin
    : (allowed.length === 0 ? '*' : 'null');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CRM-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

function normalizePhone(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  try {
    let body: Record<string, unknown> = {};
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) body = await request.json();
    else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      form.forEach((value, key) => { if (typeof value === 'string') body[key] = value; });
    }

    const name = String(body.name || body.display_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || body.mobile_number || '').trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || ((!validEmail || !email) && normalizePhone(phone).length < 7)) {
      return NextResponse.json({ error: 'Name and a valid email address or phone number are required.' }, { status: 400, headers: corsHeaders(origin) });
    }

    const [firstName, ...rest] = name.split(/\s+/);
    const lastName = rest.join(' ');
    const requirements = String(body.requirements || body.message || body.requirement_description || '').trim();
    const payload = {
      name, display_name: name, first_name: firstName || null, last_name: lastName || null,
      email: validEmail ? email : '', phone: phone || null, mobile_number: phone || null, normalized_phone: normalizePhone(phone) || null,
      contact_info: [email, phone].filter(Boolean).join('\n'),
      company: body.company ? String(body.company) : null,
      company_website: body.company_website ? String(body.company_website) : null,
      requirements: requirements || null, requirement_description: requirements || null,
      interested_service: body.interested_service || body.service ? String(body.interested_service || body.service) : null,
      source: body.source ? String(body.source) : 'Website', sub_source: body.sub_source ? String(body.sub_source) : null,
      campaign_name: body.campaign_name ? String(body.campaign_name) : 'Website Direct',
      campaign_id: body.campaign_id ? String(body.campaign_id) : null,
      utm_source: body.utm_source ? String(body.utm_source) : null,
      utm_medium: body.utm_medium ? String(body.utm_medium) : null,
      utm_campaign: body.utm_campaign ? String(body.utm_campaign) : null,
      utm_content: body.utm_content ? String(body.utm_content) : null,
      utm_term: body.utm_term ? String(body.utm_term) : null,
      landing_page: body.landing_page ? String(body.landing_page) : null,
      referral_url: body.referral_url ? String(body.referral_url) : null,
      status: 'New' as const, assigned_to: null, assigned_department: null,
      last_activity_at: new Date(), next_action: 'Initial contact',
    };

    const data = await prisma.$transaction(async (tx) => {
      const lead = await tx.leads.create({ data: payload as never });
      await tx.lead_activities.create({
        data: { lead_id: lead.id, activity_type: 'created', subject: 'Website enquiry', details: 'Lead created from the public contact form.' },
      });
      return lead;
    });
    return NextResponse.json({ success: true, data }, { status: 201, headers: corsHeaders(origin) });
  } catch (error) {
    console.error('Website lead intake error', error);
    return NextResponse.json({ error: 'Unable to create lead.' }, { status: 500, headers: corsHeaders(origin) });
  }
}
