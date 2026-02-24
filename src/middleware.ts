import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Determine which domains are protected
    const isStaffRoute = pathname.startsWith('/staff') && pathname !== '/staff/login';
    const isCitizenRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');

    if (isStaffRoute || isCitizenRoute) {
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        const sessionCookie = request.cookies.get(`a_session_${projectId}`);

        // Block access immediately if no session cookie exists
        if (!sessionCookie) {
            const loginPath = isStaffRoute ? '/staff/login' : '/login';
            const redirectUrl = new URL(loginPath, request.url);
            redirectUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Note: Edge middleware cannot reliably run the full node-appwrite SDK
        // to verify role or domain. Role verification (like checking @civicshakti.gov)
        // must happen inside the route handler or Server Component after the edge.
        // This middleware handles the basic front-line defense against unauthenticated users.
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Apply to all routes except:
         * - api (API routes, we let the route handlers manage their auth)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - public assets like images, icons
         */
        '/((?!api|_next/static|_next/image|.*\\.png|.*\\.svg|favicon.ico).*)',
    ],
};
