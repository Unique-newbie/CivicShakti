import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

        const account = new Account(client);

        // The actual login happens client-side with account.createEmailPasswordSession().
        // This route is a fallback.
        return NextResponse.json({
            success: true,
            message: 'Use client-side Appwrite SDK for login',
            email,
        });
    } catch (error: any) {
        logApiError('/api/auth/login', error);
        return NextResponse.json(
            { error: error.message || 'Login failed', code: 'ERR_AUTH_FAILED', status: 401 },
            { status: 401 }
        );
    }
}
