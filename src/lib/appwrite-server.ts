/**
 * Server-side Appwrite client for API routes.
 * Uses node-appwrite with the API key for full admin access.
 */
import { Client, Databases, Users, Storage } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

export const serverDatabases = new Databases(client);
export const serverUsers = new Users(client);
export const serverStorage = new Storage(client);

export const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'civic_db';

/**
 * Creates a session-scoped client from JWT for per-user operations.
 */
export function createSessionClient(jwt: string) {
    const sessionClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setJWT(jwt);
    return {
        account: new (require('node-appwrite').Account)(sessionClient),
        databases: new Databases(sessionClient),
    };
}
