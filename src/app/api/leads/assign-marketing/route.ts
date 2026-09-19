import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const db = supabaseAdmin ?? supabase;

function canAssignMarketingLeads(ctx: Awaited<ReturnType<typeof getAuthContext>>) {
  return ctx.isAdmin || (ctx.department === 'Marketing' && ['Admin', 'DeptHead'].includes(ctx.userRole));
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();

  if (!ctx.employeeId && !ctx.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canAssignMarketingLeads(ctx)) {
    return NextResponse.json(
      { error: 'Only Super Admin or Marketing Admin can assign leads to Marketing employees.' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const leadId = String(body.leadId || body.id || '');
  const marketingEmployeeId = String(body.marketingEmployeeId || '');

  if (!leadId || !marketingEmployeeId) {
    return NextResponse.json(
      { error: 'Lead and Marketing employee are required.' },
      { status: 400 }
    );
  }

  const [{ data: lead, error: leadError }, { data: employee, error: employeeError }] = await Promise.all([
    db.from('leads').select('id,status,assigned_department,assigned_marketing_id').eq('id', leadId).maybeSingle(),
    db.from('employees')
      .select('id,first_name,last_name,email,department_type,user_role,status')
      .eq('id', marketingEmployeeId)
      .maybeSingle(),
  ]);

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  }

  if (employeeError || !employee) {
    return NextResponse.json({ error: 'Marketing employee not found.' }, { status: 404 });
  }

  if (employee.department_type !== 'Marketing' || employee.status !== 'Active') {
    return NextResponse.json(
      { error: 'The selected employee must be an active Marketing employee.' },
      { status: 400 }
    );
  }

  const changes = {
    assigned_marketing_id: employee.id,
    assigned_department: 'Marketing',
    status: lead.status === 'New' || !lead.status ? 'Assigned' : lead.status,
    last_activity_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('leads')
    .update(changes)
    .eq('id', leadId)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
