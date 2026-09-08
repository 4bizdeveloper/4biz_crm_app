// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve auth session cookies
  const session = request.cookies.get('crm_session')?.value;
  const isLoginPage = pathname === '/login';

  // Redirect legacy /dashboard/sales visits to /dashboard/leads
  if (pathname === '/dashboard/sales') {
    return NextResponse.redirect(new URL('/dashboard/leads', request.url));
  }

  // Redirect unauthenticated users attempting to access dashboard routes
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from the login page to the primary overview
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
  ],
};