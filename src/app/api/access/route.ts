import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE_NAME,
  areAccessTokensEqual,
  createAccessToken,
  getAccessPassword,
  isAccessProtectionEnabled,
  isValidAccessToken,
} from '@/lib/access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    enabled: isAccessProtectionEnabled(),
    authenticated: await isValidAccessToken(
      request.cookies.get(ACCESS_COOKIE_NAME)?.value
    ),
  });
}

export async function POST(request: NextRequest) {
  const configuredPassword = getAccessPassword();
  if (!configuredPassword) {
    return NextResponse.json({ success: true, enabled: false });
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  if (
    typeof body?.password !== 'string' ||
    !areAccessTokensEqual(
      await createAccessToken(body.password),
      await createAccessToken(configuredPassword)
    )
  ) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, enabled: true });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: await createAccessToken(configuredPassword),
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
