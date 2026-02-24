import { Client, Account, Databases } from "node-appwrite";
import { cookies } from "next/headers";

/**
 * Creates a session client using a JWT passed from the client-side.
 * This is the RECOMMENDED approach for API routes:
 * 1. Client calls `getAuthJWT()` from auth-helpers.ts
 * 2. Client passes JWT in Authorization: Bearer <jwt> header
 * 3. API route calls createJWTClient(jwt) to get an authenticated client
 */
export function createJWTClient(jwt: string) {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setJWT(jwt);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
}

/**
 * Creates a session client from cookies. Used by Server Components
 * and middleware where JWT headers aren't available.
 * Falls back to checking the a_session cookie.
 */
export async function createSessionClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(`a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);

    if (!sessionCookie || !sessionCookie.value) {
        throw new Error("No active session detected.");
    }

    client.setSession(sessionCookie.value);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
}

export async function createAdminClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        get account() {
            return new Account(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
}
