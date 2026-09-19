import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const db = supabaseAdmin ?? supabase;

function corsHeaders(origin: string | null) {
  const allowed = (process.env.CONTACT_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  const allowOrigin = origin && (allowed.length === 0 || allowed.includes(origin)) ? origin : (allowed.length === 0 ? '*' : 'null');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CRM-API-Key',
    'Access-Control-Max-Age': '86400',
  };
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
    if (!name || !email) return NextResponse.json({ error: 'Name and Email are required fields.' }, { status: 400, headers: corsHeaders(origin) });

    const [firstName, ...rest] = name.split(/\s+/);
    const lastName = rest.join(' ');
    const phone = String(body.phone || body.mobile_number || '').trim();
    const requirements = String(body.requirements || body.message || body.requirement_description || '').trim();

    const payload = {
      name, display_name: name, first_name: firstName || null, last_name: lastName || null,
      email, phone: phone || null, mobile_number: phone || null,
      contact_info: [email, phone].filter(Boolean).join('\\n'),
      company: body.company || null, company_website: body.company_website || null,
      requirements: requirements || null, requirement_description: requirements || null,
      interested_service: body.interested_service || body.service || null,
      source: body.source || 'Website', sub_source: body.sub_source || null,
      campaign_name: body.campaign_name || 'Website Direct', campaign_id: body.campaign_id || null,
      utm_source: body.utm_source || null, utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null, utm_content: body.utm_content || null, utm_term: body.utm_term || null,
      landing_page: body.landing_page || null, referral_url: body.referral_url || null,
      status: 'New', assigned_to: null, assigned_department: null,
      last_activity_at: new Date().toISOString(), next_action: 'Initial contact',
    };

    const { data, error } = await db.from('leads').insert([payload]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(origin) });
    return NextResponse.json({ success: true, data }, { status: 201, headers: corsHeaders(origin) });
  } catch (error) {
    console.error('Website lead intake error', error);
    return NextResponse.json({ error: 'Unable to create lead.' }, { status: 500, headers: corsHeaders(origin) });
  }
}
