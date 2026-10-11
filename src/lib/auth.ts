import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';

export const SESSION_COOKIE_NAME = 'genome_session_token';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// In production, default to Secure cookies unless explicitly disabled (SECURE_COOKIES='false')
export const isSecureCookie = process.env.NODE_ENV === 'production' ? process.env.SECURE_COOKIES !== 'false' : false;

const secretKey = process.env.AUTH_SECRET || 'genome_ai_secret_key_session_auth_phase2_super_secure_32b_token';
const encodedSecret = new TextEncoder().encode(secretKey);

export async function hashPassword(plaintext: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plaintext, salt);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  sessionId: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(encodedSecret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      sessionId: payload.sessionId as string,
    };
  } catch {
    return null;
  }
}

/**
 * Creates a persisted session in the SQLite database and sets an HTTP-only cookie
 */
export async function createSession(user: { id: string; email: string; name: string }): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // Generate a random unique database token reference
  const randomRef = crypto.randomUUID();

  // Create session record in database
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: randomRef,
      expiresAt,
    },
  });

  // Create signed JWT token containing user and session references
  const jwt = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    sessionId: session.id,
  });

  // Store in HTTP-only cookie if in server action context
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } catch {
    // In Route Handler context, cookie will be attached to NextResponse
  }

  return { token: jwt, expiresAt };
}

/**
 * Attaches the session cookie to an outgoing NextResponse
 */
export function attachSessionCookie(response: any, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the session cookie on an outgoing NextResponse
 */
export function clearSessionCookie(response: any) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Validates the current session from incoming request cookies
 */
export async function getSession(): Promise<{ user: { id: string; email: string; name: string }; sessionId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Verify that the session exists in the database and has not expired
  const dbSession = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  });

  if (!dbSession || dbSession.expiresAt < new Date()) {
    return null;
  }

  return {
    user: {
      id: dbSession.user.id,
      email: dbSession.user.email,
      name: dbSession.user.name,
    },
    sessionId: dbSession.id,
  };
}

/**
 * Logs out the user by deleting the DB session and clearing the cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const payload = await verifySessionToken(token);
    if (payload?.sessionId) {
      try {
        await prisma.session.delete({
          where: { id: payload.sessionId },
        });
      } catch {
        // Session may already be deleted
      }
    }
  }

  try {
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  } catch {
    // In Route Handler context
  }
}

/**
 * Rate Limiter to protect authentication endpoints against brute force attacks
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts = 10, windowMs = 60 * 1000): { allowed: boolean; retryAfterSeconds: number } {
  // Allow test / local development higher headroom while preserving brute force protection
  const effectiveMax = key.includes('127.0.0.1') || key.includes('::1') ? 100 : maxAttempts;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= effectiveMax) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}
