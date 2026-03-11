import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/appwrite-server';
import { logApiError } from '@/lib/error-logger';

export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'ERR_UNAUTHORIZED', status: 401 },
            { status: 401 }
        );
    }

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        return NextResponse.json({
            $id: user.$id,
            id: user.$id,
            email: user.email,
            name: user.name,
            emailVerification: user.emailVerification,
            labels: user.labels,
            role: (user.labels?.includes('staff') || user.labels?.includes('superadmin')) ? 'staff' : 'citizen',
        });
    } catch (error: any) {
        logApiError('/api/auth/me', error);
        return NextResponse.json(
            { error: 'Invalid session', code: 'ERR_INVALID_SESSION', status: 401 },
            { status: 401 }
        );
    }
}
