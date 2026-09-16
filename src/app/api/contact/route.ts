import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    let name = '';
    let email = '';
    let phone = '';
    let company = '';
    let requirements = '';
    let campaign_name = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      name = body.name || '';
      email = body.email || '';
      phone = body.phone || '';
      company = body.company || '';
      requirements = body.requirements || body.message || '';
      campaign_name = body.campaign_name || '';
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      name = (formData.get('name') as string) || '';
      email = (formData.get('email') as string) || '';
      phone = (formData.get('phone') as string) || '';
      company = (formData.get('company') as string) || '';
      requirements = (formData.get('requirements') as string) || (formData.get('message') as string) || '';
      campaign_name = (formData.get('campaign_name') as string) || '';
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and Email are required fields.' },
        { status: 400 }
      );
    }

    // Build unified contact_info string
    const contactInfoParts = [email];
    if (phone) contactInfoParts.push(phone);
    const contactInfo = contactInfoParts.join('\n');

    const payload = {
      name,
      email,
      phone: phone || null,
      contact_info: contactInfo,
      company: company || null,
      requirements: requirements || null,
      campaign_name: campaign_name || 'Website Direct',
      source: 'Website',
      status: 'New',
      assigned_to: null, // Strictly null so it stays unassigned initially
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([payload])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}