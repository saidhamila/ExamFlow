import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
// Remove Notification import if no longer needed here

// Define the shape of the session data stored in the cookie
// Use uppercase roles matching Prisma schema
interface AuthSession {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'CHEF' | 'DIRECTEUR';
  // Remove cached data fields
}

// List of routes that require authentication
const protectedRoutes = [
    '/admin',
    '/schedule',
    '/profile',
    '/notifications',
    '/chef/dashboard',
    '/directeur/dashboard'
];

// Middleware needs to be async to await cookies
export async function middleware(request: NextRequest) {
  // Await the cookie store
  const cookieStore = await cookies();
  // No longer need ts-expect-error
  const sessionCookie = cookieStore.get('auth-session');
  const { pathname } = request.nextUrl;

  // Check if the current path requires authentication
  const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route));

  if (requiresAuth) {
    if (!sessionCookie) {
      // Redirect to login if no session cookie and route is protected
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value) as AuthSession;

      // Check admin route access using uppercase role
      if (pathname.startsWith('/admin') && sessionData.role !== 'ADMIN') {
        // Redirect non-admins trying to access admin routes
        console.warn(`User ${sessionData.email} (role: ${sessionData.role}) attempted to access admin route: ${pathname}`);
        // Redirect to their default schedule page or home page
        return NextResponse.redirect(new URL('/schedule', request.url));
      }

      // Check Chef route access
      if (pathname.startsWith('/chef/dashboard') && sessionData.role !== 'CHEF') {
        console.warn(`User ${sessionData.email} (role: ${sessionData.role}) attempted to access chef route: ${pathname}`);
        return NextResponse.redirect(new URL('/schedule', request.url)); // Redirect non-chefs
      }

      // Check Directeur route access
      if (pathname.startsWith('/directeur/dashboard') && sessionData.role !== 'DIRECTEUR') {
        console.warn(`User ${sessionData.email} (role: ${sessionData.role}) attempted to access directeur route: ${pathname}`);
        return NextResponse.redirect(new URL('/schedule', request.url)); // Redirect non-directeurs
      }

      // User is authenticated and has correct role (or route is not admin-specific)
      return NextResponse.next();

    } catch (error) {
      // Invalid cookie format, treat as unauthenticated
      console.error("Error parsing auth session cookie:", error);
      // Optionally delete the corrupted cookie
      // cookieStore.delete('auth-session'); // Need mutable cookies instance here
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Allow access to public routes (like the login page itself)
  // Also handle case where user is logged in and tries to access '/'
  if (pathname === '/' && sessionCookie) {
    try {
      const sessionData = JSON.parse(sessionCookie.value) as AuthSession;
      // Redirect logged-in users away from login page to their dashboard using uppercase role
      let redirectUrl = '/schedule'; // Default redirect
      if (sessionData.role === 'ADMIN') {
          redirectUrl = '/admin';
      } else if (sessionData.role === 'CHEF') {
          redirectUrl = '/chef/dashboard';
      } else if (sessionData.role === 'DIRECTEUR') {
          redirectUrl = '/directeur/dashboard';
      }
      // USER role will default to /schedule
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch (error) {
      // Invalid cookie, let them stay on login page
      return NextResponse.next();
    }
  }


  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - placeholder images/svgs
     */
    '/((?!api|_next/static|_next/image|favicon.ico|placeholder.*).*)',
  ],
}