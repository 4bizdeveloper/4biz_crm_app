import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, requirements, campaign_name } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required fields.' },
        { status: 400 }
      );
    }

    // Format contact_info for display compatibility (e.g., in UI cards/lists)
    const contactInfoCombined = `${phone ? phone + '\n' : ''}${email}`.trim();

    // Insert lead into Supabase ensuring 'email', 'phone', and 'contact_info' are populated
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          email,
          phone: phone || null,
          contact_info: contactInfoCombined,
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