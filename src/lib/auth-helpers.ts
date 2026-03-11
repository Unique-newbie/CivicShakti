/**
 * Auth helpers — uses Appwrite SDK for JWT creation and session management.
 */
import { account } from '@/lib/appwrite';

export const AUTH_COOKIE = 'civic_session';

/**
 * Creates a JWT token via the Appwrite account API and stores it as a cookie.
 */
export async function syncSessionCookie(): Promise<void> {
    try {
        const jwt = await account.createJWT();
        document.cookie = `${AUTH_COOKIE}=${jwt.jwt}; path=/; max-age=900; SameSite=Lax`;
    } catch {
        // Silently fail if no session
    }
}

/**
 * Clears the session cookie on logout.
 */
export function clearSessionCookie(): void {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Returns the Appwrite JWT from cookie (used to authenticate API route calls).
 */
export async function getAuthJWT(): Promise<string> {
    if (typeof document === 'undefined') return '';

    // Try existing cookie first
    const prefix = `${AUTH_COOKIE}=`;
    const existing = document.cookie
        .split('; ')
        .find(r => r.startsWith(prefix));
    
    if (existing) {
        const val = existing.slice(prefix.length);
        if (val) return val;
    }

    // If no cookie, try creating a fresh JWT from the current session
    try {
        const jwt = await account.createJWT();
        document.cookie = `${AUTH_COOKIE}=${jwt.jwt}; path=/; max-age=900; SameSite=Lax`;
        return jwt.jwt;
    } catch {
        return '';
    }
}
