import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createSession, checkRateLimit, attachSessionCookie } from '@/lib/auth';
import { validateSignupInput, normalizeEmail } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`signup:${ip}`, 5, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many signup attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const validation = validateSignupInput(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors[0] || 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(body.email);

    // Check for duplicate account
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Securely hash password
    const passwordHash = await hashPassword(body.password);

    // Create user in SQLite database
    const newUser = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    // Create authenticated session and set HTTP-only cookie
    const session = await createSession({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );

    attachSessionCookie(response, session.token);
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred while creating your account.' },
      { status: 500 }
    );
  }
}
