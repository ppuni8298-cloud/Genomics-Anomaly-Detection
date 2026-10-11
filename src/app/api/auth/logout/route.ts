import { NextResponse } from 'next/server';
import { destroySession, clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    await destroySession();
    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
