import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSessionToken } from '@/lib/auth-session';
import { hashPassword, verifyPassword } from '@/lib/password';

const db = supabaseAdmin ?? supabase;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const plainPassword = String(password ?? '');

    if (!normalizedEmail || !plainPassword) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword && normalizedEmail === adminEmail && plainPassword === adminPassword) {
      const token = await createSessionToken({ sub: 'super-admin', role: 'SuperAdmin', department: null });
      const response = NextResponse.json({ success: true, role: 'SuperAdmin' });
      response.cookies.set('crm_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 12,
        path: '/',
      });
      response.cookies.set('user_role', 'SuperAdmin', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 12, path: '/' });
      response.cookies.delete('employee_id');
      return response;
    }

    const { data: employee, error } = await db
      .from('employees')
      .select('id,first_name,last_name,email,password,password_hash,password_salt,status,user_role,department_type')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Unable to authenticate right now.' }, { status: 500 });
    if (!employee || employee.status !== 'Active') {
      return NextResponse.json({ error: 'Invalid credentials or inactive account.' }, { status: 401 });
    }

    let valid = false;
    if (employee.password_hash && employee.password_salt) {
      valid = await verifyPassword(plainPassword, employee.password_hash, employee.password_salt);
    } else if (employee.password) {
      valid = employee.password === plainPassword;
      if (valid) {
        const { hash, salt } = await hashPassword(plainPassword);
        await db.from('employees').update({ password_hash: hash, password_salt: salt, password: null }).eq('id', employee.id);
      }
    }

    if (!valid) return NextResponse.json({ error: 'Invalid credentials or inactive account.' }, { status: 401 });

    const role = String(employee.user_role || 'Employee');
    const department = employee.department_type ? String(employee.department_type) : null;
    const token = await createSessionToken({ sub: employee.id, role, department });

    const response = NextResponse.json({
      success: true,
      role,
      employeeId: employee.id,
      department,
      name: [employee.first_name, employee.last_name].filter(Boolean).join(' '),
    });
    response.cookies.set('crm_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
      path: '/',
    });
    response.cookies.set('user_role', role, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 12, path: '/' });
    response.cookies.set('employee_id', employee.id, { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 12, path: '/' });
    return response;
  } catch (error) {
    console.error('CRM login error', error);
    return NextResponse.json({ error: 'Unable to authenticate right now.' }, { status: 500 });
  }
}
