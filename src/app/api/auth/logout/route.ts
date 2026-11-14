import { NextRequest, NextResponse } from 'next/server';
import { destroySession, clearSessionCookie } from '@/lib/auth';

async function performLogout(req: NextRequest) {
  try {
    await destroySession();

    const accept = req.headers.get('accept') || '';
    const contentType = req.headers.get('content-type') || '';
    const isBrowserNavigation =
      accept.includes('text/html') ||
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data');

    if (isBrowserNavigation) {
      const loginUrl = new URL('/login', req.url);
      const response = NextResponse.redirect(loginUrl, 303);
      clearSessionCookie(response);
      return response;
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return performLogout(req);
}

export async function GET(req: NextRequest) {
  return performLogout(req);
}
