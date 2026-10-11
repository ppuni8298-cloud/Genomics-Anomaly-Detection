import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'genome_session_token';
const secretKey = process.env.AUTH_SECRET || 'genome_ai_secret_key_session_auth_phase2_super_secure_32b_token';
const encodedSecret = new TextEncoder().encode(secretKey);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isValidSession = false;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      if (payload?.userId) {
        isValidSession = true;
      }
    } catch {
      isValidSession = false;
    }
  }

  // 1. Protected routes: /dashboard and subroutes
  if (pathname.startsWith('/dashboard')) {
    if (!isValidSession) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Auth routes: /login and /signup
  if (pathname === '/login' || pathname === '/signup') {
    if (isValidSession) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
