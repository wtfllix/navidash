import createMiddleware from 'next-intl/middleware';
import {routing} from './navigation';
 
export default createMiddleware(routing);
 
export const config = {
  // Match only internationalized pathnames
  // matcher: ['/', '/(zh|en)/:path*']
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
