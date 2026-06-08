import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy /quanly redirects — remove this block once /quanly is cleaned up
  if (pathname === '/quanly' || pathname.startsWith('/quanly/')) {
    const suffix = pathname.replace(/^\/quanly/, '') || '/';
    const url = request.nextUrl.clone();
    url.pathname = `/admin${suffix}`;
    return NextResponse.redirect(url);
  }

  // No redirects for /admin — let the client-side layout handle auth
  return NextResponse.next();
}

export const config = {
  matcher: ['/quanly/:path*'],
};
