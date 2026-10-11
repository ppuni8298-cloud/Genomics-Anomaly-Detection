import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function forwardRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path || [];
  const backendPath = `/api/${pathSegments.join('/')}`;
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}${backendPath}${search}`;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const headers = new Headers();
  // Pass along existing headers
  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  // Attach verified Bearer token from HTTP-only session cookie
  if (sessionToken) {
    headers.set('Authorization', `Bearer ${sessionToken}`);
  }

  try {
    let body: any = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.arrayBuffer();
    }

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });

    const resHeaders = new Headers();
    backendRes.headers.forEach((val, key) => {
      // Don't forward transfer-encoding or content-encoding
      if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        resHeaders.set(key, val);
      }
    });

    const resBody = await backendRes.arrayBuffer();
    return new NextResponse(resBody, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error(`Backend forward error for ${targetUrl}:`, error);
    return NextResponse.json(
      { detail: 'Genomics backend service unavailable.' },
      { status: 503 }
    );
  }
}

export const GET = forwardRequest;
export const POST = forwardRequest;
export const PUT = forwardRequest;
export const DELETE = forwardRequest;
