import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSession, sessionCookie } from '@/lib/auth-session';
import { scryptSync, timingSafeEqual, randomBytes } from 'node:crypto';

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split('$');
  if (!salt || !expected) return false;
  const actual = hashPassword(password, salt);
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword && email.trim().toLowerCase() === adminEmail.trim().toLowerCase() && password === adminPassword) {
      const response = NextResponse.json({ success: true, role: 'SuperAdmin' });
      response.cookies.set(sessionCookie.name, createSession({ sub: 'super-admin', role: 'SuperAdmin', department: null }), sessionCookie);
      return response;
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .select('id,first_name,last_name,email,department_type,user_role,status,password,password_hash,password_salt')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !employee || employee.status !== 'Active') {
      return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    let valid = false;
    if (employee.password_hash && employee.password_salt) {
      valid = verifyPassword(password, `${employee.password_salt}$${employee.password_hash}`);
    } else if (employee.password && employee.password === password) {
      valid = true;
      const salt = randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      await supabase.from('employees').update({ password_hash: passwordHash, password_salt: salt }).eq('id', employee.id);
    }
    if (!valid) return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });

    const userRole = String(employee.user_role || 'Employee') as 'DeptHead' | 'Employee';
    const role = userRole === 'DeptHead' ? 'DeptHead' : 'Employee';
    const response = NextResponse.json({ success: true, role, employeeId: employee.id });
    response.cookies.set(sessionCookie.name, createSession({ sub: employee.id, role, department: employee.department_type }), sessionCookie);
    return response;
  } catch (error) {
    console.error('login error', error);
    return NextResponse.json({ error: 'Authentication service error' }, { status: 500 });
  }
}
