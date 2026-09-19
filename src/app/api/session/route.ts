import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/department-auth';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, ...ctx });
}
