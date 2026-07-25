import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './navigation';
import {
  ACCESS_COOKIE_NAME,
  isAccessProtectionEnabled,
  isValidAccessToken,
} from './lib/access';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAccessRoute = pathname === '/access' || pathname === '/api/access';
  const accessProtectionEnabled = isAccessProtectionEnabled();

  if (pathname === '/access' && !accessProtectionEnabled) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (accessProtectionEnabled && !isAccessRoute) {
    const authenticated = await isValidAccessToken(
      request.cookies.get(ACCESS_COOKIE_NAME)?.value
    );
    if (!authenticated) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/access', request.url);
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/api/') || pathname === '/access') {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
