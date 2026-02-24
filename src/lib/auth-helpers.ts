import { account } from './appwrite';

/**
 * After a successful Appwrite client-side login, the session is stored in
 * localStorage by the Appwrite JS SDK. However, Next.js edge middleware cannot
 * read localStorage – it can only read cookies.
 *
 * This helper retrieves the current session from Appwrite and sets a
 * browser cookie (`a_session_<projectId>`) that the middleware can read to
 * verify that a user is authenticated before allowing access to protected
 * routes like /dashboard, /profile, and /staff/*.
 */
export async function syncSessionCookie(): Promise<void> {
    try {
        const session = await account.getSession('current');
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

        if (session && projectId) {
            // Set a cookie that middleware can read.
            // Path=/ ensures middleware at any route can read it.
            // SameSite=Lax allows the cookie to be sent on navigation.
            document.cookie = `a_session_${projectId}=${session.$id}; path=/; max-age=31536000; SameSite=Lax`;
        }
    } catch (error) {
        console.warn('Could not sync session cookie:', error);
    }
}

/**
 * Clears the session cookie. Call this on logout so middleware correctly
 * blocks access to protected routes.
 */
export function clearSessionCookie(): void {
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    if (projectId) {
        document.cookie = `a_session_${projectId}=; path=/; max-age=0; SameSite=Lax`;
    }
}

/**
 * Creates a short-lived JWT from Appwrite's client SDK.
 * This JWT can be passed in the Authorization header to API routes,
 * where the server-side SDK can verify it using `client.setJWT()`.
 * JWTs are valid for 15 minutes.
 */
export async function getAuthJWT(): Promise<string> {
    const jwt = await account.createJWT();
    return jwt.jwt;
}
