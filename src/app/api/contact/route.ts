import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, requirements, campaign_name } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required fields.' }, { status: 400 });
    }

// src/app/api/contact/route.ts
const { data, error } = await supabase
  .from('leads')
  .insert([
    {
      name,
      email,
      phone: phone || null,
      contact_info: phone ? `${email}\n${phone}` : email, // Include email in contact_info
      company: company || null,
      requirements: requirements || null,
      campaign_name: campaign_name || 'Website Direct',
      source: 'Website',
      status: 'New',
      assigned_to: null,
      value: 0
    }
  ])
  .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Enable CORS if your website is hosted on a separate domain/subdomain
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}