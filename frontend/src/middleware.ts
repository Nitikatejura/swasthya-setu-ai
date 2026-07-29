import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that do not require authentication
  const isPublicPath = path === '/login' || path === '/signup' || path === '/pending-approval' || path === '/';

  const token = request.cookies.get('access_token')?.value;

  if (!isPublicPath && !token) {
    // If attempting to access protected route without token, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/pending-approval',
    '/dashboard/:path*',
    '/profile',
    '/assessment',
    '/referrals',
    '/reports',
    '/settings',
    '/patient'
  ]
};
