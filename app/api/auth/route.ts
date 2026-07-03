import { NextResponse } from 'next/server';
import { env } from '../../../lib/env';

/**
 * Handle authentication requests (Login / Logout / Session Check)
 */

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD) {
      // Create response and set cookie
      const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });
      
      // Set secure HTTP-only cookie for session management
      response.cookies.set('jawaab_admin_session', 'authenticated_token_active', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
  } catch (error) {
    console.error('[Auth API POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Read session cookie
  const cookieHeader = req.headers.get('cookie') || '';
  const hasSession = cookieHeader.includes('jawaab_admin_session=authenticated_token_active');

  if (hasSession) {
    return NextResponse.json({ authenticated: true, role: 'admin' });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear the session cookie
  response.cookies.set('jawaab_admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/',
  });

  return response;
}
