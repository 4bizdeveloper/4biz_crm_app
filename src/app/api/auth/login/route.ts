import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // 1. Admin Authentication Check
  if (email === adminEmail && password === adminPassword) {
    const response = NextResponse.json({ success: true, role: 'admin' }, { status: 200 });
    response.cookies.set('crm_session', 'admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    response.cookies.set('user_role', 'admin', { path: '/' });
    return response;
  }

  // 2. Employee Authentication Check against Supabase DB
  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('email', email)
    .single();

  if (employee && employee.password === password && employee.status === 'Active') {
    const response = NextResponse.json(
      { success: true, role: 'employee', employeeId: employee.id },
      { status: 200 }
    );

    response.cookies.set('crm_session', employee.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    response.cookies.set('user_role', 'employee', { path: '/' });
    response.cookies.set('employee_id', employee.id, { path: '/' });

    return response;
  }

  return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
}