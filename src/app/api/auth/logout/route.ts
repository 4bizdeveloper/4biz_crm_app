import { NextResponse } from 'next/server';
import { sessionCookie } from '@/lib/auth-session';
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookie.name, '', { ...sessionCookie, maxAge: 0 });
  response.cookies.delete('user_role');
  response.cookies.delete('employee_id');
  return response;
}
