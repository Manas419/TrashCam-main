import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Exclude login page and any static assets from middleware
  if (
    path.includes('/_next') || 
    path.includes('/api') ||
    path.includes('/static') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // Get the token from cookies
  const token = request.cookies.get('token')?.value

  const isPublicPath = path === '/login' || path === '/register'

  if (!token && !isPublicPath) {
    // Redirect to login if trying to access protected route without token
    const url = new URL('/login', request.url)
    url.searchParams.set('from', path)
    return NextResponse.redirect(url)
  }

  // Always allow access to login/register to avoid loops due to stale cookies

  return NextResponse.next()
}

// Configure the paths that should be handled by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}